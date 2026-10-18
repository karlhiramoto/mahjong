import { describe, it, expect } from 'vitest';
import { areTilesMatching, isTileFree, getAvailableMatchingPairs } from '../src/rules';
import { Tile } from '../src/types';

describe('Mahjong Solitaire Rules', () => {
  it('correctly matches number suits', () => {
    const t1: Tile = { id: 1, suit: 'dots', value: 5, x: 0, y: 0, z: 0, status: 'active' };
    const t2: Tile = { id: 2, suit: 'dots', value: 5, x: 4, y: 0, z: 0, status: 'active' };
    const t3: Tile = { id: 3, suit: 'dots', value: 6, x: 8, y: 0, z: 0, status: 'active' };
    const t4: Tile = { id: 4, suit: 'bamboo', value: 5, x: 12, y: 0, z: 0, status: 'active' };

    expect(areTilesMatching(t1, t2)).toBe(true);
    expect(areTilesMatching(t1, t3)).toBe(false);
    expect(areTilesMatching(t1, t4)).toBe(false);
  });

  it('correctly matches seasons and flowers with any in family', () => {
    const spring: Tile = { id: 1, suit: 'seasons', value: 'spring', x: 0, y: 0, z: 0, status: 'active' };
    const winter: Tile = { id: 2, suit: 'seasons', value: 'winter', x: 4, y: 0, z: 0, status: 'active' };
    const plum: Tile = { id: 3, suit: 'flowers', value: 'plum', x: 8, y: 0, z: 0, status: 'active' };
    const orchid: Tile = { id: 4, suit: 'flowers', value: 'orchid', x: 12, y: 0, z: 0, status: 'active' };

    // Any season matches any season
    expect(areTilesMatching(spring, winter)).toBe(true);
    // Any flower matches any flower
    expect(areTilesMatching(plum, orchid)).toBe(true);
    // Season does not match flower
    expect(areTilesMatching(spring, plum)).toBe(false);
  });

  it('evaluates tile 3D vertical coverage freedom', () => {
    // Tile at z=0, [4, 6] x [4, 6]
    const bottomTile: Tile = { id: 1, suit: 'dots', value: 1, x: 4, y: 4, z: 0, status: 'active' };
    // Tile at z=1, overlapping footprint [4.5, 6.5] x [4.5, 6.5]
    const topTile: Tile = { id: 2, suit: 'dots', value: 2, x: 5, y: 5, z: 1, status: 'active' };

    const board = [bottomTile, topTile];
    expect(isTileFree(bottomTile, board)).toBe(false); // Covered from above
    expect(isTileFree(topTile, board)).toBe(true);      // Top tile has nothing above or adjacent
  });

  it('evaluates tile horizontal blocking freedom', () => {
    // 3 tiles in a horizontal row at same layer z=0
    // Left: [2, 4], Center: [4, 6], Right: [6, 8]
    const left: Tile = { id: 1, suit: 'dots', value: 1, x: 2, y: 4, z: 0, status: 'active' };
    const center: Tile = { id: 2, suit: 'dots', value: 2, x: 4, y: 4, z: 0, status: 'active' };
    const right: Tile = { id: 3, suit: 'dots', value: 3, x: 6, y: 4, z: 0, status: 'active' };

    const row = [left, center, right];

    expect(isTileFree(left, row)).toBe(true);    // Open on its left side
    expect(isTileFree(right, row)).toBe(true);   // Open on its right side
    expect(isTileFree(center, row)).toBe(false); // Blocked on both left and right!
  });

  it('detects available matching pairs among free tiles', () => {
    const t1: Tile = { id: 1, suit: 'bamboo', value: 3, x: 0, y: 0, z: 0, status: 'active' };
    const t2: Tile = { id: 2, suit: 'bamboo', value: 3, x: 10, y: 0, z: 0, status: 'active' };
    const t3: Tile = { id: 3, suit: 'winds', value: 'east', x: 20, y: 0, z: 0, status: 'active' };

    const pairs = getAvailableMatchingPairs([t1, t2, t3]);
    expect(pairs.length).toBe(1);
    expect(pairs[0][0].id).toBe(1);
    expect(pairs[0][1].id).toBe(2);
  });
});
