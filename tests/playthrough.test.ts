import { describe, it, expect } from 'vitest';
import { getLayout } from '../src/layouts';
import { generateSolvableBoard } from '../src/generator';
import { BotSolver } from '../src/testing/botSolver';
import { runBatchPlaythrough } from '../src/testing/playthroughRunner';
import { getBestHintPair } from '../src/solver';

describe('Play-Through Testing Framework', () => {
  it('generates a full 144-tile Classic Turtle board with 72 matching pairs', () => {
    const turtle = getLayout('turtle');
    expect(turtle.tileCount).toBe(144);

    const tiles = generateSolvableBoard(turtle, 42);
    expect(tiles.length).toBe(144);

    // Verify all tiles are active initially
    expect(tiles.every(t => t.status === 'active')).toBe(true);
  });

  it('plays through a full 36-tile Mini game to complete victory (0 tiles remaining)', () => {
    const mini = getLayout('mini');
    const tiles = generateSolvableBoard(mini, 12345);
    const bot = new BotSolver(tiles);

    expect(bot.getRemainingCount()).toBe(36);

    const result = bot.playToCompletion();

    expect(result.success).toBe(true);
    expect(result.remainingTiles).toBe(0);
    expect(result.totalMoves).toBe(18); // 36 tiles / 2 = 18 moves
    expect(result.steps.length).toBe(18);
  });

  it('plays through a full 144-tile Classic Turtle game to victory', () => {
    const turtle = getLayout('turtle');
    const tiles = generateSolvableBoard(turtle, 98765);
    const bot = new BotSolver(tiles);

    expect(bot.getRemainingCount()).toBe(144);

    const result = bot.playToCompletion();

    expect(result.success).toBe(true);
    expect(result.remainingTiles).toBe(0);
    expect(result.totalMoves).toBe(72); // 144 tiles / 2 = 72 moves
  });

  it('runs batch simulation across multiple seeds to verify 100% winnability', () => {
    const mini = getLayout('mini');
    const summary = runBatchPlaythrough(mini, 5, 2026);

    expect(summary.gamesTested).toBe(5);
    expect(summary.gamesWon).toBe(5);
    expect(summary.winRate).toBe(100);
  });

  it('accurately finds valid hint pairs and steps through moves', () => {
    const mini = getLayout('mini');
    const tiles = generateSolvableBoard(mini, 55555);

    let hintsGiven = 0;
    const hint = getBestHintPair(tiles);
    expect(hint).not.toBeNull();
    if (hint) {
      hintsGiven++;
      expect(hint.tile1).toBeDefined();
      expect(hint.tile2).toBeDefined();
      expect(hint.tile1.id).not.toBe(hint.tile2.id);
    }
    expect(hintsGiven).toBe(1);
  });
});
