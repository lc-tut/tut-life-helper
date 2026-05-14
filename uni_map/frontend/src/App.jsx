import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, ContactShadows, Environment } from '@react-three/drei';
import { Bus, CalendarDays, Map as MapIcon, UsersRound, Utensils } from 'lucide-react';
import * as THREE from 'three';
import Building from './components/Building';
import fallbackBuildings from '../../backend/data.json';

const tabs = [
  { id: 'map', label: 'マップ', Icon: MapIcon },
  { id: 'timetable', label: '時間割', Icon: CalendarDays },
  { id: 'cafeteria', label: '学食', Icon: Utensils },
  { id: 'bus', label: 'バス', Icon: Bus },
  { id: 'circle', label: 'サークル', Icon: UsersRound },
];

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
  const [activeTab, setActiveTab] = useState('map');

  const activeTabData = tabs.find(tab => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="app-shell">
      <div className="app-content">
        {activeTab === 'map' ? (
          <CampusMap />
        ) : (
          <section className="blank-view" aria-label={activeTabData.label}>
            <h1>{activeTabData.label}</h1>
          </section>
        )}
      </div>

      <nav className="bottom-tabs" aria-label="メインメニュー">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              className={`tab-button${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              aria-label={`${label}を開く`}
              onClick={() => setActiveTab(id)}
            >
              <Icon aria-hidden="true" strokeWidth={isActive ? 2.8 : 2.4} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function CampusMap() {
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
        setBuildings(fallbackBuildings);
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
    <div className="map-view">
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
        <div className="floor-panel">
          <h2>
            {selectedFloor.building.name} - {selectedFloor.floor.name}
          </h2>
          <p>
            {selectedFloor.floor.details}
          </p>
          <button type="button" onClick={resetSelection}>
            閉じる
          </button>
        </div>
      )}
      
      {/* タイトルUI */}
      <div className="map-title">
        <h1>マップ</h1>
      </div>
    </div>
  );
}

export default App;
