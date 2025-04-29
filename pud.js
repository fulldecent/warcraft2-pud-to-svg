export function parsePUD(arrayBuffer) {
    // Validate input
    if (!(arrayBuffer instanceof ArrayBuffer)) {
        throw new Error("Input must be an ArrayBuffer");
    }

    const dataView = new DataView(arrayBuffer);
    let offset = 0;

    // PUD file sections
    const validPUDSections = ['TYPE', 'VER ', 'DESC', 'OWNR', 'ERA ', 'DIM ', 'UDTA', 'UGRD', 'SIDE', 'SGLD', 'SLBR', 'SOIL', 'AIPL', 'MTXM', 'SQM ', 'OILM', 'REGM', 'UNIT', 'SIGN', 'ERAX'];
    let pudSections = {};

    // Parse sections
    while (offset < arrayBuffer.byteLength) {
        // Read section name (4 bytes as string)
        const sectionName = String.fromCharCode(
            dataView.getUint8(offset),
            dataView.getUint8(offset + 1),
            dataView.getUint8(offset + 2),
            dataView.getUint8(offset + 3)
        );
        if (!validPUDSections.includes(sectionName)) {
            throw new Error("Invalid PUD section name: " + sectionName);
        }
        if (sectionName in pudSections) {
            throw new Error("The PUD has unexpected duplicate section: " + sectionName);
        }

        // Read section length (4 bytes, little-endian)
        const sectionLength = dataView.getUint32(offset + 4, true);

        // Extract section data as ArrayBuffer
        const sectionData = arrayBuffer.slice(offset + 8, offset + 8 + sectionLength);
        pudSections[sectionName] = sectionData;

        // Move offset to next section
        offset += 4 + 4 + sectionLength;
    }

    // Get dimensions
    const dimView = new DataView(pudSections["DIM "]);
    const dimX = dimView.getUint16(0, true);
    const dimY = dimView.getUint16(2, true);
    if (dimX !== dimY) throw new Error("Map must be square");

    // Parse map tiles (MTXM)
    const mtxm = new Uint16Array(
        pudSections["MTXM"],
        0,
        pudSections["MTXM"].byteLength / Uint16Array.BYTES_PER_ELEMENT
    );

    // Parse units
    const units = [];
    const unitView = new DataView(pudSections["UNIT"]);
    for (let bufferPointer = 0; bufferPointer < pudSections["UNIT"].byteLength; bufferPointer += 8) {
        units.push({
            x: unitView.getUint16(bufferPointer, true),
            y: unitView.getUint16(bufferPointer + 2, true),
            type: unitView.getUint8(bufferPointer + 4),
            owner: unitView.getUint8(bufferPointer + 5),
            resourceFactor: unitView.getUint16(bufferPointer + 6, true)
        });
    }

    // Return structured data
    return {
        dimensions: { x: dimX, y: dimY },
        tiles: Array.from(mtxm),
        units: units
    };
}