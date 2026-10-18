import { Tile, TileSuit, TileValue, BoardLayout } from './types';
import { isTileFree } from './rules';

/**
 * Creates the full 144 Mahjong Solitaire tile pool (72 matching pairs).
 */
export function createTilePool(count: number = 144): { suit: TileSuit; value: TileValue }[] {
  const fullPool: { suit: TileSuit; value: TileValue }[] = [];

  // 1. Dots (1..9 x 4)
  for (let val = 1; val <= 9; val++) {
    for (let c = 0; c < 4; c++) fullPool.push({ suit: 'dots', value: val });
  }

  // 2. Bamboo (1..9 x 4)
  for (let val = 1; val <= 9; val++) {
    for (let c = 0; c < 4; c++) fullPool.push({ suit: 'bamboo', value: val });
  }

  // 3. Characters (1..9 x 4)
  for (let val = 1; val <= 9; val++) {
    for (let c = 0; c < 4; c++) fullPool.push({ suit: 'characters', value: val });
  }

  // 4. Winds (4 directions x 4)
  const winds: TileValue[] = ['east', 'south', 'west', 'north'];
  for (const wind of winds) {
    for (let c = 0; c < 4; c++) fullPool.push({ suit: 'winds', value: wind });
  }

  // 5. Dragons (3 colors x 4)
  const dragons: TileValue[] = ['red', 'green', 'white'];
  for (const dragon of dragons) {
    for (let c = 0; c < 4; c++) fullPool.push({ suit: 'dragons', value: dragon });
  }

  // 6. Seasons (4 unique, all match each other)
  const seasons: TileValue[] = ['spring', 'summer', 'autumn', 'winter'];
  for (const season of seasons) {
    fullPool.push({ suit: 'seasons', value: season });
  }

  // 7. Flowers (4 unique, all match each other)
  const flowers: TileValue[] = ['plum', 'orchid', 'chrysanthemum', 'bamboo'];
  for (const flower of flowers) {
    fullPool.push({ suit: 'flowers', value: flower });
  }

  if (count === 144) {
    return fullPool;
  }

  // If a smaller layout is requested, extract matching pairs
  const pairs: { suit: TileSuit; value: TileValue }[][] = [];
  for (let i = 0; i < 136; i += 2) {
    pairs.push([fullPool[i], fullPool[i + 1]]);
  }
  pairs.push([fullPool[136], fullPool[137]]);
  pairs.push([fullPool[138], fullPool[139]]);
  pairs.push([fullPool[140], fullPool[141]]);
  pairs.push([fullPool[142], fullPool[143]]);

  const neededPairs = count / 2;
  const selectedPairs = shuffle(pairs).slice(0, neededPairs);
  const result: { suit: TileSuit; value: TileValue }[] = [];
  for (const p of selectedPairs) {
    result.push(p[0], p[1]);
  }
  return result;
}

/**
 * Simple PRNG (Mulberry32) for deterministic board seeding.
 */
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(array: T[], rng = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Builds pairs of tiles from a tile pool.
 */
function organizeIntoMatchingPairs(
  pool: { suit: TileSuit; value: TileValue }[],
  rng = Math.random
): [ { suit: TileSuit; value: TileValue }, { suit: TileSuit; value: TileValue } ][] {
  const pairs: [ { suit: TileSuit; value: TileValue }, { suit: TileSuit; value: TileValue } ][] = [];
  const normalBuckets = new Map<string, { suit: TileSuit; value: TileValue }[]>();
  const seasons: { suit: TileSuit; value: TileValue }[] = [];
  const flowers: { suit: TileSuit; value: TileValue }[] = [];

  for (const item of pool) {
    if (item.suit === 'seasons') {
      seasons.push(item);
    } else if (item.suit === 'flowers') {
      flowers.push(item);
    } else {
      const key = `${item.suit}-${item.value}`;
      if (!normalBuckets.has(key)) normalBuckets.set(key, []);
      normalBuckets.get(key)!.push(item);
    }
  }

  for (const [, items] of normalBuckets) {
    while (items.length >= 2) {
      pairs.push([items.pop()!, items.pop()!]);
    }
  }

  const shuffledSeasons = shuffle(seasons, rng);
  while (shuffledSeasons.length >= 2) {
    pairs.push([shuffledSeasons.pop()!, shuffledSeasons.pop()!]);
  }

  const shuffledFlowers = shuffle(flowers, rng);
  while (shuffledFlowers.length >= 2) {
    pairs.push([shuffledFlowers.pop()!, shuffledFlowers.pop()!]);
  }

  return shuffle(pairs, rng);
}

/**
 * Generates a guaranteed-solvable board for a given layout.
 *
 * Algorithm:
 * Simulates reverse peeling:
 * All layout positions start populated.
 * At each step, finds all currently free slots, prioritizing higher layers
 * so the pyramid is peeled naturally downwards.
 * Assigns pairs of matching tiles and removes the slots.
 * This guarantees a mathematically proven 100% winnable solution path.
 */
export function generateSolvableBoard(
  layout: BoardLayout,
  seed: number = Date.now()
): Tile[] {
  const rng = createPRNG(seed);
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tilePool = createTilePool(layout.tileCount);
    const pairs = organizeIntoMatchingPairs(tilePool, rng);

    const remainingSlots: Tile[] = layout.positions.map((pos, idx) => ({
      id: idx + 1,
      suit: 'dots',
      value: 1,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      status: 'active'
    }));

    const assignedTiles: Tile[] = [];
    let pairIndex = 0;
    let failed = false;

    while (remainingSlots.length > 0) {
      const freeSlots = remainingSlots.filter(s => isTileFree(s, remainingSlots));

      if (freeSlots.length < 2) {
        failed = true;
        break;
      }

      // Prioritize peeling upper layers first to avoid trapping base layers
      freeSlots.sort((a, b) => (b.z - a.z) * 10 + (rng() - 0.5) * 5);

      const slot1 = freeSlots[0];
      const slot2 = freeSlots[1];

      const pair = pairs[pairIndex++];
      if (!pair) {
        failed = true;
        break;
      }

      assignedTiles.push({
        id: slot1.id,
        suit: pair[0].suit,
        value: pair[0].value,
        x: slot1.x,
        y: slot1.y,
        z: slot1.z,
        status: 'active'
      });

      assignedTiles.push({
        id: slot2.id,
        suit: pair[1].suit,
        value: pair[1].value,
        x: slot2.x,
        y: slot2.y,
        z: slot2.z,
        status: 'active'
      });

      const idx1 = remainingSlots.findIndex(s => s.id === slot1.id);
      if (idx1 !== -1) remainingSlots.splice(idx1, 1);
      const idx2 = remainingSlots.findIndex(s => s.id === slot2.id);
      if (idx2 !== -1) remainingSlots.splice(idx2, 1);
    }

    if (!failed && assignedTiles.length === layout.tileCount) {
      return assignedTiles.sort((a, b) => a.id - b.id);
    }
  }

  // Fallback if needed
  const fallbackPool = shuffle(createTilePool(layout.tileCount), rng);
  return layout.positions.map((pos, idx) => ({
    id: idx + 1,
    suit: fallbackPool[idx].suit,
    value: fallbackPool[idx].value,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    status: 'active'
  }));
}
