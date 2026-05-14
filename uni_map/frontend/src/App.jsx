import { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, ContactShadows, Environment } from '@react-three/drei';
import { Building2, Bus, CalendarDays, Map as MapIcon, MapPin, Search, UsersRound, Utensils, X } from 'lucide-react';
import * as THREE from 'three';
import Building from './components/Building';
import fallbackBuildings from '../../backend/data.json';

const tabs = [
  { id: 'map', label: 'マップ', Icon: MapIcon },
  { id: 'timetable', label: '時間割', Icon: CalendarDays },
  { id: 'cafeteria', label: '学食', Icon: Utensils },
  { id: 'bus', label: 'バス', Icon: Bus },
  { id: 'circle', label: '交流', Icon: UsersRound },
];

const cafeteriaVenues = [
  {
    id: 'terrace',
    name: '802A TERRACE',
    detail: '東京工科大学の「802A TERRACE（ハチマルニエー・テラス）」は、八王子キャンパスの厚生棟3階にある学生食堂・カフェです。カフェめしやスイーツ、日替りランチなどが楽しめるおしゃれな空間として人気があり、休憩や憩いの場として利用されています。',
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
    detail: '東京工科大学の「ROSE kitchen（ローズキッチン）」は、八王子キャンパスの厚生棟4階にある、590席の広大な学生食堂です。一般の利用も可能で、安くてボリュームのある定食、カレー、パスタ、ガッツリ系のランチメニューを提供しており、学生に人気のスポットです。',
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
    detail: '東京工科大学（八王子キャンパス）の「FOODS FUU（フーズ・フー）」は、1階・2階合わせて約360席を持つ、学内最大級の食堂・レストランフロアです。吉野家やラーメン店、パン屋、コンビニ、ネットカフェが集まる、学生の憩いの場・生活拠点となっています。',
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

function normalizeSearchText(value) {
  return value
    .toString()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .toLowerCase()
    .replace(/\s+/g, '');
}

function formatFloorTitle(building, floor) {
  return `${building.name} ${floor.name}`;
}

function createFloorSearchText(building, floor) {
  const roomText = (floor.rooms ?? [])
    .map(room => `${room.label} ${room.type}`)
    .join(' ');

  return normalizeSearchText([
    building.name,
    `${building.name}棟`,
    floor.name,
    `${floor.level}F`,
    `${floor.level}階`,
    floor.details,
    roomText,
  ].join(' '));
}

const timetableRows = [
  { id: 'period-1', label: '1時限', type: '授業', time: '08:50〜10:30', duration: '100分' },
  { id: 'break-1', label: '休み時間', type: '休み時間', time: '10:30〜10:45', duration: '15分' },
  { id: 'period-2', label: '2時限', type: '授業', time: '10:45〜12:25', duration: '100分' },
  { id: 'lunch', label: '昼休み', type: '休み時間', time: '12:25〜13:15', duration: '50分' },
  { id: 'period-3', label: '3時限', type: '授業', time: '13:15〜14:55', duration: '100分' },
  { id: 'break-3', label: '休み時間', type: '休み時間', time: '14:55〜15:10', duration: '15分' },
  { id: 'period-4', label: '4時限', type: '授業', time: '15:10〜16:50', duration: '100分' },
  { id: 'break-4', label: '休み時間', type: '休み時間', time: '16:50〜17:05', duration: '15分' },
  { id: 'period-5', label: '5時限', type: '授業', time: '17:05〜18:45', duration: '100分' },
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
        <p>2020年度以降の時間です。100分授業と休み時間を時刻で確認できます。</p>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  const floorOptions = useMemo(() => buildings.flatMap(building => (
    building.floors.map(floor => ({
      id: `${building.id}-${floor.level}`,
      building,
      floor,
      title: formatFloorTitle(building, floor),
      searchText: createFloorSearchText(building, floor),
    }))
  )), [buildings]);

  const filteredFloorOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);

    if (!normalizedQuery) {
      return floorOptions.slice(0, 6);
    }

    return floorOptions
      .filter(option => option.searchText.includes(normalizedQuery))
      .slice(0, 8);
  }, [floorOptions, searchQuery]);

  const selectFloor = (building, floor) => {
    setSelectedFloor({ building, floor });
    setSearchQuery(formatFloorTitle(building, floor));
    setIsSearchFocused(false);
    
    // Blender風: ターゲットを選択された建物の階層の中心に移動
    const floorHeight = 1.5;
    const yPos = floorHeight / 2 + (floor.level - 1) * floorHeight;
    setCameraTarget(new THREE.Vector3(building.position.x, yPos, building.position.z));
  };

  const handleFloorClick = (building, floor) => {
    selectFloor(building, floor);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (filteredFloorOptions.length === 0) {
      return;
    }

    const { building, floor } = filteredFloorOptions[0];
    selectFloor(building, floor);
  };

  const resetSelection = () => {
    setSelectedFloor(null);
    setSearchQuery('');
    setIsSearchFocused(false);
    // 注視点はそのまま維持し、ユーザーが自由に移動（パン）できるようにする
  };

  const selectedRooms = selectedFloor?.floor.rooms ?? [];
  const selectedBuildingFloors = selectedFloor?.building.floors ?? [];
  const shouldShowSuggestions = isSearchFocused && (searchQuery || filteredFloorOptions.length > 0);

  return (
    <div className="map-view">
      <div className="map-search-panel">
        <form className="map-search-form" role="search" onSubmit={handleSearchSubmit}>
          <MapPin className="map-search-logo" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            placeholder="建物・階を検索"
            aria-label="建物や階を検索"
            autoComplete="off"
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsSearchFocused(true);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => {
              setTimeout(() => setIsSearchFocused(false), 120);
            }}
          />
          {searchQuery && (
            <button className="map-search-clear" type="button" aria-label="検索をクリア" onClick={resetSelection}>
              <X size={21} aria-hidden="true" />
            </button>
          )}
          <button className="map-search-submit" type="submit" aria-label="検索">
            <Search size={23} aria-hidden="true" />
          </button>
        </form>

        {shouldShowSuggestions && (
          <div className="map-search-suggestions" role="listbox" aria-label="検索候補">
            {filteredFloorOptions.length > 0 ? (
              filteredFloorOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={selectedFloor?.building.id === option.building.id && selectedFloor.floor.level === option.floor.level}
                  className="map-search-option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectFloor(option.building, option.floor)}
                >
                  <span className="map-search-option-icon">
                    <Building2 size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{option.title}</strong>
                    <small>{option.floor.details}</small>
                  </span>
                </button>
              ))
            ) : (
              <p className="map-search-empty">一致する場所がありません</p>
            )}
          </div>
        )}
      </div>

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

      {selectedFloor && (
        <section className="floor-panel" aria-live="polite" aria-label={`${selectedFloor.building.name} ${selectedFloor.floor.name}の詳細`}>
          <div className="floor-panel-handle" aria-hidden="true" />
          <div className="floor-panel-top">
            <span className="floor-panel-kicker">Campus detail</span>
            <button className="floor-panel-close" type="button" aria-label="詳細を閉じる" onClick={resetSelection}>
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <h2>{formatFloorTitle(selectedFloor.building, selectedFloor.floor)}</h2>
          <p>{selectedFloor.floor.details}</p>

          <div className="floor-facts">
            <div>
              <span>建物</span>
              <strong>{selectedFloor.building.name}</strong>
            </div>
            <div>
              <span>階</span>
              <strong>{selectedFloor.floor.name}</strong>
            </div>
            <div>
              <span>登録設備</span>
              <strong>{selectedRooms.length || 'なし'}</strong>
            </div>
          </div>

          <div className="floor-detail-section">
            <h3>設備</h3>
            {selectedRooms.length > 0 ? (
              <div className="room-tags">
                {selectedRooms.map(room => (
                  <span key={room.id}>{room.label}</span>
                ))}
              </div>
            ) : (
              <p>この階の設備情報はまだ登録されていません。</p>
            )}
          </div>

          {selectedBuildingFloors.length > 1 && (
            <div className="floor-detail-section">
              <h3>同じ建物の階</h3>
              <div className="floor-chip-list">
                {selectedBuildingFloors.map(floor => {
                  const isActive = floor.level === selectedFloor.floor.level;

                  return (
                    <button
                      key={floor.level}
                      type="button"
                      className={`floor-chip${isActive ? ' is-active' : ''}`}
                      onClick={() => selectFloor(selectedFloor.building, floor)}
                    >
                      {floor.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
