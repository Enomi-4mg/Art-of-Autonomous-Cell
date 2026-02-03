# Copilot Instructions: Art of Autonomous Pixels

## Project Overview
A p5.js-based generative art project featuring a dynamic cellular automaton where pixels autonomously grow by inheriting colors from neighbors. Key features: interactive cell clearing, 5 dynamic color palettes, efficient 3-bit serialization for sharing, and multi-platform social sharing with Web Share API.

## Architecture

### Module Organization (6 files, no bundler)
```
sketch.js     → Main p5 lifecycle (setup/draw), simulation constants, input handling
grid.js       → Grid/Cell classes, growth algorithm, 3-bit serialization, O(1) empty cell tracking
palette.js    → Palette system, active palette state, display color transformation
colorUtils.js → HSL↔RGB↔HEX conversion utilities (never manipulate RGB directly)
share.js      → Multi-platform sharing, QR generation, native Web Share API integration
ui.js         → Button setup (palette/reset/save/size), event listeners, QR code setup
```

### Core Components & Data Structures
- **Grid** (`grid.js`): Manages configurable grid (default 12×12), implements 8-neighborhood neighbor detection, and executes growth algorithm with dynamic timing based on empty cell count
- **Cell**: Stores `ColorIndex` (0=empty, 1-7=colors), `glowValue` for visual feedback, and O(1) empty list tracking via `isInEmptyList`/`posInList`
- **Empty Cell Tracking**: O(1) operations via `emptyIndices` array - `fillCell()` swaps with last element and pops, `clearCell()` appends to end
- **Palette System** (`palette.js`): 5 palette sets transform base colors at render time via HSL manipulation (Classic, Glacier, Ember, Mono, Pastel)
- **3-bit Serialization**: Compact binary format - 2 cells per byte (6 bits used) + 2-byte header [X, Y] → Base64url encoded
- **Share System** (`share.js`): Progressive enhancement - tries native Web Share API (with file support check) → falls back to clipboard or platform-specific web intents

### Critical Data Flow
1. **Initialization**: `setup()` → `createInitialCells()` seeds center region with random colors → `restoreFromHash()` restores from URL if present → UI setup functions
2. **Render Loop**: `draw()` → decays `glowValue` for all cells → `grid.drawCells()` renders with `getDisplayColor()` → runs fixed-step updates with dynamic interval
3. **Dynamic Growth Timing**: `UPDATE_INTERVAL_CONSTANT / emptyCount` - fewer empty cells = slower growth (prevents rapid completion)
4. **Growth Algorithm** (`Grid.update()`): Pick random empty cell from `emptyIndices` → get 8 neighbors → if has colored neighbors, inherit color (5% mutation chance) → `fillCell()` updates state and removes from empty list → if all empty, seed center
5. **Serialization Pipeline**: User action → `grid.serialize()` packs 2 cells per byte (3 bits each) → Base64url encode → store in URL hash → QR code generation
6. **Share Flow**: Button click → `handleShareAction(type)` → serialize grid → update hash → generate QR → create image blob with QR + grid + metadata → attempt native share → fallback to clipboard/web intent

### Performance-Critical Patterns
- **O(1) Empty Cell Operations**: Never iterate to find empty cells - use `emptyIndices` array with swap-and-pop removal
- **Fixed-Step Updates**: Use `millis() - updateTimestamp > dynamicInterval` pattern, never rely on `frameCount` or 60fps assumptions
- **Dynamic Interval Scaling**: `const dynamicInterval = UPDATE_INTERVAL_CONSTANT / max(emptyCount, 1)` prevents division by zero and maintains inverse relationship
- **Render-Time Color Transformation**: `getDisplayColor(colorIndex)` applies palette at render, storage always uses base indices

## Development Patterns

### Color Manipulation Convention (colorUtils.js)
**ALL** palette transformations MUST use HSL color space:
```javascript
// Pattern: HEX → RGB → HSL → modify H/S/L → RGB → HEX
const rgb = hexToRgb(hex);
const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
hsl.h = (hsl.h + hueShift) % 360;  // Modify HSL
const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
```
See `shiftHue()`, `toMonochrome()`, `soften()` in `colorUtils.js` for reference implementations.

### Storage vs Display Colors
- **Storage**: `Cell.ColorIndex` (integer 0-7) is the source of truth, never store hex colors
- **Display**: `getDisplayColor(colorIndex)` applies `activePalette` transformation at render time
- **Serialization**: Always use base color indices (0-7), not transformed colors from active palette

### 3-bit Serialization Format (grid.js)
```javascript
// Binary structure: [X:8bit][Y:8bit][cells packed 2 per byte...]
// Each byte: [unused:2bit][cell2:3bit][cell1:3bit]
// ColorIndex must be 0-7 (3 bits) - enforced via `colorIndex & 0x07`
// Base64url encoding: replace '+' with '-', '/' with '_', strip '='
```
**Critical**: Grid size change breaks existing URLs - `deserialize()` handles by resizing grid and updating size buttons.

