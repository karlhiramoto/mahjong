# Mahjong Solitaire 🀄

A modern, responsive, web-based Mahjong Solitaire puzzle game rendered on HTML5 Canvas. Features vibrant procedural vector tiles, authentic 3D layered elevation, guaranteed-solvable boards, an intelligent hint system with hint tracking, touch/gesture support, and an automated play-through testing framework.

Live Demo: [https://karlhiramoto.github.io/mahjong/](https://karlhiramoto.github.io/mahjong/)

## Features

- **3D Angled Elevation View**: Realistic 3D perspective with physical ivory + jade acrylic sandwich side walls, multi-layer progressive shadows, and layer-based sun lighting.
- **View Toggle**: Switch seamlessly between the 3D Angled View and the classic flat 2D Top-Down view (`V` key).
- **Procedural Canvas Tiles**: Razor-sharp vector tiles on high-DPI displays (Dots, Bamboo with 1-Bamboo peacock, Characters with English corner labels, Winds, Dragons, and Flowers).
- **Intelligent Hint System**: Finds valid open matching pairs that strategically unlock the most blocked tiles below, and tracks total hints used in real time.
- **Solvable Deal Generator**: Uses reverse layer-peeling simulation to mathematically guarantee 100% winnable boards.
- **Mobile & Desktop Controls**: Tap to select, drag to pan, pinch-to-zoom on touch screens, mouse wheel zooming, and accessible touch targets.
- **Automated Testing & Auto-Play Framework**:
  - Headless bot solver playing through full 144-tile games in seconds (`npm test`).
  - In-browser visual auto-play bot allowing you to watch the game play itself in real time on canvas.
- **Audio Synthesizer**: Web Audio API procedural sound effects for tile taps, match chimes, hint pings, shuffles, and victory fanfares.

## Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run automated play-through and rule tests
npm test

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

## License

MIT
