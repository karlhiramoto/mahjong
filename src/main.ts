import { Camera } from './camera';
import { GameRenderer } from './renderer';
import { MahjongGame } from './game';
import { SoundEffects } from './audio';
import { InputManager } from './input';
import { GameStats, Tile } from './types';

// UI Element Selectors
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const statRemaining = document.getElementById('stat-remaining') as HTMLElement;
const statMoves = document.getElementById('stat-moves') as HTMLElement;
const statHints = document.getElementById('stat-hints') as HTMLElement;
const statTime = document.getElementById('stat-time') as HTMLElement;
const statScore = document.getElementById('stat-score') as HTMLElement;
const toastEl = document.getElementById('toast') as HTMLElement;

const selectLayout = document.getElementById('select-layout') as HTMLSelectElement;
const btnView = document.getElementById('btn-view') as HTMLButtonElement;
const viewIcon = document.getElementById('view-icon') as HTMLElement;
const viewText = document.getElementById('view-text') as HTMLElement;
const btnHelp = document.getElementById('btn-help') as HTMLButtonElement;
const btnSound = document.getElementById('btn-sound') as HTMLButtonElement;
const soundIcon = document.getElementById('sound-icon') as HTMLElement;

const btnHint = document.getElementById('btn-hint') as HTMLButtonElement;
const btnHintBadge = document.getElementById('btn-hint-badge') as HTMLElement;
const btnUndo = document.getElementById('btn-undo') as HTMLButtonElement;
const btnShuffle = document.getElementById('btn-shuffle') as HTMLButtonElement;
const btnFit = document.getElementById('btn-fit') as HTMLButtonElement;
const btnAutoPlay = document.getElementById('btn-autoplay') as HTMLButtonElement;
const autoPlayText = document.getElementById('autoplay-text') as HTMLElement;
const btnStep = document.getElementById('btn-step') as HTMLButtonElement;
const btnNew = document.getElementById('btn-new') as HTMLButtonElement;

const modalWin = document.getElementById('modal-win') as HTMLElement;
const winTime = document.getElementById('win-time') as HTMLElement;
const winScore = document.getElementById('win-score') as HTMLElement;
const winHints = document.getElementById('win-hints') as HTMLElement;
const winMoves = document.getElementById('win-moves') as HTMLElement;
const btnPlayAgain = document.getElementById('btn-play-again') as HTMLButtonElement;

const modalHelp = document.getElementById('modal-help') as HTMLElement;
const btnCloseHelp = document.getElementById('btn-close-help') as HTMLButtonElement;
const btnGotIt = document.getElementById('btn-got-it') as HTMLButtonElement;

// Core Game Objects
const sound = new SoundEffects();
const camera = new Camera();
const renderer = new GameRenderer(canvas, camera);
const game = new MahjongGame(sound, selectLayout.value);

let toastTimeout: number | null = null;
function showToast(message: string, durationMs: number = 2500): void {
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  if (toastTimeout !== null) clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toastEl.classList.add('hidden');
  }, durationMs);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateHUD(stats: GameStats): void {
  statRemaining.textContent = String(stats.remainingTiles);
  statMoves.textContent = String(stats.availableMoves);
  statHints.textContent = String(stats.hintsUsed);
  btnHintBadge.textContent = String(stats.hintsUsed);
  statTime.textContent = formatTime(stats.elapsedSeconds);
  statScore.textContent = String(stats.score);

  // Check Game Over / Deadlock warning
  if (stats.remainingTiles > 0 && stats.availableMoves === 0) {
    showToast('⚠️ No moves available! Tap "Shuffle" 🔀 to continue.', 3500);
  }

  // Check Win condition
  if (stats.isWon) {
    winTime.textContent = formatTime(stats.elapsedSeconds);
    winScore.textContent = String(stats.score);
    winHints.textContent = String(stats.hintsUsed);
    winMoves.textContent = String(stats.movesMade);
    modalWin.classList.remove('hidden');
  } else {
    modalWin.classList.add('hidden');
  }

  // Update Auto-Play button style
  if (game.isAutoPlayActive()) {
    btnAutoPlay.classList.add('active');
    autoPlayText.textContent = 'Pause';
  } else {
    btnAutoPlay.classList.remove('active');
    autoPlayText.textContent = 'Auto Play';
  }
}