### Share System Architecture (share.js)
Progressive enhancement with 3-tier fallback:
1. **Native Share API**: Check `navigator.canShare({ files: [file] })` → include image file if supported → handle AbortError as success
2. **Clipboard Fallback**: `navigator.clipboard.writeText()` → fallback to `document.execCommand('copy')` with hidden textarea
3. **Web Intent Fallback**: Open platform-specific URL (`https://x.com/intent/tweet`, `https://social-plugins.line.me/lineit/share`) in new window

**Image File Handling**: `createShareImageFile()` returns File object named `autonomous-pixels.png` - removed from share data if `navigator.canShare()` returns false.

## Common Development Tasks

### Adding a New Palette
Edit `buildPaletteSets()` in `palette.js`:
```javascript
{ 
  id: 'mypalette',           // Unique ID for data-palette-id
  label: 'My Palette',        // Button label
  colors: colorPalette.map(hex => transformColor(hex))  // Transformation function
}
```
Buttons auto-generate in `setupPaletteButtons()`.

### Modifying Growth Rules
Edit `Grid.update()` in `grid.js`. Current rule: only empty cells grow, 5% mutation rate, 8-neighborhood inheritance.
- To allow overwriting: remove `if (this.cells[idx].ColorIndex === EMPTY_COLOR_INDEX)` check
- To change mutation rate: modify `MUTATION_RATE` constant (currently 0.05)
- To change neighbor pattern: modify `getNeighborIndices()` (currently 8-neighborhood)

### Adjusting Grid Size
- Runtime: Click size buttons (8/12/16/32) - resets grid and clears hash
- Code: Change `GRID_COLUMNS` and `GRID_ROWS` in `sketch.js` (default 12×12)
- Add size option: Add button to `.size-presets` in `index.html` with `data-size="N"` - `setupSizeButtons()` auto-detects

### Adding a New Share Platform
1. Add button to `index.html` with `data-share="platform-id"` and SVG icon
2. In `handleShareAction()` in `share.js`, add case for new platform:
   ```javascript
   if (type === 'myplatform') {
     const intentUrl = `https://example.com/share?url=${encodeURIComponent(shareUrl)}`;
     openShareWindow(intentUrl);
   }
   ```
3. For platform-specific text: use `buildShareText(includeXId)` pattern

## Technical Constraints

### Fixed-Step Timing with Dynamic Interval
Uses `millis()` difference pattern with dynamic interval calculation:
```javascript
const emptyCount = grid.emptyIndices.length;
const dynamicInterval = UPDATE_INTERVAL_CONSTANT / max(emptyCount, 1);
while (millis() - updateTimestamp > dynamicInterval) {
  updateTimestamp += dynamicInterval;
  grid.update();
}
```
**Never** use `frameCount` or rely on 60fps - growth rate must be frame-independent.

### 3-bit Color Limit
Only 8 colors supported (indices 0-7). `colorPalette` array can have more colors, but serialization clamps via `& 0x07`. Index 0 MUST be `#000000` (semantic empty).

### Responsive Canvas
Canvas resizes to fit `#canvas-container` via `windowResized()` → `getCanvasSize()`. Always use `mouseX/mouseY` with `width/height` for click detection - never hardcoded pixel coordinates.

### Web Share API Requirements
- **HTTPS/localhost only** - fails silently on HTTP
- **File support check required**: `navigator.canShare({ files: [file] })` before adding to share data
- **AbortError is success**: User cancellation is not an error - handle as successful share

## Dependencies & Workflow
- **p5.js v1.x**: Loaded via `libraries/p5.min.js` (not CDN) - global mode, all p5 functions available globally
- **QRCode.js v1.0.0**: CDN-loaded from cdnjs.cloudflare.com - used in `setupSaveButton()` and share functions
- **No build system**: Pure vanilla JS, no transpilation, no module bundler
- **Load order**: HTML loads scripts in order: `p5.min.js` → `p5.sound.min.js` → QRCode.js (CDN) → all project JS files

## Testing Approach
No automated tests. Manual testing workflow:
1. **Growth**: Watch autonomous growth with various grid sizes (8/12/16/32)
2. **Interaction**: Click cells to clear, verify O(1) empty list updates work correctly
3. **Palettes**: Switch between all 5 palettes, verify HSL transformations render correctly
4. **Dynamic Timing**: Observe growth slows as grid fills (inverse relationship)
5. **Serialization**: Save → reload page with hash → verify exact grid state restored
6. **Share**: Test all platforms (copy/X/LINE) on mobile (native share) and desktop (web intents)
7. **Export**: Download image, verify QR code scans to correct URL with grid state
8. **Grid Resize**: Change grid size, verify hash cleared and buttons update correctly
