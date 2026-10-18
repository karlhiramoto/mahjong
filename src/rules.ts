import { Tile } from './types';

/**
 * Checks if two tiles can be matched according to Mahjong Solitaire rules:
 * - Number suits (dots, bamboo, characters): same suit and same number.
 * - Winds: same wind (east, south, west, north).
 * - Dragons: same dragon (red, green, white).
 * - Seasons: any season matches any season.
 * - Flowers: any flower matches any flower.
 */
export function areTilesMatching(tile1: Tile, tile2: Tile): boolean {
  if (tile1.id === tile2.id) return false;

  if (tile1.suit === 'seasons' && tile2.suit === 'seasons') {
    return true;
  }

  if (tile1.suit === 'flowers' && tile2.suit === 'flowers') {
    return true;
  }

  return tile1.suit === tile2.suit && tile1.value === tile2.value;
}

/**
 * Checks if two tiles horizontally or vertically overlap (footprint intersection).
 * Tiles have a 2x2 grid unit footprint.
 */
export function doTilesOverlap2D(t1: { x: number; y: number }, t2: { x: number; y: number }): boolean {
  return Math.abs(t1.x - t2.x) < 2 && Math.abs(t1.y - t2.y) < 2;
}

/**
 * Determines if a tile is currently free (can be selected/matched).
 * A tile is free if:
 * 1. It is active.
 * 2. No active tile at layer z + 1 (or higher) overlaps its 2x2 footprint.
 * 3. It is open on its LEFT side OR open on its RIGHT side at the same layer z.
 */
export function isTileFree(tile: Tile, allTiles: Tile[]): boolean {
  if (tile.status === 'matched') return false;

  let blockedOnLeft = false;
  let blockedOnRight = false;

  for (const other of allTiles) {
    if (other.id === tile.id || other.status === 'matched') continue;

    // Check 1: Tile above (z > tile.z)
    if (other.z > tile.z) {
      if (doTilesOverlap2D(tile, other)) {
        return false; // Covered from above
      }
    }

    // Check 2: Same layer horizontal blockage (z === tile.z)
    if (other.z === tile.z) {
      // Must overlap vertically to block horizontally
      if (Math.abs(tile.y - other.y) < 2) {
        // Blocked on the left: other tile touches or overlaps the left edge
        // A tile is at [other.x, other.x + 2]. It blocks left if other.x is between [tile.x - 2, tile.x)
        if (other.x >= tile.x - 2 && other.x < tile.x) {
          blockedOnLeft = true;
        }

        // Blocked on the right: other tile touches or overlaps the right edge
        // It blocks right if other.x is between (tile.x, tile.x + 2]
        if (other.x <= tile.x + 2 && other.x > tile.x) {
          blockedOnRight = true;
        }
      }
    }
  }

  // Free if at least one side (left or right) is open
  return !blockedOnLeft || !blockedOnRight;
}

/**
 * Returns all currently free tiles on the board.
 */
export function getFreeTiles(tiles: Tile[]): Tile[] {
  return tiles.filter(tile => isTileFree(tile, tiles));
}

/**
 * Finds all available matching pairs from the currently free tiles.
 */
export function getAvailableMatchingPairs(tiles: Tile[]): [Tile, Tile][] {
  const freeTiles = getFreeTiles(tiles);
  const pairs: [Tile, Tile][] = [];

  for (let i = 0; i < freeTiles.length; i++) {
    for (let j = i + 1; j < freeTiles.length; j++) {
      if (areTilesMatching(freeTiles[i], freeTiles[j])) {
        pairs.push([freeTiles[i], freeTiles[j]]);
      }
    }
  }

  return pairs;
}
