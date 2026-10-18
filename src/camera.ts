export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class Camera {
  public scale: number = 1;
  public offsetX: number = 0;
  public offsetY: number = 0;

  public minScale: number = 0.3;
  public maxScale: number = 3.0;

  public defaultScale: number = 1;
  public defaultOffsetX: number = 0;
  public defaultOffsetY: number = 0;

  /**
   * Resets and auto-fits the camera to center the board inside the viewport.
   */
  public autoFit(
    viewportWidth: number,
    viewportHeight: number,
    boardBounds: Bounds,
    paddingRatio: number = 0.08
  ): void {
    const boardW = Math.max(100, boardBounds.maxX - boardBounds.minX + 40);
    const boardH = Math.max(100, boardBounds.maxY - boardBounds.minY + 50);

    const availableW = viewportWidth * (1 - paddingRatio * 2);
    const availableH = viewportHeight * (1 - paddingRatio * 2);

    const scaleX = availableW / boardW;
    const scaleY = availableH / boardH;
    const fitScale = Math.min(scaleX, scaleY, 1.8);

    this.defaultScale = fitScale;
    this.scale = fitScale;
    this.minScale = fitScale * 0.65;
    this.maxScale = Math.max(fitScale * 3.5, 2.5);

    // Center the board
    const boardCenterX = (boardBounds.minX + boardBounds.maxX) / 2;
    const boardCenterY = (boardBounds.minY + boardBounds.maxY) / 2;

    this.defaultOffsetX = viewportWidth / 2 - boardCenterX * this.scale;
    this.defaultOffsetY = viewportHeight / 2 - boardCenterY * this.scale;

    this.offsetX = this.defaultOffsetX;
    this.offsetY = this.defaultOffsetY;
  }

  public resetToDefault(): void {
    this.scale = this.defaultScale;
    this.offsetX = this.defaultOffsetX;
    this.offsetY = this.defaultOffsetY;
  }

  /**
   * Converts screen (canvas) coordinates to world coordinates.
   */
  public screenToWorld(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale
    };
  }

  /**
   * Converts world coordinates to screen (canvas) coordinates.
   */
  public worldToScreen(worldX: number, worldY: number): Point {
    return {
      x: worldX * this.scale + this.offsetX,
      y: worldY * this.scale + this.offsetY
    };
  }

  /**
   * Zooms around a specific screen anchor point (e.g. mouse cursor or pinch center).
   */
  public zoomAt(zoomFactor: number, anchorScreenX: number, anchorScreenY: number): void {
    const oldScale = this.scale;
    const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * zoomFactor));
    if (newScale === oldScale) return;

    // Adjust offsets so the world point under anchor remains stationary
    const worldAnchor = this.screenToWorld(anchorScreenX, anchorScreenY);
    this.scale = newScale;
    this.offsetX = anchorScreenX - worldAnchor.x * this.scale;
    this.offsetY = anchorScreenY - worldAnchor.y * this.scale;
  }

  /**
   * Pans the camera by screen pixel deltas.
   */
  public pan(deltaX: number, deltaY: number): void {
    this.offsetX += deltaX;
    this.offsetY += deltaY;
  }
}
