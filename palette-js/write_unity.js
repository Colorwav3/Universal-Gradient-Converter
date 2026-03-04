// ================================================
// Unity Gradient Preset Library (.gradients) Writer
// Generates YAML-format gradient preset files
// that Unity can import directly into the Gradient Editor.
//
// Limitation: Unity supports max 8 color keys + 8 alpha keys.
// Gradients with more stops are resampled to fit.
// ================================================

function buildUnityGradients(data) {
    var lines = [];
    lines.push('%YAML 1.1');
    lines.push('%TAG !u! tag:unity3d.com,2011:');
    lines.push('--- !u!114 &1');
    lines.push('MonoBehaviour:');
    lines.push('  m_ObjectHideFlags: 52');
    lines.push('  m_CorrespondingSourceObject: {fileID: 0}');
    lines.push('  m_PrefabInstance: {fileID: 0}');
    lines.push('  m_PrefabAsset: {fileID: 0}');
    lines.push('  m_GameObject: {fileID: 0}');
    lines.push('  m_Enabled: 1');
    lines.push('  m_EditorHideFlags: 0');
    lines.push('  m_Script: {fileID: 12323, guid: 0000000000000000e000000000000000, type: 0}');
    lines.push('  m_Name: ' + sanitizeYamlString(data.Name));
    lines.push('  m_EditorClassIdentifier: ');
    lines.push('  m_Presets:');

    for (var p = 0; p < data.Palettes.length; p++) {
        var palette = data.Palettes[p];
        var colours = palette.Colours;

        // Resample if more than 8 stops
        var colorKeys = resampleForUnity(colours, 8);
        var alphaKeys = resampleAlphaForUnity(colours, 8);

        lines.push('  - m_Name: ' + sanitizeYamlString(palette.Name));
        lines.push('    m_Gradient:');
        lines.push('      serializedVersion: 2');

        // Color keys (key0-key7)
        for (var k = 0; k < 8; k++) {
            if (k < colorKeys.length) {
                lines.push('      key' + k + ': {r: ' + colorKeys[k].r.toFixed(6) +
                    ', g: ' + colorKeys[k].g.toFixed(6) +
                    ', b: ' + colorKeys[k].b.toFixed(6) +
                    ', a: 1}');
            } else {
                lines.push('      key' + k + ': {r: 0, g: 0, b: 0, a: 0}');
            }
        }

        // Color times (ctime0-ctime7) — mapped from 0.0-1.0 to 0-65535
        for (var k = 0; k < 8; k++) {
            if (k < colorKeys.length) {
                lines.push('      ctime' + k + ': ' + Math.round(colorKeys[k].position * 65535));
            } else {
                lines.push('      ctime' + k + ': 0');
            }
        }

        // Alpha times (atime0-atime7)
        for (var k = 0; k < 8; k++) {
            if (k < alphaKeys.length) {
                lines.push('      atime' + k + ': ' + Math.round(alphaKeys[k].position * 65535));
            } else {
                lines.push('      atime' + k + ': 0');
            }
        }

        lines.push('      m_Mode: 0');
        lines.push('      m_ColorSpace: 0');
        lines.push('      m_NumColorKeys: ' + colorKeys.length);
        lines.push('      m_NumAlphaKeys: ' + alphaKeys.length);
    }

    return lines.join('\n') + '\n';
}

// Resample colour stops to fit Unity's 8-key limit
function resampleForUnity(colours, maxKeys) {
    if (colours.length <= maxKeys) {
        return colours.map(function (c) {
            return { r: c.Red, g: c.Green, b: c.Blue, position: c.Position };
        });
    }

    // Uniformly sample the gradient
    var keys = [];
    for (var i = 0; i < maxKeys; i++) {
        var t = i / (maxKeys - 1);
        var c = gradientUtils.getColourFromGradient(colours, t);
        keys.push({ r: c.Red, g: c.Green, b: c.Blue, position: t });
    }
    return keys;
}

// Resample alpha stops for Unity's 8-key limit
function resampleAlphaForUnity(colours, maxKeys) {
    // Collect unique alpha positions
    var alphaStops = [];
    for (var i = 0; i < colours.length; i++) {
        alphaStops.push({ alpha: colours[i].Alpha, position: colours[i].Position });
    }

    if (alphaStops.length <= maxKeys) {
        return alphaStops;
    }

    var keys = [];
    for (var i = 0; i < maxKeys; i++) {
        var t = i / (maxKeys - 1);
        var c = gradientUtils.getColourFromGradient(colours, t);
        keys.push({ alpha: c.Alpha, position: t });
    }
    return keys;
}

function sanitizeYamlString(str) {
    // If string contains special YAML characters, quote it
    if (/[:{}\[\],&*?|>!%@`#'"]/.test(str) || str.trim() !== str) {
        return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    }
    return str;
}

function writeUnityGradient(data) {
    var text = buildUnityGradients(data);
    var blob = new Blob([text], { type: 'text/plain' });
    saveFile(blob, data.Name + '.gradients');
}
