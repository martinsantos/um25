#!/usr/bin/env python3
"""Genera la página de prompts (work/cine/prompts/prompts-imagenes-umsa.html) desde image-briefs-sitio.json."""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
data = json.loads((ROOT / 'work/cine/image-briefs-sitio.json').read_text())
style, briefs = data['style'], data['briefs']
USE = {
    'Sectores': 'Tarjetas de /sectores y fichas de sector',
    'Servicios': 'Lista de /servicios y páginas de servicio',
    'Empresa': 'Página /nosotros',
    'Antecedentes destacados': 'Tarjetas de antecedentes en la home',
}

def full_prompt(b):
    opts = "\n".join(f"{k}. {v}" for k, v in enumerate(b['variants'], 1))
    return (f"Create an image, landscape 3:2 (1536×1024).\n\nEscena: {b['prompt']}\n\nEstética: {b['look']}\n\n"
            f"Encuadre: el 1. Si pido «otra», pasá al siguiente.\n{opts}\n\n{style['always']}\n\nAvoid: {style['never']}.")

groups = []
for b in briefs:
    if b['group'] not in groups:
        groups.append(b['group'])

cards = []
for g in groups:
    items = [b for b in briefs if b['group'] == g]
    cards.append(f'<section class="group" id="{g.split()[0].lower()}"><header class="group__head"><h2>{html.escape(g)}</h2><p>{html.escape(USE.get(g, ""))} · {len(items)} imágenes</p></header><div class="cards">')
    for b in items:
        p = full_prompt(b)
        targets = ''.join(f'<li><code>{html.escape(t.replace("public", ""))}</code></li>' for t in b['targets'])
        cards.append(f'''<article class="card" data-id="{b['id']}">
  <div class="card__top">
    <h3>{html.escape(b['title'])}</h3>
    <label class="done"><input type="checkbox" id="done-{b['id']}" data-done="{b['id']}"> Hecha</label>
  </div>
  <dl class="card__meta">
    <div><dt>Guardar como</dt><dd><code class="fname">{b['id']}.png</code></dd></div>
    <div><dt>Va en</dt><dd><ul>{targets}</ul></dd></div>
  </dl>
  <pre class="prompt" id="p-{b['id']}">{html.escape(p)}</pre>
  <div class="card__actions">
    <button type="button" class="btn btn--primary" data-copy="p-{b['id']}">Copiar prompt</button>
    <button type="button" class="btn" data-copy-text="{b['id']}.png">Copiar nombre de archivo</button>
    <span class="toast" role="status" aria-live="polite"></span>
  </div>
</article>''')
    cards.append('</div></section>')

