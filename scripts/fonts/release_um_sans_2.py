#!/usr/bin/env python3
"""Promote reviewed UM Sans 0.950 binaries without changing their drawings.

Run with the fontTools/Brotli environment and an explicit frozen candidate.
The new directory is immutable: this script refuses to replace a release.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import zipfile

from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen

ROOT = Path(__file__).resolve().parents[2]
VERSION = '2.0.0'
LICENSE = '''UM Sans 2.0 · ULTIMA MILLA
Copyright 2026 ULTIMA MILLA. Todos los derechos reservados.

Distribución operativa autorizada para los sitios, aplicaciones, documentos y
plantillas de ULTIMA MILLA y su visualización por sus destinatarios.
Se permite instalar la familia para editar esos documentos y utilizarla en
los sistemas de ULTIMA MILLA. La incrustación conserva Preview & Print (fsType 4).
Esta entrega no concede una licencia general para redistribuir, revender,
modificar o usar la fuente como marca de terceros.

La familia de respaldo UM Sans 1.2 mantiene su licencia SIL OFL 1.1, incluida
en compat/OFL.txt. Es un componente separado basado en Inter; sus contornos
no forman parte de UM Sans 2.0. La presencia del respaldo no relicencia 2.0.
'''


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def drawing(font):
    glyphs = font.getGlyphSet()
    result = []
    for name in font.getGlyphOrder():
        pen = RecordingPen()
        glyphs[name].draw(pen)
        result.append((name, pen.value, glyphs[name].width))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--candidate', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=ROOT / 'public/fonts/um-sans/v2.0.0')
    args = parser.parse_args()
    out = args.output
    if out.exists():
        parser.error('Release already exists; use a new version/directory.')
    contract = json.loads((args.candidate / 'qa/contract.json').read_text())
    assert len(contract['files']) == 58
    for row in contract['files']:
        assert digest(args.candidate / row['file']) == row['sha256'], row['file']
    out.mkdir(parents=True)
    files = []
    for source in sorted(args.candidate.iterdir()):
        if source.suffix not in ['.otf', '.ttf', '.woff2']:
            continue
        font = TTFont(source, recalcTimestamp=False)
        before = drawing(font)
        layout = {t: font.getTableData(t) for t in ['cmap', 'hmtx', 'GPOS', 'GSUB']}
        variable = {t: font.getTableData(t) for t in ['gvar', 'fvar', 'avar', 'HVAR'] if t in font}
        for record in font['name'].names:
            value = record.toUnicode().replace('UMSans2Family05', 'UMSans2').replace('UM Sans 2 Dev', 'UM Sans 2').replace('UM Sans 2 VF', 'UM Sans 2 Variable').replace('0.950', '2.000')
            if record.nameID == 0:
                value = 'Copyright 2026 ULTIMA MILLA. All rights reserved.'
            elif record.nameID == 13:
                value = 'Authorized for ULTIMA MILLA websites, applications and documents. All rights reserved. See LICENSE.txt. Preview & Print embedding.'
            elif record.nameID == 14:
                value = 'https://www.ultimamilla.com.ar/fonts/um-sans/v2.0.0/LICENSE.txt'
            record.string = value.encode(record.getEncoding())
        font['head'].fontRevision = 2.0
        if 'CFF ' in font:
            cff = font['CFF '].cff
            cff.fontNames = [font['name'].getDebugName(6)]
            top = cff.topDictIndex[0]
            top.version = '2.000'
            top.FullName = font['name'].getDebugName(4)
            top.FamilyName = font['name'].getDebugName(16) or font['name'].getDebugName(1)
            top.Notice = 'Copyright 2026 ULTIMA MILLA. All rights reserved.'
        target = out / source.name.replace('UMSans2Family05', 'UMSans2')
        font.save(target)
        font.close()
        with TTFont(target) as check:
            assert before == drawing(check), target
            assert all(check.getTableData(t) == b for t, b in layout.items()), target
            assert all(check.getTableData(t) == b for t, b in variable.items()), target
            assert check['OS/2'].fsType == 4
        files.append({'file': target.name, 'sha256': digest(target), 'bytes': target.stat().st_size,
                      'candidate': source.name, 'candidateSha256': digest(source), 'drawingAndLayoutUnchanged': True})
    compat = out / 'compat'
    compat.mkdir()
    for name in ['UMSans-Variable.woff2', 'UMSans-VariableItalic.woff2']:
        shutil.copy2(ROOT / 'public/fonts/um-sans' / name, compat / name)
    ofl = ROOT / 'public/fonts/um-sans/OFL-1.1.txt'
    shutil.copy2(ofl, compat / 'OFL.txt')
    (out / 'LICENSE.txt').write_text(LICENSE)
    css = '''/* UM Sans 2.0.0: pinned service. Loading this file does not restyle an application. */
@font-face { font-family: 'UM Sans 2'; src: url('./UMSans2-Variable.woff2') format('woff2'); font-weight: 100 900; font-style: normal; font-display: swap; }
@font-face { font-family: 'UM Sans 2'; src: url('./UMSans2-VariableItalic.woff2') format('woff2'); font-weight: 100 900; font-style: italic; font-display: swap; }
@font-face { font-family: 'UM Sans 1.2 Compatibility'; src: url('./compat/UMSans-Variable.woff2') format('woff2'); font-weight: 100 900; font-style: normal; font-display: swap; }
@font-face { font-family: 'UM Sans 1.2 Compatibility'; src: url('./compat/UMSans-VariableItalic.woff2') format('woff2'); font-weight: 100 900; font-style: italic; font-display: swap; }
:root {
  --um-font-family: 'UM Sans 2', 'UM Sans 1.2 Compatibility', Arial, system-ui, sans-serif;
  --um-type-title: clamp(2.25rem, 3.5vw, 3rem);
  --um-type-subtitle: 1.75rem;
  --um-type-lead: 1.375rem;
  --um-type-body: 1.25rem;
  --um-type-ui: 1rem;
  --um-type-leading: 1.65;
  --um-type-measure: 31em;
}
.um-type { font-family: var(--um-font-family); font-kerning: normal; font-synthesis: none; }
.um-type-reading { max-inline-size: var(--um-type-measure); font-size: var(--um-type-body); line-height: var(--um-type-leading); }
.um-type-figures { font-variant-numeric: tabular-nums; }
'''
    (out / 'um-sans.css').write_text(css)
    cmap = TTFont(out / 'UMSans2-Variable.ttf').getBestCmap()
    manifest = {'family': 'UM Sans 2', 'version': VERSION, 'fontVersion': '2.000', 'sourceCandidate': '0.950',
                'sourceCommit': '033235d4d39a3c1924ccf16d03a89d84789f2be4', 'styles': 18, 'weights': list(range(100, 901, 100)),
                'axes': {'wght': [100, 400, 900]}, 'glyphsPerStyle': 150, 'codepoints': sorted(cmap),
                'css': f'/fonts/um-sans/v{VERSION}/um-sans.css', 'templates': '/estilo/fuentes/plantilla',
                'license': 'LICENSE.txt', 'embedding': 'Preview & Print (fsType 4)',
                'fallback': {'family': 'UM Sans 1.2 Compatibility', 'license': 'SIL OFL 1.1', 'policy': 'Only for characters absent from UM Sans 2; not counted as original UM Sans 2 glyphs.'},
                'releaseAuthorization': 'Owner requested publishing the new family as a central service and using it in ULTIMA MILLA offer templates.',
                'files': files}
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    with zipfile.ZipFile(out / 'UMSans2-2.0.0.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for p in sorted(out.rglob('*')):
            if p.is_file() and p.suffix != '.zip':
                info = zipfile.ZipInfo('UMSans2-2.0.0/' + p.relative_to(out).as_posix(), date_time=(2026, 10, 7, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                z.writestr(info, p.read_bytes())
    print(json.dumps({'files': len(files), 'drawingAndLayoutUnchanged': True, 'output': str(out)}))


if __name__ == '__main__':
    main()
