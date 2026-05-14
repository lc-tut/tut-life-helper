import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Building from './components/Building';

function CameraRig({ targetPosition }) {
  const controlsRef = useRef();
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (targetPosition) {
      isTransitioning.current = true;
    }
  }, [targetPosition]);

  useFrame(() => {
    if (controlsRef.current && isTransitioning.current && targetPosition) {
      // スムーズにカメラの注視点（Target）を選択した階へ移動
      controlsRef.current.target.lerp(targetPosition, 0.1);
      
      // 目標に十分近づいたらアニメーションを終了し、自由な操作を許可
      if (controlsRef.current.target.distanceTo(targetPosition) < 0.05) {
        isTransitioning.current = false;
      }
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan={true} 
      enableZoom={true} 
      enableRotate={true}
      maxPolarAngle={Math.PI / 2.2} 
      minPolarAngle={0} // 真上から見下ろせるように制限を緩和
      makeDefault
      onStart={() => {
        // ユーザーが手動でカメラ操作（パンや回転）を始めたら自動移動をキャンセル
        isTransitioning.current = false;
      }}
    />
  );
}

function App() {
  const [buildings, setBuildings] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [cameraTarget, setCameraTarget] = useState(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    // バックエンドからデータを取得
    fetch('http://localhost:8000/api/buildings')
      .then(res => res.json())
      .then(data => setBuildings(data))
      .catch(err => {
        console.error("Failed to fetch buildings:", err);
      });
  }, []);

  const handleFloorClick = (building, floor) => {
    setSelectedFloor({ building, floor });
    
    // Blender風: ターゲットを選択された建物の階層の中心に移動
    const floorHeight = 1.5;
    const yPos = floorHeight / 2 + (floor.level - 1) * floorHeight;
    setCameraTarget(new THREE.Vector3(building.position.x, yPos, building.position.z));
  };

  const resetSelection = () => {
    setSelectedFloor(null);
    // 注視点はそのまま維持し、ユーザーが自由に移動（パン）できるようにする
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* onPointerMissed で背景クリック時に選択解除 */}
      <Canvas shadows onPointerMissed={resetSelection}>
        <OrthographicCamera makeDefault position={[50, 50, 50]} zoom={25} near={-100} far={1000} />
        
        {/* スムーズなカメラ移動コントローラー */}
        <CameraRig targetPosition={cameraTarget} />
        
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[20, 30, 10]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        >
          <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30]} />
        </directionalLight>

        <Environment preset="city" opacity={0.3} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#f0f0f5" />
        </mesh>
        
        <ContactShadows position={[0, -0.09, 0]} opacity={0.4} scale={50} blur={2} far={10} />

        {buildings.map(bldg => (
          <Building 
            key={bldg.id} 
            data={bldg} 
            selectedFloor={selectedFloor}
            onFloorClick={handleFloorClick} 
          />
        ))}
      </Canvas>

      {/* UI オーバーレイ (詳細情報) */}
      {selectedFloor && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '30px',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(8px)',
          fontFamily: 'sans-serif',
          minWidth: '250px',
          zIndex: 10
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#333' }}>
            {selectedFloor.building.name} - {selectedFloor.floor.name}
          </h2>
          <p style={{ margin: '0 0 15px 0', color: '#666' }}>
            {selectedFloor.floor.details}
          </p>
          <button 
            onClick={resetSelection}
            style={{
              background: '#333',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#555'}
            onMouseOut={(e) => e.target.style.background = '#333'}
          >
            閉じる
          </button>
        </div>
      )}
      
      {/* タイトルUI */}
      <div style={{
        position: 'absolute',
        top: '30px',
        left: '30px',
        pointerEvents: 'none',
        zIndex: 10
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: '#333', textShadow: '0 2px 10px rgba(255,255,255,0.8)' }}>
          University Campus Map
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#666', fontWeight: 500 }}>
          3D Interactive Model
        </p>
      </div>
    </div>
  );
}

export default App;
