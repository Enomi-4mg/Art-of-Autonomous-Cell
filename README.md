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

1. **Watch the Growth**: Pixels automatically grow and spread across the 10×10 grid
2. **Click to Clear**: Click on any cell to clear it and create space for new growth patterns
3. **Change Palettes**: Select different color schemes from the left panel
4. **Reset**: Click the "Reset" button to start fresh with a new random pattern
5. **Save & Share**: Click "Save Image" to:
   - Generate a shareable URL with your current pattern
   - Download a PNG image with a QR code pointing to your artwork

## 🏗️ Project Structure

```
Art-of-Autonomous-Cell/
├── index.html          # Main HTML file
├── sketch.js           # p5.js sketch and simulation logic
├── style.css           # Styling
├── jsconfig.json       # JavaScript configuration
├── libraries/          # External libraries
│   ├── p5.min.js
│   └── p5.sound.min.js
└── README.md           # This file
```

## 🔧 Technical Details

### Grid System
- 10×10 cell grid (configurable via `GRID_COLUMNS` and `GRID_ROWS`)
- Each cell stores a color index (0 = empty, 1-16 = various colors)

### Growth Algorithm
- Every 100ms, a random empty cell attempts to grow
- If the cell has colored neighbors, it inherits one of their colors
- If all cells are empty, the center cell is seeded with a random color

### State Serialization
- Grid state is encoded as a base-17 string
- Each character represents one cell's color index
- The state is stored in the URL hash for easy sharing

### Color Palettes
- **Classic**: Original vibrant colors
- **Glacier**: Cool blue-shifted tones
- **Ember**: Warm orange-red tones
- **Mono**: Grayscale version
- **Pastel**: Softened, lighter colors

## 🎨 Customization

You can modify the following constants in `sketch.js`:

```javascript
const CANVAS_SIZE = 400;           // Canvas dimensions
const GRID_COLUMNS = 10;           // Number of columns
const GRID_ROWS = 10;              // Number of rows
const UPDATE_STEP_MS = 100;        // Growth speed (milliseconds)
const colorPalette = [...];        // Custom color palette
```

## 📦 Dependencies

- [p5.js](https://p5js.org/) - Creative coding library
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) - QR code generation

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👤 Author

Your Name
- GitHub: [@Enomi-4mg](https://github.com/Enomi-4mg)

## 🙏 Acknowledgments

- Built with [p5.js](https://p5js.org/)
- Inspired by cellular automata and generative art
