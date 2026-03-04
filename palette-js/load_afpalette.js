// ================================================
// .afpalette Import Parser
// Reads Affinity palette binary format and produces
// the same internal palette structure used by all other importers.
// ================================================

const c_AF_Magic = 0x414BFF00;
const c_AF_P1CN = 0x506C434E;  // File name chunk
const c_AF_PaNV = 0x50614E56;  // Name list chunk
const c_AF_PaLV = 0x50616C56;  // Palette list chunk
const c_AF_Cols = 0x436F6C73;  // Colour list chunk
const c_AF_colD = 0x636F6C44;  // Colour data chunk
const c_AF_Posn = 0x506F736E;  // Position chunk

function AFSkipToChunk(dataView, current, val) {
    for (let i = current; i < dataView.byteLength - 4; i++) {
        if (dataView.getUint32(i, true) === val) {
            return i + 4;
        }
    }
    return dataView.byteLength;
}

function AFReadUtf8String(dataView, current) {
    const characterCount = dataView.getUint32(current, true); current += 4;
    let s = "";
    for (let i = 0; i < characterCount; i++) {
        const utf8 = dataView.getUint8(current); current += 1;
        if (utf8 === 0) {
            break;
        } else {
            s += String.fromCharCode(utf8);
        }
    }
    return { text: s, newIndex: current };
}

function parseAfpaletteBuffer(buffer, filenameWithoutExtension) {
    let byteIndex = 0;
    const dataView = new DataView(buffer);

    const magicNumber = dataView.getUint32(byteIndex, true); byteIndex += 4;

    if (magicNumber !== c_AF_Magic) {
        showError("This does not appear to be a valid .afpalette file (bad magic number).");
        console.log("afpalette: Bad Magic 0x" + magicNumber.toString(16));
        return;
    }

    const fileVersion = dataView.getUint32(byteIndex, true); byteIndex += 4;
    console.log("afpalette version: " + fileVersion);

    // We've seen version 11; be lenient and try to parse other versions too
    if (fileVersion < 1 || fileVersion > 50) {
        showError("Unsupported .afpalette version (" + fileVersion + "). Only versions up to ~11 are known.");
        return;
    }

    const palettes = {
        Name: filenameWithoutExtension,
        Palettes: [],
        Groups: []
    };

    // Collect all gradient data (positions + colours) then match with names
    const gradientDataList = [];
    const nameList = [];

    for (let i = byteIndex; i < dataView.byteLength - 4; i++) {

        i = AFSkipToChunk(dataView, i, c_AF_P1CN);
        if (i >= dataView.byteLength) break;

        // Filename embedded in palette
        const fileNameInfo = AFReadUtf8String(dataView, i);
        console.log("afpalette source file: '" + fileNameInfo.text + "'");
        i = fileNameInfo.newIndex;

        // Palette list
        i = AFSkipToChunk(dataView, i, c_AF_PaLV);
        if (i >= dataView.byteLength) break;
        const paletteCount = dataView.getUint32(i, true); i += 4;
        console.log("afpalette: " + paletteCount + " palettes");

        for (let j = 0; j < paletteCount; j++) {
            const gradientData = { positions: [], colours: [] };

            // Position stops
            i = AFSkipToChunk(dataView, i, c_AF_Posn);
            if (i >= dataView.byteLength) break;
            const positionCount = dataView.getUint32(i, true); i += 4;

            for (let k = 0; k < positionCount; k++) {
                const position = dataView.getFloat64(i, true); i += 8;
                const midpoint = dataView.getFloat64(i, true); i += 8;
                gradientData.positions.push({ position: position, midpoint: midpoint });
            }

            // Colour stops
            i = AFSkipToChunk(dataView, i, c_AF_Cols);
            if (i >= dataView.byteLength) break;
            const colourCount = dataView.getUint32(i, true); i += 4;

            for (let k = 0; k < colourCount; k++) {
                i = AFSkipToChunk(dataView, i, c_AF_colD);
                if (i >= dataView.byteLength) break;
                i++;   // skip '_' separator byte

                const red   = dataView.getFloat32(i, true); i += 4;
                const green = dataView.getFloat32(i, true); i += 4;
                const blue  = dataView.getFloat32(i, true); i += 4;
                const alpha = dataView.getFloat32(i, true); i += 4;
                gradientData.colours.push({ r: red, g: green, b: blue, a: alpha });
            }

            gradientDataList.push(gradientData);
        }

        // Name list
        const nameChunkPos = AFSkipToChunk(dataView, i, c_AF_PaNV);
        if (nameChunkPos < dataView.byteLength) {
            i = nameChunkPos + 4; // skip sub-header
            const nameCount = dataView.getUint32(i, true); i += 4;

            for (let j = 0; j < nameCount; j++) {
                const nameInfo = AFReadUtf8String(dataView, i);
                nameList.push(nameInfo.text);
                i = nameInfo.newIndex;
            }
        }
    }

    // Build palette entries by merging position + colour data with names
    for (let g = 0; g < gradientDataList.length; g++) {
        const gd = gradientDataList[g];
        const gradientName = (g < nameList.length && nameList[g])
            ? nameList[g]
            : filenameWithoutExtension + " " + (g + 1);

        const colours = [];
        const stopCount = Math.min(gd.positions.length, gd.colours.length);

        for (let s = 0; s < stopCount; s++) {
            colours.push({
                Red:      Math.max(0, Math.min(1, gd.colours[s].r)),
                Green:    Math.max(0, Math.min(1, gd.colours[s].g)),
                Blue:     Math.max(0, Math.min(1, gd.colours[s].b)),
                Alpha:    Math.max(0, Math.min(1, gd.colours[s].a)),
                Position: Math.max(0, Math.min(1, gd.positions[s].position)),
                Midpoint: gd.positions[s].midpoint
            });
        }

        // Ensure start/end
        if (colours.length > 0 && colours[0].Position > 0) {
            var first = colours[0];
            colours.unshift({ Red: first.Red, Green: first.Green, Blue: first.Blue, Alpha: first.Alpha, Position: 0, Midpoint: 0.5 });
        }
        if (colours.length > 0 && colours[colours.length - 1].Position < 1) {
            var last = colours[colours.length - 1];
            colours.push({ Red: last.Red, Green: last.Green, Blue: last.Blue, Alpha: last.Alpha, Position: 1, Midpoint: 0.5 });
        }

        if (colours.length >= 2) {
            palettes.Palettes.push({
                Name: gradientName,
                Colours: colours
            });
        }
    }

    if (palettes.Palettes.length === 0) {
        showError("No usable gradients found in the .afpalette file.");
        return;
    }

    console.log("afpalette: loaded " + palettes.Palettes.length + " gradient(s)");
    previewPalette(palettes);
}