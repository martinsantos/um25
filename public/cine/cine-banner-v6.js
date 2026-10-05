// Banner cine: un plano pre-renderizado por escena (vuelo por la instalación con cortes
// entre edificio y esqueleto de sistemas), etiquetas que siguen a cada equipo con la
// pista exportada desde Blender, y el 3D interactivo sólo si se pide.
const SERVICES = {
  Data: ['Redes', '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces', '#2bb3d6'],
  Fiber: ['Redes · fibra óptica', '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces', '#d9934a'],
  WiFi: ['Redes · Wi-Fi', '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces', '#5cc7d9'],
  Telecom: ['Telecomunicaciones', '/servicios/103/telecomunicaciones-datos-voz-video', '#a07ae0'],
  CCTV: ['Seguridad electrónica', '/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi', '#e0679f'],
  Security: ['Control de accesos', '/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi', '#3fb07e'],
  Intercom: ['Seguridad electrónica', '/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi', '#cf7dbb'],
  'Fire-detection': ['Detección de incendios', '/servicios/107/sistemas-de-deteccion-y-alarma-de-incendios', '#ef5a44'],
  Power: ['Eléctricos IT', '/servicios/108/servicios-electricos-para-it', '#d9a23a'],
  Software: ['Software a medida', '/servicios/104/desarrollo-de-software-a-medida-web-mobile-erp', '#6f9be6'],
};
const TITLES = { bodega: 'Bodega', fachada: 'Edificio corporativo', aeropuerto: 'Terminal aeroportuaria', hospital: 'Hospital', planta: 'Planta de altura' };
const ENGINE = { planta: 'bodega' }; // el motor 3D usa la nave de la bodega para la planta
// Claves v4 "<escena>-<servicio>": la escena base define título y motor 3D.
const baseOf = (scene) => String(scene || '').split('-')[0];
const clean = (s) => String(s || '').replace(/\s*\/\s*DEMO\b/gi, '').replace(/\bDEMO\b\s*[·-]?\s*/gi, '').trim();
const motionLimited = () => matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(navigator.connection?.saveData);
const compact = () => innerWidth <= 820 || matchMedia('(pointer: coarse)').matches;
const tracks = new Map();
const loadTrack = (scene) => {
  if (!tracks.has(scene)) tracks.set(scene, fetch(`/cine/media/cine-${scene}-ar.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  if (tracks.size > 4) tracks.delete(tracks.keys().next().value);
  return tracks.get(scene);
};

const SERVICE_NAMES = {
  redes: 'Redes', seguridad: 'Seguridad electrónica', telecom: 'Telecomunicaciones', software: 'Software a medida',
  soporte: 'Soporte 24/7', consultoria: 'Consultoría IT', incendios: 'Detección de incendios', electricos: 'Eléctricos IT',
};
const serviceOf = (cut) => SERVICE_NAMES[String(cut || '').split('-')[1]] || '';
// Long, quiet transitions let the project remain legible.

export function banner(el) {
  if (el.dataset.bound) return;
  el.dataset.bound = 'true';
  const scenes = (el.dataset.scenes || '').split(',').filter(Boolean);
  const variants = Object.fromEntries((el.dataset.variants || '').split(';').filter(Boolean).map(g => {
    const [scene, list] = g.split(':'); return [scene, (list || '').split('|').filter(Boolean)];
  }));
  const vary = Object.keys(variants).length > 0;
  const planned = {};
  let lastCut = '';
  const cutOf = i => {
    const scene = scenes[i];
    if (!vary || motionLimited()) return scene;
    if (!planned[i]) {
      const choices = [scene, ...(variants[scene] || [])].filter(k => k !== lastCut);
      planned[i] = choices[Math.floor(Math.random() * choices.length)] || scene;
    }
    return planned[i];
  };
  const only = (el.dataset.systems || '').split(',').filter(Boolean);
  const [va, vb] = el.querySelectorAll('.umc-video');
  el.dataset.cinematic='quiet';
  const poster = el.querySelector('.umc-poster'), stage = el.querySelector('.umc-stage');
  const layer = el.querySelector('.umc-ar'), rail = [...el.querySelectorAll('[data-umc-scene]')];
  const motion = el.querySelector('[data-umc-motion]'), caption = el.querySelector('[data-umc-caption]');
  if (!scenes.length || !va || !vb || !poster || !stage || !layer) return;
  const multi = scenes.length > 1 || vary;
  const SQ = {x:487,w:1080,h:1080};
  const narrow = () => stage.clientWidth <= stage.clientHeight * 1.05;
  const src = scene => `/cine/media/cine-${scene}${narrow() ? '-sq' : ''}.mp4`;
  let index = Math.max(0, Math.min(Number(el.dataset.start) || 0, scenes.length - 1));
  let active = va, idle = vb, track = null, playingCut = '', visible = false, userPaused = motionLimited();
  let started = false, disposed = false, raf = 0, cutting = false, generation = 0, preloaded = '', fxTimer = 0, startTimer = 0;
  let shown = [], lastPick = 0, posNow = .5;
  const pool = Array.from({length:4}, () => {
    const t = document.createElement('a'); t.className = 'umc-tag'; t.tabIndex = -1;
    t.innerHTML = '<i class="umc-tag__ret"></i><i class="umc-tag__lead"></i><span class="umc-tag__card"><small></small><strong></strong></span>';
    layer.appendChild(t);
    return {el:t,id:null,small:t.querySelector('small'),name:t.querySelector('strong')};
  });
  const stopFrames = () => { cancelAnimationFrame(raf); raf = 0; };
  const canPlay = () => !disposed && started && visible && !document.hidden && !userPaused && !el.classList.contains('is-exploring');
  const startFrames = () => { if (!raf && canPlay() && !active.paused) raf = requestAnimationFrame(frame); };
  const clearTags = () => { track = null; shown = []; pool.forEach(p => {p.id=null;p.el.classList.remove('is-on');}); el.classList.remove('is-glitch'); };
  const useTrack = scene => {
    clearTags();
    loadTrack(scene).then(t => { if (!disposed && playingCut === scene && t?.track && t?.assets) {track=t;startFrames();} });
  };
  const mark = i => {
    el.dataset.scene = scenes[i];
    const svc = serviceOf(playingCut || scenes[i]);
    rail.forEach((b,k) => {
      b.setAttribute('aria-pressed',String(k===i));
      const small = b.querySelector('small');
      if (small) { if (!small.dataset.base) small.dataset.base=small.textContent; small.textContent=k===i && svc ? svc : small.dataset.base; }
      const bar = b.querySelector('b'); if (bar && k!==i) bar.style.transform='scaleX(0)';
    });
    if (caption) caption.textContent=(TITLES[baseOf(scenes[i])] || '')+(svc ? ` · ${svc}` : '');
  };
  const label = () => {
    const paused = userPaused || active.paused;
    el.classList.toggle('is-paused',paused);
    motion?.setAttribute('aria-label',paused ? 'Reanudar el recorrido' : 'Pausar el recorrido');
  };
  const showPoster = scene => {
    const source = poster.closest('picture')?.querySelector('source');
    if (source) source.srcset=`/cine/media/cine-${scene}-poster.avif`;
    poster.src=`/cine/media/cine-${scene}-poster.jpg`;
    poster.classList.remove('is-hidden');
  };
  function play() {
    if (!canPlay()) {active.pause();idle.pause();stopFrames();label();return;}
    if (!active.getAttribute('src')) {
      playingCut=cutOf(index); active.loop=!multi; active.src=src(playingCut); mark(index); useTrack(playingCut);
    }
    active.play().then(() => {
      if (!canPlay()) {active.pause();stopFrames();return;}
      active.classList.add('is-on');poster.classList.add('is-hidden');startFrames();label();
    }).catch(e => { if (e?.name==='NotAllowedError') {userPaused=true;label();} });
  }
  function cutTo(nextIndex) {
    if (cutting || !canPlay()) return;
    const next=(nextIndex+scenes.length)%scenes.length, scene=cutOf(next), nextVideo=idle;
    cutting=true; const token=++generation;
    if (preloaded!==scene) nextVideo.src=src(scene);
    nextVideo.currentTime=0; nextVideo.loop=!multi;
    nextVideo.play().then(() => {
      if (token!==generation || !canPlay()) {nextVideo.pause();if(token===generation)cutting=false;return;}
      stopFrames();active.classList.remove('is-on');active.pause();
      [active,idle]=[nextVideo,active]; index=next; playingCut=scene;
      active.classList.add('is-on');poster.classList.add('is-hidden');
      mark(index);useTrack(scene);preloaded='';cutting=false;lastCut=scene;planned[index]=null;
      startFrames();label();
    }).catch(() => {if(token===generation)cutting=false;});
  }
  // Pista: 'linear' (v3, un cuadro de video = un cuadro de render) o ida y vuelta con pausa (v2).
  const frameAt = (f) => {
    const n = track.frames;
    if (track.order === 'linear') return Math.max(0, Math.min(n - 1, Math.floor(f)));
    const hold = track.hold || 0, len = hold + 2 * n - 2;
    const k = ((Math.floor(f) % len) + len) % len - hold;
    return k < 0 ? n - 1 : k < n ? n - 1 - k : k - n + 1;
  };
  const inRanges = (ranges, f) => (ranges || []).some(([a, b]) => f >= a && f < b);
  const sample = (id, time) => {
    const f = time * (track.fps || 24);
    const path = track.track[id];
    if (!path?.length) return [0, 0, false];
    const a = path[frameAt(f)] || path[path.length - 1], b = path[frameAt(f + 1)] || a;
    const u = f - Math.floor(f);
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] && b[2]];
  };
  // Del cuadro original (1920×1080, coordenadas normalizadas) al escenario, con la
  // misma cuenta que object-fit: cover + object-position del video visible.
  function project(nx, ny) {
    const w = stage.clientWidth, h = stage.clientHeight;
    const sq = (active.currentSrc || active.src || '').includes('-sq.mp4');
    const vw = sq ? SQ.w : 1920, vh = sq ? SQ.h : 1080;
    const px = nx * 1920 - (sq ? SQ.x : 0), py = ny * 1080;
    const pos = posNow;
    const s = Math.max(w / vw, h / vh);
    return [(w - vw * s) * pos + px * s, (h - vh * s) / 2 + py * s, w, h];
  }
  // Zona libre en coordenadas de la sección (el escenario puede estar corrido a la derecha).
  const free = (x, y, w, h) => {
    const sx = x + stage.offsetLeft, W = el.clientWidth;
    return compact()
      ? y > h * .38 && y < h * .74 && x > w * .12 && x < w * .88
      : !(sx < W * .5 && y > h * .2) && y > Math.max(h * .1, 120) && y < h * .8 && sx > W * .05 && sx < W * .95;
  };
  // Ancho real de la etiqueta (desplazamiento 28–34 px + tarjeta) para decidir el lado.
  const cardW = () => (compact() ? 236 : 310);
  const flips = (x) => x + stage.offsetLeft > el.clientWidth - cardW() - 16;
  const box = (x, y, w) => (flips(x, w) ? [x - cardW(), y - 90, x + 12, y + 12] : [x - 12, y - 90, x + cardW(), y + 12]);
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const ahead = (id, time) => { let n = 0; for (let k = 0; k < 30; k += 3) if (sample(id, time + k / 24)[2]) n++; return n; };
  const eligible = (a) => SERVICES[a.system] && (!only.length || only.includes(a.system));

  function pick(time, skeleton) {
    const limit = compact() ? 1 : 2;
    const keep = shown.filter((id) => { const [nx, ny, v] = sample(id, time); const [x, y, w, h] = project(nx, ny); return v && free(x, y, w, h); }).slice(0, limit);
    const boxes = keep.map((id) => { const [nx, ny] = sample(id, time); const [x, y, w] = project(nx, ny); return box(x, y, w); });
    const systems = new Set(keep.map((id) => track.assets.find((a) => a.id === id)?.system));
    const candidates = track.assets.filter((a) => eligible(a) && !keep.includes(a.id)).map((a) => {
      const [nx, ny, v] = sample(a.id, time);
      const [x, y, w, h] = project(nx, ny);
      return { a, x, y, w, ok: v && free(x, y, w, h), score: ahead(a.id, time) };
    }).filter((c) => c.ok && c.score >= 6).sort((p, q) => q.score - p.score);
    for (const c of candidates) {
      if (keep.length >= limit) break;
      if (systems.has(c.a.system) && candidates.some((o) => o !== c && !systems.has(o.a.system))) continue;
      const b = box(c.x, c.y, c.w);
      if (boxes.some((o) => hit(o, b))) continue;
      keep.push(c.a.id); boxes.push(b); systems.add(c.a.system);
    }
    shown = keep;
    pool.forEach((p) => { if (p.id && !shown.includes(p.id)) { p.id = null; p.el.classList.remove('is-on'); } });
    for (const id of shown) {
      if (pool.some((p) => p.id === id)) continue;
      const slot = pool.find((p) => !p.id);
      if (!slot) break;
      const a = track.assets.find((x) => x.id === id);
      const [service, href, color] = SERVICES[a.system];
      slot.id = id;
      slot.el.style.setProperty('--c', color);
      slot.el.href = href;
      slot.small.textContent = service;
      slot.name.textContent = clean(a.name);
      slot.el.classList.add('is-on');
    }
  }


  function frame(now) {
    raf=0;
    if (!canPlay() || active.paused || !active.classList.contains('is-on')) return;
    const time=active.currentTime;
    const protectedRect=el.querySelector('.umc-content')?.getBoundingClientRect();
    const stageRect=stage.getBoundingClientRect(),heroRect=el.getBoundingClientRect(),visibleBoxes=[];
    if (track) {
      posNow=parseFloat(getComputedStyle(active).objectPosition)/100 || .5;
      const f=time*(track.fps || 24), skeleton=inRanges(track.beats,f);
      el.classList.remove('is-glitch');
      if (now-lastPick>1200) {lastPick=now;pick(time,skeleton);}
      for (const p of pool) {
        if (!p.id) continue;
        const [nx,ny,inFrame]=sample(p.id,time),[x,y,w,h]=project(nx,ny),flip=flips(x);
        p.el.classList.toggle('is-flip',flip);p.el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
        const card=p.card || (p.card=p.el.querySelector('.umc-tag__card'));
        if (card) {
          const cw=card.offsetWidth,off=compact()?28:34,sx=x+stage.offsetLeft,W=el.clientWidth;
          const left=flip?sx-off-cw:sx+off,dx=left<8?8-left:left+cw>W-8?W-8-(left+cw):0;
          card.style.translate=dx?`${dx.toFixed(1)}px 0`:'';
          const cardLeft=heroRect.left+left+dx,anchorX=stageRect.left+x,anchorY=stageRect.top+y;
          const bounds=[Math.min(cardLeft,anchorX-12),anchorY-30-card.offsetHeight,Math.max(cardLeft+cw,anchorX+12),anchorY+12];
          const copyBounds=protectedRect?[protectedRect.left-20,protectedRect.top-20,protectedRect.right+20,protectedRect.bottom+20]:null;
          const obscured=!inFrame||!free(x,y,w,h)||(copyBounds&&hit(bounds,copyBounds))||visibleBoxes.some(other=>hit(bounds,other));
          p.el.classList.toggle('is-obscured',Boolean(obscured));
          if(!obscured)visibleBoxes.push(bounds);
        }
      }
    }
    const bar=rail[index]?.querySelector('b');
    if(bar && active.duration)bar.style.transform=`scaleX(${Math.min(1,time/active.duration).toFixed(4)})`;
    if(multi && active.duration && !motionLimited()) {
      const next=(index+1)%scenes.length,scene=cutOf(next);
      if(time>active.duration-3 && preloaded!==scene){idle.src=src(scene);idle.preload='auto';idle.load();preloaded=scene;}
      if(time>=active.duration-.05)cutTo(next);
    }
    startFrames();
  }
  rail.forEach((b,k) => b.addEventListener('click', () => {
    if(k===index)return;
    started=true;
    if(motionLimited() || userPaused) {
      generation++;cutting=false;active.pause();idle.pause();stopFrames();
      index=k;playingCut='';active.removeAttribute('src');idle.removeAttribute('src');active.load();idle.load();preloaded='';
      active.classList.remove('is-on');idle.classList.remove('is-on');clearTags();showPoster(scenes[k]);mark(k);label();
      return;
    }
    cutTo(k);
  }));
  motion?.addEventListener('click', () => {
    started=true;userPaused=!(userPaused || active.paused);
    if(userPaused){generation++;cutting=false;}play();label();
  });
  for(const v of [va,vb]) {
    v.addEventListener('play',label);v.addEventListener('playing',() => {if(v===active)startFrames();});
    v.addEventListener('pause',() => {label();if(v===active)stopFrames();});
    v.addEventListener('ended',() => {if(v===active && multi && !motionLimited())cutTo(index+1);});
    v.addEventListener('error',() => {
      if(v!==active)return;userPaused=true;v.classList.remove('is-on');clearTags();poster.classList.remove('is-hidden');stopFrames();label();
    });
  }
  const observer=new IntersectionObserver(([e]) => {visible=e.intersectionRatio>.15;play();},{threshold:[0,.15,.5]});observer.observe(el);
  const visibility=() => play();document.addEventListener('visibilitychange',visibility);
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const onPreference=() => {if(preference.matches){userPaused=true;generation++;cutting=false;}play();};preference.addEventListener('change',onPreference);
  const exploreButton=el.querySelector('[data-umc-3d]');
  exploreButton?.addEventListener('click',() => {
    el.classList.add('is-exploring');play();
    explore(el.dataset.scene,() => {el.classList.remove('is-exploring');play();},exploreButton);
  });
  const start=() => {if(disposed || started)return;started=true;play();};
  const whenIdle=() => {startTimer=setTimeout(start,600);};
  whenIdle();
  const cleanup=() => {
    disposed=true;el.removeAttribute('data-bound');generation++;clearTimeout(startTimer);clearTimeout(fxTimer);active.pause();idle.pause();stopFrames();observer.disconnect();
    document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',onPreference);removeEventListener('load',whenIdle);
    document.querySelector('.umc-dialog')?.close();
  };
  document.addEventListener('astro:before-swap',cleanup,{once:true});
  label();
  return cleanup;
}

function explore(scene,onClose,trigger) {
  let dlg=document.querySelector('.umc-dialog');
  if(!dlg) {
    dlg=document.createElement('dialog');dlg.className='umc-dialog';
    dlg.innerHTML='<div class="umc-dialog__bar"><p><b data-umc-dialog-title>Gemelo digital</b><span>Arrastrá para orbitar · rueda para acercar</span></p><button type="button" aria-label="Cerrar el gemelo digital">Cerrar</button></div><div class="umc-dialog__view"></div>';
    document.body.appendChild(dlg);dlg.querySelector('button').addEventListener('click',()=>dlg.close());
    dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
  }
  const base=baseOf(scene),name=TITLES[base] || '', title=name?`Gemelo digital · ${name}`:'Gemelo digital';
  dlg.querySelector('[data-umc-dialog-title]').textContent=title;dlg.setAttribute('aria-label',title);
  const frame=document.createElement('iframe');frame.title=`Gemelo digital interactivo · ${name}`;
  frame.src=`/3d/cinema.html?scene=${ENGINE[base] || base}&mode=building&embed=1&ar=clean&center=1`;frame.allow='fullscreen';
  dlg.querySelector('.umc-dialog__view').replaceChildren(frame);document.documentElement.classList.add('umc-lock');dlg.showModal();
  let armed=false,timer=0;
  const send=(action,value)=>frame.contentWindow?.postMessage({type:'um-cinema-command',action,value},location.origin);
  const onState=e=>{
    if(e.origin!==location.origin || e.source!==frame.contentWindow)return;
    if(e.data?.type==='um-cinema-exit'){dlg.close();return;}
    if(e.data?.type!=='um-cinema-state' || !e.data.ready || armed)return;
    armed=true;send('mode','systems');send('focus',['Data','Telecom','CCTV','Security','Fire-detection','Power','Software']);send('play');
    timer=setTimeout(()=>{if(dlg.open){send('explore',true);frame.focus();}},2400);
  };
  addEventListener('message',onState);
  dlg.addEventListener('close',()=>{
    clearTimeout(timer);removeEventListener('message',onState);dlg.querySelector('.umc-dialog__view').replaceChildren();
    document.documentElement.classList.remove('umc-lock');if(trigger?.isConnected)trigger.focus();onClose();
  },{once:true});
}
function boot(){document.querySelectorAll('[data-umc]').forEach(banner);}
boot();
document.addEventListener('DOMContentLoaded',boot,{once:true});
document.addEventListener('astro:page-load',boot);