function autoFitBoard(): void {
  renderer.resize();
  const tiles = game.getTiles();
  const bounds = renderer.getBoardBounds(tiles);
  const rect = canvas.getBoundingClientRect();
  camera.autoFit(rect.width, rect.height, bounds);
}

// Input Manager
const inputManager = new InputManager(canvas, camera, renderer, {
  onTileTap: (tile: Tile | null) => {
    game.handleTileClick(tile);
  }
});

// Setup Game Listeners
game.setOnStateChange((stats) => {
  renderer.setTiles(game.getTiles());
  inputManager.setTiles(game.getTiles());
  updateHUD(stats);
});

// Start New Game
function startNewGame(layoutId?: string): void {
  const layout = layoutId || selectLayout.value;
  game.newGame(layout);
  autoFitBoard();
  modalWin.classList.add('hidden');
}

// Toolbar Event Listeners
btnHint.addEventListener('click', () => {
  const hint = game.requestHint();
  if (!hint) {
    showToast('No matching free pairs available! Try Shuffling 🔀');
  }
});

btnUndo.addEventListener('click', () => {
  const undone = game.undo();
  if (!undone) {
    showToast('No moves to undo');
  }
});

btnShuffle.addEventListener('click', () => {
  const shuffled = game.shuffle();
  if (shuffled) {
    showToast('🔀 Tiles Shuffled!');
  }
});

btnFit.addEventListener('click', () => {
  autoFitBoard();
  showToast('View Reset 🔍', 1200);
});

btnAutoPlay.addEventListener('click', () => {
  if (game.isAutoPlayActive()) {
    game.stopAutoPlay();
  } else {
    game.startAutoPlay(280);
    showToast('🤖 Auto-Play Activated');
  }
  updateHUD(game.getStats());
});

btnStep.addEventListener('click', () => {
  game.stepAutoPlay();
});

btnNew.addEventListener('click', () => {
  startNewGame();
});

btnPlayAgain.addEventListener('click', () => {
  startNewGame();
});

selectLayout.addEventListener('change', () => {
  startNewGame(selectLayout.value);
});

btnView.addEventListener('click', () => {
  const is3D = renderer.toggleViewMode();
  if (is3D) {
    btnView.classList.remove('flat');
    viewIcon.textContent = '📐';
    viewText.textContent = '3D';
    showToast('📐 3D Angled Elevation View', 1200);
  } else {
    btnView.classList.add('flat');
    viewIcon.textContent = '🔲';
    viewText.textContent = '2D';
    showToast('🔲 Classic Top-Down View', 1200);
  }
  autoFitBoard();
});

function openHelpModal(): void {
  modalHelp.classList.remove('hidden');
}

function closeHelpModal(): void {
  modalHelp.classList.add('hidden');
}

btnHelp.addEventListener('click', () => {
  openHelpModal();
});

btnCloseHelp.addEventListener('click', () => {
  closeHelpModal();
});

btnGotIt.addEventListener('click', () => {
  closeHelpModal();
});

modalHelp.addEventListener('click', (e) => {
  if (e.target === modalHelp) {
    closeHelpModal();
  }
});

btnSound.addEventListener('click', () => {
  const muted = sound.toggleMute();
  soundIcon.textContent = muted ? '🔇' : '🔊';
  btnSound.title = muted ? 'Unmute Sound' : 'Mute Sound';
});

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  // Ignore shortcuts if an input is focused
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

  if (e.key === 'Escape') {
    closeHelpModal();
    modalWin.classList.add('hidden');
    return;
  }

  switch (e.key.toLowerCase()) {
    case '?':
    case '/':
      openHelpModal();
      break;
    case 'h':
      btnHint.click();
      break;
    case 'u':
      btnUndo.click();
      break;
    case 's':
      btnShuffle.click();
      break;
    case 'f':
      btnFit.click();
      break;
    case 'v':
      btnView.click();
      break;
    case 'n':
      btnNew.click();
      break;
    case ' ':
      e.preventDefault();
      btnStep.click();
      break;
  }
});

// Window & Orientation resize
window.addEventListener('resize', () => {
  autoFitBoard();
});

window.addEventListener('orientationchange', () => {
  setTimeout(autoFitBoard, 150);
});

// Initialize on Load
function init(): void {
  soundIcon.textContent = sound.isMuted() ? '🔇' : '🔊';
  startNewGame();
  renderer.startAnimationLoop();
}

init();
