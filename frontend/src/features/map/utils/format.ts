import { BuildingData, FloorData } from '../components/Building';

export function formatFloorTitle(building: BuildingData, floor: FloorData): string {
  return `${building.name} ${floor.name}`;
}
