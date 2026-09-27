const byId = (id) => document.getElementById(id);
const hero = byId('manifiesto');
const stage = byId('arStage');
const zone = byId('arZone');
const back = byId('arBack');
const feedback = byId('arFeedback');
const feedbackText = byId('arFeedbackText');
const retry = byId('arRetry');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(pointer: fine)');
const connection = navigator.connection;
const sceneKeys = ['hospital', 'aeropuerto', 'bodega', 'fachada'];
const sceneTitles = ['Hospital conectado', 'Terminal aeroportuaria', 'Bodega conectada', 'Edificio inteligente'];
const sceneDescriptions = [
  'Cada conexión, al servicio del cuidado.',
  'Conectividad que acompaña cada llegada.',
  'Tecnología que cuida cada etapa del proceso.',
  'Todos los sistemas. Una misma operación.',
];
const modeLabels = { film: 'Cine · 14 segundos', building: 'Arquitectura y operación', systems: 'Sistemas que lo hacen posible', journey: 'Recorrido de detalle' };
const studyQuery = new URLSearchParams(location.search).get('plano');
let hospitalStudy = ['entrada', 'equipo', 'red'].includes(studyQuery) ? studyQuery : null;
const cinema = { scene: 'hospital', mode: 'film', playing: !limitsMotion() && !hospitalStudy, exploring: false, progress: 0, phase: '', caption: '' };
const sceneButtons = [...document.querySelectorAll('[data-cinema-scene]')];
const modeButtons = [...document.querySelectorAll('[data-cinema-mode]')];
let heroFrame = null;
let heroState = 'idle';
let readyTimeout;
let releaseTimeout;
let startupTimeout;
let initialPaintReady = false;
let explicitCinema = Boolean(hospitalStudy);
let cinemaFailed = false;
let engineSuspended = false;
let slowSamples = 0;
let returnFocus = zone;
let activeCard = null;
let wantedVideo = null;

function limitsMotion() {
  return reducedMotion.matches || Boolean(connection?.saveData);
}

function videoSource(key) {
  // Only one URL is assigned: mobile browsers cannot prefetch a desktop source.
  const compact = innerWidth <= 820 || matchMedia('(pointer: coarse)').matches || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '');
  const suffix = compact ? '-720' : '';
  return `/cine/media/recorrido-${key}${suffix}.mp4`;
}

function makeVideo(id, buttonId, key, visibilityTarget) {
  const video = byId(id);
  const record = { video, button: byId(buttonId), key, visibilityTarget, visible: 0, userPaused: false, explicit: false, blocked: false, failed: false, pending: false, version: 0 };
  video.addEventListener('loadeddata', () => video.classList.add('on'));
  video.addEventListener('playing', () => {
    if (wantedVideo !== record || document.hidden) video.pause();
    updateControls(record);
  });
  video.addEventListener('pause', () => updateControls(record));
  video.addEventListener('error', () => {
    if (!video.getAttribute('src')) return;
    record.failed = true;
    video.classList.remove('on');
    updateControls(record);
  });
  if (id !== 'arHero') record.button.addEventListener('click', () => {
    if (!video.paused || record.pending) record.userPaused = true;
    else {
      record.explicit = true;
      record.userPaused = false;
      record.blocked = false;
      if (record.failed) releaseVideo(record);
    }
    syncVideos();
  });
  return record;
}

// Each lightweight preview belongs to one real scene. The old composite film
// had no reliable scene cue sheet and could label a hospital as a winery.
const heroVideo = makeVideo('arHero', 'arMotion', 'hospital', hero);
// The alpha home has no sector preview inside the hero controller (SectorAtlas owns it).
const sectorVideo = byId('sectorVideo') ? makeVideo('sectorVideo', 'sectorMotion', 'aeropuerto', byId('sectorVideo').parentElement) : null;
const videos = [heroVideo, sectorVideo].filter(Boolean);

function updateControls(record) {
  if (record === heroVideo) {
    updateCinemaUI();
    return;
  }
  const playing = !record.video.paused || (record.pending && wantedVideo === record);
  record.button.textContent = record.failed ? 'Reintentar recorrido' : playing ? 'Pausar recorrido' : record.video.getAttribute('src') ? 'Reanudar recorrido' : 'Reproducir recorrido';
  record.button.setAttribute('aria-label', `${record.button.textContent}: ${record === heroVideo ? 'portada' : sceneTitles[sceneKeys.indexOf(record.key)]}`);
}

