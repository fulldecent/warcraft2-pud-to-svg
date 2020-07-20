const fs = require('fs'),
      path = require('path'),
      filePath = path.join(__dirname, 'in.pud');

const pud = fs.readFileSync(filePath);

// https://github.com/Wargus/wargus/blob/4e2cb6ccbe3eeebfbac938ad1d5d8bb46cfa6195/doc/pud-specs.txt

// Load PUD into sections //////////////////////////////////////////////////////
// ASSUMES THAT EACH SECTION IS ONLY USED ONCE (NOT IN SPEC THOUGH)
let pudSections = {};
let pudParsingPointer = 0;
let iterationStopper = 0;
while (pudParsingPointer < pud.length) {
  const sectionName = pud.slice(pudParsingPointer, pudParsingPointer+4);
  const sectionLength = new DataView(pud.buffer).getUint32(pudParsingPointer+4, true);
  const sectionData = pud.slice(pudParsingPointer + 8, pudParsingPointer + 8 + sectionLength);
  pudSections[sectionName] = sectionData;
  console.error("Section " + sectionName + " @" + pudParsingPointer + ", " + sectionLength + " bytes");
  pudParsingPointer = pudParsingPointer + 8 + sectionLength;
  iterationStopper++;
  if (iterationStopper > 20) {
    break;
  }
}

// Inspect /////////////////////////////////////////////////////////////////////
const dims = new Uint16Array(
  pudSections["DIM "].buffer,
  pudSections["DIM "].byteOffset,
  pudSections["DIM "].length / Uint16Array.BYTES_PER_ELEMENT);
console.error("\nDimensions: ");
console.error(dims);

// Header
console.log('<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">');
console.log('<style>');

console.log('.t001x {fill: #303030}'); // light water
console.log('.t002x {fill: #303030}'); // dark water
console.log('.t003x {fill: #303030}'); // light coast
console.log('.t004x {fill: #303030}'); // dark coast
console.log('.t005x {fill: #50A725}'); // light ground
console.log('.t006x {fill: #50A725}'); // dark ground
console.log('.t007x {fill: #1F6600}'); // forest
console.log('.t008x {fill: #303030}'); // mountains
console.log('.t009x {fill: #303030}'); // human wall
console.log('.t00Ax {fill: #303030}'); // orc walls
console.log('.t00Bx {fill: #303030}'); // human walls
console.log('.t00Cx {fill: #303030}'); // orc walls
console.log('.t01xx {fill: #303030}'); // dark water and water
console.log('.t02xx {fill: #303030}'); // water and coast
console.log('.t03xx {fill: #303030}'); // dark coast and coast
console.log('.t04xx {fill: #303030}'); // mount and coast
console.log('.t05xx {fill: #303030}'); // coast and grass
console.log('.t06xx {fill: #50A725}'); // dark grass and grass
console.log('.t07xx {fill: #1F6600}'); // forest and grass
console.log('.t08xx {fill: #303030}'); // human wall
console.log('.t09xx {fill: #303030}'); // orc wall
console.log('.gold-mine {fill: gold}'); // orc wall
console.log('</style>');

// Map tiles ///////////////////////////////////////////////////////////////////
const mtxm = new Uint16Array(
  pudSections["MTXM"].buffer,
  pudSections["MTXM"].byteOffset,
  pudSections["MTXM"].length / Uint16Array.BYTES_PER_ELEMENT);
console.error("\nMTXM: ");
console.error(mtxm);
for (let x = 0; x < 128; x++) {
  for (let y = 0; y < 128; y++) {
    const tile = mtxm[y*128 + x];
    const tile1234 = tile.toString(16).padStart(4, "0");
    const tile1 = tile1234.substr(0, 1) + 'xxx';
    const tile12 = tile1234.substr(0, 2) + 'xx';
    const tile123 = tile1234.substr(0, 3) + 'x';
    const tile4 = 'xxx' + tile1234.substr(3, 1);
    const tile34 = 'xx' + tile1234.substr(2, 2);
    const tile234 = 'x' + tile1234.substr(1, 3);
    console.log(`<rect x="${x}" y="${y}" height="1" width="1" class="t${tile1} t${tile12} t${tile123} t${tile1234} t${tile234} t${tile34} t${tile4}" rx="0.2" style="stroke:#ffffff;stroke-opacity:1;stroke-width:0.1"/>`);
  }
}

// Units ///////////////////////////////////////////////////////////////////////
for (let bufferPointer = 0; bufferPointer < pudSections["UNIT"].length; bufferPointer += 8) {
  const x = new Uint16Array(
    pudSections["UNIT"].buffer,
    pudSections["UNIT"].byteOffset + bufferPointer + 0,
    2
  )[0];
  const y = new Uint16Array(
    pudSections["UNIT"].buffer,
    pudSections["UNIT"].byteOffset + bufferPointer + 2,
    2
  )[0];
  const type = new Uint8Array(
    pudSections["UNIT"].buffer,
    pudSections["UNIT"].byteOffset + bufferPointer + 4,
    2
  )[0];
  const owner = new Uint8Array(
    pudSections["UNIT"].buffer,
    pudSections["UNIT"].byteOffset + bufferPointer + 5,
    2
  )[0];
  const resourceFactor = new Uint16Array(
    pudSections["UNIT"].buffer,
    pudSections["UNIT"].byteOffset + bufferPointer + 6,
    2
  )[0];

  console.error('FOUND Unit');
  console.error({x, y, type, owner, resourceFactor});

  if (type == 0x5c) { // gold mine
    console.log(`<rect x="${x}" y="${y}" height="3" width="3" class="gold-mine" rx="0.2" style="stroke:#ffffff;stroke-opacity:1;stroke-width:0.1"/>`);
//    console.log(`<text x="${x}.5" y="${y}.5" dominant-baseline="middle" text-anchor="middle">TEXT</text>`);
  }
}


// Footer
console.log('</svg>');
