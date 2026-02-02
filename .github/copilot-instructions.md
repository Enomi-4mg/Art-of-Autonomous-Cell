# Copilot Instructions: Art of Autonomous Pixels

## Project Overview
A p5.js-based generative art project featuring a 10×10 cellular automaton where pixels autonomously grow by inheriting colors from neighbors. Users can interact by clearing cells, switch between 5 color palettes, and share creations via URL hash serialization.

## Architecture

### Core Components
- **Grid** (`sketch.js`): Manages the 10×10 cell array, handles neighbor detection (8-neighborhood), and executes the growth algorithm every 100ms via fixed-step updates
- **Cell**: Stores a `ColorIndex` (0 = empty, 1-16 = colors) and provides color lookup
- **Palette System**: 5 palette sets (Classic, Glacier, Ember, Mono, Pastel) dynamically transform base colors using HSL manipulation (`shiftHue`, `toMonochrome`, `soften`)
- **State Serialization**: Grid states encode to base-17 strings (one character per cell) stored in URL hash for sharing

### Key Data Flow
1. `setup()` initializes grid with random non-empty cells → builds palette sets → restores from URL hash if present
2. `draw()` renders grid, then runs fixed-step updates (`UPDATE_STEP_MS = 100`) to maintain consistent timing
3. `Grid.update()`: Picks random empty cell → checks if it has colored neighbors → inherits random neighbor color; if all cells empty, seeds center cell

### Critical Constants
```javascript
EMPTY_COLOR_INDEX = 0        // Semantic index for empty cells
UPDATE_STEP_MS = 100         // Growth tick rate
colorPalette[0] = "#000000"  // MUST be index 0 (empty)
```

## Development Patterns

### Color Manipulation Convention
All palette transformations use HSL color space via `hexToRgb()` → `rgbToHsl()` → modify → `hslToRgb()` → `rgbToHex()`. Never manipulate RGB directly. See `shiftHue()` for the pattern.

### Display vs Storage Colors
- **Storage**: `Cell.ColorIndex` (integer 0-16) is the source of truth
- **Display**: `getDisplayColor()` applies active palette transformation at render time
- When serializing/deserializing, always use base color indices, not transformed colors

### Export Image Pipeline
1. `setupSaveButton()` creates hidden QRCode instance with current URL
2. On save click: serialize grid → update hash → regenerate QR → wait 200ms for QR render
3. `exportImage()` creates 500×600 export canvas → draws frame → renders grid → loads QR image → adds title/author → saves PNG

## Common Tasks

### Adding a New Palette
1. Add entry to `buildPaletteSets()` with unique `id` and `label`
2. Provide a transformation function mapping each `colorPalette` hex value
3. Palette buttons auto-generate from the array

### Modifying Growth Rules
Edit `Grid.update()`. Current rule: only empty cells can grow, only from colored neighbors. To change behavior (e.g., allow overwriting), modify the `if (this.cells[idx].ColorIndex === EMPTY_COLOR_INDEX)` condition.

### Adjusting Grid Size
Change `GRID_COLUMNS` and `GRID_ROWS` constants. Note: existing URL hashes will break if length changes (100 chars for 10×10 grid). Consider migration logic if needed.

## Technical Constraints

### Fixed-Step Timing
Uses `millis() - updateTimestamp > UPDATE_STEP_MS` to decouple updates from framerate. Never use `frameCount` or rely on 60fps assumptions.

### URL Hash Serialization
- Format: base-17 string (digits 0-9, a-g) where each char = one cell's ColorIndex
- Example: "0000111222..." (100 chars for 10×10)
- Restore logic: `Grid.deserialize()` parses `window.location.hash.substring(1)`

### Responsive Canvas
Canvas resizes to fit container via `windowResized()` → `getCanvasSize()`. Always use relative coordinates (`mouseX/mouseY` with `width/height`) for click detection, never hardcoded pixels.

## Dependencies & Integration
- **p5.js**: Loaded via `libraries/p5.min.js` (not CDN). Access all p5 functions globally.
- **QRCode.js**: CDN-loaded for generating shareable QR codes in export images
- No build system: Pure vanilla JS with p5's global mode

## Testing Approach
No automated tests. Manual testing workflow:
1. Click cells to verify clearing works
2. Switch palettes to ensure colors transform correctly
3. Save → reload page with hash to test serialization
4. Export image and verify QR code scans to correct URL
