// Canvas and grid configuration
const CANVAS_SIZE = 400;
const GRID_COLUMNS = 10;
const GRID_ROWS = 10;

// Simulation update timing
const UPDATE_STEP_MS = 100;
const UPDATE_START_OFFSET_MS = 800;

// Semantic indices
const EMPTY_COLOR_INDEX = 0;

let grid;
// Color palette: index 0 is treated as "empty"
const colorPalette = ["#000000",
  "#ff0000", "#ff5100", "#3700ff", "#55ff00", 
  "#00FF85", "#00F2FF", "#007BFF", "#ff00dd", 
  "#00ae11", "#c14dff", "#4DFFC9", "#6600FF", 
  "#ff2469", "#ff3374", "#fbff00", "#FFFFFF"
];
let updateTimestamp = UPDATE_START_OFFSET_MS;
let qrcode;
let activePalette = colorPalette;
let paletteSets = [];
let activePaletteId = 'classic';

// Export layout
const EXPORT_CANVAS_WIDTH = 500;
const EXPORT_CANVAS_HEIGHT = 600;
const EXPORT_MARGIN = 50;
const EXPORT_FRAME_PADDING = 5;
const EXPORT_QR_SIZE = 80;
const EXPORT_TITLE = "ART OF AUTONOMOUS PIXELS";

