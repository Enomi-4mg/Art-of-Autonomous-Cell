// Platform detection utilities
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid() {
    return /Android/.test(navigator.userAgent);
}

function hasFileShareSupport() {
    // Web Share API files support check
    if (!navigator.canShare) return false;
    if (isIOS()) return false; // iOS Safari doesn't support files
    if (/Firefox/.test(navigator.userAgent)) return false; // Firefox doesn't have Web Share API
    return true;
}

// Share and export functionality
async function handleShareAction(type) {
    const shareUrl = updateShareUrl();
    const includeXId = type === 'x';
    const shareText = buildShareText(includeXId);
    const shareTitle = EXPORT_TITLE;

    // COPY URL: faster path without image file (especially important for iOS)
    if (type === 'copy') {
        await copyToClipboard(`${shareText}\n${shareUrl}`);
        return;
    }

    // For share buttons (X, LINE, or native Share), try with image file if supported
    let shareFile = null;
    if (hasFileShareSupport()) {
        shareFile = await createShareImageFile(shareUrl);
    }

    const shareData = { title: shareTitle, text: shareText, url: shareUrl };
    if (shareFile) {
        shareData.files = [shareFile];
        if (navigator.canShare && !navigator.canShare({ files: shareData.files })) {
            delete shareData.files;
        }
    }

    // Try native share on iOS if Web Share API is available
    if (isIOS() && navigator.share) {
        const shared = await tryNativeShare(shareData);
        if (shared) return;
    }

    // For Android, try native share with file support
    if (isAndroid() && navigator.share) {
        const shared = await tryNativeShare(shareData);
        if (shared) return;
    }

    // Fallback to web intents for desktop or unsupported platforms
    if (type === 'x') {
        const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        openShareWindow(intentUrl);
        return;
    }
    if (type === 'line') {
        const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        openShareWindow(lineUrl);
    }
}

function updateShareUrl() {
    window.location.hash = grid.serialize();
    return window.location.href;
}

function buildShareText(includeXId) {
    const lines = [SHARE_SHORT_TEXT, EXPORT_TITLE, SHARE_AUTHOR_LINE];
    if (includeXId) {
        lines.push(`X: ${SHARE_X_ID}`);
    }
    return lines.join('\n');
}

async function tryNativeShare(shareData) {
    if (!navigator.share) return false;
    try {
        await navigator.share(shareData);
        return true;
    } catch (err) {
        if (err && err.name === 'AbortError') {
            return true;
        }
        return false;
    }
}

function openShareWindow(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
}

async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch (_err) {
            // Fallback below
        }
    }
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.position = 'absolute';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
}

/**
 * Download image using HTML5 Download API
 * Fallback for iOS and browsers without Web Share API file support
 */
function downloadImage(blob, filename = 'autonomous-pixels.png') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Display image in fullscreen modal for iOS long-press save
 * This allows iOS users to tap and hold the image to save to Photos
 */
function displayImageForSaving(blob, filename = 'autonomous-pixels.png') {
    // Create data URL from blob
    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        
        // Create modal container
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
        `;
        
        // Create image
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.cssText = `
            max-width: 100%;
            max-height: 80%;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;
        
        // Create instruction text
        const instruction = document.createElement('p');
        instruction.textContent = 'Tap and hold to save to Photos';
        instruction.style.cssText = `
            color: #ffffff;
            margin-top: 20px;
            text-align: center;
            font-size: 14px;
        `;
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            margin-top: 15px;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            border: 1px solid #ffffff;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        closeBtn.onclick = () => document.body.removeChild(modal);
        
        modal.appendChild(img);
        modal.appendChild(instruction);
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);
    };
    reader.readAsDataURL(blob);
}

/**
 * 統合画像生成関数：描画ロジックを一元化
 * @param {Object} options - 設定オプション
 * @param {string} options.outputFormat - 出力形式: 'download' | 'blob'
 * @param {string} [options.shareUrl] - シェアURL（QR生成用、'blob'時に使用）
 * @returns {Promise<Blob|void>}
 */
