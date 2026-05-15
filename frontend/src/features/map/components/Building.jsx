import { useState, useMemo } from 'react';

import * as THREE from 'three';

export default function Building({ data, selectedFloor, onFloorClick }) {
  const { position, floors } = data;
  const floorHeight = 1.5;
  const width = 4;
  const depth = 4;

  const isBuildingSelected = selectedFloor?.building?.id === data.id;

  return (
    <group position={[position.x, 0, position.z]}>
      {floors.map((floor, index) => {
        const yPos = floorHeight / 2 + index * floorHeight;
        
        // 選択された階より上の階は非表示にする
        const isHidden = isBuildingSelected && floor.level > selectedFloor.floor.level;
        // 現在選択中の階かどうか
        const isSelected = isBuildingSelected && floor.level === selectedFloor.floor.level;

        return (
          <group key={floor.level} position={[0, yPos, 0]} visible={!isHidden}>
            <Floor
              size={[width, floorHeight, depth]}
              isSelected={isSelected}
              onClick={() => onFloorClick(data, floor)}
            />
            {/* 選択された階のみ間取り（部屋・トイレなど）を表示 */}
            {/* y座標を -floorHeight/2 にすることで、箱の「床」に配置されるようにする */}
            {isSelected && floor.rooms && (
              <group position={[0, -floorHeight / 2, 0]}>
                {floor.rooms.map(room => (
                  <RoomBox key={room.id} room={room} />
                ))}
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Floor({ size, isSelected, onClick }) {
  const [hovered, setHover] = useState(false);

  const matColor = isSelected ? '#dfe6ff' : hovered ? '#eef2ff' : '#ffffff';

  // 選択時は BackSide（裏面のみ）を描画することで、
  // カメラの角度に関わらず常に手前の壁と天井が透けて奥の壁と床が見えるようになります。
  const material = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: matColor, 
    roughness: 0.8, 
    metalness: 0.1,
    side: isSelected ? THREE.BackSide : THREE.FrontSide
  }), [matColor, isSelected]);


  return (
    <mesh
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHover(false);
        document.body.style.cursor = 'auto';
      }}
      castShadow
      receiveShadow
      material={material}
    >
      <boxGeometry args={size} />
    </mesh>
  );
}

// 間取り・トイレ等の小さな3Dボックス
function RoomBox({ room }) {
  const roomHeight = 0.5; // 床からの高さ
  return (
    <mesh position={[room.position.x, roomHeight / 2, room.position.z]} castShadow receiveShadow>
      <boxGeometry args={[room.size.x, roomHeight, room.size.z]} />
      <meshStandardMaterial color={room.color} roughness={0.6} />
    </mesh>
  );
}
