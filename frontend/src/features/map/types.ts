export interface Room {
  id: string;
  label?: string;
  name?: string;
  type?: string;
  position: { x: number; z: number };
  size: { x: number; z: number };
  color: string;
}

export interface FloorData {
  level: number;
  name: string;
  details?: string;
  rooms?: Room[];
}

export interface BuildingData {
  id: string;
  name: string;
  position: { x: number; z: number };
  floors: FloorData[];
}

export interface SelectedFloor {
  building: BuildingData;
  floor: FloorData;
}
