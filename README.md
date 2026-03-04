# Universal Gradient Converter

A browser-based tool that converts gradient files between **11 formats** across design apps, 3D/game engines, and web technologies — entirely client-side.

> Built on [Balakov/GrdToAfpalette](https://github.com/Balakov/GrdToAfpalette) by [Mike Stimpson](https://mikestimpson.com). Extended by [Colorwav3](https://github.com/Colorwav3) with AI assistance (GitHub Copilot / Claude).

---

## Supported Formats

| Direction | Format | Software |
|-----------|--------|----------|
| Import & Export | `.grd` (v5) | Adobe Photoshop / After Effects |
| Import & Export | `.ggr` | GIMP |
| Import & Export | `.kgr` | Krita |
| Import & Export | `.svg` | Any SVG editor / browser |
| Import & Export | `.css` | Web (CSS gradients) |
| Import & Export | `.afpalette` | Affinity Photo / Designer / Publisher |
| Import & Export | `.tres` | Godot Engine |
| Import only | `.cpt` | CPTCITY |
| Export only | `.py` | Blender (color ramp script) |
| Export only | `.py` | Cinema 4D (gradient shader script) |
| Export only | `.ms` | 3ds Max (MaxScript gradient ramp) |
| Export only | `.gradients` | Unity |

## Features

- **11 format support** — design, 3D, game engines, and web
- **CMYK, Lab, Greyscale & Book Color** auto-conversion to RGB
- **Noise gradient detection** — skips procedural noise gradients with a clear warning
- **Group-aware** — reads Photoshop `.grd` hierarchy, browse groups via tabs
- **Dual export view** — switch between "By Software" (grouped) and "By File Type" (flat grid)
- **Live preview** — scrollable gradient grid with hover zoom
- **Batch download** — single file, current group, or all groups as ZIP
- **100% client-side** — nothing leaves your browser

## Quick Start

1. Open `index.html` in a browser (or host it anywhere — it's a static page)
2. Click **Choose File** and pick any supported gradient file
3. Preview your gradients — use group tabs if the file has groups
4. Pick a target format from the export panel
5. Hit **Download**

## Color Space Conversion

All non-RGB color spaces are automatically converted on import:

| Source | Method |
|--------|--------|
| CMYK | `R = (1−C)(1−K)`, `G = (1−M)(1−K)`, `B = (1−Y)(1−K)` |
| CIE Lab | Lab → XYZ (D65) → linear sRGB (3×3 matrix) → gamma sRGB |
| Greyscale | `R = G = B = gray` |
| Book Color | Reads embedded RGB fallback; defaults to 50% gray |

> Conversions are device-independent (no ICC profiles). Colors may differ slightly from the original application.

## Limitations

- **Transparency** — Adobe gradients store opacity on a separate track. The converter inserts interpolated stops to approximate it, which may not be pixel-perfect.
- **Unity** — limited to 8 color keys per gradient (Unity engine limit). Gradients with more stops are resampled.
- **Noise gradients** — procedural noise gradients in `.grd` files cannot be converted and are skipped.

## Technical Notes

<details>
<summary><strong>.afpalette format</strong></summary>

Chunk-based binary: 80-byte header, body, 115-byte footer. A CRC32 checksum (`0xEDB88320`) over the body is written to two footer positions. Affinity 2 rejects files with invalid checksums.
</details>

<details>
<summary><strong>GRD group hierarchy</strong></summary>

`.grd` v5 files may contain a hierarchy section (`8BIMphry` → `hierarchy` → `VlLs`) with `Grup` (group start), `groupEnd` (group end), and `preset` (gradient ref) objects. Groups can nest; the parser uses a stack to assign each gradient to its leaf group.
</details>

<details>
<summary><strong>Architecture</strong></summary>

The `.grd` parser uses bounded chunk search (`GRDSkipToChunkInRange`, `GRDFindAllChunks`) rather than a full descriptor parser. All importers produce a common JSON intermediate format consumed by all export writers:

```
{ Name, Palettes: [{ Name, Colours: [{ Red, Green, Blue, Alpha, Position, Midpoint }] }], Groups: [] }
```

Writers:
- `write_afpalette.js` — binary with CRC32
- `write_grd.js` — Photoshop GRD v5 binary
- `write_ggr.js` — GIMP/Krita text format
- `write_svg.js` — SVG `<linearGradient>` defs
- `write_css.js` — CSS custom properties + utility classes
- `write_godot.js` — Godot `.tres` resource
- `write_blender.js` — Blender Python color ramp script
- `write_unity.js` — Unity `.gradients` YAML
- `write_cinema4d.js` — Cinema 4D Python shader script
- `write_3dsmax.js` — 3ds Max MaxScript

</details>

## Credits

- Original tool by [Mike Stimpson](https://mikestimpson.com) — [Balakov/GrdToAfpalette](https://github.com/Balakov/GrdToAfpalette)
- Extended by [Colorwav3](https://github.com/Colorwav3) with AI assistance (GitHub Copilot / Claude)
- [JSZip](https://stuk.github.io/jszip/) for ZIP archive generation

## License

See [LICENSE](LICENSE) for details.
- [.grd file format description](https://github.com/tonton-pixel/json-photoshop-scripting/tree/master/Documentation/Photoshop-Gradients-File-Format#descriptor)
- [Official Adobe file formats](https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/#50577411_pgfId-1059252)
- [Adobe](https://www.adobe.com/)
- [Affinity](https://affinity.serif.com/)

## Disclaimer

This project is not affiliated with Adobe or Serif (Affinity). It is a community project provided under the MIT licence. Use at your own risk — no responsibility is taken for lost work due to crashes or malfunctions.

All trademarks and brand names are the property of their respective owners.
