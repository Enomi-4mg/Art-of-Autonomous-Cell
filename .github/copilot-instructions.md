# Copilot Instructions: Art of Autonomous Pixels

## Project Overview
A p5.js-based generative art project featuring a 10×10 cellular automaton where pixels autonomously grow by inheriting colors from neighbors. Users can interact by clearing cells, switch between 5 color palettes, and share creations via URL hash serialization and social sharing with native Web Share API support.

## Architecture

### Core Components
- **Grid** (`sketch.js`): Manages the 10×10 cell array, handles neighbor detection (8-neighborhood), and executes the growth algorithm every 100ms via fixed-step updates
- **Cell**: Stores a `ColorIndex` (0 = empty, 1-16 = colors) and provides color lookup
- **Palette System**: 5 palette sets (Classic, Glacier, Ember, Mono, Pastel) dynamically transform base colors using HSL manipulation (`shiftHue`, `toMonochrome`, `soften`)
- **State Serialization**: Grid states encode to base-17 strings (one character per cell) stored in URL hash for sharing
- **Share System**: Multi-platform sharing via native Web Share API, clipboard, and social media intents (X/Twitter)

### Key Data Flow
1. `setup()` initializes grid with random non-empty cells → builds palette sets → restores from URL hash if present → sets up share buttons
2. `draw()` renders grid, then runs fixed-step updates (`UPDATE_STEP_MS = 100`) to maintain consistent timing
3. `Grid.update()`: Picks random empty cell → checks if it has colored neighbors → inherits random neighbor color; if all cells empty, seeds center cell
4. Share flow: `handleShareAction()` → serializes grid → updates URL hash → generates QR code → creates share image blob → tries native share or falls back to clipboard/web intent

### Critical Constants
```javascript
EMPTY_COLOR_INDEX = 0        // Semantic index for empty cells
UPDATE_STEP_MS = 100         // Growth tick rate
colorPalette[0] = "#000000"  // MUST be index 0 (empty)
EXPORT_CANVAS_WIDTH = 500    // Export image width
EXPORT_CANVAS_HEIGHT = 600   // Export image height (includes QR + text)
EXPORT_QR_SIZE = 80          // QR code dimensions in export
```

## Development Patterns

### Color Manipulation Convention
All palette transformations use HSL color space via `hexToRgb()` → `rgbToHsl()` → modify → `hslToRgb()` → `rgbToHex()`. Never manipulate RGB directly. See `shiftHue()` for the pattern.

### Display vs Storage Colors
- **Storage**: `Cell.ColorIndex` (integer 0-16) is the source of truth
- **Display**: `getDisplayColor()` applies active palette transformation at render time
- When serializing/deserializing, always use base color indices, not transformed colors

### Export & Share Pipeline
1. **Setup Phase**: `setupSaveButton()` creates hidden QRCode instance; `setupShareButtons()` attaches event listeners to share buttons
2. **Save Image**: On save click → serialize grid → update hash → regenerate QR → wait 200ms → `exportImage()` creates 500×600 canvas → draws frame → renders grid → loads QR image → adds title/author → saves PNG
3. **Share Flow**: On share button click → `handleShareAction(type)`:
   - Serializes grid state to URL hash
   - Generates QR code via `qrcode.makeCode()`
   - Creates share image blob via `createShareImageBlob()` (returns Promise<Blob>)
   - Wraps blob in File object named `autonomous-pixels.png`
   - Attempts native Web Share API with `navigator.share()` (includes image file if supported)
   - Falls back to clipboard copy (type=copy) or web intent (type=x for X/Twitter)
   - For clipboard: uses `navigator.clipboard.writeText()` or `document.execCommand('copy')` fallback
   - For web intents: opens new window with `window.open(intentUrl)` (e.g., `https://x.com/intent/tweet`)

### Share System Details
- **Native Share**: Checks `navigator.canShare({ files: [file] })` to verify file sharing support before attempting
- **Progressive Enhancement**: Tries native share first, then falls back to platform-specific methods
- **Share Data Format**: 
  ```javascript
  { 
    title: "ART OF AUTONOMOUS PIXELS",
    text: "Autonomous pixels bloom into living patterns.\n...",
    url: window.location.href,
    files: [File] // Optional, removed if not supported
  }
  ```
- **X Share Specifics**: Includes `SHARE_X_ID` (@4mgEnomi) in share text when sharing to X platform
- **Error Handling**: Silent fallback chain; AbortError (user cancels) treated as success

## Common Tasks

### Adding a New Palette
1. Add entry to `buildPaletteSets()` with unique `id` and `label`
2. Provide a transformation function mapping each `colorPalette` hex value
3. Palette buttons auto-generate from the array

### Modifying Growth Rules
Edit `Grid.update()`. Current rule: only empty cells can grow, only from colored neighbors. To change behavior (e.g., allow overwriting), modify the `if (this.cells[idx].ColorIndex === EMPTY_COLOR_INDEX)` condition.

### Adjusting Grid Size
Change `GRID_COLUMNS` and `GRID_ROWS` constants. Note: existing URL hashes will break if length changes (100 chars for 10×10 grid). Consider migration logic if needed.

### Adding a New Share Platform
1. Add button to `index.html` with `data-share="platform-id"` attribute
2. In `handleShareAction()`, add case for new platform type
3. For social platforms: create intent URL following platform's URL scheme
4. For native integration: extend share data object with platform-specific fields

### Customizing Share Text
Edit constants at top of `sketch.js`:
- `SHARE_SHORT_TEXT`: One-line description for shares
- Updated by: Save button, share actions (auto-serializes before sharing)

### Web Share API Integration
- Browser support: Modern mobile browsers + some desktop (Chrome/Edge 89+, Safari 12.1+)
- File sharing: Checked via `navigator.canShare({ files: [...] })`; silently degrades if unsupported
- User cancellation: `AbortError` handled as non-error (user intentionally cancelled)
- Security: Share only works in secure contexts (HTTPS or localhost)
- `SHARE_AUTHOR_LINE`: Author credit line
- `SHARE_X_ID`: X/Twitter handle (included in X shares only)
- `EXPORT_TITLE`: Title shown on export images

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
- No build system: Pure vanilla JS with p5's global mod
5. Test share buttons:
   - **Copy button**: Verify clipboard contains text + URL
   - **X button**: Check native share dialog appears (mobile) or X intent opens (desktop)
   - **Cross-browser**: Test on Chrome/Edge (full support), Firefox (no native share), Safari (iOS/macOS)
   - **Image sharing**: Verify image file included in native share on supported platforms
6. Test share URLs encode current grid state correctly
7. Verify share text includes correct credits and platform-specific IDse

## Testing Approach
No automated tests. Manual testing workflow:
1. Click cells to verify clearing works
2. Switch palettes to ensure colors transform correctly
3. Save → reload page with hash to test serialization
4. Export image and verify QR code scans to correct URL