function releaseVideo(record) {
  record.version++;
  record.pending = false;
  record.failed = false;
  record.video.pause();
  record.video.removeAttribute('src');
  record.video.classList.remove('on');
  record.video.load();
}

function syncVideos() {
  if (heroState !== 'live' && heroVideo.key !== cinema.scene) {
    releaseVideo(heroVideo);
    heroVideo.key = cinema.scene;
    heroVideo.video.poster = `/cine/media/recorrido-${cinema.scene}-poster.jpg`;
  }
  const eligible = videos.filter((record) => record.visible > 0.1 && !record.userPaused && !record.blocked && !record.failed && (!limitsMotion() || record.explicit));
  wantedVideo = !document.hidden && heroState !== 'live' && !activeCard ? eligible.sort((a, b) => b.visible - a.visible)[0] || null : null;
  for (const record of videos) {
    if (record !== wantedVideo) {
      record.video.pause();
      updateControls(record);
      continue;
    }
    if (!record.video.getAttribute('src')) {
      record.video.src = videoSource(record.key);
      record.video.preload = 'metadata';
      record.video.load();
    }
    if (!record.pending && record.video.paused) {
      const version = record.version;
      record.pending = true;
      record.video.play().then(() => {
        if (version !== record.version) return;
        record.pending = false;
        if (wantedVideo !== record || document.hidden) record.video.pause();
        updateControls(record);
      }).catch((error) => {
        if (version !== record.version) return;
        record.pending = false;
        if (error.name !== 'AbortError') record.blocked = true;
        updateControls(record);
      });
    }
    updateControls(record);
  }
}

function updateCinemaUI() {
  const index = sceneKeys.indexOf(cinema.scene);
  const playing = heroState === 'live'
    ? cinema.playing && !engineSuspended && !document.hidden
    : !heroVideo.video.paused || (heroVideo.pending && wantedVideo === heroVideo);
  hero.dataset.scene = cinema.scene;
  hero.dataset.mode = cinema.mode;
  hero.classList.toggle('is-playing', playing);
  hero.classList.toggle('is-exploring', cinema.exploring);
  byId('cinemaStudyNav').hidden = !hospitalStudy;
  document.querySelector('.cinema-modes').hidden = Boolean(hospitalStudy);
  byId('cinemaStudyNav').querySelectorAll('a').forEach((link) => {
    if (link.dataset.study === hospitalStudy) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  sceneButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.cinemaScene === cinema.scene)));
  modeButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.cinemaMode === cinema.mode)));
  byId('cinemaSceneTitle').textContent = sceneTitles[index];
  byId('cinemaDescription').textContent = heroState === 'live' && cinema.caption ? cinema.caption : sceneDescriptions[index];
  byId('cinemaStep').textContent = `${String(index + 1).padStart(2, '0')} / 04`;
  byId('cinemaModeLabel').textContent = heroState === 'live' ? hospitalStudy ? 'Estudio de luz y detalle · plano fijo' : modeLabels[cinema.mode] : 'Vista previa';
  byId('cinemaProgress').style.transform = `scaleX(${Math.max(0, Math.min(1, cinema.progress))})`;
  const state = cinema.exploring ? 'Exploración libre' : heroState === 'live' ? 'Movie 3D' : 'Vista cinematográfica';
  const paused = !playing ? ' · en pausa' : '';
  byId('arNow').querySelector('span').textContent = `${state}${paused} · Visualización conceptual`;
  heroVideo.button.textContent = playing || (heroState === 'loading' && cinema.playing) ? 'Pausar' : 'Reproducir';
  heroVideo.button.setAttribute('aria-label', `${heroVideo.button.textContent}: ${sceneTitles[index]}`);
  heroVideo.button.setAttribute('aria-pressed', String(!cinema.playing));
  back.hidden = !cinema.exploring;
  zone.setAttribute('aria-pressed', String(cinema.exploring));
  if (heroFrame) {
    heroFrame.tabIndex = cinema.exploring ? 0 : -1;
    heroFrame.style.pointerEvents = cinema.exploring ? 'auto' : 'none';
    heroFrame.title = `Movie 3D: ${sceneTitles[index]}`;
  }
}

