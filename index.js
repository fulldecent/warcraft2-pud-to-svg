import { parsePUD } from './pud.js';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const svgContainer = document.getElementById('svgContainer');
const downloadButton = document.getElementById('downloadButton');

// Drag and drop handling for the entire page
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

document.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
});

dropZone.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) processFile(file);
});

// Process uploaded file
async function processFile(file) {
  try {
    // Update page title with file name
    document.title = file.name;

    const arrayBuffer = await file.arrayBuffer();
    const pudData = parsePUD(arrayBuffer);
    renderSVG(pudData);
    setupDownload(pudData);
  } catch (error) {
    alert('Error processing PUD file: ' + error.message);
  }
}

// Render SVG
function renderSVG(pudData) {
  const { dimensions, tiles, units } = pudData;
  const { x: dimX, y: dimY } = dimensions;

  let svgContent = `
    <svg viewBox="0 0 ${dimX} ${dimY}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <style>
        .t001x {fill: aqua} /* light water */
        .t002x {fill: aqua} /* dark water */
        .t003x {fill: steelblue} /* light coast */
        .t004x {fill: steelblue} /* dark coast */
        .t005x {fill: olivedrab} /* light ground */
        .t006x {fill: olivedrab} /* dark ground */
        .t007x {fill: darkgreen} /* forest */
        .t008x {fill: saddlebrown} /* mountains */
        .t009x {fill: gray} /* human wall */
        .t00Ax {fill: gray} /* orc walls */
        .t00Bx {fill: gray} /* human walls */
        .t00Cx {fill: gray} /* orc walls */
        .t01xx {fill: aqua} /* dark water and water */
        .t02xx {fill: lightcyan} /* water and coast */
        .t03xx {fill: lightcyan} /* dark coast and coast */
        .t04xx {fill: fuchsia} /* mount and coast */
        .t05xx {fill: plum} /* coast and grass */
        .t06xx {fill: olivedrab} /* dark grass and grass */
        .t07xx {fill: darkgreen} /* forest and grass */
        .t08xx {fill: gray} /* human wall */
        .t09xx {fill: gray} /* orc wall */
        .gold-mine {fill: gold}
        .oil-patch {fill: blue}
      </style>
  `;

  // Render tiles
  for (let x = 0; x < dimX; x++) {
    for (let y = 0; y < dimY; y++) {
      const tile = tiles[y * dimX + x];
      const tile1234 = tile.toString(16).padStart(4, "0");
      const tile1 = tile1234.substr(0, 1) + 'xxx';
      const tile12 = tile1234.substr(0, 2) + 'xx';
      const tile123 = tile1234.substr(0, 3) + 'x';
      const tile4 = 'xxx' + tile1234.substr(3, 1);
      const tile34 = 'xx' + tile1234.substr(2, 2);
      const tile234 = 'x' + tile1234.substr(1, 3);
      svgContent += `<rect x="${x}" y="${y}" height="1" width="1" class="t${tile1} t${tile12} t${tile123} t${tile1234} t${tile234} t${tile34} t${tile4}" rx="0.2" style="stroke:#ffffff;stroke-opacity:1;stroke-width:0.1"/>\n`;
    }
  }

  // Render units
  units.forEach(unit => {
    if (unit.type === 0x5c) { // Gold mine
      svgContent += `<rect x="${unit.x}" y="${unit.y}" height="3" width="3" class="gold-mine" rx="0.2" style="stroke:#ffffff;stroke-opacity:1;stroke-width:0.1"/>\n`;
    } else if (unit.type === 0x5d) { // Oil patch
      svgContent += `<rect x="${unit.x}" y="${unit.y}" height="3" width="3" class="oil-patch" rx="0.2" style="stroke:#ffffff;stroke-opacity:1;stroke-width:0.1"/>\n`;
    }
  });

  svgContent += '</svg>';
  svgContainer.innerHTML = svgContent;
}

// Setup download button
function setupDownload(pudData) {
  downloadButton.style.display = 'block';
  downloadButton.onclick = () => {
    const svgContent = svgContainer.innerHTML;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map.svg';
    a.click();
    URL.revokeObjectURL(url);
  };
}