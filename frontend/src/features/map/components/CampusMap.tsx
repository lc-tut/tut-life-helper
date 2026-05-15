import { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, ContactShadows, Environment } from '@react-three/drei';
import { Building2, MapPin, Search, X } from 'lucide-react';
import * as THREE from 'three';
import Building from './Building';
import { fetchBuildings } from '../api';
import fallbackBuildings from '../../../../../backend/app/data.json';
import { CameraRig } from './CameraRig';
import { formatFloorTitle } from '../utils/format';
import { createFloorSearchText, normalizeSearchText } from '../utils/search';

export function CampusMap() {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<any>(null);
  const [cameraTarget, setCameraTarget] = useState(new THREE.Vector3(0, 0, 0));
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    fetchBuildings()
      .then(data => setBuildings(data))
      .catch(err => {
        setBuildings(fallbackBuildings as any[]);
      });
  }, []);

  const floorOptions = useMemo(() => buildings.flatMap(building => (
    building.floors.map((floor: any) => ({
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

  const selectFloor = (building: any, floor: any) => {
    setSelectedFloor({ building, floor });
    setSearchQuery(formatFloorTitle(building, floor));
    setIsSearchFocused(false);
    
    // Blender風: ターゲットを選択された建物の階層の中心に移動
    const floorHeight = 1.5;
    const yPos = floorHeight / 2 + (floor.level - 1) * floorHeight;
    setCameraTarget(new THREE.Vector3(building.position.x, yPos, building.position.z));
  };

  const handleFloorClick = (building: any, floor: any) => {
    selectFloor(building, floor);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
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
                  aria-selected={selectedFloor?.building.id === option.building.id && selectedFloor?.floor.level === option.floor.level}
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
                {selectedRooms.map((room: any) => (
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
                {selectedBuildingFloors.map((floor: any) => {
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
