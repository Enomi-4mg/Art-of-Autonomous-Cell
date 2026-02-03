// Share and export functionality

async function handleShareAction(type) {
  const shareUrl = updateShareUrl();
  const includeXId = type === 'x';
  const shareText = buildShareText(includeXId);
  const shareTitle = EXPORT_TITLE;
  const shareFile = await createShareImageFile(shareUrl);
  const shareData = { title: shareTitle, text: shareText, url: shareUrl };

  if (shareFile) {
    shareData.files = [shareFile];
    if (navigator.canShare && !navigator.canShare({ files: shareData.files })) {
      delete shareData.files;
    }
  }

  const shouldTryNativeShare = type !== 'copy' || !!shareData.files;
  if (shouldTryNativeShare) {
    const shared = await tryNativeShare(shareData);
    if (shared) return;
  }

  if (type === 'copy') {
    await copyToClipboard(`${shareText}\n${shareUrl}`);
    return;
  }
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
  return new Promise((resolve) => {
    const exportCanvas = createGraphics(EXPORT_CANVAS_WIDTH, EXPORT_CANVAS_HEIGHT);
    exportCanvas.background(246, 247, 251);

    const frameSize = CANVAS_SIZE + EXPORT_FRAME_PADDING * 2;
    exportCanvas.stroke(31, 41, 55);
    exportCanvas.strokeWeight(2);
    exportCanvas.noFill();
    exportCanvas.rect(EXPORT_MARGIN - EXPORT_FRAME_PADDING, EXPORT_MARGIN - EXPORT_FRAME_PADDING, frameSize, frameSize);

    drawGridToGraphics(exportCanvas, EXPORT_MARGIN, EXPORT_MARGIN, CANVAS_SIZE);

    const finalizeExport = () => {
      exportCanvas.fill(31, 41, 55);
      exportCanvas.textFont("Inter, Helvetica Neue, Segoe UI, sans-serif");
      exportCanvas.textAlign(CENTER);
      exportCanvas.textSize(18);
      exportCanvas.textStyle(NORMAL);
      exportCanvas.text(EXPORT_TITLE, EXPORT_CANVAS_WIDTH / 2, EXPORT_CANVAS_HEIGHT - 80);
      exportCanvas.textSize(12);
      exportCanvas.text(SHARE_AUTHOR_LINE, EXPORT_CANVAS_WIDTH / 2, EXPORT_CANVAS_HEIGHT - 60);

      exportCanvas.canvas.toBlob((blob) => {
        resolve(blob || null);
      }, 'image/png');
    };

    if (qrcode && typeof qrcode.makeCode === 'function') {
      qrcode.makeCode(shareUrl);
    }

    setTimeout(() => {
      const qrImgElement = document.querySelector('#qrcode img');
      if (qrImgElement && qrImgElement.src) {
        loadImage(qrImgElement.src, (readyImg) => {
          exportCanvas.image(
            readyImg,
            EXPORT_CANVAS_WIDTH - EXPORT_QR_SIZE - EXPORT_FRAME_PADDING,
            EXPORT_CANVAS_HEIGHT - EXPORT_QR_SIZE - EXPORT_FRAME_PADDING,
            EXPORT_QR_SIZE,
            EXPORT_QR_SIZE
          );
          finalizeExport();
        }, () => {
          finalizeExport();
        });
      } else {
        finalizeExport();
      }
    }, 200);
  });
}

async function exportImage() {
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

  // QRコードの取得を待機
  const qrImg = await getQRCodeImage();
  if (qrImg) {
    exportCanvas.image(
      qrImg,
      EXPORT_CANVAS_WIDTH - EXPORT_QR_SIZE - EXPORT_FRAME_PADDING,
      EXPORT_CANVAS_HEIGHT - EXPORT_QR_SIZE - EXPORT_FRAME_PADDING,
      EXPORT_QR_SIZE,
      EXPORT_QR_SIZE
    );
  }

  // テキスト描画
  exportCanvas.fill(31, 41, 55);
  exportCanvas.textFont("Inter, Helvetica Neue, Segoe UI, sans-serif");
  exportCanvas.textAlign(CENTER);
  exportCanvas.textSize(18);
  exportCanvas.text(EXPORT_TITLE, EXPORT_CANVAS_WIDTH / 2, EXPORT_CANVAS_HEIGHT - 80);
  exportCanvas.textSize(12);
  exportCanvas.text("Created by @Enomi-4mg", EXPORT_CANVAS_WIDTH / 2, EXPORT_CANVAS_HEIGHT - 60);

  saveCanvas(exportCanvas, 'autonomous-pixels', 'png');
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
