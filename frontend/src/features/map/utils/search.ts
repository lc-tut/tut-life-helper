import { BuildingData, FloorData, Room } from '../components/Building';

export function normalizeSearchText(value: unknown): string {
  if (value == null) return '';
  return value
    .toString()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char: string) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function createFloorSearchText(building: BuildingData, floor: FloorData): string {
  const roomText = (floor.rooms ?? [])
    .map((room: Room) => `${room.label ?? ''} ${room.type ?? ''}`)
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