heroVideo.video.addEventListener('timeupdate', () => {
  if (heroState === 'live' || explicitCinema) return;
  const duration = heroVideo.video.duration;
  if (!Number.isFinite(duration) || duration <= 0) return;
  cinema.progress = heroVideo.video.currentTime / duration;
  updateCinemaUI();
});

function setFeedback(text, isError = false) {
  feedbackText.textContent = text;
  feedback.hidden = !text;
  retry.hidden = !isError;
}

function command(action, value) {
  const payload = value ?? (action === 'explore' || action === 'suspend' ? true : undefined);
  heroFrame?.contentWindow?.postMessage({ type: 'um-cinema-command', action, value: payload }, location.origin);
}

// Unloading the only owned iframe releases its WebGL context and model assets.
function releaseHero() {
  clearTimeout(readyTimeout);
  clearTimeout(releaseTimeout);
  command('suspend');
  heroFrame?.remove();
  heroFrame = null;
  heroState = 'idle';
  engineSuspended = false;
  cinema.exploring = false;
  hero.classList.remove('is-live', 'is-loading', 'is-exploring');
  hero.removeAttribute('aria-busy');
  updateCinemaUI();
}

function fallbackCinema(message) {
  cinemaFailed = true;
  releaseHero();
  setFeedback(message, true);
  syncVideos();
}

function mayRunCinema() {
  return initialPaintReady && !document.hidden && heroVideo.visible > 0.1 && !activeCard && !cinemaFailed
    && (explicitCinema || ((finePointer.matches || innerWidth > 820) && !limitsMotion() && (cinema.playing || heroFrame)));
}

function loadCinema() {
  if (heroFrame || !mayRunCinema()) return;
  clearTimeout(releaseTimeout);
  engineSuspended = false;
  slowSamples = 0;
  heroState = 'loading';
  hero.classList.add('is-loading');
  hero.setAttribute('aria-busy', 'true');
  if (explicitCinema) setFeedback('Preparando la escena…');
  const frame = document.createElement('iframe');
  frame.id = 'arLive';
  frame.title = `Movie 3D: ${sceneTitles[sceneKeys.indexOf(cinema.scene)]}`;
  frame.tabIndex = -1;
  frame.setAttribute('aria-label', frame.title);
  const query = new URLSearchParams({ scene: cinema.scene, mode: cinema.mode, embed: '1' });
  if (hospitalStudy) query.set('plano', hospitalStudy);
  frame.src = `/3d/cinema.html?${query}`;
  frame.addEventListener('error', () => {
    if (heroFrame === frame) fallbackCinema('La escena no pudo cargar. La vista previa sigue disponible; podés reintentar el 3D.');
  });
  heroFrame = frame;
  stage.appendChild(frame);
  readyTimeout = setTimeout(() => {
    if (heroFrame === frame && heroState === 'loading') fallbackCinema('La escena está tardando en cargar. Podés seguir con la vista previa o reintentar el 3D.');
  }, 30000);
  updateCinemaUI();
  syncVideos();
}

function syncCinema() {
  if (mayRunCinema()) {
    clearTimeout(releaseTimeout);
    if (!heroFrame) loadCinema();
    else if (engineSuspended) {
      engineSuspended = false;
      command('suspend', false);
      command('resume');
      if (!cinema.playing) command('pause');
      if (cinema.exploring) command('explore');
    }
  } else if (heroFrame) {
    if (!engineSuspended) {
      engineSuspended = true;
      command('suspend');
      // Preserve the frame during a brief scroll; release memory after leaving.
      releaseTimeout = setTimeout(() => {
        if (!mayRunCinema()) { releaseHero(); syncVideos(); }
      }, 1800);
    }
  }
  syncVideos();
  updateCinemaUI();
}

function activateCinema() {
  explicitCinema = true;
  cinemaFailed = false;
  initialPaintReady = true;
  heroVideo.explicit = true;
  heroVideo.blocked = false;
  if (heroVideo.failed) releaseVideo(heroVideo);
  closeCard(false, false);
}

