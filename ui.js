// UI setup functions for buttons and interactions
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

function setupSizeButtons() {
    const buttons = document.querySelectorAll('.size-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // アクティブ状態の切り替え
            buttons.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');

            const newSize = parseInt(btn.dataset.size);

            // グリッドのリセット
            GRID_COLUMNS = newSize;
            GRID_ROWS = newSize;
            const cells = createInitialCells(GRID_COLUMNS, GRID_ROWS);
            grid = new Grid(GRID_COLUMNS, GRID_ROWS, cells);

            // 状態のクリア
            window.location.hash = '';
            console.log(`Grid resized to ${newSize}x${newSize}`);
        });
    });
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
        correctLevel: QRCode.CorrectLevel.Q
    });
    saveBtn.addEventListener('click', async () => {
        if (GRID_COLUMNS > 16) {
            alert("Warning: High density grid may be hard to scan via QR.");
        }
        const serializedData = grid.serialize();
        window.location.hash = serializedData;
        const baseUrl = window.location.href.split('#')[0];
        const fullUrl = baseUrl + '#' + serializedData;
        // Generate the QR code
        qrcode.makeCode(fullUrl);
        // Wait briefly to ensure the library finishes rendering
        setTimeout(async () => {
            // For iOS Safari, use display modal instead of download
            if (isIOS()) {
                const blob = await createShareImageBlob(fullUrl);
                if (blob) {
                    displayImageForSaving(blob);
                } else {
                    alert("Failed to generate image. Please try again.");
                }
            } else {
                // For desktop and Android, use normal export
                await exportImage();
            }
        }, 300);
    });
}


function setupQRButton() {
    const qrBtn = document.getElementById('save-qr-button');
    if (!qrBtn) return;
    qrBtn.disabled = false;
    qrBtn.addEventListener('click', () => {
        if (GRID_COLUMNS > 16) {
            alert("Warning: High density grid may be hard to scan via QR.");
        }
        const serializedData = grid.serialize();
        window.location.hash = serializedData;
        const baseUrl = window.location.href.split('#')[0];
        const fullUrl = baseUrl + '#' + serializedData;
        // Generate the QR code
        qrcode.makeCode(fullUrl);
        // Wait briefly to ensure the library finishes rendering
        setTimeout(() => {
            const qrImgElement = document.querySelector('#qrcode img');
            if (qrImgElement && qrImgElement.src) {
                loadImage(qrImgElement.src, (readyImg) => {
                    const qrCanvas = createGraphics(EXPORT_QR_ONLY_SIZE, EXPORT_QR_ONLY_SIZE);
                    qrCanvas.background(246, 247, 251);

                    // Add frame around QR code
                    const qrSize = EXPORT_QR_ONLY_SIZE - 2 * EXPORT_QR_ONLY_FRAME_PADDING - 150;
                    const qrX = (EXPORT_QR_ONLY_SIZE - qrSize) / 2;
                    const qrY = 100;

                    // Draw QR code
                    qrCanvas.image(readyImg, qrX, qrY, qrSize, qrSize);

                    // Add title at top
                    qrCanvas.fill(31, 41, 55);
                    qrCanvas.textFont("Inter, Helvetica Neue, Segoe UI, sans-serif");
                    qrCanvas.textAlign(CENTER);
                    qrCanvas.textSize(32);
                    qrCanvas.textStyle(BOLD);
                    qrCanvas.text(EXPORT_TITLE, EXPORT_QR_ONLY_SIZE / 2, 60);

                    // Add description below QR
                    qrCanvas.textSize(20);
                    qrCanvas.textStyle(NORMAL);
                    qrCanvas.text(SHARE_SHORT_TEXT, EXPORT_QR_ONLY_SIZE / 2, qrY + qrSize + 40);

                    // Add author info
                    qrCanvas.textSize(18);
                    qrCanvas.text(SHARE_AUTHOR_LINE, EXPORT_QR_ONLY_SIZE / 2, qrY + qrSize + 70);

                    // Add URL at bottom
                    qrCanvas.textSize(16);
                    qrCanvas.fill(100, 116, 139);
                    qrCanvas.text("Scan to view this pattern", EXPORT_QR_ONLY_SIZE / 2, qrY + qrSize + 100);

                    // Add version at bottom-left
                    qrCanvas.textSize(15);
                    qrCanvas.fill(31, 41, 55, 150);
                    qrCanvas.textAlign(LEFT);
                    qrCanvas.text(APP_VERSION, 15, EXPORT_QR_ONLY_SIZE - 15);

                    // For iOS Safari, use display modal instead of download
                    if (isIOS()) {
                        qrCanvas.canvas.toBlob((blob) => {
                            if (blob) {
                                displayImageForSaving(blob, 'autonomous-pixels-qr.png');
                            } else {
                                alert("Failed to generate QR image. Please try again.");
                            }
                        }, 'image/png');
                    } else {
                        // For desktop and Android, use normal export
                        saveCanvas(qrCanvas, 'autonomous-pixels-qr', 'png');
                    }
                });
            }
        }, 300);
    });
}

function setupShareButtons() {
    const shareButtons = document.querySelectorAll('.share-button');
    if (!shareButtons || shareButtons.length === 0) return;
    shareButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            const type = button.dataset.share;
            if (!type) return;
            await handleShareAction(type);
        });
    });
}
