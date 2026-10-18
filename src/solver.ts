import { Tile, HintPair } from './types';
import { getAvailableMatchingPairs, doTilesOverlap2D } from './rules';

/**
 * Calculates a strategic priority score for a tile.
 * Tiles on higher layers or tiles covering other tiles below them
 * are given higher priority because removing them unlocks the board.
 */
function evaluateTileWeight(tile: Tile, allTiles: Tile[]): number {
  let score = tile.z * 10;

  for (const other of allTiles) {
    if (other.id === tile.id || other.status === 'matched') continue;
    // Tile directly below this tile
    if (other.z < tile.z && doTilesOverlap2D(tile, other)) {
      score += 15 * (tile.z - other.z);
    }
  }

  return score;
}

/**
 * Finds the best hint pair to suggest to the player.
 * Prioritizes matching pairs that unlock the most blocked tiles beneath them.
 */
export function getBestHintPair(tiles: Tile[]): HintPair | null {
  const activeTiles = tiles.filter(t => t.status !== 'matched');
  const availablePairs = getAvailableMatchingPairs(activeTiles);

  if (availablePairs.length === 0) {
    return null;
  }

  let bestPair: [Tile, Tile] = availablePairs[0];
  let highestScore = -Infinity;

  for (const [tile1, tile2] of availablePairs) {
    const pairScore = evaluateTileWeight(tile1, activeTiles) + evaluateTileWeight(tile2, activeTiles);
    if (pairScore > highestScore) {
      highestScore = pairScore;
      bestPair = [tile1, tile2];
    }
  }

  return {
    tile1: bestPair[0],
    tile2: bestPair[1]
  };
}