function leaveExploration(restoreFocus = true) {
  cinema.exploring = false;
  command('resume');
  if (!cinema.playing) command('pause');
  if (restoreFocus && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  updateCinemaUI();
}

zone.addEventListener('click', () => {
  activateCinema();
  returnFocus = zone;
  cinema.exploring = true;
  syncCinema();
  if (heroState === 'live') command('explore');
  back.focus({ preventScroll: true });
});
retry.addEventListener('click', () => {
  releaseHero();
  activateCinema();
  setFeedback('');
  syncCinema();
});
back.addEventListener('click', () => leaveExploration());

sceneButtons.forEach((button) => button.addEventListener('click', () => {
  hospitalStudy = null;
  activateCinema();
  cinema.scene = button.dataset.cinemaScene;
  cinema.progress = 0;
  cinema.phase = cinema.caption = '';
  syncCinema();
  if (heroState === 'live') command('scene', cinema.scene);
  updateCinemaUI();
}));
modeButtons.forEach((button) => button.addEventListener('click', () => {
  hospitalStudy = null;
  activateCinema();
  cinema.mode = button.dataset.cinemaMode;
  cinema.progress = 0;
  cinema.phase = cinema.caption = '';
  syncCinema();
  if (heroState === 'live') command('mode', cinema.mode);
  updateCinemaUI();
}));

heroVideo.button.addEventListener('click', () => {
  const wasPlaying = heroState === 'live' ? cinema.playing : !heroVideo.video.paused || heroVideo.pending || (heroState === 'loading' && cinema.playing);
  cinema.playing = !wasPlaying;
  if (cinema.playing) hospitalStudy = null;
  heroVideo.userPaused = wasPlaying;
  if (!wasPlaying) {
    heroVideo.explicit = true;
    heroVideo.blocked = false;
    if (heroVideo.failed) releaseVideo(heroVideo);
  }
  if (heroFrame) command(cinema.playing ? 'play' : 'pause');
  syncCinema();
});

// A same-origin message must also come from the iframe currently owned by us.
window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || !heroFrame || event.source !== heroFrame.contentWindow) return;
  if (!event.data || typeof event.data !== 'object') return;
  const { type } = event.data;
  if (type === 'um-cinema-ready' && heroState === 'loading') {
    clearTimeout(readyTimeout);
    heroState = 'live';
    hero.classList.remove('is-loading');
    hero.classList.add('is-live');
    hero.removeAttribute('aria-busy');
    setFeedback('');
    if (!hospitalStudy) {
      command('scene', cinema.scene);
      command('mode', cinema.mode);
    }
    command(cinema.playing ? 'play' : 'pause');
    if (cinema.exploring) command('explore');
    if (engineSuspended || !mayRunCinema()) command('suspend');
    syncVideos();
    updateCinemaUI();
  } else if (type === 'um-cinema-state' && heroState === 'live') {
    const state = event.data;
    if (sceneKeys.includes(state.scene)) cinema.scene = state.scene;
    if (Object.hasOwn(modeLabels, state.mode)) cinema.mode = state.mode;
    if (typeof state.playing === 'boolean' && !engineSuspended) cinema.playing = state.playing;
    if (typeof state.exploring === 'boolean') cinema.exploring = state.exploring;
    if (Number.isFinite(state.progress)) cinema.progress = Math.max(0, Math.min(1, state.progress));
    if (typeof state.phase === 'string') cinema.phase = state.phase;
    if (typeof state.caption === 'string') cinema.caption = state.caption;
    heroVideo.userPaused = !cinema.playing;
    updateCinemaUI();
  } else if (type === 'um-cinema-exit') leaveExploration();
  else if (type === 'um-cinema-error') fallbackCinema('La escena 3D no está disponible en este dispositivo. La vista previa sigue disponible; podés reintentar.');
  else if (type === 'um-cinema-performance') {
    slowSamples = event.data.slow === true ? slowSamples + 1 : 0;
    if (slowSamples >= 3) fallbackCinema('Seguimos con la vista cinematográfica para mantener un movimiento fluido. Podés reintentar el 3D.');
  }
});

