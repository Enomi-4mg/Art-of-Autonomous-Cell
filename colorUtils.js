// Color conversion utilities (HSL ↔ RGB ↔ HEX)

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

// Palette transformation functions

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
