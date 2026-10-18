import { Tile, BoardLayout, GameStats, HintPair } from './types';
import { getLayout } from './layouts';
import { generateSolvableBoard } from './generator';
import { areTilesMatching, isTileFree, getAvailableMatchingPairs } from './rules';
import { getBestHintPair } from './solver';
import { SoundEffects } from './audio';

export interface MoveRecord {
  tile1Id: number;
  tile2Id: number;
  scoreDelta: number;
}

export class MahjongGame {
  private tiles: Tile[] = [];
  private currentLayout: BoardLayout;
  private selectedTile: Tile | null = null;
  private history: MoveRecord[] = [];

  // Metrics
  private hintsUsed: number = 0;
  private movesMade: number = 0;
  private score: number = 0;
  private timerSeconds: number = 0;
  private timerIntervalId: number | null = null;

  private isWon: boolean = false;
  private isGameOver: boolean = false;

  private sound: SoundEffects;
  private onStateChangeCallback?: (stats: GameStats) => void;

  // Auto-play state
  private isAutoPlaying: boolean = false;
  private autoPlayTimeoutId: number | null = null;

  constructor(sound: SoundEffects, initialLayoutId: string = 'turtle') {
    this.sound = sound;
    this.currentLayout = getLayout(initialLayoutId);
  }

  public getTiles(): Tile[] {
    return this.tiles;
  }

  public getLayout(): BoardLayout {
    return this.currentLayout;
  }

  public getStats(): GameStats {
    const active = this.tiles.filter(t => t.status !== 'matched');
    const available = getAvailableMatchingPairs(active);

    return {
      hintsUsed: this.hintsUsed,
      movesMade: this.movesMade,
      remainingTiles: active.length,
      availableMoves: available.length,
      elapsedSeconds: this.timerSeconds,
      score: this.score,
      isWon: this.isWon,
      isGameOver: this.isGameOver
    };
  }

  public setOnStateChange(cb: (stats: GameStats) => void): void {
    this.onStateChangeCallback = cb;
  }