function closeCard(restoreFocus = true, resumeHero = true) {
  if (!activeCard) return;
  const { card, frame, button, stage: cardStage } = activeCard;
  activeCard = null;
  frame.remove();
  cardStage.classList.remove('live');
  card.classList.remove('expanded');
  if (restoreFocus) button.focus({ preventScroll: true });
  if (resumeHero) syncCinema();
  else syncVideos();
}

document.querySelectorAll('[data-open]').forEach((button) => {
  button.addEventListener('click', () => {
    const cardStage = button.closest('.stage');
    if (activeCard?.stage === cardStage) return;
    releaseHero();
    setFeedback('');
    closeCard(false, false);
    const card = button.closest('.scene');
    const frame = document.createElement('iframe');
    frame.src = cardStage.dataset.src;
    frame.title = button.textContent.replace('Abrir', 'Explorar');
    frame.allow = 'fullscreen';
    frame.allowFullscreen = true;
    activeCard = { card, stage: cardStage, frame, button };
    frame.addEventListener('load', () => {
      if (activeCard?.frame !== frame) return;
      try {
        frame.contentDocument.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && activeCard?.frame === frame) closeCard();
        });
        let attempts = 0;
        const seekCanvas = () => {
          if (activeCard?.frame !== frame) return;
          const canvas = frame.contentDocument?.querySelector('canvas');
          if (canvas) canvas.scrollIntoView({ block: 'start', behavior: 'instant' });
          else if (++attempts < 40) setTimeout(seekCanvas, 250);
        };
        seekCanvas();
      } catch { /* The close button stays usable if an embed redirects. */ }
    });
    cardStage.appendChild(frame);
    cardStage.classList.add('live');
    card.classList.add('expanded');
    let close = cardStage.querySelector('.close');
    if (!close) {
      close = document.createElement('button');
      close.type = 'button';
      close.className = 'btn line close';
      close.textContent = 'Cerrar escena ×';
      close.addEventListener('click', () => closeCard());
      cardStage.appendChild(close);
    }
    close.focus({ preventScroll: true });
    card.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    syncVideos();
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (cinema.exploring) leaveExploration();
  else closeCard();
});

document.querySelectorAll('.sectors button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.sectors button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    const key = button.dataset.scene;
    if (!sceneKeys.includes(key)) return;
    if (sectorVideo.key !== key) {
      releaseVideo(sectorVideo);
      sectorVideo.key = key;
      sectorVideo.video.poster = `/cine/media/recorrido-${key}-poster.jpg`;
    }
    byId('sectorLabel').textContent = `${button.textContent.replace(/^\d+/, '').trim()} · gemelo digital del sector`;
    // Selecting a sector keeps a deliberately paused/reduced-motion video paused.
    syncVideos();
  });
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const record = videos.find((item) => item.visibilityTarget === entry.target);
      if (record) record.visible = entry.isIntersecting ? entry.intersectionRatio : 0;
    }
    syncCinema();
  }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
  videos.forEach((record) => observer.observe(record.visibilityTarget));
} else {
  const measure = () => {
    videos.forEach((record) => {
      const rect = record.visibilityTarget.getBoundingClientRect();
      record.visible = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 64)) / Math.max(1, rect.height);
    });
    syncCinema();
  };
  window.addEventListener('scroll', measure, { passive: true });
  window.addEventListener('resize', measure);
  measure();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) closeCard(false, false);
  syncCinema();
});
function preferencesChanged() {
  if (limitsMotion()) videos.filter((record) => !record.explicit).forEach(releaseVideo);
  syncCinema();
}
reducedMotion.addEventListener('change', preferencesChanged);
finePointer.addEventListener('change', syncCinema);
connection?.addEventListener('change', preferencesChanged);
window.addEventListener('resize', syncCinema);
window.addEventListener('pagehide', () => {
  clearTimeout(startupTimeout);
  releaseHero();
  closeCard(false, false);
  wantedVideo = null;
  videos.forEach(releaseVideo);
});
// The HTML, poster, and controls get their first paint before any 3D import.
requestAnimationFrame(() => requestAnimationFrame(() => {
  startupTimeout = setTimeout(() => { initialPaintReady = true; syncCinema(); }, 350);
}));
videos.forEach(updateControls);
