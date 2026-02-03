// Palette management and color display
// Note: colorPalette is defined in sketch.js and loaded first

let activePalette;
let paletteSets = [];
let activePaletteId = 'classic';

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

function getDisplayColor(colorIndex) {
  if (!activePalette || !activePalette[colorIndex]) {
    return colorPalette[colorIndex];
  }
  return activePalette[colorIndex];
}
