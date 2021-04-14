// Warcraft II PUD to SVG //////////////////////////////////////////////////////
// William Entriken ////////////////////////////////////////////////////////////
// https://github.com/fulldecent/warcraft2-pud-to-svg //////////////////////////

const pud = require('fs').readFileSync(process.stdin.fd);

// PUD file specification
// https://github.com/Wargus/wargus/blob/4e2cb6ccbe3eeebfbac938ad1d5d8bb46cfa6195/doc/pud-specs.txt

// Load PUD into sections //////////////////////////////////////////////////////
const validPUDSections = ['TYPE', 'VER ', 'DESC', 'OWNR', 'ERA ', 'DIM ', 'UDTA', 'UGRD', 'SIDE', 'SGLD', 'SLBR', 'SOIL', 'AIPL', 'MTXM', 'SQM ', 'OILM', 'REGM', 'UNIT'];
let pudSections = {};
let remainingPud = pud;
while (remainingPud.length > 0) {
  const sectionName = remainingPud.slice(0, 4).toString();
  if (!validPUDSections.includes(sectionName)) {
    throw new Error("Invalid PUD section name: " + sectionName);
  }
  if (sectionName in pudSections) {
    throw new Error("The PUD has unexpected duplicate section: " + sectionName);
  }
  const sectionLength = remainingPud.readUInt32LE(4);
  const sectionData = remainingPud.slice(8, 8+sectionLength);
  pudSections[sectionName] = sectionData;
  remainingPud = remainingPud.slice(4+4+sectionLength);
}

// Get dimensions //////////////////////////////////////////////////////////////
const dimX = pudSections["DIM "].readUInt16LE(0);
const dimY = pudSections["DIM "].readUInt16LE(2);
if (dimX !== dimY) {
  throw new Error("Map must be square");
}
console.error("Dimensions: ", dimX, dimY);

// Header //////////////////////////////////////////////////////////////////////
console.log('<svg viewBox="0 0 '+dimX+' '+dimY+'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">');
console.log('<style>');

console.log('.t001x {fill: aqua}'); // light water
console.log('.t002x {fill: aqua}'); // dark water
console.log('.t003x {fill: steelblue}'); // light coast
console.log('.t004x {fill: steelblue}'); // dark coast
console.log('.t005x {fill: olivedrab}'); // light ground
console.log('.t006x {fill: olivedrab}'); // dark ground
console.log('.t007x {fill: darkgreen}'); // forest
console.log('.t008x {fill: saddlebrown}'); // mountains
console.log('.t009x {fill: gray}'); // human wall
console.log('.t00Ax {fill: gray}'); // orc walls
console.log('.t00Bx {fill: gray}'); // human walls
console.log('.t00Cx {fill: gray}'); // orc walls
console.log('.t01xx {fill: aqua}'); // dark water and water
console.log('.t02xx {fill: lightcyan}'); // water and coast
console.log('.t03xx {fill: lightcyan}'); // dark coast and coast
console.log('.t04xx {fill: fuchsia}'); // mount and coast
console.log('.t05xx {fill: plum}'); // coast and grass
console.log('.t06xx {fill: olivedrab}'); // dark grass and grass
console.log('.t07xx {fill: darkgreen}'); // forest and grass
console.log('.t08xx {fill: gray}'); // human wall
console.log('.t09xx {fill: gray}'); // orc wall
console.log('.gold-mine {fill: gold}'); // orc wall
console.log('.oil-patch {fill: blue}'); // orc wall
console.log('</style>');

// Map tiles ///////////////////////////////////////////////////////////////////
const mtxm = new Uint16Array( // todo: should check LE
  pudSections["MTXM"].buffer,
  pudSections["MTXM"].byteOffset,
  pudSections["MTXM"].length / Uint16Array.BYTES_PER_ELEMENT);
console.error("MTXM", mtxm);

for (let x = 0; x < dimX; x++) {
  for (let y = 0; y < dimY; y++) {
    const tile = mtxm[y*dimX + x];
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
  const aUNIT = pudSections["UNIT"].slice(bufferPointer, bufferPointer+8);
  const x = aUNIT.readUInt16LE(0);
  const y = aUNIT.readUInt16LE(2);
  const type = aUNIT.readUInt8(4);
  const owner = aUNIT.readUInt8(5);
  const resourceFactor = aUNIT.readUInt16LE(6);

  console.error("A UNIT", x, y, type, owner, resourceFactor);

  switch (type) {
    case 0x5c: // Gold mine
      console.log(`<rect x="${x}" y="${y}" height="3" width="3" class="gold-mine" rx="0.2" style="stroke:#ffffff;stroke-opacity:1;stroke-width:0.1"/>`);
      break;
    case 0x5d: // Oil patch
      console.log(`<rect x="${x}" y="${y}" height="3" width="3" class="oil-patch" rx="0.2" style="stroke:#ffffff;stroke-opacity:1;stroke-width:0.1"/>`);
      break;
  }
}


// Footer
console.log('</svg>');
