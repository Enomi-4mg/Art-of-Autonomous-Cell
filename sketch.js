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
const colorPalette = [`#000000`, `#FF0040`, `#00AAFF`, `#FFEF00`, `#00FF66`, `#9D00FF`, `#FF00FF`, `#FF8800`, `#FFFFFF`,
  `#888888`, `#00FFFF`, `#8B4513`, `#006400`, `#000080`, `#FFD700`, `#FF7F50`, `#40E0D0`];
let updateTimestamp = UPDATE_START_OFFSET_MS;
let qrcode;

// Export layout
const EXPORT_CANVAS_WIDTH = 500;
const EXPORT_CANVAS_HEIGHT = 600;
const EXPORT_MARGIN = 50;
const EXPORT_FRAME_PADDING = 5;
const EXPORT_QR_SIZE = 80;
const EXPORT_TITLE = "ART OF AUTONOMOUS PIXELS";

function setup() {
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const cells = createInitialCells(GRID_COLUMNS, GRID_ROWS);
  grid = new Grid(GRID_COLUMNS, GRID_ROWS, cells);
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
  const saveBtn = createButton('記憶を保存する');
  saveBtn.position(10, height + 10);
  qrcode = new QRCode(document.getElementById("qrcode"), {
    text: window.location.href,
    width: EXPORT_QR_SIZE,
    height: EXPORT_QR_SIZE,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  saveBtn.mousePressed(() => {
    window.location.hash = grid.serialize();
    // Generate the QR code
    qrcode.makeCode(window.location.href);
    // Wait briefly to ensure the library finishes rendering
    setTimeout(() => {
      exportImage();
    }, 200);
  });
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
  exportCanvas.background(20); // Dark background

  // Draw the frame border
  const frameSize = CANVAS_SIZE + EXPORT_FRAME_PADDING * 2;
  exportCanvas.stroke(255);
  exportCanvas.noFill();
  exportCanvas.rect(EXPORT_MARGIN - EXPORT_FRAME_PADDING, EXPORT_MARGIN - EXPORT_FRAME_PADDING, frameSize, frameSize);

  // Draw the grid onto the export canvas
  drawGridToGraphics(exportCanvas, EXPORT_MARGIN, EXPORT_MARGIN, CANVAS_SIZE);

  const qrImgElement = document.querySelector('#qrcode img');
  
  if (qrImgElement && qrImgElement.src !== "") {
    // Load the QR image and draw it
    loadImage(qrImgElement.src, (readyImg) => {
      exportCanvas.image(readyImg, EXPORT_CANVAS_WIDTH - EXPORT_QR_SIZE - EXPORT_FRAME_PADDING, EXPORT_CANVAS_HEIGHT - EXPORT_QR_SIZE - EXPORT_FRAME_PADDING, EXPORT_QR_SIZE, EXPORT_QR_SIZE);
      
      // Save after rendering is finished
      exportCanvas.fill(255);
      exportCanvas.textAlign(CENTER);
      exportCanvas.textSize(20);
      exportCanvas.text(EXPORT_TITLE, EXPORT_CANVAS_WIDTH / 2, EXPORT_CANVAS_HEIGHT - 80);
      save(exportCanvas, 'my_artwork.png');
    });
  } else {
    // Fallback when the QR image is not ready yet
    console.log("QR画像が生成中...もう一度試してください");
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
        fill(this.cells[index].getColor());
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