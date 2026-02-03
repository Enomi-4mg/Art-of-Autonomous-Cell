// Canvas and grid configuration
const CANVAS_SIZE = 400;
let GRID_COLUMNS = 12;
let GRID_ROWS = 12;

// Simulation update timing
const UPDATE_STEP_MS = 200;
const UPDATE_START_OFFSET_MS = 800;
// Dynamic interval scaling: base milliseconds × max cells / current empty cells
const UPDATE_INTERVAL_CONSTANT = 200 * 144; // Base × typical grid size

// Semantic indices
const EMPTY_COLOR_INDEX = 0;
const MUTATION_RATE = 0.05;

let grid;
// Color palette: index 0 is treated as "empty"
const colorPalette = [
  "#000000", "#ff0000", "#ff5100", "#1100ff",
  "#00F2FF", "#00ae11", "#9900ff", "#fbff00",
];
let updateTimestamp = UPDATE_START_OFFSET_MS;
let qrcode;

// Export layout
const EXPORT_CANVAS_WIDTH = 500;
const EXPORT_CANVAS_HEIGHT = 600;
const EXPORT_MARGIN = 50;
const EXPORT_FRAME_PADDING = 5;
const EXPORT_QR_SIZE = 105;
const EXPORT_QR_ONLY_SIZE = 800;
const EXPORT_QR_ONLY_FRAME_PADDING = 20;
const EXPORT_TITLE = "ART OF AUTONOMOUS PIXELS";
const SHARE_SHORT_TEXT = "Autonomous pixels bloom into living patterns.";
const SHARE_AUTHOR_LINE = "Created by Enomi-4mg";
const SHARE_X_ID = "@4mgEnomi";

function setup() {
  const container = document.getElementById('canvas-container');
  const initialSize = container.offsetWidth > 0 ? container.offsetWidth : CANVAS_SIZE;
  const cnv = createCanvas(initialSize, initialSize);
  cnv.parent('canvas-container');
  const cells = createInitialCells(GRID_COLUMNS, GRID_ROWS);
  grid = new Grid(GRID_COLUMNS, GRID_ROWS, cells);
  paletteSets = buildPaletteSets();
  activePalette = colorPalette;  // Initialize activePalette with default palette
  setupPaletteButtons();
  setupResetButton();
  restoreFromHash();
  setupSaveButton();
  setupQRButton();
  setupShareButtons();
  setupSizeButtons();
}
function draw() {
  background(0);
  
  // Decay glow values for all cells
  for (let cell of grid.cells) {
    if (cell.glowValue > 0) {
      cell.glowValue -= 0.05;
      if (cell.glowValue < 0) {
        cell.glowValue = 0;
      }
    }
  }
  
  // Render current state
  grid.drawCells();
  
  // Calculate dynamic interval based on empty cell count
  // Inverse relationship: fewer empty cells = longer interval (slower growth)
  const emptyCount = grid.emptyIndices.length;
  const minEmptyThreshold = 1;
  const dynamicInterval = emptyCount > minEmptyThreshold 
    ? UPDATE_INTERVAL_CONSTANT / emptyCount 
    : UPDATE_INTERVAL_CONSTANT / minEmptyThreshold;
  
  // Run fixed-step updates to keep time consistent
  while (millis() - updateTimestamp > dynamicInterval) {
    updateTimestamp += dynamicInterval;
    grid.update();
  }
}
function mousePressed() {
  // Clear the clicked cell (set to empty)
  // console.log("Mouse pressed at " + mouseX + ", " + mouseY);
  if (touches.length === 0) {
    handleInput(mouseX, mouseY);
  }
}
function touchStarted() {
  const touchX = touches[0].x;
  const touchY = touches[0].y;
  if (touchX >= 0 && touchX <= width && touchY >= 0 && touchY <= height) {
    // console.log("Touch started inside canvas at " + touchX + ", " + touchY);
    handleInput(touchX, touchY);
    return false;
  }
}
function handleInput(x, y) {
  const index = grid.getIndexAt(x, y);
  // console.log(`Clicked at (${x}, ${y}), cell index: ${index}`);
  if (index !== null) {
    grid.clearCell(index);
    // console.log(`Cleared cell at index ${index}`);
  }
}
function restoreFromHash() {
  // Restore grid from URL hash when possible
  const hash = window.location.hash.substring(1);
  if (hash.length > 0) {
    grid.deserialize(hash);
  }
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
  // Initialize grid mostly empty with seed cells in center
  const cells = [];
  const cellCount = columns * rows;
  for (let i = 0; i < cellCount; i++) {
    cells.push(new Cell(true)); // All cells start empty
  }
  
  // Add seed cells in the center region
  const centerX = Math.floor(columns / 2);
  const centerY = Math.floor(rows / 2);
  const seedRadius = Math.max(1, Math.floor(Math.min(columns, rows) / 6));
  
  for (let dx = -seedRadius; dx <= seedRadius; dx++) {
    for (let dy = -seedRadius; dy <= seedRadius; dy++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < columns && y >= 0 && y < rows) {
        const idx = x + y * columns;
        cells[idx] = new Cell(false); // Non-empty seed cells
      }
    }
  }
  
  return cells;
}

function loadPreset(jsonData) {
  // Only load preset if hash is empty
  if (window.location.hash.length > 1) {
    return;
  }
  
  try {
    // Accept both string and array formats
    let colorIndices = [];
    
    if (typeof jsonData === 'string') {
      // Try to deserialize string format (serialized grid)
      grid.deserialize(jsonData);
      return;
    } else if (Array.isArray(jsonData)) {
      // Handle array format: [colorIndex, colorIndex, ...]
      colorIndices = jsonData;
    } else if (typeof jsonData === 'object' && jsonData.indices) {
      // Handle object with 'indices' property: { indices: [...] }
      colorIndices = jsonData.indices;
    }
    
    // Apply color indices to grid
    if (colorIndices.length > 0) {
      const cellCount = Math.min(colorIndices.length, grid.cells.length);
      for (let i = 0; i < cellCount; i++) {
        const colorIdx = colorIndices[i];
        if (colorIdx >= 0 && colorIdx < colorPalette.length) {
          if (colorIdx === EMPTY_COLOR_INDEX) {
            grid.cells[i].ColorIndex = EMPTY_COLOR_INDEX;
            grid.cells[i].glowValue = 0.0;
          } else {
            grid.cells[i].ColorIndex = colorIdx;
            grid.cells[i].glowValue = 0.0;
          }
        }
      }
      // Reinitialize empty list to reflect new state
      grid.initializeEmptyList();
    }
  } catch (e) {
    console.error("Preset loading failed:", e);
  }
}