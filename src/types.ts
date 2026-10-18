export type NumberSuit = 'dots' | 'bamboo' | 'characters';
export type HonorSuit = 'winds' | 'dragons';
export type BonusSuit = 'seasons' | 'flowers';
export type TileSuit = NumberSuit | HonorSuit | BonusSuit;

export type WindValue = 'east' | 'south' | 'west' | 'north';
export type DragonValue = 'red' | 'green' | 'white';
export type SeasonValue = 'spring' | 'summer' | 'autumn' | 'winter';
export type FlowerValue = 'plum' | 'orchid' | 'chrysanthemum' | 'bamboo';

export type TileValue = number | WindValue | DragonValue | SeasonValue | FlowerValue;

export type TileStatus = 'active' | 'selected' | 'matched' | 'hint';

export interface Tile {
  id: number;
  suit: TileSuit;
  value: TileValue;
  x: number;      // Grid position in half-tile units (width is 2 units)
  y: number;      // Grid position in half-tile units (height is 2 units)
  z: number;      // Layer (0 = bottom, 1, 2, 3...)
  status: TileStatus;
}

export interface TilePosition {
  x: number;
  y: number;
  z: number;
}

export interface BoardLayout {
  id: string;
  name: string;
  tileCount: number;
  positions: TilePosition[];
}

export interface MoveRecord {
  tile1: Tile;
  tile2: Tile;
  timestamp: number;
}

export interface GameStats {
  hintsUsed: number;
  movesMade: number;
  remainingTiles: number;
  availableMoves: number;
  elapsedSeconds: number;
  score: number;
  isWon: boolean;
  isGameOver: boolean;
}

export interface HintPair {
  tile1: Tile;
  tile2: Tile;
}

export interface CameraTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  minScale: number;
  maxScale: number;
}