  private notifyStateChange(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.getStats());
    }
  }

  public newGame(layoutId: string = this.currentLayout.id, seed: number = Date.now()): void {
    this.stopAutoPlay();
    this.stopTimer();

    this.currentLayout = getLayout(layoutId);
    this.tiles = generateSolvableBoard(this.currentLayout, seed);

    this.selectedTile = null;
    this.history = [];
    this.hintsUsed = 0;
    this.movesMade = 0;
    this.score = 0;
    this.timerSeconds = 0;
    this.isWon = false;
    this.isGameOver = false;

    this.startTimer();
    this.notifyStateChange();
  }

  public startTimer(): void {
    if (this.timerIntervalId !== null) return;
    this.timerIntervalId = window.setInterval(() => {
      if (!this.isWon && !this.isGameOver) {
        this.timerSeconds++;
        this.notifyStateChange();
      }
    }, 1000);
  }

  public stopTimer(): void {
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  /**
   * Handles user tapping on a tile.
   */
  public handleTileClick(tile: Tile | null): boolean {
    if (!tile || tile.status === 'matched') {
      this.clearSelection();
      this.notifyStateChange();
      return false;
    }

    const activeTiles = this.tiles.filter(t => t.status !== 'matched');
    if (!isTileFree(tile, activeTiles)) {
      // Tile is blocked, cannot select
      return false;
    }

    // Clear any active hint glowing indicators
    this.clearHintAura();

    // If tapping the already selected tile, deselect it
    if (this.selectedTile && this.selectedTile.id === tile.id) {
      this.clearSelection();
      this.notifyStateChange();
      return false;
    }

    // First tile selection
    if (!this.selectedTile) {
      this.selectedTile = tile;
      tile.status = 'selected';
      this.sound.playTileTap();
      this.notifyStateChange();
      return true;
    }

    // Second tile selected - check matching
    const firstTile = this.selectedTile;

    if (areTilesMatching(firstTile, tile)) {
      // Successful match!
      firstTile.status = 'matched';
      tile.status = 'matched';
      this.selectedTile = null;

      const scoreDelta = 100 + Math.max(0, 50 - this.hintsUsed * 5);
      this.score += scoreDelta;
      this.movesMade++;

      this.history.push({
        tile1Id: firstTile.id,
        tile2Id: tile.id,
        scoreDelta
      });

      this.sound.playMatch();

      const remaining = this.tiles.filter(t => t.status !== 'matched');
      if (remaining.length === 0) {
        this.isWon = true;
        this.stopTimer();
        this.sound.playWin();
      } else {
        const available = getAvailableMatchingPairs(remaining);
        if (available.length === 0) {
          this.isGameOver = true;
        }
      }

      this.notifyStateChange();
      return true;
    } else {
      // Switch selection to the newly clicked free tile
      firstTile.status = 'active';
      this.selectedTile = tile;
      tile.status = 'selected';
      this.sound.playTileTap();
      this.notifyStateChange();
      return true;
    }
  }

  /**
   * Clears currently selected tile.
   */
  public clearSelection(): void {
    if (this.selectedTile) {
      this.selectedTile.status = 'active';
      this.selectedTile = null;
    }
  }

  /**
   * Clears hint pulsing states.
   */
  public clearHintAura(): void {
    for (const t of this.tiles) {
      if (t.status === 'hint') {
        t.status = 'active';
      }
    }
  }

  /**
   * Requests a hint. Highlights a matching free pair and increments hintsUsed counter.
   */
  public requestHint(): HintPair | null {
    this.clearSelection();
    this.clearHintAura();

    const activeTiles = this.tiles.filter(t => t.status !== 'matched');
    const bestHint = getBestHintPair(activeTiles);

    if (bestHint) {
      this.hintsUsed++;
      const t1 = this.tiles.find(t => t.id === bestHint.tile1.id);
      const t2 = this.tiles.find(t => t.id === bestHint.tile2.id);

      if (t1) t1.status = 'hint';
      if (t2) t2.status = 'hint';

      this.sound.playHint();
      this.notifyStateChange();
      return bestHint;
    }

    this.notifyStateChange();
    return null;
  }

  /**
   * Undoes the last move.
   */
  public undo(): boolean {
    if (this.history.length === 0) return false;

    this.clearSelection();
    this.clearHintAura();

    const lastMove = this.history.pop()!;
    const t1 = this.tiles.find(t => t.id === lastMove.tile1Id);
    const t2 = this.tiles.find(t => t.id === lastMove.tile2Id);

    if (t1) t1.status = 'active';
    if (t2) t2.status = 'active';

    this.score = Math.max(0, this.score - lastMove.scoreDelta);
    this.movesMade = Math.max(0, this.movesMade - 1);
    this.isWon = false;
    this.isGameOver = false;

    this.sound.playTileTap();
    this.notifyStateChange();
    return true;
  }

  /**
   * Shuffles remaining tiles to ensure solvability.
   */
  public shuffle(): boolean {
    this.clearSelection();
    this.clearHintAura();

    const activeTiles = this.tiles.filter(t => t.status !== 'matched');
    if (activeTiles.length === 0) return false;

    const faces = activeTiles.map(t => ({ suit: t.suit, value: t.value }));
    // Fisher-yates
    for (let i = faces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [faces[i], faces[j]] = [faces[j], faces[i]];
    }

    activeTiles.forEach((tile, idx) => {
      tile.suit = faces[idx].suit;
      tile.value = faces[idx].value;
    });

    this.isGameOver = false;
    this.sound.playShuffle();
    this.notifyStateChange();
    return true;
  }

  // --- Auto-Play Demo & Testing Mode ---

  public isAutoPlayActive(): boolean {
    return this.isAutoPlaying;
  }

  public startAutoPlay(stepDelayMs: number = 320): void {
    if (this.isAutoPlaying || this.isWon) return;
    this.isAutoPlaying = true;
    this.clearSelection();
    this.clearHintAura();

    const step = () => {
      if (!this.isAutoPlaying) return;

      const activeTiles = this.tiles.filter(t => t.status !== 'matched');
      if (activeTiles.length === 0) {
        this.stopAutoPlay();
        return;
      }

      const hint = getBestHintPair(activeTiles);
      if (hint) {
        // Perform move
        this.handleTileClick(hint.tile1);
        this.handleTileClick(hint.tile2);

        this.autoPlayTimeoutId = window.setTimeout(step, stepDelayMs);
      } else {
        // Try shuffling if stuck
        this.shuffle();
        const available = getAvailableMatchingPairs(this.tiles.filter(t => t.status !== 'matched'));
        if (available.length > 0) {
          this.autoPlayTimeoutId = window.setTimeout(step, stepDelayMs);
        } else {
          this.stopAutoPlay();
        }
      }
    };

    step();
  }

  public stopAutoPlay(): void {
    this.isAutoPlaying = false;
    if (this.autoPlayTimeoutId !== null) {
      clearTimeout(this.autoPlayTimeoutId);
      this.autoPlayTimeoutId = null;
    }
  }

  public stepAutoPlay(): void {
    const activeTiles = this.tiles.filter(t => t.status !== 'matched');
    if (activeTiles.length === 0) return;

    const hint = getBestHintPair(activeTiles);
    if (hint) {
      this.handleTileClick(hint.tile1);
      this.handleTileClick(hint.tile2);
    }
  }
}
