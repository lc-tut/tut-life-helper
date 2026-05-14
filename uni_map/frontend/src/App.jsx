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

const cafeteriaVenues = [
  {
    id: 'terrace',
    name: '802A TERRACE',
    detail: '定食とカレーを中心に、昼休みに選びやすいメニューをまとめています。',
    highlight: '定食・カレー',
    items: [
      { name: '日替わりランチ', price: 650, category: '定食' },
      { name: '唐揚げ定食', price: 620, category: '定食' },
      { name: 'チキンカレー', price: 520, category: 'カレー' },
      { name: 'カツカレー', price: 680, category: 'カレー' },
      { name: 'ハンバーグプレート', price: 700, category: 'プレート' },
      { name: 'ライス単品', price: 160, category: 'サイド' },
      { name: '味噌汁', price: 90, category: 'サイド' },
      { name: '小鉢', price: 120, category: 'サイド' },
    ],
  },
  {
    id: 'rose',
    name: 'ROSE kitchen',
    detail: '軽めの食事や洋食系のメニューを探すときに見やすい構成です。',
    highlight: '洋食・軽食',
    items: [
      { name: 'ローストチキンプレート', price: 720, category: 'プレート' },
      { name: 'ミートソースパスタ', price: 580, category: 'パスタ' },
      { name: 'カルボナーラ', price: 620, category: 'パスタ' },
      { name: 'オムライス', price: 640, category: 'ごはん' },
      { name: 'サラダボウル', price: 460, category: 'サラダ' },
      { name: 'スープセット', price: 280, category: 'サイド' },
      { name: 'フライドポテト', price: 250, category: '軽食' },
      { name: 'ドリンクセット', price: 180, category: 'ドリンク' },
    ],
  },
  {
    id: 'foods-fuu',
    name: 'FOODS FUU',
    detail: '丼もの、麺類、すぐ食べたいメニューを中心に掲載しています。',
    highlight: '丼・麺',
    items: [
      { name: 'かけうどん', price: 360, category: 'うどん' },
      { name: 'きつねうどん', price: 430, category: 'うどん' },
      { name: '醤油ラーメン', price: 520, category: 'ラーメン' },
      { name: 'カツ丼', price: 620, category: '丼' },
      { name: '親子丼', price: 560, category: '丼' },
      { name: 'ミニサラダ', price: 180, category: 'サイド' },
      { name: '半ライス', price: 120, category: 'サイド' },
      { name: '温泉卵', price: 100, category: 'トッピング' },
    ],
  },
];

function formatPrice(price) {
  return `¥${price.toLocaleString('ja-JP')}`;
}

const timetableRows = [
  { id: 'period-1', label: '1時限', type: '授業', time: '09:00〜10:30', duration: '90分' },
  { id: 'break-1', label: '休み時間', type: '休み時間', time: '10:30〜10:45', duration: '15分' },
  { id: 'period-2', label: '2時限', type: '授業', time: '10:45〜12:15', duration: '90分' },
  { id: 'lunch', label: '昼休み', type: '休み時間', time: '12:15〜13:15', duration: '60分' },
  { id: 'period-3', label: '3時限', type: '授業', time: '13:15〜14:45', duration: '90分' },
  { id: 'break-3', label: '休み時間', type: '休み時間', time: '14:45〜15:00', duration: '15分' },
  { id: 'period-4', label: '4時限', type: '授業', time: '15:00〜16:30', duration: '90分' },
  { id: 'break-4', label: '休み時間', type: '休み時間', time: '16:30〜16:45', duration: '15分' },
  { id: 'period-5', label: '5時限', type: '授業', time: '16:45〜18:15', duration: '90分' },
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
        ) : activeTab === 'timetable' ? (
          <TimetableView />
        ) : activeTab === 'cafeteria' ? (
          <CafeteriaMenu />
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

function TimetableView() {
  return (
    <section className="timetable-view" aria-label="現行時間割">
      <header className="timetable-header">
        <p className="section-kicker">Timetable</p>
        <h1>時間割</h1>
        <p>2020年度以降の現行時間です。授業と休み時間を時刻で確認できます。</p>
      </header>

      <div className="timetable-list">
        {timetableRows.map(row => (
          <article
            className={`timetable-row${row.type === '休み時間' ? ' is-break' : ''}`}
            key={row.id}
          >
            <div>
              <span className="timetable-kind">{row.type}</span>
              <h2>{row.label}</h2>
            </div>
            <p className="timetable-time">{row.time}</p>
            <span className="timetable-duration">{row.duration}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function CafeteriaMenu() {
  const [activeVenueId, setActiveVenueId] = useState(cafeteriaVenues[0].id);
  const cafeteriaViewRef = useRef(null);
  const swipeStart = useRef(null);
  const activeVenueIndex = cafeteriaVenues.findIndex(venue => venue.id === activeVenueId);
  const activeVenue = cafeteriaVenues[activeVenueIndex] ?? cafeteriaVenues[0];

  const showVenue = (nextIndex) => {
    const maxIndex = cafeteriaVenues.length - 1;
    const safeIndex = Math.min(Math.max(nextIndex, 0), maxIndex);
    const nextVenueId = cafeteriaVenues[safeIndex].id;

    if (nextVenueId === activeVenueId) {
      return;
    }

    setActiveVenueId(nextVenueId);
    requestAnimationFrame(() => {
      cafeteriaViewRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handlePointerDown = (event) => {
    swipeStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerUp = (event) => {
    if (!swipeStart.current || swipeStart.current.pointerId !== event.pointerId) {
      return;
    }

    const diffX = event.clientX - swipeStart.current.x;
    const diffY = event.clientY - swipeStart.current.y;
    swipeStart.current = null;

    if (Math.abs(diffX) < 56 || Math.abs(diffX) < Math.abs(diffY) * 1.25) {
      return;
    }

    showVenue(activeVenueIndex + (diffX < 0 ? 1 : -1));
  };

  return (
    <section
      ref={cafeteriaViewRef}
      className="cafeteria-view"
      aria-label="学食メニュー"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        swipeStart.current = null;
      }}
    >
      <header className="cafeteria-header">
        <div>
          <p className="section-kicker">Cafeteria</p>
          <h1>学食メニュー</h1>
        </div>
        <div className="menu-count" aria-label={`${activeVenue.items.length}件のメニュー`}>
          {activeVenue.items.length}
          <span>品</span>
        </div>
      </header>

      <div className="venue-tabs" role="tablist" aria-label="学食の場所">
        {cafeteriaVenues.map(venue => {
          const isActive = venue.id === activeVenueId;

          return (
            <button
              key={venue.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`venue-button${isActive ? ' is-active' : ''}`}
              onClick={() => showVenue(cafeteriaVenues.findIndex(item => item.id === venue.id))}
            >
              {venue.name}
            </button>
          );
        })}
      </div>

      <div className="venue-summary">
        <span>{activeVenue.highlight}</span>
        <p>{activeVenue.detail}</p>
      </div>

      <div className="menu-grid" aria-live="polite">
        {activeVenue.items.map(item => (
          <article className="menu-card" key={`${activeVenue.id}-${item.name}`}>
            <span className="menu-category">{item.category}</span>
            <h2>{item.name}</h2>
            <p className="menu-price">
              {formatPrice(item.price)}
              <span>（税込）</span>
            </p>
          </article>
        ))}
      </div>
    </section>
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
          <meshStandardMaterial color="#eef1f7" />
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