master = (ROOT / 'work/cine/prompts/prompt-maestro-chatgpt.txt').read_text()
lote = (ROOT / 'work/cine/prompts/prompt-lote-4-opciones.txt').read_text()
nav = ''.join(f'<a href="#{g.split()[0].lower()}">{html.escape(g)}</a>' for g in groups)
page = f'''<title>Prompts de imágenes UMSA</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
  :root {{
    --bg: #f5f4f1; --panel: #ffffff; --line: #dedbd4; --text: #17191d; --muted: #5d6169; --accent: #c61f1f; --accent-ink: #ffffff; --code: #f0eee9;
    --sans: 'Archivo', 'Helvetica Neue', Arial, sans-serif; --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  }}
  @media (prefers-color-scheme: dark) {{
    :root:not([data-theme="light"]) {{ --bg: #0d0e11; --panel: #15171b; --line: #2a2d33; --text: #ecebe7; --muted: #9ba0a8; --accent: #e0342f; --accent-ink: #ffffff; --code: #1b1e23; color-scheme: dark; }}
  }}
  :root[data-theme="dark"] {{ --bg: #0d0e11; --panel: #15171b; --line: #2a2d33; --text: #ecebe7; --muted: #9ba0a8; --accent: #e0342f; --accent-ink: #ffffff; --code: #1b1e23; color-scheme: dark; }}
  * {{ box-sizing: border-box; }}
  body {{ background: var(--bg); color: var(--text); font: 400 16px/1.55 var(--sans); padding-inline: 16px; padding-block: 0 64px; }}
  .wrap {{ max-width: 1080px; margin: 0 auto; }}
  .hero {{ padding-block: 40px 28px; border-bottom: 1px solid var(--line); }}
  .kicker {{ display: flex; align-items: center; gap: 12px; margin: 0 0 14px; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); }}
  .kicker::before {{ content: ''; width: 28px; height: 2px; background: var(--accent); }}
  h1 {{ margin: 0; font-size: clamp(30px, 5vw, 46px); line-height: 1.05; font-weight: 700; letter-spacing: -.025em; text-wrap: balance; }}
  .lead {{ margin: 14px 0 0; max-width: 62ch; color: var(--muted); font-size: 17px; }}
  .ways {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 28px; }}
  .way {{ padding: 20px; background: var(--panel); border: 1px solid var(--line); }}
  .way h2 {{ margin: 0 0 10px; font-size: 18px; font-weight: 600; }}
  .way ol {{ margin: 0; padding-left: 20px; display: grid; gap: 6px; color: var(--text); }}
  .way code, .card code {{ font: 500 13.5px var(--mono); background: var(--code); padding: 1px 6px; border: 1px solid var(--line); }}
  .way .cost {{ margin: 12px 0 0; font-size: 14px; color: var(--muted); }}
  .bar {{ position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 18px; padding-block: 12px; background: var(--bg); border-bottom: 1px solid var(--line); }}
  .bar nav {{ display: flex; flex-wrap: wrap; gap: 6px; }}
  .bar a {{ padding: 6px 12px; border: 1px solid var(--line); color: var(--text); text-decoration: none; font-size: 14px; font-weight: 500; }}
  .bar a:hover, .bar a:focus-visible {{ border-color: var(--accent); }}
  .progress {{ margin-left: auto; font-size: 14px; color: var(--muted); font-variant-numeric: tabular-nums; }}
  .progress b {{ color: var(--text); }}
  .group {{ padding-top: 34px; scroll-margin-top: 64px; }}
  .group__head {{ display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 16px; margin-bottom: 16px; }}
  .group__head h2 {{ margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -.01em; }}
  .group__head p {{ margin: 0; color: var(--muted); font-size: 14px; }}
  .cards {{ display: grid; gap: 14px; }}
  .master {{ margin-top: 28px; }}
  .prompt--master {{ max-height: 22em; }}
  .card {{ padding: 18px 20px 16px; background: var(--panel); border: 1px solid var(--line); transition: opacity .2s ease; }}
  .card.is-done {{ opacity: .55; }}
  .card__top {{ display: flex; align-items: center; justify-content: space-between; gap: 12px; }}
  .card h3 {{ margin: 0; font-size: 19px; font-weight: 600; }}
  .done {{ display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: var(--muted); cursor: pointer; }}
  .done input {{ width: 18px; height: 18px; accent-color: var(--accent); }}
  .card__meta {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px 20px; margin: 12px 0 14px; }}
  .card__meta dt {{ font-size: 12px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }}
  .card__meta dd {{ margin: 4px 0 0; }}
  .card__meta ul {{ margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; }}
  .prompt {{ margin: 0; max-height: 11.5em; overflow: auto; padding: 14px 16px; background: var(--code); border: 1px solid var(--line); font: 400 13.5px/1.6 var(--mono); white-space: pre-wrap; word-break: break-word; }}
  .card__actions {{ display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px; }}
  .btn {{ min-height: 40px; padding: 0 14px; border: 1px solid var(--line); background: transparent; color: var(--text); font: 600 14px var(--sans); cursor: pointer; }}
  .btn:hover {{ border-color: var(--text); }}
  .btn--primary {{ background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }}
  .btn--primary:hover {{ filter: brightness(1.08); border-color: var(--accent); }}
  :focus-visible {{ outline: 2px solid var(--accent); outline-offset: 2px; }}
  .toast {{ font-size: 14px; color: var(--muted); }}
  .note {{ margin-top: 36px; padding: 18px 20px; border-left: 3px solid var(--accent); background: var(--panel); color: var(--muted); font-size: 15px; }}
  @media (prefers-reduced-motion: reduce) {{ .card {{ transition: none; }} }}
</style>
<div class="wrap">
  <header class="hero">
    <p class="kicker">Última Milla · rediseño 2026</p>
    <h1>Prompts de imágenes UMSA</h1>
    <p class="lead">{len(briefs)} imágenes para reemplazar las fotos del sitio con la misma dirección de arte de las escenas cine: mañana en Mendoza, cordillera, grafito y un solo acento rojo. Cada tarjeta dice con qué nombre guardar la imagen y dónde va.</p>
    <div class="ways">
      <section class="way">
        <h2>Con ChatGPT (sin clave)</h2>
        <ol>
          <li>Abrí ChatGPT y pegá el prompt.</li>
          <li>Descargá la imagen y guardala con el nombre indicado.</li>
          <li>Dejala en <code>work/cine/ai/entrantes/</code> o mandámela.</li>
          <li>Yo corro <code>import-ai-images.py</code> y la coloco en el sitio.</li>
        </ol>
      </section>
      <section class="way">
        <h2>Por API (con tu clave)</h2>
        <ol>
          <li>En tu terminal: <code>export OPENAI_API_KEY=…</code></li>
          <li><code>node work/cine/scripts/openai-images.mjs --briefs work/cine/image-briefs-sitio.json</code></li>
          <li>Después, <code>python3 work/cine/scripts/import-ai-images.py</code></li>
        </ol>
        <p class="cost">Modelo gpt-image-2 a 1536×1024: unos US$0,04 por imagen en calidad media o US$0,17 en alta. Las {len(briefs)} cuestan entre US$1 y US$4.</p>
      </section>
    </div>
  </header>
  <section class="master card" id="lote">
    <div class="card__top"><h3>Lote completo: 4 opciones de cada una y ZIP</h3></div>
    <p class="lead">Pegalo entero en un chat nuevo de ChatGPT. Genera las {len(briefs) * 4} imágenes sin esperar, cada ficha con su escena, su estética y cuatro encuadres, y arma un ZIP por grupo. Si se corta, escribí «seguí desde la NN».</p>
    <pre class="prompt prompt--master" id="p-lote">{html.escape(lote)}</pre>
    <div class="card__actions">
      <button type="button" class="btn btn--primary" data-copy="p-lote">Copiar prompt del lote</button>
      <span class="toast" role="status" aria-live="polite"></span>
    </div>
  </section>
  <section class="master card" id="maestro">
    <div class="card__top"><h3>Prompt maestro: las {len(briefs)} en un solo hilo</h3></div>
    <p class="lead">Pegalo entero en un chat nuevo de ChatGPT. Genera una imagen por respuesta, en orden; escribí «siguiente» para avanzar u «otra» para repetir.</p>
    <pre class="prompt prompt--master" id="p-master">{html.escape(master)}</pre>
    <div class="card__actions">
      <button type="button" class="btn btn--primary" data-copy="p-master">Copiar prompt maestro</button>
      <span class="toast" role="status" aria-live="polite"></span>
    </div>
  </section>
  <div class="bar">
    <nav aria-label="Grupos">{nav}</nav>
    <p class="progress"><b id="count">0</b> de {len(briefs)} hechas</p>
  </div>
  {''.join(cards)}
  <p class="note">Las imágenes de antecedentes son ilustrativas: muestran el tipo de trabajo, sin clientes ni marcas. En el sitio llevan la leyenda "Imagen ilustrativa". Si algo sale con texto, logos o caras de frente, pedí otra variante: el prompt ya lo excluye.</p>
</div>
<script>
  const KEY = 'umsa-prompts-done';
  const read = () => {{ try {{ return JSON.parse(localStorage.getItem(KEY) || '[]'); }} catch {{ return []; }} }};
  const write = (v) => {{ try {{ localStorage.setItem(KEY, JSON.stringify(v)); }} catch {{}} }};
  const boxes = [...document.querySelectorAll('[data-done]')];
  const sync = () => {{
    const done = boxes.filter((b) => b.checked).map((b) => b.dataset.done);
    boxes.forEach((b) => b.closest('.card').classList.toggle('is-done', b.checked));
    document.getElementById('count').textContent = done.length;
    return done;
  }};
  const saved = new Set(read());
  boxes.forEach((b) => {{ b.checked = saved.has(b.dataset.done); b.addEventListener('change', () => write(sync())); }});
  sync();
  const flash = (btn, msg) => {{ const t = btn.parentElement.querySelector('.toast'); t.textContent = msg; setTimeout(() => {{ if (t.textContent === msg) t.textContent = ''; }}, 2200); }};
  const copy = async (btn, text, ok) => {{
    try {{ await navigator.clipboard.writeText(text); flash(btn, ok); }}
    catch {{ flash(btn, 'Seleccioná el texto y copialo'); }}
  }};
  document.addEventListener('click', (e) => {{
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.copy) {{
      const pre = document.getElementById(b.dataset.copy);
      copy(b, pre.textContent, 'Prompt copiado');
      const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }}
    if (b.dataset.copyText) copy(b, b.dataset.copyText, 'Nombre copiado');
  }});
</script>
'''
out = ROOT / 'work/cine/prompts/prompts-imagenes-umsa.html'
out.write_text(page)
print(out, len(page))
