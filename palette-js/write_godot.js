// ================================================
// Godot Gradient Resource (.tres) Writer
// Generates Godot 4 text resource files
// ================================================

function buildGodotTres(name, colours) {
    var lines = [];
    lines.push('[gd_resource type="Gradient" format=3]');
    lines.push('');
    lines.push('[resource]');
    lines.push('resource_name = "' + name.replace(/"/g, '\\"') + '"');

    var offsets = [];
    var colorValues = [];

    for (var i = 0; i < colours.length; i++) {
        offsets.push(colours[i].Position.toFixed(6));
        colorValues.push(
            colours[i].Red.toFixed(6) + ', ' +
            colours[i].Green.toFixed(6) + ', ' +
            colours[i].Blue.toFixed(6) + ', ' +
            colours[i].Alpha.toFixed(6)
        );
    }

    lines.push('offsets = PackedFloat32Array(' + offsets.join(', ') + ')');
    lines.push('colors = PackedColorArray(' + colorValues.join(', ') + ')');
    lines.push('');

    return lines.join('\n');
}

function writeGodotGradient(data) {
    if (data.Palettes.length === 1) {
        var text = buildGodotTres(data.Palettes[0].Name, data.Palettes[0].Colours);
        var blob = new Blob([text], { type: 'text/plain' });
        var safeName = data.Palettes[0].Name.replace(/[<>:"\/\\|?*]/g, '_');
        saveFile(blob, safeName + '.tres');
    } else {
        writeGodotZip(data);
    }
}

async function writeGodotZip(data) {
    var zip = new JSZip();
    for (var i = 0; i < data.Palettes.length; i++) {
        var safeName = data.Palettes[i].Name.replace(/[<>:"\/\\|?*]/g, '_');
        var text = buildGodotTres(data.Palettes[i].Name, data.Palettes[i].Colours);
        zip.file(safeName + '.tres', text);
    }
    var content = await zip.generateAsync({ type: 'blob' });
    saveFile(content, data.Name + '_godot.zip');
}