async function generateExportImage(options = {}) {
    const { outputFormat = 'download', shareUrl = null } = options;

    // キャンバス作成と基本描画
    const exportCanvas = createGraphics(EXPORT_CANVAS_WIDTH, EXPORT_CANVAS_HEIGHT);
    exportCanvas.background(246, 247, 251);

    // フレーム描画
    const frameSize = CANVAS_SIZE + EXPORT_FRAME_PADDING * 2;
    exportCanvas.stroke(31, 41, 55);
    exportCanvas.strokeWeight(2);
    exportCanvas.noFill();
    exportCanvas.rect(EXPORT_MARGIN - EXPORT_FRAME_PADDING, EXPORT_MARGIN - EXPORT_FRAME_PADDING, frameSize, frameSize);

    // グリッド描画
    drawGridToGraphics(exportCanvas, EXPORT_MARGIN, EXPORT_MARGIN, CANVAS_SIZE);

    // QR画像取得
    let qrImage = null;
    if (outputFormat === 'download') {
        // downloadモード：await getQRCodeImage()で非同期対応
        qrImage = await getQRCodeImage();
    } else if (outputFormat === 'blob' && shareUrl) {
        // blobモード：setTimeout でDOM要素ポーリング
        qrImage = await new Promise((resolve) => {
            if (qrcode && typeof qrcode.makeCode === 'function') {
                qrcode.makeCode(shareUrl);
            }
            setTimeout(() => {
                const qrImgElement = document.querySelector('#qrcode img');
                if (qrImgElement && qrImgElement.src) {
                    loadImage(qrImgElement.src, (img) => resolve(img), () => resolve(null));
                } else {
                    resolve(null);
                }
            }, 200);
        });
    }

    // QR画像描画
    if (qrImage) {
        exportCanvas.image(
            qrImage,
            EXPORT_CANVAS_WIDTH - EXPORT_QR_SIZE - EXPORT_FRAME_PADDING,
            EXPORT_CANVAS_HEIGHT - EXPORT_QR_SIZE - EXPORT_FRAME_PADDING,
            EXPORT_QR_SIZE,
            EXPORT_QR_SIZE
        );
    }

    // テキスト描画（共通）
    exportCanvas.textFont("Inter, Helvetica Neue, Segoe UI, sans-serif");
    exportCanvas.fill(31, 41, 55);
    exportCanvas.textAlign(CENTER);
    exportCanvas.textSize(18);
    exportCanvas.textStyle(NORMAL);
    exportCanvas.text(EXPORT_TITLE, EXPORT_CANVAS_WIDTH / 2, EXPORT_CANVAS_HEIGHT - 80);
    exportCanvas.textSize(12);
    exportCanvas.text(SHARE_AUTHOR_LINE, EXPORT_CANVAS_WIDTH / 2, EXPORT_CANVAS_HEIGHT - 60);

    // バージョン表記を左下に統一描画
    exportCanvas.textSize(15);
    exportCanvas.fill(31, 41, 55, 150);
    exportCanvas.textAlign(LEFT);
    exportCanvas.text(APP_VERSION, 15, EXPORT_CANVAS_HEIGHT - 15);

    // 出力形式に応じて処理
    if (outputFormat === 'download') {
        saveCanvas(exportCanvas, 'autonomous-pixels', 'png');
        return;
    } else if (outputFormat === 'blob') {
        return new Promise((resolve) => {
            exportCanvas.canvas.toBlob((blob) => resolve(blob || null), 'image/png');
        });
    }
}

async function createShareImageFile(shareUrl) {
    try {
        const blob = await createShareImageBlob(shareUrl);
        if (!blob) return null;
        return new File([blob], 'autonomous-pixels.png', { type: 'image/png' });
    } catch (_err) {
        return null;
    }
}

function createShareImageBlob(shareUrl) {
    // 統合関数を呼び出し
    return generateExportImage({ outputFormat: 'blob', shareUrl });
}

async function exportImage() {
    await generateExportImage({ outputFormat: 'download' });
}

function drawGridToGraphics(gfx, offsetX, offsetY, size) {
    // Draw the current grid onto a p5.Graphics instance
    const cellSize = size / grid.X;
    for (let i = 0; i < grid.X; i++) {
        for (let j = 0; j < grid.Y; j++) {
            const cIdx = grid.cells[i + j * grid.X].ColorIndex;
            gfx.fill(colorPalette[cIdx]);
            gfx.stroke(230);
            gfx.strokeWeight(0.5);
            gfx.rect(offsetX + i * cellSize, offsetY + j * cellSize, cellSize + 0.5, cellSize + 0.5);
        }
    }
}

// QRコードの読み込みを待機するヘルパー
function getQRCodeImage() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            const qrImgElement = document.querySelector('#qrcode img');
            if (qrImgElement && qrImgElement.src && qrImgElement.src.startsWith('data:image')) {
                clearInterval(checkInterval);
                loadImage(qrImgElement.src, (readyImg) => resolve(readyImg));
            }
        }, 50); // 50msごとにチェック

        // 2秒経ってもダメならタイムアウト
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve(null);
        }, 2000);
    });
}
