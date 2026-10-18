import { BoardLayout, TilePosition } from './types';

/**
 * Classic 144-Tile Turtle (Shanghai) Layout
 */
function createTurtlePositions(): TilePosition[] {
  const positions: TilePosition[] = [];

  // Layer 0: 87 tiles
  // Row y=0: 12 tiles
  for (let x = 2; x <= 24; x += 2) positions.push({ x, y: 0, z: 0 });
  // Row y=2: 8 tiles
  for (let x = 6; x <= 20; x += 2) positions.push({ x, y: 2, z: 0 });
  // Row y=4: 10 tiles
  for (let x = 4; x <= 22; x += 2) positions.push({ x, y: 4, z: 0 });
  // Row y=6: 12 tiles
  for (let x = 2; x <= 24; x += 2) positions.push({ x, y: 6, z: 0 });
  // Row y=8: 12 tiles
  for (let x = 2; x <= 24; x += 2) positions.push({ x, y: 8, z: 0 });
  // Row y=10: 10 tiles
  for (let x = 4; x <= 22; x += 2) positions.push({ x, y: 10, z: 0 });
  // Row y=12: 8 tiles
  for (let x = 6; x <= 20; x += 2) positions.push({ x, y: 12, z: 0 });
  // Row y=14: 12 tiles
  for (let x = 2; x <= 24; x += 2) positions.push({ x, y: 14, z: 0 });

  // Outrigger / Ear tiles in middle row (y=7)
  positions.push({ x: 0, y: 7, z: 0 });
  positions.push({ x: 26, y: 7, z: 0 });
  positions.push({ x: 28, y: 7, z: 0 });

  // Layer 1: 36 tiles (6x6 square from x=8..18, y=4..14)
  for (let y = 4; y <= 14; y += 2) {
    for (let x = 8; x <= 18; x += 2) {
      positions.push({ x, y, z: 1 });
    }
  }

  // Layer 2: 16 tiles (4x4 square from x=10..16, y=6..12)
  for (let y = 6; y <= 12; y += 2) {
    for (let x = 10; x <= 16; x += 2) {
      positions.push({ x, y, z: 2 });
    }
  }

  // Layer 3: 4 tiles (2x2 square from x=12..14, y=8..10)
  for (let y = 8; y <= 10; y += 2) {
    for (let x = 12; x <= 14; x += 2) {
      positions.push({ x, y, z: 3 });
    }
  }

  // Layer 4: 1 tile at center
  positions.push({ x: 13, y: 9, z: 4 });

  return positions;
}

/**
 * Mini 36-Tile Layout (Quick play & fast test validation)
 */
function createMiniPositions(): TilePosition[] {
  const positions: TilePosition[] = [];
  // Layer 0: 24 tiles (6 cols x 4 rows)
  for (let y = 2; y <= 8; y += 2) {
    for (let x = 4; x <= 14; x += 2) {
      positions.push({ x, y, z: 0 });
    }
  }
  // Layer 1: 8 tiles (4 cols x 2 rows)
  for (let y = 4; y <= 6; y += 2) {
    for (let x = 6; x <= 12; x += 2) {
      positions.push({ x, y, z: 1 });
    }
  }
  // Layer 2: 4 tiles (2 cols x 2 rows)
  for (let y = 4; y <= 6; y += 2) {
    for (let x = 8; x <= 10; x += 2) {
      positions.push({ x, y, z: 2 });
    }
  }
  return positions;
}

/**
 * Fortress 64-Tile Layout
 */
function createFortressPositions(): TilePosition[] {
  const positions: TilePosition[] = [];
  // Layer 0: 44 tiles
  for (let y = 0; y <= 10; y += 2) {
    for (let x = 0; x <= 14; x += 2) {
      // Four corner towers + center cross
      const isCorner = (x === 0 || x === 14) && (y === 0 || y === 10);
      const isOuter = x === 0 || x === 14 || y === 0 || y === 10;
      const isInner = x >= 4 && x <= 10 && y >= 4 && y <= 6;
      if (isOuter || isInner || isCorner) {
        positions.push({ x, y, z: 0 });
      }
    }
  }

  // Layer 1: 16 tiles
  for (let y = 2; y <= 8; y += 2) {
    for (let x = 4; x <= 10; x += 2) {
      positions.push({ x, y, z: 1 });
    }
  }

  // Layer 2: 4 tiles
  positions.push({ x: 6, y: 4, z: 2 });
  positions.push({ x: 8, y: 4, z: 2 });
  positions.push({ x: 6, y: 6, z: 2 });
  positions.push({ x: 8, y: 6, z: 2 });

  return positions;
}

export const LAYOUTS: BoardLayout[] = [
  {
    id: 'turtle',
    name: 'Classic Turtle (144 Tiles)',
    tileCount: 144,
    positions: createTurtlePositions()
  },
  {
    id: 'mini',
    name: 'Quick Mini (36 Tiles)',
    tileCount: 36,
    positions: createMiniPositions()
  },
  {
    id: 'fortress',
    name: 'Fortress (64 Tiles)',
    tileCount: 64,
    positions: createFortressPositions()
  }
];

export function getLayout(id: string): BoardLayout {
  return LAYOUTS.find(l => l.id === id) || LAYOUTS[0];
}