function setup() {
  const container = document.getElementById('canvas-container');
  const initialSize = container.offsetWidth > 0 ? container.offsetWidth : CANVAS_SIZE;
  const cnv = createCanvas(initialSize, initialSize);
  cnv.parent('canvas-container');
  const cells = createInitialCells(GRID_COLUMNS, GRID_ROWS);
  grid = new Grid(GRID_COLUMNS, GRID_ROWS, cells);
  paletteSets = buildPaletteSets();
  setupPaletteButtons();
  setupResetButton();
  restoreFromHash();
  setupSaveButton();
}
function draw() {
  background(0);
  // Render current state
  grid.drawCells();
  // Run fixed-step updates to keep time consistent
  while (millis() - updateTimestamp > UPDATE_STEP_MS) {
    updateTimestamp += UPDATE_STEP_MS;
    grid.update();
  }
}
function mousePressed() {
  // Clear the clicked cell (set to empty)
  const index = grid.getIndexAt(mouseX, mouseY);
  if (index !== null) {
    grid.cells[index].ColorIndex = EMPTY_COLOR_INDEX;
  }
}
function restoreFromHash() {
  // Restore grid from URL hash when possible
  const hash = window.location.hash.substring(1);
  if (hash.length === GRID_COLUMNS * GRID_ROWS) {
    grid.deserialize(hash);
  }
}
function setupSaveButton() {
  // Create save button and QR generator
  const saveBtn = document.getElementById('save-button');
  if (!saveBtn) return;
  saveBtn.disabled = false;
  qrcode = new QRCode(document.getElementById("qrcode"), {
    text: window.location.href,
    width: EXPORT_QR_SIZE,
    height: EXPORT_QR_SIZE,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  saveBtn.addEventListener('click', () => {
    window.location.hash = grid.serialize();
    // Generate the QR code
    qrcode.makeCode(window.location.href);
    // Wait briefly to ensure the library finishes rendering
    setTimeout(() => {
      exportImage();
    }, 200);
  });
}
function setupPaletteButtons() {
  const paletteRoot = document.getElementById('palette-buttons');
  paletteRoot.innerHTML = '';
  paletteSets.forEach((palette) => {
    const btn = document.createElement('button');
    btn.className = 'palette-button';
    btn.textContent = palette.label;
    btn.dataset.paletteId = palette.id;
    btn.addEventListener('click', () => {
      setActivePalette(palette.id);
    });
    paletteRoot.appendChild(btn);
  });
  setActivePalette(activePaletteId);
}
function setupResetButton() {
  const resetButton = document.getElementById('reset-button');
  if (!resetButton) return;
  resetButton.addEventListener('click', () => {
    grid = new Grid(GRID_COLUMNS, GRID_ROWS, createInitialCells(GRID_COLUMNS, GRID_ROWS));
    window.location.hash = '';
  });
}
function setActivePalette(paletteId) {
  const palette = paletteSets.find((item) => item.id === paletteId);
  if (!palette) return;
  activePaletteId = paletteId;
  activePalette = palette.colors;
  const buttons = document.querySelectorAll('.palette-button');
  buttons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.paletteId === paletteId);
  });
}
function buildPaletteSets() {
  return [
    {
      id: 'classic',
      label: 'Classic',
      colors: [...colorPalette]
    },
    {
      id: 'glacier',
      label: 'Glacier',
      colors: colorPalette.map((hex) => shiftHue(hex, 170, 0.88, 1.05))
    },
    {
      id: 'ember',
      label: 'Ember',
      colors: colorPalette.map((hex) => shiftHue(hex, -20, 1.08, 1.02))
    },
    {
      id: 'mono',
      label: 'Mono',
      colors: colorPalette.map((hex) => toMonochrome(hex))
    },
    {
      id: 'pastel',
      label: 'Pastel',
      colors: colorPalette.map((hex) => soften(hex, 0.65))
    }
  ];
}
function getCanvasSize() {
  const container = document.getElementById('canvas-container');
  if (!container) return CANVAS_SIZE;
  const rect = container.getBoundingClientRect();
  const size = Math.floor(Math.min(rect.width, rect.height || rect.width));
  return size > 0 ? size : CANVAS_SIZE;
}
function windowResized() {
  const size = getCanvasSize();
  resizeCanvas(size, size);
}
function createInitialCells(columns, rows) {
  // Initialize each cell with a random non-empty color
  const cells = [];
  const cellCount = columns * rows;
  for (let i = 0; i < cellCount; i++) {
    cells.push(new Cell());
  }
  return cells;
}
function exportImage() {
  // Create a slightly larger "frame" canvas
  const exportCanvas = createGraphics(EXPORT_CANVAS_WIDTH, EXPORT_CANVAS_HEIGHT);
  // Light background matching CSS theme
  exportCanvas.background(246, 247, 251); // #f6f7fb

  // Draw the frame border
  const frameSize = CANVAS_SIZE + EXPORT_FRAME_PADDING * 2;
  exportCanvas.stroke(31, 41, 55); // #1f2937 - text color from CSS
  exportCanvas.strokeWeight(2);
  exportCanvas.noFill();
  exportCanvas.rect(EXPORT_MARGIN - EXPORT_FRAME_PADDING, EXPORT_MARGIN - EXPORT_FRAME_PADDING, frameSize, frameSize);

  // Draw the grid onto the export canvas
  drawGridToGraphics(exportCanvas, EXPORT_MARGIN, EXPORT_MARGIN, CANVAS_SIZE);

  const qrImgElement = document.querySelector('#qrcode img');
  
  const finalizeExport = () => {
    exportCanvas.fill(31, 41, 55); // #1f2937 - text color from CSS
    exportCanvas.textFont("Inter, Helvetica Neue, Segoe UI, sans-serif");
    exportCanvas.textAlign(CENTER);
    exportCanvas.textSize(18);
    exportCanvas.textStyle(NORMAL);
    exportCanvas.text(EXPORT_TITLE, EXPORT_CANVAS_WIDTH / 2, EXPORT_CANVAS_HEIGHT - 80);
    exportCanvas.textSize(12);
    exportCanvas.text("Created by @Enomi-4mg", EXPORT_CANVAS_WIDTH / 2, EXPORT_CANVAS_HEIGHT - 60);
    // Save the composed image
    saveCanvas(exportCanvas, 'my_artwork', 'png');
  };

  if (qrImgElement && qrImgElement.src !== "") {
    // Load the QR image and draw it
    loadImage(qrImgElement.src, (readyImg) => {
      exportCanvas.image(readyImg, EXPORT_CANVAS_WIDTH - EXPORT_QR_SIZE - EXPORT_FRAME_PADDING, EXPORT_CANVAS_HEIGHT - EXPORT_QR_SIZE - EXPORT_FRAME_PADDING, EXPORT_QR_SIZE, EXPORT_QR_SIZE);
      finalizeExport();
    }, () => {
      finalizeExport();
    });
  } else {
    finalizeExport();
  }
}
function drawGridToGraphics(gfx, offsetX, offsetY, size) {
  // Draw the current grid onto a p5.Graphics instance
  const cellSize = size / grid.X;
  for (let i = 0; i < grid.X; i++) {
    for (let j = 0; j < grid.Y; j++) {
      const cIdx = grid.cells[i + j * grid.X].ColorIndex;
      gfx.fill(colorPalette[cIdx]);
      gfx.noStroke();
      gfx.rect(offsetX + i * cellSize, offsetY + j * cellSize, cellSize, cellSize);
    }
  }
}
class Grid {
  constructor(columns, rows, cells) {
    this.X = columns;
    this.Y = rows;
    this.cells = cells;
  }
  drawCells() {
    // Draw each cell as a rectangle
    const cellSize = width / this.X;
    for (let i = 0; i < this.X; i++) {
      for (let j = 0; j < this.Y; j++) {
        let index = i + j * this.X;
        fill(getDisplayColor(this.cells[index].ColorIndex));
        rect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }
  getIndexAt(screenX, screenY) {
    // Convert screen position to cell index (or null if outside)
    if (screenX < 0 || screenX >= width || screenY < 0 || screenY >= height) {
      return null;
    }
    const column = floor(screenX / (width / this.X));
    const row = floor(screenY / (height / this.Y));
    return column + row * this.X;
  }
  getColorAt(index) {
    return this.cells[index].getColor();
  }
  getNeighborIndices(x, y) {
    // Collect neighbor color indices (8-neighborhood)
    let neighbors = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        let nx = x + dx;
        let ny = y + dy;
        if (nx < 0 || nx >= this.X || ny < 0 || ny >= this.Y) continue;
        let nIdx = nx + ny * this.X;
        neighbors.push(this.cells[nIdx].ColorIndex);
      }
    }
    return neighbors;
  }
  update() {
    // Rescue from extinction: seed the center if all are empty
    if (this.cells.every(c => c.ColorIndex === EMPTY_COLOR_INDEX)) {
      this.cells[floor(this.cells.length / 2)].ColorIndex = floor(random(1, colorPalette.length));
      return;
    }
    let idx = floor(random(this.cells.length));
    // Try to grow only into empty cells
    if (this.cells[idx].ColorIndex === EMPTY_COLOR_INDEX) {
      let x = idx % this.X;
      let y = floor(idx / this.X);
      let neighborIndices = this.getNeighborIndices(x, y);
      let candidates = neighborIndices.filter(cIdx => cIdx > EMPTY_COLOR_INDEX);
      if (candidates.length > 0) {
        // Inherit a random neighbor color
        this.cells[idx].ColorIndex = random(candidates);
      }
    }
  }
  serialize() {
    const data = this.cells.map(c => c.ColorIndex.toString(17)).join('');
    // console.log("呪文:", data);
    return data;
  }
  deserialize(dataString) {
    for (let i = 0; i < this.cells.length; i++) {
      if (dataString[i]) {
        this.cells[i].ColorIndex = parseInt(dataString[i], 17);
      }
    }
  }
}

