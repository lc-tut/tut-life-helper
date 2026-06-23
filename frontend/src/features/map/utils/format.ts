import { BuildingData, FloorData } from '../types';

export function formatFloorTitle(building: BuildingData, floor: FloorData): string {
  return `${building.name} ${floor.name}`;
}
