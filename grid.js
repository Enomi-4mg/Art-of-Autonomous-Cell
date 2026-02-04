// Grid and Cell classes for cellular automaton
class Cell {
    constructor(isEmpty = true) {
        // Initialize with provided state: empty or random color
        if (isEmpty) {
            this.ColorIndex = EMPTY_COLOR_INDEX;
        } else {
            this.ColorIndex = floor(random(1, colorPalette.length));
        }
        // Glow effect property
        this.glowValue = 0.0;
        // Empty list tracking for O(1) operations
        this.isInEmptyList = isEmpty;
        this.posInList = -1;
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

class Grid {
    constructor(columns, rows, cells) {
        this.X = columns;
        this.Y = rows;
        this.cells = cells;
        this.emptyIndices = [];
        this.initializeEmptyList();
    }

    initializeEmptyList() {
        // Populate emptyIndices array and set posInList for each empty cell
        this.emptyIndices = [];
        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i];
            if (cell.ColorIndex === EMPTY_COLOR_INDEX) {
                cell.posInList = this.emptyIndices.length;
                cell.isInEmptyList = true;
                this.emptyIndices.push(i);
            } else {
                cell.glowValue = 0.0;
                cell.isInEmptyList = false;
                cell.posInList = -1;
            }
        }
    }

    // O(1) fill: swap cell with last element in emptyIndices, then pop
    fillCell(cellIndex, colorIndex) {
        const cell = this.cells[cellIndex];
        if (cell.isInEmptyList) {
            // Get position in list
            const pos = cell.posInList;
            const lastIdx = this.emptyIndices.length - 1;

            // Swap with last element
            if (pos !== lastIdx) {
                const lastCellIndex = this.emptyIndices[lastIdx];
                this.emptyIndices[pos] = lastCellIndex;
                this.cells[lastCellIndex].posInList = pos;
            }

            // Remove from list
            this.emptyIndices.pop();
            cell.isInEmptyList = false;
            cell.posInList = -1;
        }

        // Set color and glow
        cell.ColorIndex = colorIndex;
        cell.glowValue = 1.0;
    }

    // O(1) clear: add cell to end of emptyIndices
    clearCell(cellIndex) {
        const cell = this.cells[cellIndex];
        if (!cell.isInEmptyList) {
            cell.posInList = this.emptyIndices.length;
            cell.isInEmptyList = true;
            this.emptyIndices.push(cellIndex);
            cell.ColorIndex = EMPTY_COLOR_INDEX;
            cell.glowValue = 0.0;
        }
    }

    drawCells() {
        // Draw each cell as a rectangle with glow effect
        const cellSize = width / this.X;
        for (let i = 0; i < this.X; i++) {
            for (let j = 0; j < this.Y; j++) {
                let index = i + j * this.X;
                const cell = this.cells[index];
                // Get base color
                let baseColor = getDisplayColor(cell.ColorIndex);
                stroke(200);
                strokeWeight(0.5);
                // Apply glow if active
                if (cell.glowValue > 0) {
                    const glowAmount = cell.glowValue;
                    baseColor = lerpColor(color(baseColor), color(255), glowAmount);
                }
                fill(baseColor);
                rect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }

    getIndexAt(screenX, screenY) {
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
        if (this.emptyIndices.length === this.cells.length) {
            const centerIdx = floor(this.cells.length / 2);
            const seedColor = floor(random(1, colorPalette.length));
            this.fillCell(centerIdx, seedColor);
            return;
        }

        // Pick a random empty cell directly from emptyIndices (O(1))
        if (this.emptyIndices.length === 0) return;

        const randomEmptyPos = floor(random(this.emptyIndices.length));
        const idx = this.emptyIndices[randomEmptyPos];

        let x = idx % this.X;
        let y = floor(idx / this.X);
        let neighborIndices = this.getNeighborIndices(x, y);
        let candidates = neighborIndices.filter(cIdx => cIdx > EMPTY_COLOR_INDEX);

        if (candidates.length > 0) {
            // Check mutation rate
            if (random() < MUTATION_RATE) {
                // Mutation: pick random color from palette (excluding empty index 0)
                const mutantColor = floor(random(1, colorPalette.length));
                this.fillCell(idx, mutantColor);
            } else {
                // Normal inheritance: pick random neighbor color
                const inheritedColor = random(candidates);
                this.fillCell(idx, inheritedColor);
            }
        }
    }

    // 8色(3bit)最適化シリアライズ
    serialize() {
        // ヘッダー: X, Y, パレット数(現在は8固定)
        let bytes = [this.X, this.Y];

        // 8色に制限するため、ColorIndexを 0-7 にクランプ
        // 1バイトに2セル(3bit+3bit = 6bit)詰め込む
        for (let i = 0; i < this.cells.length; i += 2) {
            let c1 = this.cells[i].ColorIndex & 0x07;
            let c2 = (this.cells[i + 1] ? this.cells[i + 1].ColorIndex : 0) & 0x07;

            // [空き2bit][セル2の3bit][セル1の3bit]
            bytes.push((c2 << 3) | c1);
        }

        let binary = "";
        bytes.forEach(b => binary += String.fromCharCode(b));
        console.log("Serialized length:", binary.length);
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    // 8色(3bit)デシリアライズ
    deserialize(dataString) {
        try {
            let base64 = dataString.replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4 !== 0) base64 += '=';
            const decoded = atob(base64);

            const newX = decoded.charCodeAt(0);
            const newY = decoded.charCodeAt(1);

            if (newX !== this.X || newY !== this.Y) {
                this.X = newX;
                this.Y = newY;
                GRID_COLUMNS = newX;
                GRID_ROWS = newY;
                this.cells = createInitialCells(this.X, this.Y);

                const buttons = document.querySelectorAll('.size-btn');
                buttons.forEach(btn => {
                    btn.classList.toggle('is-active', parseInt(btn.dataset.size) === this.X);
                });
            }

            let cellIdx = 0;
            for (let i = 2; i < decoded.length; i++) {
                let byte = decoded.charCodeAt(i);

                // セル1 (下位3bit)
                if (cellIdx < this.cells.length) {
                    this.cells[cellIdx].ColorIndex = byte & 0x07;
                    cellIdx++;
                }
                // セル2 (次の3bit)
                if (cellIdx < this.cells.length) {
                    this.cells[cellIdx].ColorIndex = (byte >> 3) & 0x07;
                    cellIdx++;
                }
            }

            // デシリアライズ後に空セルリストを再構築して整合性を保つ
            this.initializeEmptyList();
            console.log("Deserialize length:", decoded.length);
        } catch (e) {
            console.error("3bit復元失敗:", e);
        }
    }
}
