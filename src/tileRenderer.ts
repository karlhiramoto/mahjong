import { Tile } from './types';

export const TILE_BASE_WIDTH = 64;
export const TILE_BASE_HEIGHT = 86;
export const TILE_DEPTH = 10;

/**
 * Procedural Vector Renderer for Mahjong Solitaire Tiles.
 * Draws vibrant, razor-sharp vector graphics on HTML5 Canvas.
 */
export class TileRenderer {
  /**
   * Draws a complete 3D Mahjong tile at world coordinates (x, y).
   */
  public static drawTile(
    ctx: CanvasRenderingContext2D,
    tile: Tile,
    worldX: number,
    worldY: number,
    width: number = TILE_BASE_WIDTH,
    height: number = TILE_BASE_HEIGHT,
    depth: number = TILE_DEPTH,
    isFree: boolean = true,
    hintGlowPulse: number = 0,
    is3DView: boolean = true
  ): void {
    ctx.save();
    ctx.translate(worldX, worldY);

    const sideDepth = is3DView ? Math.round(depth * 0.75) : Math.round(depth * 0.6);
    const frontDepth = is3DView ? Math.round(depth * 1.1) : Math.round(depth * 0.6);

    // 1. Draw Multi-Layer 3D Drop Shadow
    this.drawDropShadow(ctx, width, height, sideDepth, frontDepth, tile.z, tile.status === 'selected', is3DView);

    // 2. Draw 3D Front & Right Walls (Two-tone Ivory + Jade Acrylic Sandwich)
    this.drawTileSides(ctx, width, height, sideDepth, frontDepth, is3DView);

    // 3. Draw Tile Face (Ivory / Eggshell Beveled Surface with Layer-based lighting)
    this.drawTileFace(ctx, width, height, tile.z, tile.status === 'selected');

    // 4. Draw Tile Symbol / Pip Artwork
    ctx.save();
    this.drawFaceClip(ctx, width, height, depth);
    this.drawGlyph(ctx, tile, width, height, depth);
    ctx.restore();

    // 5. Status Overlays (Selected, Hint Glow, Dimmed Blocked)
    if (tile.status === 'selected') {
      this.drawSelectedBorder(ctx, width, height, depth);
    } else if (tile.status === 'hint' || hintGlowPulse > 0) {
      this.drawHintAura(ctx, width, height, depth, hintGlowPulse);
    } else if (!isFree) {
      this.drawBlockedOverlay(ctx, width, height, depth);
    }

    ctx.restore();
  }

  private static drawDropShadow(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    sideD: number,
    frontD: number,
    layerZ: number,
    isSelected: boolean,
    is3DView: boolean
  ): void {
    ctx.save();
    // Elevation scales the shadow offset and blur dramatically
    const layerBonus = is3DView ? layerZ * 6 : layerZ * 3;
    const shadowOffsetX = 4 + layerBonus * 0.6 + (isSelected ? 6 : 0);
    const shadowOffsetY = 5 + layerBonus * 0.9 + (isSelected ? 8 : 0);
    const blur = 4 + (layerZ + 1) * 5 + (isSelected ? 6 : 0);
    const alpha = Math.min(0.48, 0.22 + layerZ * 0.06 + (isSelected ? 0.15 : 0));

    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.filter = `blur(${blur}px)`;
    ctx.beginPath();
    ctx.roundRect(
      shadowOffsetX,
      shadowOffsetY,
      w + sideD,
      h + frontD,
      6
    );
    ctx.fill();
    ctx.restore();
  }

  private static drawTileSides(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    sideD: number,
    frontD: number,
    _is3DView: boolean
  ): void {
    const ivoryRatio = 0.35; // Top 35% of tile thickness is ivory
    const frontIvoryH = frontD * ivoryRatio;
    const sideIvoryW = sideD * ivoryRatio;

    // --- FRONT WALL (Facing the viewer at bottom y = h) ---
    // 1. Front Ivory strip
    ctx.fillStyle = '#e5decb';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, h);
    ctx.lineTo(w, h + frontIvoryH);
    ctx.lineTo(0, h + frontIvoryH);
    ctx.closePath();
    ctx.fill();

