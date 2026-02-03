# Art of Autonomous Pixels

An interactive generative art project where pixels grow and evolve autonomously to create unique patterns. Built with p5.js.

[日本語版 README](README_ja.md)

## 🎨 Features

- **Autonomous Growth**: Pixels autonomously expand into empty spaces by inheriting colors from their neighbors
- **Interactive Canvas**: Click to clear cells and influence the growth pattern
- **Multiple Palettes**: Switch between 5 different color schemes (Classic, Glacier, Ember, Mono, Pastel)
- **State Persistence**: Save and share your artwork via URL hash
- **Image Export**: Download your creation as a PNG with QR code for sharing

## 🚀 Getting Started

### Prerequisites

- A modern web browser
- A local web server (optional, for local development)

### Installation

1. Clone this repository:
```bash
git clone https://github.com/Enomi-4mg/Art-of-Autonomous-Cell.git
cd Art-of-Autonomous-Cell
```

2. Open `index.html` in your web browser or serve it with a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server
```

3. Navigate to `http://localhost:8000` in your browser

## 🎮 How to Use

1. **Watch the Growth**: Pixels automatically grow and spread across the grid (default 12×12, configurable to 8, 12, 16, or 32)
2. **Click to Clear**: Click on any cell to clear it and create space for new growth patterns
3. **Change Palettes**: Select different color schemes from the palette buttons
4. **Adjust Grid Size**: Click size buttons to change grid dimensions (clears current pattern)
5. **Reset**: Click the "Reset" button to start fresh with a new random seeded pattern
6. **Save & Share**: Click "Save Image" to:
   - Generate a shareable URL with your current pattern encoded in the hash
   - Download a PNG image with a QR code linking to your artwork
   - Share via native Web Share API (mobile), clipboard, or social media platforms (Twitter/X, LINE)

## 🏗️ Project Structure

```
Art-of-Autonomous-Cell/
├── index.html          # Main HTML file with UI buttons
├── sketch.js           # p5.js lifecycle, simulation constants, input handling
├── grid.js             # Grid/Cell classes, growth algorithm, serialization
├── palette.js          # Palette system, color transformation, HSL utilities
├── colorUtils.js       # Color conversion utilities (HSL/RGB/HEX)
├── share.js            # Multi-platform sharing, QR generation, Web Share API
├── ui.js               # Button setup and event listeners
├── style.css           # Styling
├── jsconfig.json       # JavaScript configuration
├── libraries/          # External libraries
│   ├── p5.min.js       # p5.js v1.x (vanilla JS mode)
│   └── p5.sound.min.js # p5.sound library
└── README.md           # This file
```

## 🔧 Technical Details

### Grid System
- Configurable grid sizes: 8×8, 12×12 (default), 16×16, or 32×32
- Each cell stores a 3-bit color index (0 = empty, 1-7 = colors)
- O(1) empty cell tracking using index array with swap-and-pop removal
- 8-neighborhood neighbor detection

### Growth Algorithm
- Selects random empty cell from tracked empty list
- If cell has colored neighbors, inherits one color with 5% mutation chance
- Dynamic growth timing: `UPDATE_INTERVAL / empty_cell_count` (faster when fewer cells empty, slower at completion)
- If all cells filled, center region reseeds with new colors
- Fixed-step updates independent of frame rate

### State Serialization
- Compact 3-bit format: 2 cells per byte (6 bits used, 2 unused)
- Binary structure: 1-byte width + 1-byte height + packed cell data
- Base64url encoding (replaces `+` with `-`, `/` with `_`, strips `=`)
- Encoded in URL hash for easy sharing; grid size changes trigger resizing

### Color Palettes (5 Total)
- **Classic**: Original vibrant colors
- **Glacier**: Cool blue-shifted tones
- **Ember**: Warm orange-red tones  
- **Mono**: Grayscale version
- **Pastel**: Softened, lighter colors
- HSL color space used for palette transformations (hue shift, saturation, lightness)

### Sharing Features
- **Native Web Share API**: On supported mobile devices, share image files directly to apps
- **Clipboard Fallback**: Copy URL to clipboard for pasting
- **Social Media Intents**: Direct sharing to Twitter/X and LINE with preset text
- **QR Code Export**: Downloads PNG with embedded QR code linking to artwork

## 🎨 Customization

Edit the following constants in `sketch.js`:

```javascript
const UPDATE_INTERVAL_CONSTANT = 500;  // Base growth interval (scaled by empty cell count)
const GRID_COLUMNS = 12;               // Default grid width (also 8, 16, 32)
const GRID_ROWS = 12;                  // Default grid height
const MUTATION_RATE = 0.05;            // Color mutation probability (5%)
```

To add a new palette, edit `buildPaletteSets()` in `palette.js`:
```javascript
{ 
  id: 'mypalette',
  label: 'My Palette',
  colors: basePalette.map(hex => transformColor(hex))
}
```

Custom color transformations use HSL color space in `colorUtils.js`:
- `shiftHue(hex, degrees)` - Rotate hue by specified degrees
- `toMonochrome(hex)` - Convert to grayscale
- `soften(hex)` - Reduce saturation/increase lightness for pastel effect

## 📦 Dependencies

- [p5.js v1.x](https://p5js.org/) - Creative coding library (vanilla JS mode)
- [p5.sound](https://p5js.org/reference/#/libraries/p5.sound) - Sound library
- [QRCode.js v1.0.0](https://github.com/davidshimjs/qrcodejs) - QR code generation (CDN: cdnjs.cloudflare.com)

## 🌐 Browser Requirements

- Modern ES6-compatible browser
- HTTPS or localhost for Web Share API and clipboard access
- Canvas API support
- Native File API for image export

## 🔄 Persistence

- **URL Hash**: Grid state persists in URL fragment for easy bookmarking and sharing
- **No Backend**: Entirely client-side; no data stored on server
- **Reproducible**: Same URL hash always loads identical grid state

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👤 Author

- GitHub: [@Enomi-4mg](https://github.com/Enomi-4mg)

## 🙏 Acknowledgments

- Built with [p5.js](https://p5js.org/)
- Inspired by cellular automata and autonomous systems
- QR code generation by [davidshimjs/qrcodejs](https://github.com/davidshimjs/qrcodejs)
