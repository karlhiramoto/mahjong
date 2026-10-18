import { Tile } from './types';
import { Camera, Bounds } from './camera';
import { isTileFree } from './rules';
import { TileRenderer, TILE_BASE_WIDTH, TILE_BASE_HEIGHT, TILE_DEPTH } from './tileRenderer';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;

  private dpr: number = 1;
  private hintPulse: number = 0;
  private lastTime: number = 0;
  private animFrameId: number | null = null;

  private currentTiles: Tile[] = [];
  private onRenderCallback?: () => void;

  constructor(canvas: HTMLCanvasElement, camera: Camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.camera = camera;
    this.updateDPR();
  }

  public updateDPR(): void {
    this.dpr = window.devicePixelRatio || 1;
  }

  public resize(): void {
    this.updateDPR();
    const rect = this.canvas.getBoundingClientRect();
    const displayWidth = Math.floor(rect.width);
    const displayHeight = Math.floor(rect.height);

    if (this.canvas.width !== displayWidth * this.dpr || this.canvas.height !== displayHeight * this.dpr) {
      this.canvas.width = displayWidth * this.dpr;
      this.canvas.height = displayHeight * this.dpr;
    }
  }

  public is3DView: boolean = true;

  public toggleViewMode(): boolean {
    this.is3DView = !this.is3DView;
    return this.is3DView;
  }

  public is3D(): boolean {
    return this.is3DView;
  }

  /**
   * Calculates the world coordinates (x, y) for a tile given its grid position and layer.
   * In 3D view, substantial vertical elevation (-15px per z-layer) makes the pyramid layers stand out clearly.
   */
  public getTileWorldPos(tile: Tile): { x: number; y: number } {
    const halfW = TILE_BASE_WIDTH / 2;
    const halfH = TILE_BASE_HEIGHT / 2;

    const layerShiftX = this.is3DView ? tile.z * 1 : -tile.z * 3;
    const layerShiftY = this.is3DView ? -tile.z * 15 : -tile.z * 4;

    // Selected tile gets an extra lift
    const liftY = tile.status === 'selected' ? -8 : 0;

    return {
      x: tile.x * halfW + layerShiftX,
      y: tile.y * halfH + layerShiftY + liftY
    };
  }

  /**
   * Calculates the exact world pixel bounding box of all tiles in the layout.
   */
  public getBoardBounds(tiles: Tile[]): Bounds {
    if (tiles.length === 0) return { minX: 0, maxX: 1000, minY: 0, maxY: 600 };

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const sideExtrusion = this.is3DView ? 10 : 6;
    const frontExtrusion = this.is3DView ? 14 : 6;

    for (const t of tiles) {
      const pos = this.getTileWorldPos(t);
      if (pos.x < minX) minX = pos.x;
      if (pos.x + TILE_BASE_WIDTH + sideExtrusion > maxX) maxX = pos.x + TILE_BASE_WIDTH + sideExtrusion;
      if (pos.y < minY) minY = pos.y;
      if (pos.y + TILE_BASE_HEIGHT + frontExtrusion > maxY) maxY = pos.y + TILE_BASE_HEIGHT + frontExtrusion;
    }

    return { minX, maxX, minY, maxY };
  }

  /**
   * Raycasts a world coordinate (from touch or mouse) to the top-most tile under the cursor.
   * Prioritizes highest z-layer first to ensure upper elevated tiles are accurately clicked.
   */
  public getTileAtWorldPos(worldX: number, worldY: number, tiles: Tile[]): Tile | null {
    const activeTiles = tiles.filter(t => t.status !== 'matched');

    // Sort descending by layer z, then y, then x to hit top-most first
    const sorted = [...activeTiles].sort((a, b) => {
      if (b.z !== a.z) return b.z - a.z;
      if (b.y !== a.y) return b.y - a.y;
      return b.x - a.x;
    });

    const sideD = this.is3DView ? 8 : 5;
    const frontD = this.is3DView ? 12 : 5;

    for (const tile of sorted) {
      const pos = this.getTileWorldPos(tile);
      if (
        worldX >= pos.x &&
        worldX <= pos.x + TILE_BASE_WIDTH + sideD &&
        worldY >= pos.y &&
        worldY <= pos.y + TILE_BASE_HEIGHT + frontD
      ) {
        return tile;
      }
    }

    return null;
  }

  public setTiles(tiles: Tile[]): void {
    this.currentTiles = tiles;
  }

  public startAnimationLoop(onRender?: () => void): void {
    this.onRenderCallback = onRender;
    this.lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      this.hintPulse = (this.hintPulse + dt * 1.5) % 1;

      this.render();

      if (this.onRenderCallback) {
        this.onRenderCallback();
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopAnimationLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /**
   * Renders one complete frame to the canvas.
   */
  public render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Draw rich casino felt table background
    this.drawTableBackground(ctx, w, h);

    // Apply HiDPI scale and Camera transform
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.translate(this.camera.offsetX, this.camera.offsetY);
    ctx.scale(this.camera.scale, this.camera.scale);

    // Render active tiles in bottom-to-top order
    const activeTiles = this.currentTiles.filter(t => t.status !== 'matched');

    // Sort ascending: lower layer first, then top-to-bottom y, then left-to-right x
    activeTiles.sort((a, b) => {
      if (a.z !== b.z) return a.z - b.z;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    for (const tile of activeTiles) {
      const pos = this.getTileWorldPos(tile);
      const isFree = isTileFree(tile, activeTiles);
      const isHinted = tile.status === 'hint';

      TileRenderer.drawTile(
        ctx,
        tile,
        pos.x,
        pos.y,
        TILE_BASE_WIDTH,
        TILE_BASE_HEIGHT,
        TILE_DEPTH,
        isFree,
        isHinted ? this.hintPulse : 0,
        this.is3DView
      );
    }

    ctx.restore();
  }

  private drawTableBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Rich dark-green felt table with vignette
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, '#134e34');
    grad.addColorStop(0.65, '#0b3523');
    grad.addColorStop(1, '#051b11');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Fine table felt pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.012)';
    const step = 8 * this.dpr;
    for (let x = 0; x < w; x += step) {
      ctx.fillRect(x, 0, 1, h);
    }
  }
}
