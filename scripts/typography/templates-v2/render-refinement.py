from pathlib import Path
import subprocess, os, sys
import pypdfium2 as pdfium
import os, tempfile
ROOT=Path(os.environ.get("UM_TEMPLATE_WORK",Path(tempfile.gettempdir())/"um-sans-template-build"))
REPO=Path(os.environ.get("UM_TEMPLATE_REPO",Path(__file__).resolve().parents[3]))
root=ROOT
runtime=Path(os.environ.get('UM_ARTIFACT_RUNTIME',Path.home()/'.cache/codex-runtimes/codex-primary-runtime'))
env={**os.environ,'FONTCONFIG_FILE':str(root/'fontconfig.xml'),'PATH':str(runtime/'dependencies/bin/override')+':'+os.environ['PATH']}
renderer=runtime/'plugins/openai-primary-runtime/plugins/documents/skills/documents/render_docx.py'
lo=str(runtime/'dependencies/bin/override/soffice')
profile='-env:UserInstallation='+(root/'lo-profile').as_uri()
examples_only='--examples-only' in sys.argv
costing_only='--costing-only' in sys.argv
for name in ([] if costing_only else ['ejemplo-licitacion'] if examples_only else ['oferta-completa','resumen-comercial','membrete','prueba-licitacion','ejemplo-licitacion','imagenes-documento']):
    subprocess.run([sys.executable,str(renderer),str(root/'entrega'/f'{name}.docx'),'--output_dir',str(root/'qa/r2'/name),'--emit_pdf'],env=env,check=True)
for name in ([] if examples_only or costing_only else ['oferta-completa','resumen-comercial','membrete','imagenes-documento']):
    subprocess.run([lo,profile,'--headless','--convert-to','odt','--outdir',str(root/'entrega'),str(root/'entrega'/f'{name}.docx')],env=env,check=True)
out=root/'qa/r2/excel-print';out.mkdir(parents=True,exist_ok=True)
files=[root/'entrega/presupuesto-interno.xlsx'] if costing_only else [root/'entrega/oferta-economica.xlsx',root/'entrega/ejemplo-economico.xlsx',root/'entrega/presupuesto-interno.xlsx']+([] if examples_only else [root/'qa/prueba-economica.xlsx'])
for file in files:
    subprocess.run([lo,profile,'--headless','--convert-to','pdf','--outdir',str(out),str(file)],env=env,check=True)
    pdf=pdfium.PdfDocument(out/(file.stem+'.pdf'))
    for i in range(len(pdf)):pdf[i].render(scale=2).to_pil().save(out/(file.stem+f'-{i+1}.png'))
out=root/'qa/r2/recalculated';out.mkdir(parents=True,exist_ok=True)
if not costing_only:subprocess.run([lo,profile,'--headless','--convert-to','xlsx','--outdir',str(out),str(root/'qa/prueba-economica.xlsx')],env=env,check=True)
