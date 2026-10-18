import { BoardLayout } from '../types';
import { generateSolvableBoard } from '../generator';
import { BotSolver, PlaythroughResult } from './botSolver';

export interface BatchSummary {
  layoutId: string;
  gamesTested: number;
  gamesWon: number;
  winRate: number;
  avgDurationMs: number;
  avgMoves: number;
  results: PlaythroughResult[];
}

/**
 * Runs a batch simulation of N games to verify board solvability and solver reliability.
 */
export function runBatchPlaythrough(
  layout: BoardLayout,
  gameCount: number = 5,
  startingSeed: number = 1000
): BatchSummary {
  const results: PlaythroughResult[] = [];
  let totalDuration = 0;
  let totalMoves = 0;
  let gamesWon = 0;

  for (let i = 0; i < gameCount; i++) {
    const seed = startingSeed + i * 777;
    const tiles = generateSolvableBoard(layout, seed);
    const bot = new BotSolver(tiles);
    const result = bot.playToCompletion();

    results.push(result);
    totalDuration += result.durationMs;
    totalMoves += result.totalMoves;
    if (result.success) {
      gamesWon++;
    }
  }

  return {
    layoutId: layout.id,
    gamesTested: gameCount,
    gamesWon,
    winRate: (gamesWon / gameCount) * 100,
    avgDurationMs: totalDuration / gameCount,
    avgMoves: totalMoves / gameCount,
    results
  };
}