    // 2. Front Jade body (Dark emerald green acrylic)
    const frontJadeGrad = ctx.createLinearGradient(0, h + frontIvoryH, 0, h + frontD);
    frontJadeGrad.addColorStop(0, '#156a38');
    frontJadeGrad.addColorStop(1, '#0e4a26');
    ctx.fillStyle = frontJadeGrad;
    ctx.beginPath();
    ctx.moveTo(0, h + frontIvoryH);
    ctx.lineTo(w, h + frontIvoryH);
    ctx.lineTo(w, h + frontD);
    ctx.lineTo(0, h + frontD);
    ctx.closePath();
    ctx.fill();

    // Subtle bottom corner rounding & edge highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // --- RIGHT WALL (Receding to the right from x = w) ---
    // 1. Right Ivory strip
    ctx.fillStyle = '#d3c9b4';
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w + sideIvoryW, 0);
    ctx.lineTo(w + sideIvoryW, h + frontIvoryH);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // 2. Right Jade body (Darker side shadow)
    const rightJadeGrad = ctx.createLinearGradient(w, 0, w + sideD, 0);
    rightJadeGrad.addColorStop(0, '#0f4825');
    rightJadeGrad.addColorStop(1, '#082a15');
    ctx.fillStyle = rightJadeGrad;
    ctx.beginPath();
    ctx.moveTo(w + sideIvoryW, 0);
    ctx.lineTo(w + sideD, 0);
    ctx.lineTo(w + sideD, h + frontD);
    ctx.lineTo(w, h + frontD);
    ctx.lineTo(w, h + frontIvoryH);
    ctx.lineTo(w + sideIvoryW, h + frontIvoryH);
    ctx.closePath();
    ctx.fill();

    // Dark seam between ivory and jade
    ctx.strokeStyle = '#072412';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, h + frontIvoryH);
    ctx.lineTo(w, h + frontIvoryH);
    ctx.lineTo(w + sideD, h + frontIvoryH);
    ctx.stroke();
  }

  private static drawTileFace(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    layerZ: number,
    isSelected: boolean
  ): void {
    // Layer-based lighting: higher layers are brighter white with sunlight highlight
    const grad = ctx.createLinearGradient(0, 0, w, h);
    if (isSelected) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#fef08a'); // Warm selected highlight
    } else {
      // Brighter at top of pyramid
      switch (layerZ) {
        case 4: // Peak
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(1, '#fcfaf2');
          break;
        case 3:
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(1, '#faf6ea');
          break;
        case 2:
          grad.addColorStop(0, '#fefefe');
          grad.addColorStop(1, '#f6f0df');
          break;
        case 1:
          grad.addColorStop(0, '#fbf8ef');
          grad.addColorStop(1, '#ede5d0');
          break;
        default: // Layer 0
          grad.addColorStop(0, '#f8f4e6');
          grad.addColorStop(1, '#e5dcc7');
          break;
      }
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 4);
    ctx.fill();

    // Bevel highlights: Top & Left are lit, Bottom & Right are shaded
    ctx.strokeStyle = isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = isSelected ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(1, h - 1);
    ctx.lineTo(1, 1);
    ctx.lineTo(w - 1, 1);
    ctx.stroke();

    ctx.strokeStyle = isSelected ? '#d97706' : 'rgba(160, 145, 120, 0.35)';
    ctx.beginPath();
    ctx.moveTo(w - 1, 1);
    ctx.lineTo(w - 1, h - 1);
    ctx.lineTo(1, h - 1);
    ctx.stroke();
  }

  private static drawFaceClip(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    _d: number
  ): void {
    ctx.beginPath();
    ctx.roundRect(1, 1, w - 2, h - 2, 4);
    ctx.clip();
  }

  private static drawSelectedBorder(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    _d: number
  ): void {
    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 5);
    ctx.stroke();

    // Corner glow
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  private static drawHintAura(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    _d: number,
    pulse: number
  ): void {
    ctx.save();
    const glowWidth = 3 + Math.sin(pulse * Math.PI * 2) * 2;
    const alpha = 0.7 + Math.sin(pulse * Math.PI * 2) * 0.25;

    ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
    ctx.lineWidth = glowWidth;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.roundRect(-2, -2, w + 4, h + 4, 7);
    ctx.stroke();

    // 💡 Animated Hint badge in the upper right
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(w - 6, 6, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', w - 6, 6);

    ctx.restore();
  }

  private static drawBlockedOverlay(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    _d: number
  ): void {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 5);
    ctx.fill();
  }

  /**
   * Main dispatcher to render tile glyphs by suit.
   */
  private static drawGlyph(
    ctx: CanvasRenderingContext2D,
    tile: Tile,
    w: number,
    h: number,
    _d: number
  ): void {

    switch (tile.suit) {
      case 'dots':
        this.drawDots(ctx, tile.value as number, w, h);
        break;
      case 'bamboo':
        this.drawBamboo(ctx, tile.value as number, w, h);
        break;
      case 'characters':
        this.drawCharacters(ctx, tile.value as number, w, h);
        break;
      case 'winds':
        this.drawWind(ctx, tile.value as string, w, h);
        break;
      case 'dragons':
        this.drawDragon(ctx, tile.value as string, w, h);
        break;
      case 'seasons':
        this.drawSeason(ctx, tile.value as string, w, h);
        break;
      case 'flowers':
        this.drawFlower(ctx, tile.value as string, w, h);
        break;
    }

    // Helpful index in corner for number suits
    if (tile.suit === 'dots' || tile.suit === 'bamboo' || tile.suit === 'characters') {
      ctx.fillStyle = 'rgba(71, 85, 105, 0.7)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(String(tile.value), 4, 3);
    }
  }

  /**
   * Draws Dots (Pin) suit with concentric circles and colors.
   */
  private static drawDots(ctx: CanvasRenderingContext2D, val: number, w: number, h: number): void {
    const red = '#dc2626';
    const blue = '#1d4ed8';
    const green = '#15803d';

    const cx = w / 2;
    const cy = h / 2;
    const r = 5.2;

    const drawPip = (x: number, y: number, color: string, radius: number = r) => {
      // Outer ring
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // White inner ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.28, 0, Math.PI * 2);
      ctx.fill();
    };

    if (val === 1) {
      // Giant ornate center pinwheel
      const bigR = 17;
      ctx.fillStyle = red;
      ctx.beginPath();
      ctx.arc(cx, cy, bigR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, bigR * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Petal pattern
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const px = cx + Math.cos(angle) * (bigR * 0.42);
        const py = cy + Math.sin(angle) * (bigR * 0.42);
        ctx.fillStyle = i % 2 === 0 ? blue : green;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = red;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const xL = cx - 14;
    const xR = cx + 14;
    const yT = cy - 23;
    const yM = cy;
    const yB = cy + 23;

    switch (val) {
      case 2:
        drawPip(cx, cy - 17, green);
        drawPip(cx, cy + 17, blue);
        break;
      case 3:
        drawPip(xL, yT, blue);
        drawPip(cx, yM, red);
        drawPip(xR, yB, green);
        break;
      case 4:
        drawPip(xL, yT + 5, blue);
        drawPip(xR, yT + 5, green);
        drawPip(xL, yB - 5, green);
        drawPip(xR, yB - 5, blue);
        break;
      case 5:
        drawPip(xL, yT + 3, blue);
        drawPip(xR, yT + 3, green);
        drawPip(cx, yM, red, 6.5);
        drawPip(xL, yB - 3, green);
        drawPip(xR, yB - 3, blue);
        break;
      case 6:
        drawPip(xL, yT, green);
        drawPip(xR, yT, green);
        drawPip(xL, yM, red);
        drawPip(xR, yM, red);
        drawPip(xL, yB, red);
        drawPip(xR, yB, red);
        break;
      case 7:
        drawPip(xL, yT - 2, green);
        drawPip(cx, yT + 6, green);
        drawPip(xR, yT + 14, green);
        drawPip(xL, yM + 12, red);
        drawPip(xR, yM + 12, red);
        drawPip(xL, yB + 3, red);
        drawPip(xR, yB + 3, red);
        break;
      case 8:
        for (let row = 0; row < 4; row++) {
          const py = cy - 24 + row * 16;
          drawPip(xL, py, blue);
          drawPip(xR, py, blue);
        }
        break;
      case 9:
        for (let col = -1; col <= 1; col++) {
          const px = cx + col * 15;
          drawPip(px, yT + 2, green);
          drawPip(px, yM, red);
          drawPip(px, yB - 2, blue);
        }
        break;
    }
  }

  /**
   * Draws Bamboo (Sou) suit.
   */
  private static drawBamboo(ctx: CanvasRenderingContext2D, val: number, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;
    const green = '#15803d';
    const red = '#dc2626';
    const blue = '#1d4ed8';

    if (val === 1) {
      // 1-Bamboo: Colorful Peacock / Sparrow
      ctx.save();
      ctx.translate(cx, cy);

      // Body & Breast
      ctx.fillStyle = green;
      ctx.beginPath();
      ctx.ellipse(0, 4, 11, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wing feathers
      ctx.fillStyle = blue;
      ctx.beginPath();
      ctx.ellipse(4, 2, 6, 12, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Head & Crown
      ctx.fillStyle = red;
      ctx.beginPath();
      ctx.arc(-2, -13, 6, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-7, -13);
      ctx.lineTo(-13, -11);
      ctx.lineTo(-7, -9);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, -14, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4.5, -14, 1, 0, Math.PI * 2);
      ctx.fill();

      // Tail plumage
      ctx.strokeStyle = green;
      ctx.lineWidth = 2.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.quadraticCurveTo(i * 9, 23, i * 12, 27);
        ctx.stroke();
      }

      ctx.restore();
      return;
    }

    // Helper to draw single bamboo stick
    const drawStalk = (x: number, y: number, len: number, color: string = green) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = '#0f5132';
      ctx.lineWidth = 0.8;

      const halfW = 2.6;
      ctx.beginPath();
      ctx.roundRect(x - halfW, y - len / 2, halfW * 2, len, 2);
      ctx.fill();
      ctx.stroke();

      // Middle joint
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - halfW, y - 1, halfW * 2, 2);
      ctx.fillStyle = color;
      ctx.restore();
    };

    const stalkLen = 19;
    const xL = cx - 14;
    const xR = cx + 14;

    switch (val) {
      case 2:
        drawStalk(cx, cy - 16, stalkLen, green);
        drawStalk(cx, cy + 16, stalkLen, blue);
        break;
      case 3:
        drawStalk(cx, cy - 18, stalkLen, blue);
        drawStalk(xL, cy + 16, stalkLen, green);
        drawStalk(xR, cy + 16, stalkLen, green);
        break;
      case 4:
        drawStalk(xL, cy - 16, stalkLen, blue);
        drawStalk(xR, cy - 16, stalkLen, green);
        drawStalk(xL, cy + 16, stalkLen, green);
        drawStalk(xR, cy + 16, stalkLen, blue);
        break;
      case 5:
        drawStalk(xL, cy - 16, stalkLen, green);
        drawStalk(xR, cy - 16, stalkLen, blue);
        drawStalk(cx, cy, 14, red);
        drawStalk(xL, cy + 16, stalkLen, blue);
        drawStalk(xR, cy + 16, stalkLen, green);
        break;
      case 6:
        drawStalk(xL, cy - 16, stalkLen, green);
        drawStalk(cx, cy - 16, stalkLen, green);
        drawStalk(xR, cy - 16, stalkLen, green);
        drawStalk(xL, cy + 16, stalkLen, blue);
        drawStalk(cx, cy + 16, stalkLen, blue);
        drawStalk(xR, cy + 16, stalkLen, blue);
        break;
      case 7:
        drawStalk(cx, cy - 24, 12, red);
        drawStalk(xL, cy - 6, 12, green);
        drawStalk(xR, cy - 6, 12, green);
        drawStalk(xL - 2, cy + 18, 14, blue);
        drawStalk(xL + 7, cy + 18, 14, blue);
        drawStalk(xR - 7, cy + 18, 14, blue);
        drawStalk(xR + 2, cy + 18, 14, blue);
        break;
      case 8:
        for (let i = 0; i < 4; i++) {
          const px = cx - 18 + i * 12;
          drawStalk(px, cy - 16, stalkLen, green);
          drawStalk(px, cy + 16, stalkLen, blue);
        }
        break;
      case 9:
        for (let col = -1; col <= 1; col++) {
          const px = cx + col * 15;
          drawStalk(px, cy - 20, 13, red);
          drawStalk(px, cy, 13, blue);
          drawStalk(px, cy + 20, 13, green);
        }
        break;
    }
  }

  /**
   * Draws Characters (Man / Wan) suit with Chinese numbers & "萬".
   */
  private static drawCharacters(ctx: CanvasRenderingContext2D, val: number, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;

    const kanjiNums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const numChar = kanjiNums[val] || String(val);

    // Number character (top)
    ctx.fillStyle = '#1e3a8a'; // Prussian Navy
    ctx.font = 'bold 24px "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(numChar, cx, cy - 14);

    // Character "萬" (bottom in bold red)
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 22px "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText('萬', cx, cy + 16);
  }

  /**
   * Draws Winds (East, South, West, North).
   */
  private static drawWind(ctx: CanvasRenderingContext2D, val: string, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;

    const windData: Record<string, { char: string; color: string; label: string }> = {
      east: { char: '東', color: '#1d4ed8', label: 'E' },
      south: { char: '南', color: '#dc2626', label: 'S' },
      west: { char: '西', color: '#15803d', label: 'W' },
      north: { char: '北', color: '#7e22ce', label: 'N' }
    };

    const d = windData[val] || { char: val, color: '#1e293b', label: '' };

    // Big Chinese glyph
    ctx.fillStyle = d.color;
    ctx.font = 'bold 36px "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.char, cx, cy - 2);

    // English label in corner
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = d.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(d.label, 5, 4);
  }

  /**
   * Draws Dragons (Red 中, Green 發, White 白).
   */
  private static drawDragon(ctx: CanvasRenderingContext2D, val: string, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;

    if (val === 'red') {
      ctx.fillStyle = '#e11d48';
      ctx.font = 'bold 36px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('中', cx, cy - 2);
    } else if (val === 'green') {
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 36px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('發', cx, cy - 2);
    } else {
      // White Dragon: ornate picture frame
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - 16, cy - 24, 32, 48);

      ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
      ctx.fillRect(cx - 13, cy - 21, 26, 42);

      // Corner rosettes
      ctx.fillStyle = '#0284c7';
      const corners = [
        [cx - 16, cy - 24],
        [cx + 16, cy - 24],
        [cx - 16, cy + 24],
        [cx + 16, cy + 24]
      ];
      for (const [px, py] of corners) {
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Draws Seasons (Spring, Summer, Autumn, Winter).
   */
  private static drawSeason(ctx: CanvasRenderingContext2D, val: string, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;

    const seasonMap: Record<string, { icon: string; name: string; color: string; num: string }> = {
      spring: { icon: '🌸', name: '春', color: '#db2777', num: '1' },
      summer: { icon: '☀️', name: '夏', color: '#ea580c', num: '2' },
      autumn: { icon: '🍁', name: '秋', color: '#d97706', num: '3' },
      winter: { icon: '❄️', name: '冬', color: '#0284c7', num: '4' }
    };

    const s = seasonMap[val] || { icon: '🌱', name: '季', color: '#059669', num: '' };

    // Emoji icon
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.icon, cx, cy - 14);

    // Kanji name
    ctx.fillStyle = s.color;
    ctx.font = 'bold 18px "Noto Sans SC", sans-serif';
    ctx.fillText(s.name, cx, cy + 16);

    // Number index
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(s.num, 4, 3);
  }

  /**
   * Draws Flowers (Plum, Orchid, Chrysanthemum, Bamboo).
   */
  private static drawFlower(ctx: CanvasRenderingContext2D, val: string, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;

    const flowerMap: Record<string, { icon: string; name: string; color: string; num: string }> = {
      plum: { icon: '🌺', name: '梅', color: '#e11d48', num: '1' },
      orchid: { icon: '🪷', name: '蘭', color: '#7c3aed', num: '2' },
      chrysanthemum: { icon: '🌼', name: '菊', color: '#f59e0b', num: '3' },
      bamboo: { icon: '🎋', name: '竹', color: '#16a34a', num: '4' }
    };

    const f = flowerMap[val] || { icon: '💮', name: '花', color: '#ec4899', num: '' };

    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.icon, cx, cy - 14);

    ctx.fillStyle = f.color;
    ctx.font = 'bold 18px "Noto Sans SC", sans-serif';
    ctx.fillText(f.name, cx, cy + 16);

    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(f.num, 4, 3);
  }
}
