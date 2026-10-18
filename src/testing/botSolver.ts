import { Tile } from '../types';
import { getAvailableMatchingPairs } from '../rules';
import { getBestHintPair } from '../solver';

export interface MoveStep {
  tile1Id: number;
  tile2Id: number;
  suit: string;
  value: string | number;
  remainingCount: number;
}

export interface PlaythroughResult {
  success: boolean;
  totalMoves: number;
  initialTiles: number;
  remainingTiles: number;
  steps: MoveStep[];
  durationMs: number;
  deadlockEncountered: boolean;
  shufflesUsed: number;
}

/**
 * Headless Bot Solver that can play through games autonomously.
 */
export class BotSolver {
  private tiles: Tile[];
  private steps: MoveStep[] = [];
  private shufflesUsed = 0;

  constructor(initialTiles: Tile[]) {
    // Deep clone tiles
    this.tiles = initialTiles.map(t => ({ ...t }));
  }

  public getRemainingTiles(): Tile[] {
    return this.tiles.filter(t => t.status !== 'matched');
  }

  public getRemainingCount(): number {
    return this.getRemainingTiles().length;
  }

  /**
   * Executes a single smart move using the hint solver's strategic choice.
   */
  public step(): MoveStep | null {
    const activeTiles = this.getRemainingTiles();
    if (activeTiles.length === 0) return null;

    const hint = getBestHintPair(activeTiles);
    if (!hint) return null;

    const t1 = this.tiles.find(t => t.id === hint.tile1.id)!;
    const t2 = this.tiles.find(t => t.id === hint.tile2.id)!;

    t1.status = 'matched';
    t2.status = 'matched';

    const stepRecord: MoveStep = {
      tile1Id: t1.id,
      tile2Id: t2.id,
      suit: t1.suit,
      value: t1.value,
      remainingCount: this.getRemainingCount()
    };

    this.steps.push(stepRecord);
    return stepRecord;
  }

  /**
   * Shuffles the remaining active tiles on their current positions if no moves are available.
   */
  public shuffleRemaining(rng = Math.random): boolean {
    const activeTiles = this.getRemainingTiles();
    if (activeTiles.length === 0) return false;

    // Collect current values
    const faces = activeTiles.map(t => ({ suit: t.suit, value: t.value }));
    // Shuffle faces
    for (let i = faces.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [faces[i], faces[j]] = [faces[j], faces[i]];
    }
    // Reassign
    activeTiles.forEach((tile, idx) => {
      tile.suit = faces[idx].suit;
      tile.value = faces[idx].value;
    });

    this.shufflesUsed++;
    return true;
  }

  /**
   * Plays through the game until all tiles are matched.
   * If a greedy path encounters a temporary block, it utilizes shuffle or search.
   */
  public playToCompletion(maxMoves = 200): PlaythroughResult {
    const startTime = performance.now();
    const initialCount = this.getRemainingCount();
    let deadlock = false;
    let iterations = 0;

    while (this.getRemainingCount() > 0 && iterations < maxMoves) {
      iterations++;
      const step = this.step();
      if (!step) {
        deadlock = true;
        // Try shuffling remaining tiles if blocked
        let shuffled = false;
        for (let attempt = 0; attempt < 5; attempt++) {
          this.shuffleRemaining();
          const available = getAvailableMatchingPairs(this.getRemainingTiles());
          if (available.length > 0) {
            shuffled = true;
            break;
          }
        }
        if (!shuffled) {
          break; // Truly deadlocked
        }
      }
    }

    const durationMs = performance.now() - startTime;
    const remaining = this.getRemainingCount();

    return {
      success: remaining === 0,
      totalMoves: this.steps.length,
      initialTiles: initialCount,
      remainingTiles: remaining,
      steps: [...this.steps],
      durationMs,
      deadlockEncountered: deadlock,
      shufflesUsed: this.shufflesUsed
    };
  }
}
