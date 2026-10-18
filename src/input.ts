import { Camera } from './camera';
import { GameRenderer } from './renderer';
import { Tile } from './types';

export interface InputHandlers {
  onTileTap: (tile: Tile | null) => void;
  onPan?: () => void;
}

export class InputManager {
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private renderer: GameRenderer;
  private handlers: InputHandlers;
  private tiles: Tile[] = [];

  // Pointer drag tracking
  private isPointerDown = false;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private pointerStartTime = 0;
  private hasMovedSignificantly = false;

  // Touch tracking for pinch-to-zoom
  private activePointers = new Map<number, { x: number; y: number }>();
  private initialPinchDist = 0;

  constructor(
    canvas: HTMLCanvasElement,
    camera: Camera,
    renderer: GameRenderer,
    handlers: InputHandlers
  ) {
    this.canvas = canvas;
    this.camera = camera;
    this.renderer = renderer;
    this.handlers = handlers;

    this.attachEventListeners();
  }

  public setTiles(tiles: Tile[]): void {
    this.tiles = tiles;
  }

  private attachEventListeners(): void {
    // Prevent default touch behaviors (pinch bounce, pull-to-refresh)
    this.canvas.style.touchAction = 'none';

    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
    window.addEventListener('pointercancel', this.onPointerCancel.bind(this));

    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
  }

  private getCanvasRelativeCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  private onPointerDown(e: PointerEvent): void {
    this.canvas.setPointerCapture(e.pointerId);
    const coords = this.getCanvasRelativeCoords(e.clientX, e.clientY);

    this.activePointers.set(e.pointerId, coords);

    if (this.activePointers.size === 1) {
      this.isPointerDown = true;
      this.pointerStartX = coords.x;
      this.pointerStartY = coords.y;
      this.lastPointerX = coords.x;
      this.lastPointerY = coords.y;
      this.pointerStartTime = performance.now();
      this.hasMovedSignificantly = false;
    } else if (this.activePointers.size === 2) {
      // Initiate pinch-to-zoom
      const pts = Array.from(this.activePointers.values());
      this.initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      this.hasMovedSignificantly = true;
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.activePointers.has(e.pointerId)) return;

    const coords = this.getCanvasRelativeCoords(e.clientX, e.clientY);
    this.activePointers.set(e.pointerId, coords);

    if (this.activePointers.size === 1 && this.isPointerDown) {
      const dx = coords.x - this.lastPointerX;
      const dy = coords.y - this.lastPointerY;

      const totalDist = Math.hypot(coords.x - this.pointerStartX, coords.y - this.pointerStartY);
      if (totalDist > 8) {
        this.hasMovedSignificantly = true;
        this.camera.pan(dx, dy);
        if (this.handlers.onPan) this.handlers.onPan();
      }

      this.lastPointerX = coords.x;
      this.lastPointerY = coords.y;
    } else if (this.activePointers.size === 2) {
      // Handle pinch-to-zoom
      const pts = Array.from(this.activePointers.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

      if (this.initialPinchDist > 0 && currentDist > 0) {
        const factor = currentDist / this.initialPinchDist;
        const centerX = (pts[0].x + pts[1].x) / 2;
        const centerY = (pts[0].y + pts[1].y) / 2;
        this.camera.zoomAt(factor, centerX, centerY);
        this.initialPinchDist = currentDist;
      }
    }
  }

  private onPointerUp(e: PointerEvent): void {
    this.activePointers.delete(e.pointerId);

    if (this.activePointers.size === 0 && this.isPointerDown) {
      this.isPointerDown = false;
      const duration = performance.now() - this.pointerStartTime;

      // If user tapped without dragging
      if (!this.hasMovedSignificantly && duration < 400) {
        const coords = this.getCanvasRelativeCoords(e.clientX, e.clientY);
        const worldPt = this.camera.screenToWorld(coords.x, coords.y);
        const clickedTile = this.renderer.getTileAtWorldPos(worldPt.x, worldPt.y, this.tiles);
        this.handlers.onTileTap(clickedTile);
      }
    } else if (this.activePointers.size === 1) {
      // Re-anchor remaining pointer
      const remaining = Array.from(this.activePointers.values())[0];
      this.lastPointerX = remaining.x;
      this.lastPointerY = remaining.y;
    }
  }

  private onPointerCancel(e: PointerEvent): void {
    this.activePointers.delete(e.pointerId);
    if (this.activePointers.size === 0) {
      this.isPointerDown = false;
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const coords = this.getCanvasRelativeCoords(e.clientX, e.clientY);
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    this.camera.zoomAt(zoomFactor, coords.x, coords.y);
  }
}