function getDisplayColor(colorIndex) {
  if (!activePalette || !activePalette[colorIndex]) {
    return colorPalette[colorIndex];
  }
  return activePalette[colorIndex];
}
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const value = parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}
function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((val) => val.toString(16).padStart(2, '0')).join('')}`;
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h, s, l };
}
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp >= 0 && hp < 1) {
    r1 = c; g1 = x; b1 = 0;
  } else if (hp >= 1 && hp < 2) {
    r1 = x; g1 = c; b1 = 0;
  } else if (hp >= 2 && hp < 3) {
    r1 = 0; g1 = c; b1 = x;
  } else if (hp >= 3 && hp < 4) {
    r1 = 0; g1 = x; b1 = c;
  } else if (hp >= 4 && hp < 5) {
    r1 = x; g1 = 0; b1 = c;
  } else if (hp >= 5 && hp < 6) {
    r1 = c; g1 = 0; b1 = x;
  }
  const m = l - c / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function shiftHue(hex, hueShift, saturationScale = 1, lightnessScale = 1) {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  const h = (hsl.h + hueShift + 360) % 360;
  const s = clamp(hsl.s * saturationScale, 0, 1);
  const l = clamp(hsl.l * lightnessScale, 0, 1);
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}
function toMonochrome(hex) {
  const { r, g, b } = hexToRgb(hex);
  const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  return rgbToHex(gray, gray, gray);
}
function soften(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (val) => Math.round(val + (255 - val) * factor * 0.6);
  return rgbToHex(mix(r), mix(g), mix(b));
}

class Cell {
  constructor() {
    // Start with a random non-empty color
    this.ColorIndex = floor(random(1, colorPalette.length));
  }
  display() {
  }
  getColor() {
    return colorPalette[this.ColorIndex];
  }
  setColor(_c) {
    if (_c === undefined || _c === null) return;
    if (typeof _c === 'number') {
      this.ColorIndex = _c;
    }
  }
}