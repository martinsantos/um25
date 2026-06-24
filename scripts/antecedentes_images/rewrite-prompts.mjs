#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'work/antecedentes-images';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith('--') ? next : true;
    if (args[key] !== true) i += 1;
  }
  return args;
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted && ch === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function readManifest(lote) {
  const file = path.join(ROOT, 'lotes', lote, 'manifest.csv');
  const text = fs.readFileSync(file, 'utf8').trim();
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return lines.filter(Boolean).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function loteNumber(lote) {
  return Number(lote.match(/\d+$/)?.[0] ?? 0);
}

function listLotes() {
  return fs.readdirSync(path.join(ROOT, 'lotes'))
    .filter((entry) => /^lote_\d+$/.test(entry))
    .sort((a, b) => loteNumber(a) - loteNumber(b));
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function classify(item) {
  const titleText = normalize(item.titulo);
  const coreText = normalize([
    item.titulo,
    item.descripcion,
    item.area,
    item.unidad_de_negocio,
  ].join(' '));
  const text = normalize([
    item.titulo,
    item.descripcion,
    item.cliente,
    item.area,
    item.unidad_de_negocio,
  ].join(' '));

  if (hasAny(coreText, ['sirena', 'parlante con control remoto'])) {
    return 'sdi';
  }
  if (hasAny(titleText, ['software', 'digitalizacion', 'digitalizacion', 'procesos'])) {
    return 'software';
  }
  if (hasAny(titleText, ['ftth', 'ultima milla'])) {
    return 'network';
  }
  if (hasAny(titleText, ['telefono', 'telefonos', 'telefonia', 'ip phone'])) {
    return 'support';
  }
  if (hasAny(titleText, ['computadora', 'pc ', 'pc +', 'pc+', 'pc de', 'desktop', 'servidor', 'backup', 'disco duro', 'disco ssd', 'ssd', 'memoria ram', 'cpu', 'scanner', 'escaner', 'fuente de alimentacion', 'insumo informatica', 'insumo de informatica', 'insumos de informatica'])) {
    return 'hardware';
  }
  if (hasAny(titleText, ['control de asistencia', 'control de acceso', 'lector de barra', 'lectores de barra', 'biometrico', 'biometrica'])) {
    return 'access';
  }
  if (hasAny(titleText, ['cctv', 'videovigilancia', 'video vigilancia', 'monitoreo'])) {
    return 'cctv';
  }
  if (hasAny(titleText, ['deteccion', 'detector', 'humo', 'incendio', 'sdi', 'sirena', 'sensor', 'firewarden', 'notifier', 'balizamiento'])) {
    return 'sdi';
  }
  if (hasAny(titleText, ['fibra', 'optica', 'redes', 'cableado', 'patch', 'rack', 'ap,', 'access point', 'wifi', 'wi-fi', 'sfp', 'cable canal', 'cablecanal', 'faceplate', 'porta bastidor', 'puesto de datos', 'conectores lc', 'lc/pc', 'conector sc', 'sc/upc', 'drop flat', 'g657a2', 'enlace'])) {
    return 'network';
  }
  if (hasAny(coreText, ['disco', 'ssd', 'memoria ram', 'cpu', 'bateria', 'baterias', 'conector', 'balun', 'insumo', 'placa', 'bobina', 'amplificador'])) {
    return 'hardware';
  }
  if (hasAny(coreText, ['control de asistencia', 'control de acceso', 'lector de barra', 'lectores de barra', 'biometrico', 'biometrica'])) {
    return 'access';
  }
  if (hasAny(coreText, ['cctv', 'videovigilancia', 'video vigilancia', 'monitoreo', 'seguridad electronica'])) {
    return 'cctv';
  }
  if (hasAny(coreText, ['deteccion', 'detector', 'humo', 'incendio', 'sdi', 'sirena', 'sensor', 'firewarden', 'notifier', 'balizamiento'])) {
    return 'sdi';
  }
  if (hasAny(coreText, ['fibra', 'optica', 'redes', 'cableado', 'patch', 'rack', 'ap ', 'access point', 'utp', 'cat 6', 'internet', 'wifi', 'wi-fi', 'sfp', 'cable canal'])) {
    return 'network';
  }
  if (hasAny(coreText, ['soporte', 'infraestructura it', 'alta disponibilidad', 'telefonia', 'telefono', 'central'])) {
    return 'support';
  }
  if (hasAny(coreText, ['software', 'digitalizacion', 'digitalizacion', 'procesos', 'gmail', 'mail', 'correo'])) {
    return 'software';
  }
  if (hasAny(coreText, ['aeropuerto de', 'aeropuertos argentina', 'aa2000', 'df sarmiento', 'manga movil'])) {
    return 'airport';
  }
  return 'corporate';
}

function contextFor(item) {
  const titleText = normalize([item.titulo, item.descripcion].join(' '));
  const clientText = normalize(item.cliente);
  const text = normalize([item.titulo, item.descripcion, item.cliente].join(' '));
  if (hasAny(text, ['hospital', 'fuesmen', 'centro de salud', 'perrupato', 'schestakow'])) return 'hospital o centro de salud, pasillos limpios y cielorraso tecnico, sin pacientes';
  if (hasAny(titleText, ['wifi evento', 'evento alta gama'])) return 'salon de evento, espacio corporativo temporal o area tecnica discreta de evento, sin marcas ni invitados identificables';
  if (hasAny(text, ['evento para', 'vento para', 'evento 50 personas', '200 personas', '300 personas', '50 personas', '1 ap', 'equipamiento wifi', 'soporte por 4 dias'])) return 'salon de evento, predio corporativo temporal o sala tecnica discreta de evento, sin marcas ni invitados identificables';
  if (hasAny(text, ['conectividad en eventos', 'costos por puesto', 'persona conectada', 'configuracion por vlan', 'ssid'])) return 'salon de evento, predio corporativo temporal o sala tecnica discreta de evento, sin marcas ni invitados identificables';
  if (hasAny(text, ['evento de los pumas', 'headcomm'])) return 'recinto deportivo o sala tecnica temporal de evento, sin escudos, logos ni personas identificables';
  if (hasAny(text, ['rugby championship', 'evento rugby', 'champioship'])) return 'recinto deportivo o sala tecnica temporal de evento, sin logos, escudos ni personas identificables';
  if (hasAny(text, ['autodromo', 'circuito'])) return 'autodromo o sala tecnica de circuito deportivo, sin logos, escudos ni personas identificables';
  if (hasAny(text, ['la casa del aroma'])) return 'oficina comercial o sala tecnica de pyme, sin carteleria ni datos personales visibles';
  if (hasAny(text, ['acceso norte'])) return 'sucursal u oficina corporativa de seguros, sin logos ni carteleria';
  if (hasAny(text, ['edificio calle', 'calle lavalle', 'primer edificio'])) return 'edificio corporativo u obra terminada con instalaciones a la vista, sin carteles';
  if (hasAny(text, ['casa ', 'vivienda', 'residencial'])) return 'vivienda u oficina domestica sobria, con terminaciones prolijas y sin datos personales visibles';
  if (hasAny(text, ['estadio', 'malvinas', 'secretaria de deporte'])) return 'estadio o recinto deportivo, sala tecnica de graderias o area operativa, sin carteleria ni personas identificables';
  if (hasAny(text, ['bodega', 'vinedo', 'vina', 'antigal', 'caro', 'esmeralda', 'lecumberri'])) return 'bodega mendocina con tanques, barricas o sala tecnica, sin marca visible';
  if (hasAny(text, ['camara de comercio'])) return 'oficina institucional corporativa, sala de reuniones o area administrativa, sin carteleria visible';
  if (hasAny(text, ['call center', '30 puestos', '20 puestos', '10 puestos'])) return 'oficinas corporativas o call center institucional, puestos desocupados y sin datos personales visibles';
  if (hasAny(text, ['poder judicial'])) return 'oficina judicial o administrativa institucional, sin escudos ni simbolos visibles';
  if (hasAny(text, ['universidad', 'univercidad', 'maza', 'aconcagua'])) return 'edificio universitario o institucional limpio, sin carteleria ni escudos visibles';
  if (hasAny(text, ['camara de senadores', 'h. camara de senadores', 'recinto'])) return 'recinto legislativo o sala institucional sobria, sin escudos ni carteleria';
  if (hasAny(text, ['triunfo cooperativa', 'cooperativa de seguros', 'seguros'])) return 'oficina institucional de seguros, sala operativa o area administrativa sobria, sin logos ni carteleria';
  if (hasAny(text, ['camping'])) return 'predio municipal al aire libre o sala tecnica pequena de camping, sin carteleria ni personas identificables';
  if (hasAny(titleText, ['ftth', 'tendido de red de fibra', 'tendido de red de fo'])) return 'via publica municipal, poste bajo, camara tecnica exterior o vereda en obra prolija, sin carteleria ni personas identificables';
  if (hasAny(text, ['irrigacion', 'riego', 'distribucion de agua'])) return 'oficina tecnica de gestion hidrica o sala operativa de riego, sin logos ni carteleria';
  if (hasAny(text, ['montecaseros', 'cauces derivados', 'cauces'])) return 'oficina tecnica de gestion hidrica o sala operativa de riego, sin logos ni carteleria';
  if (hasAny(text, ['municipalidad', 'gobierno', 'afip', 'administracion federal', 'ministerio', 'fondo para la transformacion'])) return 'oficina publica o sala operativa institucional sobria, sin escudos ni carteleria';
  if (hasAny(clientText, ['aeropuertos argentina', 'copa airlines']) || hasAny(titleText, ['aeropuerto de', 'aeropuertos argentina', 'avianca', 'aa2000', 'df sarmiento', 'manga movil', 'copa airlines'])) return 'terminal aeroportuaria o area tecnica de aeropuerto, sin logos';
  if (hasAny(text, ['hotel', 'sheraton', 'fuente mayor'])) return 'hotel o corredor corporativo de alto transito, sin marca visible';
  if (hasAny(text, ['obrador', 'obradores', 'carcel federal'])) return 'obrador modular de obra publica o campamento tecnico de construccion, sin carteleria ni personas identificables';
  if (hasAny(text, ['edificio', 'torre', 'kristich', 'construcciones', 'obra'])) return 'edificio corporativo u obra terminada con instalaciones a la vista, sin carteles';
  if (hasAny(text, ['fabrica', 'planta', 'industria', 'flexcolor', 'cela', 'quilmes', 'nucete'])) return 'planta industrial limpia o nave de servicios, con infraestructura tecnica visible';
  return 'entorno corporativo argentino realista, limpio y tecnico';
}

const RECIPES = {
  airport: [
    ['sensorizacion en manga movil', 'plano general bajo cielorraso de terminal con detectores, canalizacion metalica y una manga de embarque insinuada al fondo'],
    ['tablero tecnico aeroportuario', 'plano detalle de tablero de baja tension o SDI abierto, con cables rotulados sin texto legible y pista desenfocada al fondo'],
    ['cableado en terminal', 'linea de fuga de bandejas portacables y conduits sobre un corredor de embarque vacio'],
  ],
  cctv: [
    ['camara instalada en arquitectura real', 'contrapicado suave a una camara domo o bullet montada en esquina, con cableado prolijo y profundidad de pasillo'],
    ['puesto de verificacion sin operador protagonista', 'monitor generico desenfocado con cuadriculas abstractas no legibles y camara fisica en primer plano'],
    ['mantenimiento de camara', 'primer plano de manos ajustando soporte o lente de CCTV con herramientas sobre escalera parcial, sin rostro'],
  ],
  sdi: [
    ['deteccion de incendio en contexto', 'plano lateral de detector, pulsador rojo y sirena sobre pared real con conduit metalico visible'],
    ['mesa tecnica de SDI', 'cenital de detectores, bases, borneras, cable rojo/negro y multimetro sobre banco de trabajo'],
    ['central y perifericos', 'plano medio de central de incendio roja en pared, con dispositivos de campo instalados alrededor'],
    ['cielorraso tecnico', 'linea de fuga de detectores de humo y luces de emergencia en pasillo o nave, sin personas'],
  ],
  network: [
    ['fibra optica en detalle', 'macro de fusionadora, bandeja de empalme o cordones de fibra con medidor optico sobre mesa tecnica'],
    ['cableado estructurado instalado', 'plano ancho de bandejas y bajadas a puestos de trabajo, con patch cords como detalle secundario'],
    ['certificacion de red', 'primer plano de tester de cableado y roseta RJ45 en puesto real, sin mostrar marcas'],
    ['punto de acceso instalado', 'contrapicado limpio a access point en cielorraso con cableado oculto y oficina desenfocada'],
  ],
  software: [
    ['digitalizacion operativa', 'mesa de oficina publica con tablet o monitor mostrando interfaz abstracta sin texto legible, documentos y lector de codigo'],
    ['flujo de procesos', 'plano medio de tablero kanban fisico desenfocado, laptop con dashboard abstracto y manos revisando datos'],
    ['puesto de control', 'vista oblicua de pantalla con mapa o trazabilidad generica, teclado y credenciales anonimas, sin personas identificables'],
  ],
  support: [
    ['alta disponibilidad compacta', 'plano detalle de kit compacto de continuidad IT sobre estante o mesa tecnica: UPS pequena, router, switch, patch cords, fuentes y tester, sin operador sentado, sin rack completo y sin pantallas de monitoreo'],
    ['telefonia y soporte', 'puesto administrativo con telefono IP, patchera pequena y herramientas de diagnostico sobre escritorio'],
    ['monitoreo tecnico discreto', 'tablet con graficas abstractas junto a equipamiento de red compacto y cableado prolijo'],
  ],
  access: [
    ['control de asistencia instalado', 'terminal de asistencia o lector biometrico montado junto a puerta tecnica, con canalizacion prolija'],
    ['lectores y perifericos en mesa tecnica', 'camara web compacta, lector de codigo de barras, cables USB y base de montaje sobre banco de trabajo'],
    ['punto de control operativo', 'lector de acceso o asistencia conectado a una pequena controladora, con credenciales anonimas sin texto legible'],
  ],
  hardware: [
    ['insumos sobre banco tecnico', 'cenital ordenado de componentes reales, fuente, conectores, cables, baterias o disco, con textura de taller limpio'],
    ['pieza instalada', 'primer plano de componente reemplazado conectado en gabinete mural o caja tecnica, con tornilleria y cableado visible'],
    ['diagnostico de hardware', 'mesa de trabajo con multimetro, disco externo o placa, manos parciales usando herramienta, sin rostro'],
  ],
  corporate: [
    ['infraestructura puntual', 'plano detalle de equipamiento tecnico pequeno instalado en pared o cielorraso, evitando sala de servidores generica'],
    ['operacion sobria', 'escena de trabajo con dispositivos tecnicos y documentacion anonima, sin logos y sin rostros'],
    ['evidencia de instalacion', 'vista de cableado, canalizacion o dispositivo final en contexto real del cliente, con buena profundidad'],
  ],
};

const COMPOSITIONS = [
  'usar lente documental 35mm, perspectiva natural, profundidad media',
  'usar plano detalle con profundidad de campo corta, textura tecnica visible',
  'usar plano general ambiental para mostrar contexto, dispositivo como evidencia clara',
  'usar toma cenital ordenada sobre banco tecnico, sin parecer catalogo de stock',
  'usar contrapicado suave hacia cielorraso o pared tecnica, lineas arquitectonicas limpias',
  'usar vista oblicua a 45 grados, materiales reales y pequenas imperfecciones creibles',
  'usar primer plano de manos o herramientas solo si aporta escala; no mostrar rostro',
  'usar plano lateral con conduits, canaletas o cableado guiando la mirada',
  'usar composicion con primer plano tecnico y fondo contextual desenfocado',
  'usar encuadre amplio horizontal 16:10 con espacio negativo util para card web',
];

function compositionFor(kind, index) {
  const composition = COMPOSITIONS[index % COMPOSITIONS.length];
  if (kind === 'software' && (
    composition.includes('conduits') ||
    composition.includes('canaletas') ||
    composition.includes('contrapicado')
  )) {
    return 'usar vista oblicua de mesa de proyecto o puesto de trabajo, pantalla abstracta sin texto y contexto institucional desenfocado';
  }
  return composition;
}

function recipeFor(item, kindIndex) {
  const kind = classify(item);
  const titleText = normalize(item.titulo);
  const coreText = normalize([item.titulo, item.descripcion, item.area, item.cliente].join(' '));
  const clientText = normalize(item.cliente);
  if (hasAny(titleText, ['insumos de networking'])) {
    return {
      kind: 'hardware',
      name: 'kit de insumos de networking',
      scene: 'kit de insumos de networking sobre banco tecnico industrial: switch compacto, access point generico, conectores RJ45, keystones, patch cords, pinza crimpeadora, tester de red, fuentes y cajas anonimas abiertas, sin parecer gondola retail',
    };
  }
  if (hasAny(titleText, ['diagnostico de infraestructura it'])) {
    return {
      kind: 'support',
      name: 'diagnostico de infraestructura IT',
      scene: 'mesa de diagnostico IT en planta industrial con notebook de diagnostico abstracto sin texto, router compacto, switch pequeno, UPS secundaria, tester de red, multimetro, patch cords y checklist anonimo dado vuelta, sin gabinete ni rack protagonista',
    };
  }
  if (hasAny(titleText, ['trabajos varios mes de agosto'])) {
    return {
      kind: 'support',
      name: 'mantenimiento tecnico mensual',
      scene: 'mesa de cierre de mantenimiento mensual en planta industrial con router compacto, fuente, inyector PoE, patch cords, tester, destornilladores, canaleta corta, conectores y hoja de trabajo en blanco, escena de servicio tecnico variado sin dispositivo unico dominante',
    };
  }
  if (hasAny(titleText, ['lpn-13', 'licitacion ufi'])) {
    return {
      kind: 'hardware',
      name: 'provision municipal de equipos informaticos y conectividad',
      scene: 'deposito u oficina publica sobria con PCs y monitores genericos preparados junto a switches compactos, access points, patch cords, fuentes, cajas anonimas y checklist en blanco, sin escudos ni carteleria',
    };
  }
  if (hasAny(titleText, ['provision anual de equipos e insumos'])) {
    return {
      kind: 'hardware',
      name: 'provision anual de equipos e insumos',
      scene: 'preparacion anual de equipos e insumos sobre banco tecnico industrial: routers, switches compactos, fuentes, patch cords, conectores, pequenos perifericos, cajas anonimas abiertas, tester y hoja de control en blanco, sin etiquetas legibles',
    };
  }
  if (hasAny(titleText, ['provision de equipamiento para periodo 2016'])) {
    return {
      kind: 'hardware',
      name: 'provision de equipamiento tecnologico',
      scene: 'equipamiento tecnologico preparado para periodo anual en banco tecnico industrial: PCs compactas o mini PCs, router, switch pequeno, access point, fuentes, patch cords, cajas anonimas y hoja de control en blanco, sin logos ni etiquetas legibles',
    };
  }
  if (hasAny(titleText, ['sitio web tnc'])) {
    return {
      kind: 'software',
      name: 'sitio web corporativo TNC',
      scene: 'mesa de proyecto web en planta industrial con notebook y tablet mostrando wireframes abstractos sin texto, router compacto, cable de red, documentos anonimos dados vuelta y entorno de oficina tecnica desenfocado',
    };
  }
  if (hasAny(titleText, ['ampliacion clinica de cuyo con di'])) {
    return {
      kind: 'sdi',
      name: 'deteccion de incendio para ampliacion clinica',
      scene: 'pasillo limpio de clinica u hospital con detector de humo, pulsador rojo, sirena y conduit prolijo instalados en pared o cielorraso, multimetro o herramienta secundaria, sin pacientes ni rostros',
    };
  }
  if (hasAny(coreText, ['central telefonica y call center']) && hasAny(clientText, ['guaymallen'])) {
    return {
      kind: 'support',
      name: 'central telefonica y call center municipal',
      scene: 'mesa tecnica de call center municipal con central PBX/VoIP generica, telefonos de escritorio y headsets vistos de costado, pequeno switch, patch cords, tester y puestos desocupados desenfocados, sin escudos ni pantallas legibles',
    };
  }
  if (hasAny(titleText, ['provision de 50 telefonos analogicos', '19 headset'])) {
    return {
      kind: 'support',
      name: 'provision de telefonos analogicos y headsets',
      scene: 'lote de telefonos analogicos genericos y headsets preparados sobre banco tecnico industrial, cajas anonimas abiertas, cables espiralados, patch cords, tester y hoja de control en blanco, telefonos de costado sin teclas ni pantallas legibles',
    };
  }
  if (hasAny(coreText, ['hospital perrupato']) && hasAny(coreText, ['corrientes debiles', 'ampliacion'])) {
    return {
      kind: 'network',
      name: 'corrientes debiles para ampliacion hospitalaria',
      scene: 'sector de ampliacion hospitalaria limpio con canalizacion de corrientes debiles, cajas de paso, tomas RJ45, cableado de alarma/datos, detector secundario, tester y herramientas sobre carro tecnico, sin pacientes ni rostros',
    };
  }
  if (hasAny(coreText, ['sistema de deteccion de incendio para aeropuerto argentina 2000'])) {
    return {
      kind: 'sdi',
      name: 'deteccion de incendio en terminal aeroportuaria',
      scene: 'detector de humo, pulsador rojo y sirena instalados con conduit metalico en terminal aeroportuaria, puerta tecnica o manga de embarque desenfocada al fondo, multimetro secundario, sin logos',
    };
  }
  if (hasAny(coreText, ['mercado pago', 'modulo de creacion de notas de pedido'])) {
    return {
      kind: 'software',
      name: 'integracion de pagos API y notas de pedido',
      scene: 'mesa de integracion de software en planta alimenticia con laptop y tablet mostrando flujo abstracto de pedidos y pagos sin texto ni marcas, lector o terminal generico secundario, router compacto, cable de red y documentos anonimos dados vuelta',
    };
  }
  if (hasAny(coreText, ['finca lecumberri'])) {
    return {
      kind: 'network',
      name: 'servicio de internet para finca',
      scene: 'instalacion de internet en finca mendocina con radio CPE o antena exterior en mastil bajo, cable UTP entrando a caja estanca, inyector PoE, router compacto y tester, con hileras de vid o galpon agricola desenfocado, sin marcas',
    };
  }
  if (hasAny(titleText, ['canalizacion de sdi']) && hasAny(coreText, ['aeropuerto de mendoza'])) {
    return {
      kind: 'sdi',
      name: 'canalizacion SDI en sala de maquinas aeroportuaria',
      scene: 'sala de maquinas aeroportuaria con conduit metalico y cable rojo/negro de SDI siguiendo bandeja o pared tecnica, caja de paso abierta, detector o modulo secundario, multimetro y herramientas sobre carro, sin logos',
    };
  }
  if (hasAny(titleText, ['soluciones tecnologicas web']) && hasAny(clientText, ['nucete'])) {
    return {
      kind: 'software',
      name: 'web industrial confidencial',
      scene: 'mesa de proyecto web en planta alimenticia limpia con laptop y tablet mostrando wireframes abstractos sin texto, router compacto, cable de red, documentos anonimos dados vuelta y equipos industriales desenfocados',
    };
  }
  if (hasAny(titleText, ['provision de equipamiento para cumbre de mercosur'])) {
    return {
      kind: 'hardware',
      name: 'provision de equipamiento para cumbre institucional',
      scene: 'preparacion de equipamiento para evento institucional en sala de conferencia publica: access points, routers compactos, switches pequenos, notebooks genericas, radios o headsets, cajas de transporte anonimas y checklist en blanco, sin banderas ni escudos',
    };
  }
  if (hasAny(titleText, ['servicios de infraestructura para cumbre mercosur'])) {
    return {
      kind: 'network',
      name: 'infraestructura temporal para cumbre institucional',
      scene: 'mesa tecnica y piso tecnico temporal de evento institucional con switch compacto, access points, patch cords, cableado canalizado hacia puestos desocupados, tester de red y sala de conferencias desenfocada, sin banderas, escudos ni carteleria',
    };
  }
  if (hasAny(titleText, ['alarma instruccion psa'])) {
    return {
      kind: 'sdi',
      name: 'alarma e instruccion tecnica aeroportuaria',
      scene: 'aula o sala tecnica aeroportuaria con tablero didactico anonimo de alarma, detector, pulsador rojo, sirena, cables de prueba, multimetro y herramientas, terminal o pasillo aeroportuario desenfocado al fondo, sin logos ni uniformes',
    };
  }
  if (hasAny(titleText, ['alarma de instruccion psa'])) {
    return {
      kind: 'sdi',
      name: 'alarma de instruccion tecnica PSA',
      scene: 'mesa de instruccion tecnica de alarma con tablero didactico anonimo, detector, pulsador rojo, sirena, cables de prueba, borneras, multimetro y herramientas, en aula sobria de seguridad aeroportuaria sin logos ni uniformes',
    };
  }
  if (hasAny(coreText, ['edificio calle 25 de mayo', 'kristich'])) {
    return {
      kind: 'network',
      name: 'corrientes debiles en edificio residencial',
      scene: 'palier o sala tecnica de edificio residencial terminado con gabinete de telecomunicaciones de baja tension, caja de paso abierta, rosetas RJ45, cableado ordenado, tester y herramientas, sin carteles ni personas',
    };
  }
  if (hasAny(titleText, ['deteccion de incendios seguridad sdi']) && hasAny(clientText, ['cela'])) {
    return {
      kind: 'sdi',
      name: 'SDI industrial para Cela',
      scene: 'planta industrial limpia con detector de humo, pulsador rojo y sirena instalados junto a conduit metalico y bandeja tecnica, modulo de lazo o multimetro secundario sobre carro, sin logos',
    };
  }
  if (hasAny(coreText, ['palacio policial'])) {
    return {
      kind: 'sdi',
      name: 'SDI institucional en palacio policial',
      scene: 'pasillo institucional sobrio con detector de humo, pulsador rojo, sirena y conduit prolijo instalados en pared antigua o palier administrativo, carro tecnico con multimetro y herramientas, sin escudos ni uniformes',
    };
  }
  if (hasAny(titleText, ['cliente confidencial (12)']) && hasAny(titleText, ['implementacion de redes de datos y fibra optica'])) {
    return {
      kind: 'network',
      name: 'red mixta datos/fibra en oficina industrial',
      scene: 'mesa tecnica de oficina industrial con mini caja de terminacion optica, patchera pequena, cordones de fibra amarillos, patch cords azules, switch compacto, medidor optico y tester, sin gabinete frontal dominante',
    };
  }
  if (hasAny(coreText, ['adecuacion y migracion sistema de incendios', 'detectores y barreras'])) {
    return {
      kind: 'sdi',
      name: 'migracion de sistema de incendio con barreras',
      scene: 'mesa de migracion SDI en planta industrial con detector, barrera optica lineal o emisor/receptor, modulo de lazo, cable rojo/negro, multimetro y notebook con panel abstracto sin texto, sin logos',
    };
  }
  if (hasAny(titleText, ['fuentes para telefonos ip'])) {
    return {
      kind: 'support',
      name: 'fuentes para telefonos IP',
      scene: 'lote de fuentes de alimentacion genericas para telefonos IP sobre banco tecnico industrial, telefonos IP de costado como referencia secundaria, cables, patch cords, tester y cajas anonimas abiertas, sin pantallas ni teclas legibles',
    };
  }
  if (hasAny(coreText, ['nuevos modulos para software de ventas'])) {
    return {
      kind: 'software',
      name: 'modulos de software de ventas',
      scene: 'mesa de desarrollo de software de ventas en planta industrial con laptop y tablet mostrando dashboard abstracto de ventas sin texto, tarjetas de proceso en blanco, router compacto, cable de red y documentos anonimos dados vuelta',
    };
  }
  if (hasAny(titleText, ['municipalidad guaymallen']) && hasAny(titleText, ['implementacion de redes de datos y fibra optica'])) {
    return {
      kind: 'network',
      name: 'red municipal de datos y fibra Guaymallen',
      scene: 'oficina publica sobria con gabinete mural compacto de fibra/datos, bandeja optica, patchera RJ45, cordones amarillos, patch cords azules, medidor optico, tester y canalizacion limpia, sin escudos ni carteles',
    };
  }
  if (hasAny(coreText, ['camarines sala de envasado gaseosas', 'corto electrico'])) {
    return {
      kind: 'support',
      name: 'diagnostico de corto electrico en sala de envasado',
      scene: 'sala de envasado de bebidas o camarines tecnicos con tablero electrico abierto desenergizado, termicas, canalizacion, multimetro, pinza amperometrica y herramientas de diagnostico sobre banco, sin chispas ni riesgo visible',
    };
  }
  if (hasAny(titleText, ['detector de humo psa'])) {
    return {
      kind: 'sdi',
      name: 'detector de humo PSA en aeropuerto',
      scene: 'detector de humo instalado en cielorraso tecnico de terminal aeroportuaria, conduit prolijo, pulsador o sirena secundaria, multimetro sobre carro tecnico y manga o pasillo de aeropuerto desenfocado, sin logos',
    };
  }
  if (hasAny(titleText, ['provision de 10 telefonos ip'])) {
    return {
      kind: 'support',
      name: 'provision de diez telefonos IP',
      scene: 'diez telefonos IP genericos preparados para entrega sobre banco tecnico industrial, algunos de costado y otros en cajas anonimas abiertas, patch cords, fuentes, switch PoE pequeno y tester, sin pantallas ni teclas legibles',
    };
  }
  if (hasAny(titleText, ['cliente confidencial (12)']) && hasAny(titleText, ['desarrollo de software'])) {
    return {
      kind: 'software',
      name: 'digitalizacion operativa industrial',
      scene: 'mesa de digitalizacion en planta alimenticia con tablet y laptop mostrando paneles abstractos sin texto, lector o periferico USB secundario, router compacto, cable de red, documentos anonimos dados vuelta y entorno industrial desenfocado',
    };
  }
  if (hasAny(titleText, ['montaje sirenas', 'avisos de emergencia en campo de vuelo'])) {
    return {
      kind: 'sdi',
      name: 'sirenas y avisos de emergencia en campo de vuelo',
      scene: 'sirena o baliza sonora exterior instalada en mastil o poste bajo del campo de vuelo, caja estanca, conduit, cableado prolijo, multimetro y herramientas en carro tecnico, pista o plataforma aeroportuaria desenfocada, sin logos',
    };
  }
  if (hasAny(titleText, ['sdi - adicional emilio civit'])) {
    return {
      kind: 'sdi',
      name: 'SDI adicional en edificio Emilio Civit',
      scene: 'central de incendio roja o modulo SDI instalado en pared de edificio administrativo, detector, pulsador, sirena y conduit prolijo alrededor, herramientas y multimetro secundarios, sin carteles',
    };
  }
  if (hasAny(titleText, ['alquiler de brazo hidraulico'])) {
    return {
      kind: 'support',
      name: 'brazo hidraulico para trabajo tecnico en altura',
      scene: 'brazo hidraulico o plataforma elevadora amarilla en planta industrial limpia, canasto elevado junto a cielorraso tecnico para instalacion de cableado o luminaria, herramientas y conos discretos, sin rostros visibles ni logos',
    };
  }
  if (hasAny(titleText, ['renovacion contratos web mza gob ar'])) {
    return {
      kind: 'software',
      name: 'renovacion de contratos web gubernamentales',
      scene: 'mesa de oficina publica con laptop y tablet mostrando interfaz web abstracta sin texto, carpetas y contratos con hojas en blanco dadas vuelta, sello generico sin marca, router compacto y cable de red, sin escudos ni carteleria',
    };
  }
  if (hasAny(titleText, ['provision de tablets'])) {
    return {
      kind: 'hardware',
      name: 'provision de tablets',
      scene: 'tablets genericas preparadas para entrega sobre banco tecnico industrial, algunas apagadas y otras con pantalla gris sin texto, cajas anonimas abiertas, cables de carga, router compacto y checklist en blanco, sin logos',
    };
  }
  if (hasAny(titleText, ['control de humo']) && hasAny(coreText, ['aa2000', 'francisco gabrielli'])) {
    return {
      kind: 'sdi',
      name: 'control de humo en terminal aeroportuaria',
      scene: 'cielorraso tecnico de terminal aeroportuaria con detectores de humo, rejillas o ductos de extraccion, compuerta o panel de control secundario apagado, herramientas en carro, pasillo de aeropuerto desenfocado, sin humo real ni logos',
    };
  }
  if (hasAny(coreText, ['sistemas de seguridad para moviles policiales'])) {
    return {
      kind: 'access',
      name: 'seguridad electronica para moviles policiales',
      scene: 'interior o baul tecnico de movil de seguridad anonimo con DVR/router vehicular, camara compacta, antena GPS, cableado de 12V, fusiblera y herramientas, sin escudos, patentes ni identificacion policial visible',
    };
  }
  if (hasAny(titleText, ['disco duro y ups'])) {
    return {
      kind: 'hardware',
      name: 'disco duro y UPS',
      scene: 'disco duro o unidad de almacenamiento sobre banco tecnico junto a UPS compacta, adaptador SATA/USB, cableado, multimetro o herramienta de diagnostico y equipo informatico secundario, sin etiquetas ni marcas visibles',
    };
  }
  if (hasAny(titleText, ['cctv - remplazo de materiales'])) {
    return {
      kind: 'cctv',
      name: 'reemplazo de materiales CCTV',
      scene: 'materiales de reemplazo CCTV sobre banco tecnico de oficina de seguros: camara domo, camara bullet, conectores, fuente, cable coaxial o UTP, herramientas y checklist en blanco, sin monitor de vigilancia ni logos',
    };
  }
  if (hasAny(titleText, ['proyector halogeno'])) {
    return {
      kind: 'support',
      name: 'proyector halogeno con tripode amarillo',
      scene: 'proyector halogeno doble de obra sobre tripode amarillo en planta industrial, cable enrollado, tablero o toma industrial cercana y herramientas, iluminacion de trabajo realista, sin marcas ni etiquetas visibles',
    };
  }
  if (hasAny(coreText, ['mantenimiento de cuatro tableros banco de capacitores'])) {
    return {
      kind: 'support',
      name: 'mantenimiento de tableros banco de capacitores',
      scene: 'cuatro modulos o tableros de banco de capacitores en sala de maquinas industrial, puertas abiertas desenergizadas, capacitores cilindricos, contactores, multimetro, pinza amperometrica y herramientas, sin chispas ni riesgo visible',
    };
  }
  if (hasAny(titleText, ['mejora en iluminacion de planta'])) {
    return {
      kind: 'support',
      name: 'mejora de iluminacion de planta',
      scene: 'planta industrial limpia con luminarias LED o proyectores instalados en altura, bandeja o conduit cercano, luxometro o multimetro y escalera/plataforma parcial como evidencia, sin rostros ni logos',
    };
  }
  if (hasAny(titleText, ['revision y refuncionalizacion de 3', 'cpamaras del cctv'])) {
    return {
      kind: 'cctv',
      name: 'revision de tres camaras CCTV',
      scene: 'tres camaras CCTV genericas sobre banco tecnico de oficina de seguros, una abierta para revision, fuente, conectores, cableado, tester y monitor desenfocado con grillas abstractas sin imagenes ni texto, sin operador',
    };
  }
  if (hasAny(titleText, ['tablero banco de capacitores'])) {
    return {
      kind: 'support',
      name: 'tablero banco de capacitores en sala de maquina',
      scene: 'tablero de banco de capacitores abierto en sala de maquina industrial, capacitores cilindricos, contactores, borneras, canalizacion, multimetro y herramientas, equipo desenergizado y ordenado, sin labels legibles',
    };
  }
  if (hasAny(coreText, ['acuerdo marco de servicios de mantenimiento en planta mendoza'])) {
    return {
      kind: 'support',
      name: 'mantenimiento marco en planta Mendoza',
      scene: 'mesa de mantenimiento preventivo en planta industrial con herramientas, multimetro, repuestos electricos pequenos, router o switch secundario, checklist en blanco y linea de produccion desenfocada, sin marcas ni carteles',
    };
  }
  if (hasAny(coreText, ['gestion y monitoreo de seguridad electronica']) && hasAny(clientText, ['triunfo'])) {
    return {
      kind: 'cctv',
      name: 'gestion de seguridad electronica para oficina de seguros',
      scene: 'camara de seguridad instalada y modulo controlador o pantalla tecnica con vistas abstractas desenfocadas en oficina de seguros, sin operador protagonista ni puesto de monitoreo dominante',
    };
  }
  if (hasAny(coreText, ['refuncionalizacion tecnologica', 'camara de senadores', 'recinto'])) {
    return {
      kind: 'support',
      name: 'refuncionalizacion tecnologica de recinto legislativo',
      scene: 'mesa tecnica de recinto legislativo con microfonos de conferencia genericos, matriz AV secundaria, switch compacto, patch cords, tester, canalizacion ordenada y recinto desenfocado, sin escudos',
    };
  }
  if (hasAny(coreText, ['rugby championship', 'evento rugby', 'champioship'])) {
    return {
      kind: 'network',
      name: 'soporte tecnico para evento deportivo',
      scene: 'mesa tecnica de evento deportivo con access points, router, switch, patch cords, tester, radios o headsets genericos y cancha o graderias desenfocadas al fondo, sin logos',
    };
  }
  if (hasAny(titleText, ['alquiler telefonos ip'])) {
    return {
      kind: 'support',
      name: 'alquiler de telefonos IP',
      scene: 'telefonos IP genericos de costado o de espaldas, switch PoE, patch cords, roseta, fuente y tester en banco tecnico de planta industrial, sin teclados frontales ni pantallas legibles',
    };
  }
  if (hasAny(coreText, ['sdi - oficina copa airlines', 'oficina copa airlines', 'copa airlines'])) {
    return {
      kind: 'sdi',
      name: 'SDI en oficina aeroportuaria',
      scene: 'detector de humo, pulsador rojo y sirena en oficina o area tecnica de aeropuerto, conduit prolijo, multimetro y carro tecnico parcial, sin logos de aerolinea',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(titleText, ['cliente confidencial (8)'])) {
    return {
      kind: 'network',
      name: 'terminacion compacta de datos y fibra',
      scene: 'mesa tecnica de oficina con mini caja de terminacion optica, rosetas RJ45, cordones de fibra amarillos, patch cords azules, medidor optico, tester y herramientas, sin gabinete mural protagonista',
    };
  }
  if (hasAny(coreText, ['diagnostico de red ip', 'coga peru'])) {
    return {
      kind: 'network',
      name: 'diagnostico de red IP',
      scene: 'notebook con pantalla abstracta sin texto, router o switch compacto, tester analizador de red, patch cords, multimetro y checklist anonimo dado vuelta sobre mesa tecnica',
    };
  }
  if (hasAny(titleText, ['desarrollos internos - um', 'desarrollos internos'])) {
    return {
      kind: 'software',
      name: 'desarrollos internos UM',
      scene: 'mesa de desarrollo interno con laptop y tablet mostrando paneles abstractos sin texto, tablero de tareas desenfocado, router compacto, cable de red y documentos anonimos',
    };
  }
  if (hasAny(titleText, ['reventa de equipamiento'])) {
    return {
      kind: 'hardware',
      name: 'reventa de equipamiento tecnologico',
      scene: 'equipamiento preparado para entrega sobre banco tecnico: router, switch, access point, fuentes, patch cords y cajas anonimas abiertas, sin etiquetas ni logos',
    };
  }
  if (hasAny(titleText, ['lector de codigo de barra', 'lector codigo de barra'])) {
    return {
      kind: 'access',
      name: 'lector de codigo de barras',
      scene: 'lector de codigo de barras USB o inalambrico sobre banco tecnico, cable, base, notebook o tablet con pantalla abstracta y tarjetas en blanco sin codigos visibles',
    };
  }
  if (hasAny(coreText, ['evento de los pumas', 'headcomm'])) {
    return {
      kind: 'network',
      name: 'conectividad temporal para evento deportivo',
      scene: 'mesa tecnica de evento deportivo con access point generico, router compacto, switch pequeno, patch cords, tester, radios o headsets genericos y caja de transporte, con recinto deportivo desenfocado al fondo',
    };
  }
  if (hasAny(titleText, ['7 pcs con monitor', 'pcs con monitor'])) {
    return {
      kind: 'hardware',
      name: 'siete puestos informaticos con monitor',
      scene: 'fila corta de PCs de escritorio y monitores genericos preparados para planta industrial, teclados, mouses, UPS pequenas, cables de red ordenados, etiquetas anonimas dadas vuelta y herramientas de configuracion',
    };
  }
  if (hasAny(titleText, ['web municipio guaymallen', 'web municipio'])) {
    return {
      kind: 'software',
      name: 'web municipal institucional',
      scene: 'mesa de proyecto municipal con notebook y tablet mostrando wireframes abstractos de sitio web sin texto, router compacto, cable de red, documentos anonimos dados vuelta y entorno de oficina publica sobria',
    };
  }
  if (hasAny(titleText, ['ingenieria de corrientes debiles del hospital'])) {
    return {
      kind: 'network',
      name: 'ingenieria de corrientes debiles hospitalarias',
      scene: 'plano tecnico anonimo dado vuelta junto a canalizacion de corrientes debiles, caja tecnica abierta, cables de datos y alarma, detector o modulo secundario, tester y herramientas en pasillo hospitalario limpio',
    };
  }
  if (hasAny(titleText, ['venta de remanente de proyectos', 'remanente de proyectos'])) {
    return {
      kind: 'hardware',
      name: 'remanente de materiales de proyectos',
      scene: 'mesa de inventario tecnico con remanentes de proyectos: patch cords, conectores, fuentes, modulos, canaletas cortas, tornilleria, tester y cajas anonimas abiertas, sin logos ni etiquetas legibles',
    };
  }
  if (hasAny(coreText, ['sistema de ups para data center', 'ups para data center']) || (hasAny(coreText, ['ups']) && hasAny(coreText, ['data center']))) {
    return {
      kind: 'support',
      name: 'UPS para data center y puestos de datos',
      scene: 'UPS compactas y banco de baterias pequeno preparados junto a patchera y puntos de datos, tester de red, canalizacion bajo piso o zocalo tecnico y herramientas, sin rack frontal dominante',
    };
  }
  if (hasAny(coreText, ['licencia para central denwa', 'denwa premium'])) {
    return {
      kind: 'support',
      name: 'licencia y central telefonica hospitalaria',
      scene: 'central telefonica compacta o gateway VoIP generico preparado en mesa tecnica hospitalaria, telefono IP, router pequeno, cableado de red, checklist anonimo dado vuelta y pasillo limpio desenfocado',
    };
  }
  if (hasAny(titleText, ['conexion obradores con wifi', 'obradores con wifi'])) {
    return {
      kind: 'network',
      name: 'conexion WiFi entre obradores',
      scene: 'radioenlace o access point exterior instalado en mastil bajo de obrador, cable UTP exterior entrando a caja estanca, inyector PoE, tester de red y trailer de obra desenfocado',
    };
  }
  if (hasAny(titleText, ['catamarca 147']) && hasAny(clientText, ['aconcagua', 'universidad', 'univercidad'])) {
    return {
      kind: 'support',
      name: 'adecuacion tecnica universitaria Catamarca 147',
      scene: 'caja tecnica o puesto de datos instalado en edificio universitario, canalizacion prolija, tomas RJ45, pequeno switch o router de apoyo, tester y herramientas en corredor institucional limpio',
    };
  }
  if (hasAny(coreText, ['acceso norte']) && hasAny(clientText, ['triunfo'])) {
    return {
      kind: 'network',
      name: 'conectividad de sucursal Acceso Norte',
      scene: 'router/ONT generico y switch compacto instalados en sucursal de seguros, rosetas RJ45, patch cords, tester de red y canalizacion limpia en oficina sobria',
    };
  }
  if (hasAny(titleText, ['detectores de humo']) && hasAny(coreText, ['avianca', 'aeropuerto'])) {
    return {
      kind: 'sdi',
      name: 'detectores de humo en terminal aeroportuaria',
      scene: 'detector de humo instalado en cielorraso tecnico de terminal aeroportuaria, sirena o pulsador secundario, conduit prolijo, escalera parcial y multimetro sobre carro tecnico, sin logos',
    };
  }
  if (hasAny(coreText, ['soporte it nivel 1', 'oficinas de procon'])) {
    return {
      kind: 'support',
      name: 'soporte IT nivel 1 en oficinas',
      scene: 'mesa de soporte IT en oficina corporativa con notebook de diagnostico abstracto, router compacto, pequeno switch, patch cords, tester, fuente y checklist anonimo dado vuelta',
    };
  }
  if (hasAny(titleText, ['reparacion de bridas transformador', 'bridas transformador'])) {
    return {
      kind: 'support',
      name: 'reparacion de bridas de transformador',
      scene: 'transformador industrial desconectado o caja de terminales de transformador con bridas mecanicas, llaves, multimetro, guantes dielectricos y herramientas de ajuste en planta limpia, sin intervencion energizada',
    };
  }
  if (hasAny(coreText, ['sistema de deteccion de incendio para el autodromo', 'autodromo de san juan'])) {
    return {
      kind: 'sdi',
      name: 'sistema de deteccion de incendio para autodromo',
      scene: 'mesa tecnica o sala de control de autodromo con detector de humo, pulsador rojo, sirena, cable rojo/negro, modulo de lazo y multimetro, con boxes o pista desenfocados al fondo',
    };
  }
  if (hasAny(titleText, ['ampliacion hospital perrupato consultorios externo', 'consultorios externo'])) {
    return {
      kind: 'network',
      name: 'corrientes debiles para consultorios externos',
      scene: 'sector de consultorios externos en ampliacion hospitalaria con canalizacion de datos/alarma, cajas de paso, tomas RJ45, cableado prolijo, tester y herramientas sobre carro tecnico, sin pacientes',
    };
  }
  if (hasAny(titleText, ['municipalidad de godoy cruz']) && hasAny(titleText, ['implementacion de redes de datos y fibra optica'])) {
    return {
      kind: 'network',
      name: 'red municipal de datos y fibra',
      scene: 'gabinete mural municipal con bandeja de fibra, patchera RJ45, cordones opticos amarillos, patch cords ordenados, medidor optico y tester de red, sin escudos ni carteles',
    };
  }
  if (hasAny(coreText, ['montecaseros', 'cauces derivados', 'inspeccion rama'])) {
    return {
      kind: 'support',
      name: 'alta disponibilidad IT para gestion hidrica',
      scene: 'mesa o gabinete bajo de oficina tecnica de riego con UPS pequena, router compacto, switch, patch cords, tester y plano hidrico anonimo dado vuelta, sin rack protagonista',
    };
  }
  if (hasAny(titleText, ['plan de negocios', 'config de transportes', 'config. de transportes'])) {
    return {
      kind: 'software',
      name: 'configuracion digital de transportes',
      scene: 'mesa de planificacion logistica con notebook y tablet mostrando rutas y bloques abstractos sin texto, router compacto, cable de red, tarjetas anonimas dadas vuelta y documentos en blanco',
    };
  }
  if (hasAny(titleText, ['servicios y tramites para el gobierno', 'tramites para el gobierno'])) {
    return {
      kind: 'software',
      name: 'tramites digitales de gobierno',
      scene: 'puesto de oficina publica con notebook y tablet mostrando flujo abstracto de tramites sin texto, lector o scanner, router compacto, carpetas anonimas dadas vuelta y cableado prolijo',
    };
  }
  if (hasAny(titleText, ['digitalizacion de procesos - millan', 'millan s.a'])) {
    return {
      kind: 'software',
      name: 'digitalizacion operativa para retail',
      scene: 'mesa de back office comercial con tablet y monitor mostrando paneles abstractos sin texto, lector de codigo o periferico USB, router compacto, cableado prolijo y documentos anonimos',
    };
  }
  if (hasAny(coreText, ['encuentro bid'])) {
    return {
      kind: 'network',
      name: 'soporte tecnologico para encuentro institucional',
      scene: 'mesa tecnica discreta de evento institucional con access point, router compacto, switch pequeno, microfonos o consola secundaria, patch cords, tester y sala de reuniones publica desenfocada',
    };
  }
  if (hasAny(titleText, ['edificio calle mitre'])) {
    return {
      kind: 'network',
      name: 'corrientes debiles en edificio Mitre',
      scene: 'palier o pasillo de edificio con caja tecnica abierta, canalizacion de datos/alarma, tomas RJ45, cableado prolijo, tester y herramientas, sin porteria ni camaras como protagonistas',
    };
  }
  if (hasAny(titleText, ['cliente confidencial (7)']) && hasAny(titleText, ['implementacion de redes de datos y fibra optica'])) {
    return {
      kind: 'network',
      name: 'terminacion compacta de datos y fibra',
      scene: 'mesa tecnica de oficina con mini caja de terminacion optica, rosetas RJ45, cordones de fibra amarillos, patch cords azules, medidor optico, tester y herramientas, sin gabinete mural protagonista',
    };
  }
  if (hasAny(titleText, ['asistencia tecnica']) && hasAny(clientText, ['nucete'])) {
    return {
      kind: 'support',
      name: 'asistencia tecnica en planta industrial',
      scene: 'carro o banco de asistencia tecnica en planta alimenticia con notebook de diagnostico abstracto, router compacto, pequeno switch, fuente, patch cords, tester y herramientas',
    };
  }
  if (hasAny(coreText, ['gateway 8 fxo', 'gateway 24fxs', 'comodato de central denwa'])) {
    return {
      kind: 'support',
      name: 'comodato de central y gateways telefonicos',
      scene: 'central PBX/VoIP generica y dos gateways FXO/FXS compactos sobre escritorio tecnico industrial, patch cords, fuente, herramienta de diagnostico y telefono secundario de costado sin teclado visible',
    };
  }
  if (hasAny(coreText, ['380 puestos de trabajo', 'visita tecnica']) && hasAny(clientText, ['irrigacion'])) {
    return {
      kind: 'network',
      name: 'relevamiento de cableado para 380 puestos',
      scene: 'relevamiento tecnico de muchos puestos de trabajo en oficina de gestion hidrica, con plano anonimo dado vuelta, tester de red, rosetas RJ45, patch cords, etiquetas en blanco y canalizacion perimetral visible',
    };
  }
  if (hasAny(titleText, ['modulos sanciones', 'logs np', 'modal np'])) {
    return {
      kind: 'software',
      name: 'modulos digitales de sanciones y logs',
      scene: 'mesa de proyecto industrial con notebook y tablet mostrando modulos administrativos abstractos sin texto, lector o periferico USB, router compacto, documentos anonimos y cable de red',
    };
  }
  if (hasAny(titleText, ['pulsadores manuales sdi'])) {
    return {
      kind: 'sdi',
      name: 'pulsadores manuales SDI',
      scene: 'pulsadores manuales rojos de incendio preparados e instalados en pared industrial, cable rojo/negro, conduit, multimetro y destornillador, sin baterias como protagonista',
    };
  }
  if (hasAny(coreText, ['actualizacion de licencia denwa', 'licencia denwa']) && hasAny(coreText, ['estadio', 'malvinas'])) {
    return {
      kind: 'support',
      name: 'actualizacion de licencia telefonica en estadio',
      scene: 'central PBX/VoIP o gateway telefonico generico en sala tecnica de estadio, router compacto, patch cords, telefono secundario de costado, checklist anonimo dado vuelta y graderias desenfocadas al fondo',
    };
  }
  if (hasAny(coreText, ['acondicionamiento de valvulas', 'vinculacion al sistema de deteccion'])) {
    return {
      kind: 'sdi',
      name: 'vinculacion de valvulas al sistema de deteccion',
      scene: 'valvulas industriales o manifold de incendio con modulo de supervision, cable rojo/negro, borneras, multimetro y central SDI secundaria desenfocada, sin pantalla de software protagonista',
    };
  }
  if (hasAny(titleText, ['oficinas aseguradores de cauciones', 'aseguradores de cauciones'])) {
    return {
      kind: 'support',
      name: 'infraestructura tecnica para oficinas de cauciones',
      scene: 'oficina aseguradora sobria con punto de datos RJ45 instalado, router compacto, pequeno switch, patch cords, tester y documentos anonimos dados vuelta sobre escritorio',
    };
  }
  if (hasAny(titleText, ['web municipalidad de maipu', 'web municipalidad'])) {
    return {
      kind: 'software',
      name: 'web municipal institucional',
      scene: 'mesa de proyecto municipal con notebook y tablet mostrando wireframes abstractos de sitio web sin texto, router compacto, cable de red, documentos anonimos dados vuelta y oficina publica sobria',
    };
  }
  if (hasAny(titleText, ['pc + monitor', 'pc+monitor'])) {
    if (hasAny(clientText, ['nucete'])) {
      return {
        kind,
        name: 'puesto informatico para planta industrial',
        scene: 'PC de escritorio y monitor instalados en puesto administrativo de planta, gabinete bajo escritorio, teclado, mouse, UPS pequena y cableado ordenado hacia canaleta o roseta',
      };
    }
    return {
      kind,
      name: 'puesto informatico corporativo completo',
      scene: 'PC de escritorio y monitor configurados en escritorio corporativo, teclado, mouse, UPS pequena, cableado prolijo y herramienta de diagnostico o instalador USB como evidencia tecnica',
    };
  }
  if (hasAny(titleText, ['ssd y memoria ram', 'ssd memoria ram', 'memoria ram'])) {
    return {
      kind,
      name: 'upgrade de SSD y memoria RAM',
      scene: 'gabinete de PC abierto sobre banco tecnico, modulo de memoria RAM y disco SSD visibles, pulsera antiestatica, destornillador y monitor de prueba desenfocado',
    };
  }
  if (hasAny(titleText, ['discos para servidor de aplicaciones'])) {
    return {
      kind: 'hardware',
      name: 'discos para servidor de aplicaciones',
      scene: 'bandejas hot-swap con discos de servidor genericos, servidor compacto abierto, pulsera antiestatica, herramienta de diagnostico y UPS pequena sobre banco tecnico',
    };
  }
  if (hasAny(titleText, ['disco y modulos', 'disco y modulos jeluz'])) {
    return {
      kind: 'hardware',
      name: 'disco y modulos de periscopio',
      scene: 'disco de almacenamiento generico, modulos de datos, placas para periscopio, tornilleria, cablecanal y tester organizados sobre banco tecnico industrial',
    };
  }
  if (hasAny(titleText, ['materiales para arizu'])) {
    return {
      kind: 'hardware',
      name: 'materiales tecnicos para bodega',
      scene: 'kit de materiales para instalacion en bodega con rollo de cable, canaleta, cajas de paso, modulos RJ45 o borneras, conectores, tester y herramientas sobre banco tecnico',
    };
  }
  if (hasAny(titleText, ['servidor para control point', 'control point'])) {
    return {
      kind: 'hardware',
      name: 'servidor compacto para control de acceso',
      scene: 'servidor torre compacto preparado para sistema de control de acceso, UPS pequena, patch cords, teclado de servicio, disco de respaldo y tester sobre banco tecnico de oficina de seguros',
    };
  }
  if (hasAny(coreText, ['calle lavalle', 'afumex', 'felro', 'cambio de cableado en sector casa'])) {
    return {
      kind: 'network',
      name: 'cambio de cableado y reparaciones en edificio',
      scene: 'tramo de cableado de edificio en reparacion con cable ignifugo generico, canalizacion metalica o cablecanal, caja de paso abierta, herramientas de tendido, tester y rollos de cable organizados en pasillo tecnico de edificio',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(coreText, ['cableado de datos y energia', 'licitacion publica']) && hasAny(clientText, ['poder judicial'])) {
    return {
      kind: 'network',
      name: 'cableado de datos y energia judicial',
      scene: 'canalizacion mixta de datos y energia en oficina judicial, cajas de piso o zocalo tecnico, cables separados y ordenados, rosetas RJ45, tomas electricas y tester de red como evidencia',
    };
  }
  if (hasAny(titleText, ['adecuacion de red de datos']) && hasAny(coreText, ['estadio', 'malvinas'])) {
    return {
      kind: 'network',
      name: 'adecuacion de red de datos en estadio',
      scene: 'sala tecnica o sector de graderias de estadio con caja de datos RJ45, canalizacion protegida, patch cords, tester de red y estructura deportiva desenfocada al fondo',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(coreText, ['fusion', 'fusiones', 'multimodo', '4x62'])) {
    return {
      kind: 'network',
      name: 'fusiones de fibra optica multimodo',
      scene: 'fusionadora de fibra, bandeja de empalme, pigtails o cordones multimodo, peladora, cleaver y medidor optico sobre mesa tecnica de obra u oficina, sin texto ni marcas visibles',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(clientText, ['ifx networks'])) {
    return {
      kind: 'network',
      name: 'handoff de fibra optica carrier',
      scene: 'punto de entrega de fibra de carrier con ODF compacto, bandeja de empalme, cordones opticos amarillos, medidor de potencia, patchera secundaria y cableado ordenado en sala tecnica corporativa, sin logos ni etiquetas legibles',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(coreText, ['cableado exterior por postes', 'tendidos nuevos', 'postes'])) {
    return {
      kind: 'network',
      name: 'cableado exterior por postes',
      scene: 'tendido exterior de datos/fibra por postes en predio agricola, cable autosoportado o exterior, caja estanca, switch compacto preparado, tester y herramientas de tendido, sin marcas visibles',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(coreText, ['alquiler de infraestructura', 'infraestructura de cableado estructurado'])) {
    return {
      kind: 'network',
      name: 'infraestructura de cableado estructurado alquilada',
      scene: 'infraestructura temporal o alquilada de cableado estructurado con rollos UTP, canaletas, patchera compacta, cajas de piso o zocalo tecnico, tester de red y patch cords listos para puestos de obra u oficina',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(clientText, ['fuesmen']) && hasAny(coreText, ['caps 168', 'estanzuela'])) {
    return {
      kind: 'network',
      name: 'cableado estructurado para CAPS La Estanzuela',
      scene: 'pasillo limpio de centro de salud barrial con caja de datos RJ45 instalada, canaleta blanca prolija, tramo UTP azul, tester de red y roseta final como evidencia, sin rack ni sala tecnica protagonista',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(clientText, ['fuesmen']) && hasAny(coreText, ['hospital escuela', 'salud mental'])) {
    return {
      kind: 'network',
      name: 'red de datos hospital escuela salud mental',
      scene: 'puesto tecnico en hospital escuela con rosetas RJ45 nuevas, patch cords cortos, tester de certificacion y bandeja de cableado en cielorraso bajo, con pasillo institucional desenfocado y sin pacientes',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(clientText, ['fuesmen'])) {
    return {
      kind: 'network',
      name: 'terminacion de fibra y datos en salud',
      scene: 'mesa tecnica hospitalaria con mini ODF, bandeja de empalme abierta, cordones opticos amarillos, patchera pequena, medidor optico y planilla en blanco dada vuelta, sin gabinete frontal dominante',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(clientText, ['aeropuertos argentina'])) {
    return {
      kind: 'network',
      name: 'red de datos y fibra en terminal aeroportuaria',
      scene: 'punto tecnico discreto de terminal aeroportuaria con caja de terminacion optica, patchera compacta, bandeja portacables superior, medidor optico y tester, con corredor de embarque desenfocado y sin logos',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(clientText, ['jose nucete'])) {
    return {
      kind: 'network',
      name: 'red industrial de datos y fibra en planta alimenticia',
      scene: 'planta alimenticia limpia con gabinete mural lateral, bajada de datos/fibra, switch compacto, cordones opticos, patch cords y tester sobre mesa de acero, con linea industrial desenfocada y sin logos',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(clientText, ['headcomm'])) {
    return {
      kind: 'network',
      name: 'cableado de datos en sucursal logistica',
      scene: 'sucursal corporativa o deposito logistico con rollo UTP, canaleta, cajas de piso, patchera compacta y tester de red sobre mesa tecnica, evitando rack frontal y pantallas de monitoreo',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(clientText, ['premix'])) {
    return {
      kind: 'network',
      name: 'tendido de fibra en planta industrial Premix',
      scene: 'planta industrial de materiales con caja estanca de fibra, cable exterior, bandeja portacables, medidor optico y herramientas sobre banco tecnico, con estructura fabril desenfocada y sin carteleria',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica']) && hasAny(clientText, ['martinez wajchman'])) {
    return {
      kind: 'network',
      name: 'red de datos para obra en construccion',
      scene: 'obra o edificio en terminacion con canalizacion de datos, caja de paso abierta, rosetas RJ45, rollo UTP, tester y herramientas sobre banco provisorio, sin personas identificables ni carteles',
    };
  }
  if (hasAny(titleText, ['implementacion de redes de datos y fibra optica'])) {
    return {
      kind: 'network',
      name: 'implementacion mixta de datos y fibra',
      scene: 'terminacion compacta de datos y fibra con mini ODF, rosetas RJ45, patch cords, medidor optico y tester sobre mesa tecnica contextual, evitando rack frontal como motivo principal',
    };
  }
  if (hasAny(coreText, ['parlante con control remoto']) || (hasAny(coreText, ['sirena']) && hasAny(coreText, ['parlante']))) {
    return {
      kind: 'sdi',
      name: 'sirena con parlante y control remoto',
      scene: 'sirena y parlante de aviso montados en pared tecnica hospitalaria, modulo receptor o control remoto anonimo en primer plano, conduit prolijo y multimetro de verificacion',
    };
  }
  if (hasAny(titleText, ['amplificadores']) && hasAny(coreText, ['central', 'sdi', 'notifier'])) {
    return {
      kind: 'sdi',
      name: 'amplificadores para central SDI',
      scene: 'modulos amplificadores de audio/alarma y placa de expansion instalados junto a central de incendio abierta, cableado rojo y negro ordenado, multimetro y borneras visibles, sin marcas legibles',
    };
  }
  if (hasAny(titleText, ['reparacion amplificadores', 'reparacion de amplificadores'])) {
    return {
      kind: 'hardware',
      name: 'reparacion de amplificadores electronicos',
      scene: 'amplificador electronico generico abierto sobre banco tecnico, disipador, placa, borneras, soldador apagado, multimetro, puntas de prueba y cables organizados, sin marca visible',
    };
  }
  if (hasAny(titleText, ['detectores', 'modulos', 'firmware']) && hasAny(titleText, ['firmware'])) {
    return {
      kind: 'sdi',
      name: 'reemplazo de detectores y firmware',
      scene: 'detector de humo nuevo, modulo de control, laptop de servicio con pantalla abstracta y herramienta de programacion junto a una central de incendio abierta, en area tecnica aeroportuaria',
    };
  }
  if (hasAny(coreText, ['obrador', 'carcel federal'])) {
    return {
      kind: 'support',
      name: 'servicio IT en obrador de obra publica',
      scene: 'oficina tecnica modular de obra con router compacto, switch pequeno, notebook de configuracion, canaleta provisoria prolija y casco o plano anonimo como contexto de obrador',
    };
  }
  if (hasAny(titleText, ['transformacion digital']) && hasAny(coreText, ['planta de elaboracion'])) {
    return {
      kind: 'sdi',
      name: 'sensorizacion industrial para planta',
      scene: 'tablero industrial pequeno con controladora, sensores cableados, borneras y canalizacion prolija en planta de elaboracion limpia, sin camaras ni pantallas protagonistas',
    };
  }
  if (hasAny(titleText, ['transformacion de digital', 'transformacion digital']) && hasAny(clientText, ['cooperativa'])) {
    return {
      kind: 'software',
      name: 'integracion digital para cooperativa',
      scene: 'mesa de asesoramiento tecnico con notebook mostrando dashboard abstracto sin texto, router compacto, documentos anonimos y cableado de integracion en oficina institucional sobria',
    };
  }
  if (hasAny(coreText, ['extension de cableado', 'isla de legales'])) {
    return {
      kind: 'network',
      name: 'extension de cableado de datos y electrico',
      scene: 'isla de puestos administrativos con cajas de piso o periscopio, bajada de cableado de datos y electrico, canalizacion prolija, tester de red y tomas listas para conectar',
    };
  }
  if (hasAny(coreText, ['sistema electrico para equipo info', 'sistema electrico para equipo informatico'])) {
    return {
      kind: 'support',
      name: 'remodelacion electrica para equipo informatico',
      scene: 'puesto tecnico municipal con canalizacion electrica renovada, tomas normalizadas, UPS pequena, cable de red, tester y equipo informatico listo para conexion, sin software protagonista',
    };
  }
  if (hasAny(coreText, ['alojamiento', 'mantenimiento de la pagina web', 'pagina web'])) {
    return {
      kind: 'software',
      name: 'alojamiento y mantenimiento web municipal',
      scene: 'notebook de mantenimiento con interfaz web abstracta sin texto, servidor compacto o mini PC, router, disco de respaldo y documentos anonimos en oficina publica sobria',
    };
  }
  if (hasAny(coreText, ['alojamietno', "ss's para guaymallen", 'ss para guaymallen'])) {
    return {
      kind: 'software',
      name: 'alojamiento y servicios municipales',
      scene: 'notebook de soporte con interfaz abstracta de servicios alojados sin texto, mini servidor, router, disco de respaldo y documentos anonimos en oficina municipal sobria',
    };
  }
  if (hasAny(titleText, ['activos de red']) && hasAny(titleText, ['data center'])) {
    return {
      kind: 'network',
      name: 'activos de red para mejora de data center',
      scene: 'switches y router genericos listos para instalacion, patch cords, transceptores, UPS pequena y tester sobre banco tecnico de planta, con rack parcial desenfocado al fondo',
    };
  }
  if (hasAny(titleText, ['piso tecnico para data center', 'piso tecnico'])) {
    return {
      kind: 'support',
      name: 'piso tecnico para data center',
      scene: 'placas de piso tecnico elevadas parcialmente en sala de data center en obra, pedestales metalicos, bandejas bajo piso, cableado de energia y datos ordenado, ventosa levanta placas y nivel como evidencia',
    };
  }
  if (hasAny(titleText, ['data center'])) {
    return {
      kind: 'support',
      name: 'recuperacion de data center',
      scene: 'detalle de UPS, patchera, bandeja de cableado y servidor compacto en sala tecnica institucional, con etiquetas borrosas y sin rack frontal dominante',
    };
  }
  if (hasAny(titleText, ['servicio tecnico']) && hasAny(coreText, ['hospital', 'perrupato'])) {
    return {
      kind: 'support',
      name: 'servicio tecnico hospitalario',
      scene: 'carro o mesa tecnica en pasillo hospitalario con notebook de diagnostico abstracto, tester, patch cords, fuente pequena y herramientas ordenadas, sin pacientes ni rostros',
    };
  }
  if (hasAny(titleText, ['rack y canalizacion', 'rack y canalizacion'])) {
    return {
      kind: 'network',
      name: 'rack y canalizacion provistos',
      scene: 'rack mural o gabinete compacto instalado lateralmente, canalizacion metalica o cablecanal entrando ordenadamente, patchera pequena, switch y tester de red como evidencia, sin tecnico delante',
    };
  }
  if (hasAny(titleText, ['deteccion de incendios']) && hasAny(titleText, ['cctv', 'porteria'])) {
    return {
      kind: 'sdi',
      name: 'integracion de SDI, CCTV y porteria',
      scene: 'acceso tecnico de edificio con detector o pulsador de incendio, camara instalada en esquina y modulo/intercom de porteria en pared, todos como dispositivos instalados y sin puesto de monitoreo',
    };
  }
  if (hasAny(coreText, ['enlace de internet', 'equipo para enlace']) || hasAny(titleText, ['torre y equipamiento', 'provision de torre'])) {
    return {
      kind: 'network',
      name: 'mantenimiento de torre y enlace de internet',
      scene: 'radio de enlace instalado en mastil industrial bajo, cable exterior UTP entrando a gabinete tecnico con inyector PoE y tester de red como evidencia',
    };
  }
  if (hasAny(titleText, ['aplicacion']) && hasAny(coreText, ['creditos'])) {
    return {
      kind: 'software',
      name: 'aplicacion de gestion de creditos',
      scene: 'puesto de oficina publica con laptop o monitor mostrando flujo abstracto de creditos sin texto, carpetas anonimas, credenciales tapadas y router compacto como soporte tecnico',
    };
  }
  if (hasAny(titleText, ['expansor de senal'])) {
    return {
      kind: 'support',
      name: 'expansor de senal industrial',
      scene: 'expansor de senal generico y modulo de comunicaciones instalado en gabinete tecnico pequeno, antena o borneras, fuente, tester y cableado prolijo, sin marcas visibles',
    };
  }
  if (hasAny(titleText, ['comodato telefonico', 'telefonico'])) {
    return {
      kind: 'support',
      name: 'comodato telefonico',
      scene: 'telefonos de escritorio genericos entregados en comodato sobre mesa tecnica, patch cords, roseta telefonica, fuente y herramienta de verificacion, sin marcas ni textos',
    };
  }
  if (hasAny(coreText, ['factura electronica', 'web service', 'ws)'])) {
    return {
      kind: 'software',
      name: 'web service de factura electronica',
      scene: 'notebook con diagrama abstracto de integracion API sin texto, mini servidor o router, documentos anonimos y cableado prolijo sobre escritorio tecnico institucional',
    };
  }
  if (hasAny(coreText, ['internet dedicado'])) {
    return {
      kind: 'network',
      name: 'servicio de internet dedicado',
      scene: 'router profesional generico, ONT o radio compacto, patch cords, medidor/tester y cableado de acometida en area institucional, sin carteleria ni logos',
    };
  }
  if (hasAny(coreText, ['desmonte de suc', 'servicio de desmonte'])) {
    return {
      kind: 'support',
      name: 'desmonte tecnico de sucursal',
      scene: 'mesa tecnica de desmonte con canaletas retiradas, patch cords, fuente, pequeno switch, tornilleria y herramientas, en oficina bancaria o medica vacia sin logos ni carteles',
    };
  }
  if (hasAny(titleText, ['computadora para visualizar camaras', 'computadora para visualizar camaras de cctv'])) {
    return {
      kind: 'cctv',
      name: 'computadora para visualizacion CCTV',
      scene: 'PC de escritorio generica y monitor mostrando mosaico abstracto de camaras sin imagenes reconocibles ni texto, teclado, mouse, pequeno switch y cableado ordenado en puesto de seguridad sobrio',
    };
  }
  if (hasAny(coreText, ['sucursales de banco', 'banco galicia'])) {
    return {
      kind: 'support',
      name: 'soporte IT para sucursales bancarias',
      scene: 'gabinete mural compacto de sucursal con router, UPS pequena, switch, patch cords y checklist anonimo, en oficina bancaria sin logos ni carteleria',
    };
  }
  if (hasAny(coreText, ['helipuerto'])) {
    return {
      kind: 'network',
      name: 'vinculacion tecnica con helipuerto',
      scene: 'radioenlace o caja tecnica exterior en azotea hospitalaria, cableado protegido, vista parcial de helipuerto desenfocada y tester de red como evidencia, sin pacientes',
    };
  }
  if (hasAny(titleText, ['provision e instalacion']) && hasAny(titleText, ['camaras de seguridad'])) {
    return {
      kind: 'cctv',
      name: 'instalacion de dos camaras de seguridad',
      scene: 'dos camaras de seguridad instaladas en puntos distintos de una nave industrial limpia, una en primer plano y otra sugerida al fondo, canalizacion prolija y herramienta de ajuste cercana',
    };
  }
  if (hasAny(titleText, ['componentes informaticos'])) {
    return {
      kind: 'hardware',
      name: 'componentes informaticos para oficina',
      scene: 'kit de componentes informaticos genericos para oficina de servicios, memoria, disco, fuente pequena, adaptadores, cables y herramientas sobre banco tecnico institucional',
    };
  }
  if (hasAny(titleText, ['web ianiglia', 'web ']) && hasAny(coreText, ['ambiente'])) {
    return {
      kind: 'software',
      name: 'web ambiental institucional',
      scene: 'notebook con sitio web ambiental abstracto sin texto, mapa esquematico de areas naturales sin nombres, router compacto, documentos anonimos y cableado prolijo en oficina tecnica',
    };
  }
  if (hasAny(coreText, ['ce, cctv', 'tel ip', 'planta de premolde'])) {
    return {
      kind: 'network',
      name: 'redes de corrientes debiles, CCTV y telefonia IP',
      scene: 'tablero o gabinete de corrientes debiles en planta de premolde con patchera, pequeno switch PoE, telefono IP generico, cableado de camara y canalizacion prolija',
    };
  }
  if (hasAny(titleText, ['desarrollo software para el gobierno'])) {
    return {
      kind: 'software',
      name: 'expediente digital para gobierno provincial',
      scene: 'mesa de proyecto en oficina publica con notebook y tablet mostrando flujos abstractos de expediente digital sin texto, carpetas anonimas dadas vuelta, cable de red y router compacto como soporte tecnico',
    };
  }
  if (hasAny(titleText, ['remplazo de dvr', 'reemplazo de dvr'])) {
    return {
      kind: 'cctv',
      name: 'reemplazo de DVR',
      scene: 'DVR/NVR generico abierto o sobre banco tecnico de bodega, disco interno, cables coaxiales o UTP, fuente, una camara de prueba y tester de video, sin monitor de vigilancia',
    };
  }
  if (hasAny(titleText, ['web para el pj', 'poder judicial'])) {
    return {
      kind: 'software',
      name: 'web institucional judicial',
      scene: 'notebook con portal judicial abstracto sin texto, documentos anonimos, router compacto y cableado prolijo en oficina administrativa sobria, sin escudos ni simbolos judiciales',
    };
  }
  if (hasAny(titleText, ['desarrollo de software y digitalizacion de procesos']) && hasAny(clientText, ['triunfo']) && !titleText.includes('(2)')) {
    return {
      kind: 'software',
      name: 'digitalizacion operativa para seguros',
      scene: 'puesto de trabajo de seguros con tablet y monitor mostrando paneles abstractos sin texto, credenciales anonimas dadas vuelta, scanner de escritorio, router compacto y documentos sin datos visibles',
    };
  }
  if (hasAny(titleText, ['desarrollo de software y digitalizacion de procesos']) && hasAny(clientText, ['triunfo']) && titleText.includes('(2)')) {
    return {
      kind: 'software',
      name: 'puesto de control de procesos aseguradores',
      scene: 'vista oblicua de escritorio de seguros con pantalla mostrando mapa o trazabilidad abstracta sin texto, teclado, tarjetas anonimas dadas vuelta, cableado prolijo y mini servidor compacto secundario',
    };
  }
  if (hasAny(titleText, ['desarrollo de software y digitalizacion de procesos']) && hasAny(clientText, ['procon'])) {
    return {
      kind: 'software',
      name: 'digitalizacion operativa para seguridad',
      scene: 'mesa tecnica corporativa con tablet y monitor mostrando mosaico abstracto de estados de seguridad sin imagenes reconocibles ni texto, lector o periferico USB, router compacto y cableado prolijo',
    };
  }
  if (hasAny(coreText, ['sistema de ventas', 'actualizacion sistema de ventas'])) {
    return {
      kind: 'software',
      name: 'actualizacion de sistema de ventas',
      scene: 'mesa de oficina comercial con notebook y tablet mostrando flujo abstracto de ventas sin texto, lector de codigo o scanner, router compacto, cableado prolijo y documentos anonimos dados vuelta',
    };
  }
  if (hasAny(coreText, ['laboratorio quimicos', 'laboratorio'])) {
    return {
      kind: 'software',
      name: 'digitalizacion de procesos de laboratorio',
      scene: 'mesa de laboratorio/oficina tecnica con notebook mostrando flujo abstracto sin texto, lector o periferico USB, tubos o instrumental desenfocado y documentos anonimos sin etiquetas',
    };
  }
  if (hasAny(coreText, ['sistema de audio', 'parlante + amplificador', '6 parlante'])) {
    return {
      kind: 'support',
      name: 'sistema de audio para SUM',
      scene: 'amplificador de audio generico, parlante de pared o cielorraso, cable de parlante, fuente y tester sobre mesa tecnica de edificio, con sala SUM desenfocada',
    };
  }
  if (hasAny(titleText, ['gestion y monitoreo de seguridad electronica'])) {
    return {
      kind: 'cctv',
      name: 'gestion de seguridad electronica aeroportuaria',
      scene: 'camara de seguridad instalada y modulo de control o pantalla tecnica con vistas abstractas desenfocadas, ubicado en area tecnica de terminal aeroportuaria, sin operador protagonista ni puesto de monitoreo dominante',
    };
  }
  if (hasAny(titleText, ['sistema de porteria']) || hasAny(coreText, ['sistema de porteria'])) {
    return {
      kind: 'access',
      name: 'ampliacion de sistema de porteria',
      scene: 'modulo de porteria/intercom generico, pulsadores de llamada, controladora pequena, cable multipar y herramientas sobre banco tecnico de edificio',
    };
  }
  if (hasAny(titleText, ['llamadores para enfermeria', 'llamador para enfermeria', 'llamadores de enfermeria'])) {
    return {
      kind: 'access',
      name: 'llamadores de enfermeria instalados',
      scene: 'pulsador de llamada de enfermeria y modulo indicador instalados junto a cabecera o pared hospitalaria, canalizacion oculta o prolija, puesto de enfermeria desenfocado al fondo, sin pacientes',
    };
  }
  if (hasAny(titleText, ['cambio de bateria central de incendio', 'bateria central de incendio'])) {
    return {
      kind: 'sdi',
      name: 'cambio de bateria en central de incendio',
      scene: 'central de incendio abierta con baterias selladas de respaldo, cables rojo y negro, multimetro y destornillador, en sala tecnica municipal sin escudos ni carteles',
    };
  }
  if (hasAny(titleText, ['cambio de central de deteccion de incendio'])) {
    return {
      kind: 'sdi',
      name: 'cambio de central de deteccion de incendio',
      scene: 'central de incendio generica nueva montada junto a la anterior retirada o abierta, cableado rojo/negro ordenado, borneras, multimetro y detector secundario, sin marca visible aunque el antecedente mencione Bosch',
    };
  }
  if (hasAny(titleText, ['reparacion de central de deteccion de incendio'])) {
    return {
      kind: 'sdi',
      name: 'reparacion de central de deteccion de incendio',
      scene: 'central de incendio abierta en sala tecnica de bodega, placa y borneras visibles, cableado rojo/negro ordenado, multimetro midiendo la salida y detector secundario en mesa de apoyo',
    };
  }
  if (hasAny(titleText, ['instalacion de termica para sdi', 'termica para sdi'])) {
    return {
      kind: 'sdi',
      name: 'termica dedicada para SDI',
      scene: 'pequeno tablero electrico o caja DIN con llave termica dedicada para sistema de deteccion de incendio, cableado ordenado, rotulos borrosos, multimetro y detector o central SDI como referencia secundaria',
    };
  }
  if (hasAny(titleText, ['modificacion en canalizacion de deteccion de incendio'])) {
    return {
      kind: 'sdi',
      name: 'modificacion de canalizacion SDI en bodega',
      scene: 'tramo de conduit metalico y cajas de paso de deteccion de incendio modificados sobre pared o cielorraso de bodega, detector de humo y pulsador secundarios, curvadora manual o herramientas cercanas',
    };
  }
  if (hasAny(coreText, ['sala de extincion de incendio', 'mantenimiento sala de extincion'])) {
    return {
      kind: 'sdi',
      name: 'mantenimiento de sala de extincion de incendio',
      scene: 'sala de extincion de incendio industrial con cilindros o manifold de agente limpio, valvulas, manometro, central o modulo de disparo secundario y checklist anonimo sin texto legible',
    };
  }
  if (hasAny(titleText, ['mantenimiento critico de sistemas de deteccion'])) {
    return {
      kind: 'sdi',
      name: 'mantenimiento critico de deteccion industrial',
      scene: 'mesa tecnica industrial con detector de humo, base, modulo de lazo, cable rojo/negro, multimetro y borneras, con central de incendio o nave industrial desenfocada al fondo',
    };
  }
  if (hasAny(titleText, ['reemplazo de 4 detectores', 'reemplazo de cuatro detectores'])) {
    return {
      kind: 'sdi',
      name: 'reemplazo de cuatro detectores hospitalarios',
      scene: 'contrapicado a cielorraso tecnico hospitalario con cuatro detectores de humo nuevos instalados en linea, una base abierta o detector retirado sobre carro tecnico parcial, multimetro y cable rojo/negro como evidencia',
    };
  }
  if (hasAny(coreText, ['central de incendio a revisar', 'presupuesto para activar proyecto'])) {
    return {
      kind: 'sdi',
      name: 'revision de central de incendio para proyecto',
      scene: 'central de incendio existente abierta en pared tecnica universitaria, borneras y cableado rojo/negro visibles, multimetro, planilla anonima dada vuelta y detector de humo secundario en el pasillo',
    };
  }
  if (hasAny(coreText, ['central de incendio']) && hasAny(coreText, ['sensores', 'sirenas', 'pulsador'])) {
    return {
      kind: 'sdi',
      name: 'kit de central de incendio cotizado',
      scene: 'central de incendio generica, detectores de humo, dos sirenas, pulsador manual, cable rojo/negro y multimetro sobre mesa tecnica, sin marcas ni papeles legibles',
    };
  }
  if (hasAny(titleText, ['detectores de humo y gas', 'humo y gas'])) {
    return {
      kind: 'sdi',
      name: 'detectores de humo y gas en centro de salud',
      scene: 'pasillo limpio de centro de salud con detector de humo en cielorraso, detector de gas o sensor mural, pulsador rojo y sirena secundaria, conduit prolijo y multimetro sobre carro tecnico parcial',
    };
  }
  if (hasAny(coreText, ['22 detectores', '3 sirenas', '5 pulsadores'])) {
    return {
      kind: 'sdi',
      name: 'sistema SDI de edificio con detectores sirenas y pulsadores',
      scene: 'kit de obra para edificio con varios detectores de humo, sirenas rojas, pulsadores manuales, cable rojo/negro, conduit, multimetro y plano anonimo dado vuelta, sin texto legible',
    };
  }
  if (hasAny(coreText, ['9 detectores de humo', 'detectores de temperatura', 'provision de materiales9'])) {
    return {
      kind: 'sdi',
      name: 'provision de materiales SDI',
      scene: 'materiales de sistema de deteccion de incendio sobre banco tecnico: detectores de humo, detector de temperatura, sirena, pulsadores manuales, bases, cable rojo/negro y multimetro',
    };
  }
  if (hasAny(titleText, ['alta disponibilidad']) && hasAny(coreText, ['hospital', 'perrupato'])) {
    return {
      kind: 'support',
      name: 'soporte IT de alta disponibilidad hospitalaria',
      scene: 'carro tecnico hospitalario en pasillo limpio con UPS pequena, router compacto, switch de 8 puertos, patch cords cortos, tester de red y checklist anonimo dado vuelta, sin operador sentado, sin rack y sin monitores',
    };
  }
  if (hasAny(titleText, ['alta disponibilidad']) && hasAny(clientText, ['aeropuertos argentina']) && hasAny(coreText, ['deteccion', 'incendio', 'sdi'])) {
    return {
      kind: 'sdi',
      name: 'mantenimiento SDI aeroportuario',
      scene: 'carro tecnico en area de aeropuerto con detector de humo, modulo de lazo, multimetro, cable rojo/negro y central de incendio parcial desenfocada, sin UPS/router como protagonista',
    };
  }
  if (hasAny(titleText, ['alta disponibilidad']) && hasAny(clientText, ['obras'])) {
    return {
      kind: 'support',
      name: 'soporte IT de alta disponibilidad en obra',
      scene: 'oficina tecnica de obra con UPS pequena, router y switch compacto sobre estante o gabinete bajo, notebook de diagnostico con pantalla abstracta, planos anonimos desenfocados y cableado prolijo',
    };
  }
  if (hasAny(titleText, ['alta disponibilidad']) && hasAny(clientText, ['bodega caro'])) {
    return {
      kind: 'support',
      name: 'mantenimiento preventivo IT en bodega',
      scene: 'carro tecnico o mesa de mantenimiento en sala de bodega con UPS pequena, router compacto, patch cords, tester, multimetro y checklist anonimo dado vuelta, sin gabinete mural como protagonista',
    };
  }
  if (hasAny(titleText, ['alta disponibilidad']) && hasAny(clientText, ['la casa del aroma'])) {
    return {
      kind: 'support',
      name: 'soporte IT de alta disponibilidad para pyme comercial',
      scene: 'mesa o estante tecnico de oficina comercial con UPS pequena, router compacto, switch pequeno, patch cords, tester y documentos anonimos dados vuelta, sin gabinete mural como protagonista',
    };
  }
  if (hasAny(titleText, ['alta disponibilidad']) && hasAny(clientText, ['nucete', 'jose nucete'])) {
    return {
      kind: 'support',
      name: 'alta disponibilidad IT en planta alimenticia',
      scene: 'mesa de acero en planta alimenticia limpia con UPS pequena, router industrial compacto, switch, patch cords y tester ordenados como kit de continuidad, con nave industrial desenfocada al fondo, sin tecnico de espaldas, sin rack y sin pantallas',
    };
  }
  if (hasAny(titleText, ['alta disponibilidad']) && hasAny(clientText, ['quilmes'])) {
    return {
      kind: 'support',
      name: 'alta disponibilidad IT en planta cervecera',
      scene: 'gabinete tecnico compacto en planta cervecera con UPS pequena, router industrial, switch, patch cords, tester y canalizacion protegida, con nave de servicios desenfocada y sin logos',
    };
  }
  if (hasAny(titleText, ['alta disponibilidad']) && hasAny(coreText, ['puestos para impresora', 'soporte para televisores'])) {
    return {
      kind: 'support',
      name: 'puestos de impresora y soporte para televisores',
      scene: 'area administrativa de seguros con punto de datos para impresora, soporte de TV instalado en pared, canaleta prolija, patch cord, nivel y tester de red como evidencia de soporte tecnico',
    };
  }
  if (hasAny(titleText, ['alta disponibilidad']) && hasAny(coreText, ['evento para', 'vento para', '200 personas', 'puestos fijos', 'soporte por 4 dias'])) {
    return {
      kind: 'network',
      name: 'soporte de red para evento con puestos fijos',
      scene: 'mesa tecnica de evento con router compacto, access point, switch pequeno, patch cords, tester y dos puestos cableados preparados para soporte de evento, sin gabinete mural ni rack',
    };
  }
  if (hasAny(titleText, ['alta disponibilidad'])) {
    return {
      kind: 'support',
      name: 'alta disponibilidad compacta',
      scene: 'plano detalle de kit compacto de continuidad IT sobre estante o mesa tecnica: UPS pequena, router, switch, patch cords, fuentes y tester, sin operador sentado, sin rack completo y sin pantallas de monitoreo',
    };
  }
  if (hasAny(titleText, ['modulo descuentos', 'descuentos configurables'])) {
    return {
      kind: 'software',
      name: 'modulo de descuentos configurables',
      scene: 'notebook con interfaz comercial abstracta de reglas y descuentos sin texto, pequenas tarjetas o productos anonimos, router compacto y documentos dados vuelta en oficina comercial',
    };
  }
  if (hasAny(titleText, ['cotizacion para web', 'web estimativa'])) {
    return {
      kind: 'software',
      name: 'cotizacion de desarrollo web institucional',
      scene: 'mesa de proyecto con notebook mostrando wireframes abstractos sin texto, tablet con esquema web borroso, documentos anonimos dados vuelta, router compacto y cable de red en oficina judicial sobria',
    };
  }
  if (hasAny(titleText, ['modulo web y micrositio', 'micrositio'])) {
    return {
      kind: 'software',
      name: 'modulo web y micrositio municipal',
      scene: 'mesa de proyecto municipal con notebook y tablet mostrando bloques abstractos de micrositio sin texto, router compacto, cable de red y documentos anonimos dados vuelta',
    };
  }
  if (hasAny(titleText, ['plantilla e-commerce', 'catalogo de economia social'])) {
    return {
      kind: 'software',
      name: 'plantilla e-commerce de catalogo social',
      scene: 'notebook y tablet mostrando grilla abstracta de catalogo e-commerce sin texto ni precios, pequenas tarjetas o productos anonimos desenfocados, router compacto y documentos en blanco',
    };
  }
  if (hasAny(titleText, ['luminaria led', 'luminaria'])) {
    return {
      kind: 'support',
      name: 'luminarias LED municipales',
      scene: 'luminaria LED generica instalada o preparada para instalacion, cableado, borneras, herramienta y escalera parcial en edificio publico o deposito municipal sin carteles',
    };
  }
  if (hasAny(titleText, ['tablero electrico', 'aire acondicionados'])) {
    return {
      kind: 'support',
      name: 'tablero electrico de aire acondicionado reubicado',
      scene: 'tablero electrico generico para aire acondicionado abierto, llaves termicas sin marcas legibles, canalizacion nueva, cables ordenados y multimetro en planta industrial',
    };
  }
  if (hasAny(titleText, ['servicio de wifi evento', 'wifi evento'])) {
    return {
      kind: 'network',
      name: 'wifi temporal para evento de alta gama',
      scene: 'access point y router compacto preparados para evento, cable UTP prolijo, inyector PoE, tester y atril o estructura de montaje discreta en salon o espacio de evento elegante sin marcas',
    };
  }
  if (hasAny(coreText, ['conectividad en eventos', 'costos por puesto', 'persona conectada', 'configuracion por vlan', 'ssid'])) {
    return {
      kind: 'network',
      name: 'servicios de conectividad para eventos',
      scene: 'mesa tecnica de evento con access points genericos, switch compacto, router, inyectores PoE, patch cords, tester y esquema anonimo dado vuelta para puestos y WiFi temporal, sin rack protagonista',
    };
  }
  if (hasAny(coreText, ['evento sheraton', '300 personas', 'equipamiento wifi'])) {
    return {
      kind: 'network',
      name: 'WiFi temporal para evento hotelero de 300 personas',
      scene: 'mesa tecnica de evento hotelero con varios access points, router compacto, switch pequeno, inyectores PoE, patch cords, tester y plano anonimo dado vuelta, salon desenfocado al fondo',
    };
  }
  if (hasAny(titleText, ['evento 50 personas', '1 ap']) || (hasAny(coreText, ['evento 50 personas']) && hasAny(coreText, ['1 ap', 'un ap']))) {
    return {
      kind: 'network',
      name: 'WiFi temporal para evento de 50 personas',
      scene: 'access point unico preparado para evento, router compacto, inyector PoE, patch cord, tester y mesa tecnica discreta de soporte por un dia, con salon o area temporal desenfocada',
    };
  }
  if (hasAny(coreText, ['cableado de datos y energia', 'licitacion publica']) && hasAny(clientText, ['poder judicial'])) {
    return {
      kind: 'network',
      name: 'cableado de datos y energia judicial',
      scene: 'canalizacion mixta de datos y energia en oficina judicial, cajas de piso o zocalo tecnico, cables separados y ordenados, rosetas RJ45, tomas electricas y tester de red como evidencia',
    };
  }
  if (hasAny(coreText, ['red de cableado estructurado', 'nuevo local'])) {
    return {
      kind: 'network',
      name: 'cableado estructurado para nuevo local',
      scene: 'nuevo local en obra fina con bandeja o canaleta de datos, puestos RJ45, rollos de cable UTP, patch cords y tester verificando enlaces, sin carteleria',
    };
  }
  if (hasAny(titleText, ['30 puestos']) || hasAny(coreText, ['call center', '30 puestos', '20 puestos', '10 puestos'])) {
    return {
      kind: 'network',
      name: 'puestos de red para oficinas y call center',
      scene: 'sala de oficinas o call center desocupada con filas de puestos, canalizacion perimetral, varias rosetas RJ45 instaladas, patch cords ordenados y tester verificando un puesto en primer plano',
    };
  }
  if (hasAny(coreText, ['selectoras de aceitunas', '4 puestos de datos'])) {
    return {
      kind: 'network',
      name: 'puestos de datos en selectoras de aceitunas',
      scene: 'linea industrial de selectoras de aceitunas con cuatro puestos RJ45 o cajas de datos, canalizacion prolija, cable UTP, patch cords y tester verificando los enlaces',
    };
  }
  if (hasAny(titleText, ['predio de chalet'])) {
    return {
      kind: 'cctv',
      name: 'camaras en predio de chalet',
      scene: 'camara de seguridad generica instalada en alero o poste exterior de chalet/predio, cableado protegido, herramienta de ajuste y segunda camara sugerida al fondo, sin personas',
    };
  }
  if (hasAny(titleText, ['adicionales triunfo seguro'])) {
    return {
      kind: 'network',
      name: 'adicionales de conectividad en oficina de seguros',
      scene: 'pequeno agregado de conectividad en oficina de seguros con dos nuevos puntos RJ45, canaleta perimetral, patch cords, tester y tapas modulares sobre mesa o zocalo tecnico',
    };
  }
  if (hasAny(titleText, ['cd - hospital schestakow', 'cd hospital schestakow'])) {
    return {
      kind: 'network',
      name: 'corrientes debiles hospitalarias',
      scene: 'caja o tablero de corrientes debiles en hospital con canalizacion prolija, cables de datos/llamadores, tester, patch cords y cielorraso tecnico limpio, sin pacientes',
    };
  }
  if (hasAny(titleText, ['provision de periscopio', 'periscopio 6 modulos'])) {
    return {
      kind: 'network',
      name: 'periscopio de seis modulos',
      scene: 'periscopio de piso o mesa para seis modulos de datos/energia, placas modulares, tomas RJ45, cableado ordenado, tester y tornilleria sobre banco tecnico de oficina de gestion hidrica',
    };
  }
  if (hasAny(titleText, ['modulos de rele', 'modulos de rele frm', 'rele frm'])) {
    return {
      kind: 'sdi',
      name: 'modulos de rele para obra',
      scene: 'modulos de rele genericos para sistema de incendio o control, borneras, cable rojo/negro, multimetro y herramientas sobre mesa tecnica de obra o edificio, sin marca visible',
    };
  }
  if (hasAny(coreText, ['sistema de deteccion de incendio sede'])) {
    return {
      kind: 'sdi',
      name: 'sistema de deteccion de incendio en sede publica',
      scene: 'detector de humo, pulsador manual y sirena instalados en corredor institucional, conduit prolijo y multimetro o planilla anonima como evidencia, sin escudos ni carteles',
    };
  }
  if (hasAny(titleText, ['colocacion de 5 camaras', '5 camaras'])) {
    return {
      kind: 'cctv',
      name: 'colocacion de camaras en distintos sectores',
      scene: 'camara de seguridad instalada en entrada de planta industrial y otra camara visible en profundidad de pasillo, canalizacion prolija, tester o herramienta de ajuste cercana',
    };
  }
  if (hasAny(titleText, ['colocacion de 4 camaras', '4 camaras'])) {
    return {
      kind: 'cctv',
      name: 'colocacion de cuatro camaras en oficinas',
      scene: 'dos camaras de seguridad instaladas en zonas distintas de una oficina de salud o administrativa, una en primer plano y otra sugerida al fondo, cableado prolijo y herramienta de ajuste cercana',
    };
  }
  if (hasAny(titleText, ['3 camaras de cctv', '3 camaras']) && hasAny(coreText, ['edificio mitre'])) {
    return {
      kind: 'cctv',
      name: 'tres camaras CCTV en edificio',
      scene: 'camara de seguridad instalada en palier o pasillo de edificio, segunda camara sugerida al fondo y tercera como equipo preparado en banco o escalera parcial, canalizacion prolija y herramienta cercana',
    };
  }
  if (hasAny(titleText, ['logistica'])) {
    return {
      kind: 'support',
      name: 'logistica de materiales tecnicos',
      scene: 'preparacion logistica de materiales tecnologicos para obra, cajas anonimas, rollos de cable, canaletas, herramientas y checklist sin texto sobre mesa o baul de utilitario',
    };
  }
  if (hasAny(titleText, ['ingenieria torres'])) {
    return {
      kind: 'support',
      name: 'ingenieria tecnica para edificio en torre',
      scene: 'relevamiento tecnico de obra edilicia con plano anonimo dado vuelta, nivel laser o cinta metrica, canalizacion prevista y caja tecnica en pared de edificio en construccion, sin antena ni torre de telecomunicaciones',
    };
  }
  if (hasAny(titleText, ['cambio de bateria']) && !hasAny(titleText, ['central de incendio'])) {
    return {
      kind: 'hardware',
      name: 'cambio de bateria de respaldo',
      scene: 'bateria sellada de respaldo reemplazada en UPS o gabinete tecnico pequeno, cables rojo/negro, multimetro y destornillador en oficina institucional o universidad, sin carteles',
    };
  }
  if (hasAny(titleText, ['relevos de sdi', 'relevamiento de sdi']) || hasAny(coreText, ['sdi en supermercados'])) {
    return {
      kind: 'sdi',
      name: 'relevamiento SDI en supermercado',
      scene: 'detector de humo y sirena instalados sobre pasillo tecnico de supermercado o deposito, escalera parcial, multimetro y planilla anonima sin texto como evidencia de relevamiento',
    };
  }
  if (hasAny(titleText, ['asistencia tecnica sdi'])) {
    return {
      kind: 'sdi',
      name: 'diagnostico de lazo SDI industrial',
      scene: 'detalle de multimetro y puntas de prueba verificando lazo de deteccion en borneras de central o caja tecnica, detector de humo y cable rojo/negro cercanos, planta industrial desenfocada al fondo',
    };
  }
  if (hasAny(coreText, ['semana de trabajo en sdi', 'sdi para terminar'])) {
    return {
      kind: 'sdi',
      name: 'terminacion de trabajos SDI en planta',
      scene: 'tramo final de instalacion SDI en planta industrial con conduit, detector de humo, sirena o pulsador, cables rojo/negro organizados, escalera parcial y herramientas de terminacion',
    };
  }
  if (hasAny(coreText, ['mano de obra para sdi hotel sheraton', '5 dias de mano de obra para sdi'])) {
    return {
      kind: 'sdi',
      name: 'mano de obra SDI en hotel',
      scene: 'carro tecnico de hotel con detectores de humo, bases, cable rojo/negro, multimetro y herramientas, con corredor hotelero desenfocado como contexto y sin marcas visibles',
    };
  }
  if (hasAny(coreText, ['revision de camaras', 'camaras fuera'])) {
    return {
      kind: 'cctv',
      name: 'revision tecnica de camaras fuera de servicio',
      scene: 'camara de seguridad retirada o abierta sobre mesa tecnica de oficina de seguros, tester de video o red, fuente, conectores, herramientas y segunda camara instalada desenfocada al fondo',
    };
  }
  if (hasAny(coreText, ['cable de 3x70', '1x50', 'tendido de un cable']) && hasAny(coreText, ['quilmes'])) {
    return {
      kind: 'support',
      name: 'tendido de cable industrial de potencia',
      scene: 'bobina o tramo de cable industrial grueso de potencia sobre piso tecnico de planta cervecera, bandeja portacables, prensaestopas, guantes, herramienta de tendido y tablero electrico desenfocado',
    };
  }
  if (hasAny(coreText, ['tres dias de trabajo', 's&h']) && !hasAny(coreText, ['camara', 'camaras'])) {
    return {
      kind: 'support',
      name: 'planificacion de jornadas tecnicas en planta',
      scene: 'mesa de preparacion de trabajo en planta cervecera con EPP anonimo, herramientas, rollo de cable, canalizacion, checklist dado vuelta y permiso de trabajo sin texto legible, sin personas protagonistas',
    };
  }
  if (hasAny(titleText, ['cctv analogica', 'cctv analogico', '2 camaras'])) {
    return {
      kind: 'cctv',
      name: 'provision de camaras CCTV analogicas',
      scene: 'dos camaras analogicas genericas sobre banco tecnico de bodega, cable coaxial, conectores BNC, fuente de alimentacion y tester de video, sin puesto de monitoreo',
    };
  }
  if (hasAny(titleText, ['telefono analogico', 'telefono', 'telefonos'])) {
    return {
      kind,
      name: 'telefonia instalada',
      scene: 'telefonos de escritorio conectados en puesto administrativo, patch cords, roseta telefonica o de red y herramienta de diagnostico, con contexto del cliente visible',
    };
  }
  if (hasAny(titleText, ['puesto de datos'])) {
    return {
      kind,
      name: 'puesto de datos reubicado',
      scene: 'nuevo punto de datos RJ45 instalado en pared o zocalo tecnico, canaleta prolija, patch cord conectado y tester de red verificando el enlace',
    };
  }
  if (hasAny(titleText, ['activos de red'])) {
    return {
      kind,
      name: 'activos de red compactos',
      scene: 'switches, router compacto, patch cords, fuente de alimentacion y tester de red organizados sobre banco tecnico, listos para instalacion',
    };
  }
  if (hasAny(titleText, ['faceplate', 'porta bastidor', 'cablecanal'])) {
    return {
      kind,
      name: 'faceplates y bastidores de red',
      scene: 'faceplates de cuatro puertos, porta bastidores para cablecanal, modulos RJ45, patch cords y tester organizados sobre banco tecnico',
    };
  }
  if (hasAny(titleText, ['chapas para modulos', 'chapas de datos', 'modulos jeluz'])) {
    return {
      kind,
      name: 'chapas y modulos de datos',
      scene: 'chapas para modulos, placas de datos, modulos RJ45, tornilleria, cablecanal y tester organizados sobre banco tecnico de obra',
    };
  }
  if (hasAny(titleText, ['rack mural'])) {
    return {
      kind,
      name: 'rack mural provisto',
      scene: 'rack mural compacto instalado en pared con puerta abierta, patchera pequena, switch y cableado ordenado, mostrado como equipo final sin persona delante',
    };
  }
  if (hasAny(titleText, ['conectores lc', 'lc/pc'])) {
    return {
      kind,
      name: 'conectores de fibra LC/PC',
      scene: 'macro de conectores LC/PC monomodo, cordones amarillos de fibra, herramienta de corte y medidor optico sobre banco tecnico',
    };
  }
  if (hasAny(titleText, ['conector sc', 'sc/upc', 'fo-'])) {
    return {
      kind,
      name: 'conector de fibra SC/UPC',
      scene: 'macro de conectores SC/UPC monomodo, cordones amarillos de fibra, cleaver, pelacable y medidor optico sobre banco tecnico',
    };
  }
  if (hasAny(titleText, ['crimpeadora'])) {
    return {
      kind,
      name: 'herramienta de crimpeo',
      scene: 'crimpeadora profesional de red junto a conectores RJ45, cable UTP pelado, patch cords y tester sobre banco tecnico',
    };
  }
  if (hasAny(titleText, ['drop flat', 'g657a2', '2core'])) {
    return {
      kind,
      name: 'cable drop flat de fibra',
      scene: 'rollo de cable drop flat 2 core para fibra optica, tramo de cable abierto, conectores y medidor optico sobre banco o bobina tecnica',
    };
  }
  if (hasAny(titleText, ['ftth'])) {
    return {
      kind: 'network',
      name: 'tendido FTTH municipal',
      scene: 'tendido exterior de fibra FTTH con bobina de drop, caja de empalme optica o FAT en poste bajo o camara de vereda abierta, medidor optico y cordones de fibra, sin roseta RJ45',
    };
  }
  if (hasAny(titleText, ['panel remoto'])) {
    return {
      kind,
      name: 'panel remoto instalado',
      scene: 'panel remoto de alarma o control montado en pared tecnica, conduit prolijo, indicadores apagados o abstractos y herramienta de verificacion cercana',
    };
  }
  if (hasAny(titleText, ['computadora completa', 'computadora de escritorio', 'pc de escritorio', 'desktop', 'computadora + monitor'])) {
    return {
      kind,
      name: 'puesto informatico completo',
      scene: 'PC de escritorio completa con monitor, teclado, mouse, UPS pequena y cableado ordenado sobre puesto real de trabajo, con herramientas de configuracion como detalle secundario',
    };
  }
  if (hasAny(titleText, ['pc de oficina', 'disco ssd'])) {
    return {
      kind,
      name: 'PC de oficina con SSD',
      scene: 'PC de escritorio de oficina con gabinete abierto o lateral retirado, disco SSD visible, monitor, teclado, mouse y herramienta de configuracion',
    };
  }
  if (hasAny(titleText, ['servidor de backup', 'backup'])) {
    return {
      kind,
      name: 'backup local compacto',
      scene: 'servidor de backup compacto o NAS con discos extraibles, UPS pequena, disco externo y patch cords sobre estante tecnico o banco de trabajo, sin rack como protagonista',
    };
  }
  if (hasAny(titleText, ['servidor'])) {
    return {
      kind,
      name: 'servidor compacto en preparacion',
      scene: 'servidor torre o compacto sobre banco tecnico con UPS, patch cords, disco externo y herramientas de configuracion, listo para instalacion industrial',
    };
  }
  if (hasAny(titleText, ['insumo informatica', 'insumo de informatica', 'insumos de informatica'])) {
    return {
      kind,
      name: 'kit de insumos informaticos',
      scene: 'conjunto ordenado de perifericos, adaptadores, patch cords, disco externo y fuente de alimentacion sobre banco tecnico, con etiquetas anonimas sin texto legible',
    };
  }
  if (hasAny(titleText, ['placa de video'])) {
    return {
      kind,
      name: 'placa de video',
      scene: 'placa de video GPU sobre banco tecnico con gabinete de PC abierto, cable de video, destornillador y bolsa antiestatica sin marcas visibles',
    };
  }
  if (hasAny(titleText, ['disco duro'])) {
    return {
      kind,
      name: 'disco duro',
      scene: 'disco duro o unidad de almacenamiento sobre banco tecnico, adaptador SATA/USB, cableado y herramienta de diagnostico junto a equipo informatico',
    };
  }
  if (hasAny(titleText, ['corrientes debiles'])) {
    return {
      kind,
      name: 'corrientes debiles instaladas',
      scene: 'canalizacion de corrientes debiles con caja tecnica, cables de datos y alarma, tester y herramientas, en edificio u obra terminada',
    };
  }
  if (hasAny(titleText, ['scanner', 'escaner'])) {
    return {
      kind,
      name: 'scanner documental instalado',
      scene: 'scanner documental de oficina junto a hojas en blanco, laptop con interfaz abstracta sin texto, cable USB y fuente de alimentacion sobre escritorio tecnico',
    };
  }
  if (hasAny(titleText, ['pulsador', 'pusaldor', 'baterias'])) {
    return {
      kind,
      name: 'pulsador y baterias SDI',
      scene: 'pulsador manual rojo de incendio, baterias selladas de respaldo, cable rojo/negro, multimetro y destornillador sobre banco tecnico hospitalario',
    };
  }
  if (hasAny(titleText, ['denwa', 'central mini', 'central telefonica'])) {
    return {
      kind,
      name: 'central telefonica compacta',
      scene: 'central telefonica compacta tipo PBX/VoIP sobre escritorio tecnico, telefono IP, patch cords, fuente de alimentacion y herramienta de diagnostico',
    };
  }
  if (hasAny(titleText, ['telefonos ip', 'telefono ip'])) {
    return {
      kind,
      name: 'telefonia IP instalada',
      scene: 'telefonos IP conectados en puesto administrativo, pequeno switch PoE, patch cords y herramienta de diagnostico, con contexto del cliente visible',
    };
  }
  if (hasAny(titleText, ['instalacion de ap', 'provision e instalacion de ap', ' ap,', 'access point'])) {
    return {
      kind,
      name: 'access point instalado',
      scene: 'access point instalado en cielorraso o pared con cableado oculto, inyector PoE o pequeno switch y tester de red como evidencia de instalacion',
    };
  }
  if (hasAny(titleText, ['enlace para camping', 'camping municipal'])) {
    return {
      kind,
      name: 'enlace inalambrico municipal',
      scene: 'antena o radio de enlace punto a punto instalada en mastil bajo, cable UTP exterior, inyector PoE y tester de red como evidencia de instalacion',
    };
  }
  if (hasAny(titleText, ['enlace punto a punto'])) {
    return {
      kind,
      name: 'enlace punto a punto',
      scene: 'radioenlace punto a punto con antena direccional instalada en mastil o fachada, cable exterior UTP, inyector PoE y tester como evidencia tecnica',
    };
  }
  if (hasAny(titleText, ['torre y equipamiento', 'provision de torre'])) {
    return {
      kind,
      name: 'torre y equipamiento de comunicaciones',
      scene: 'tramo de torre o mastil de comunicaciones con antena, herrajes, cable exterior y gabinete tecnico pequeno listo para montaje',
    };
  }
  if (hasAny(titleText, ['camara de cctv'])) {
    return {
      kind,
      name: 'camara CCTV instalada',
      scene: 'camara CCTV domo o bullet instalada en fachada o estructura real, cableado prolijo y herramienta de ajuste cercana, sin puesto de monitoreo',
    };
  }
  const recipes = RECIPES[kind] ?? RECIPES.corporate;
  const recipe = recipes[kindIndex % recipes.length];
  return { kind, name: recipe[0], scene: recipe[1] };
}

function specificAvoid(kind) {
  const avoids = [
    'no tecnico de espaldas frente a rack',
    'no persona mirando pantallas de espaldas',
    'no sala de servidores generica como solucion comodin',
    'no collage ni grilla',
    'no texto legible, logos, marcas de cliente ni marcas inventadas',
    'no rostros reconocibles',
  ];
  if (kind !== 'network' && kind !== 'support') avoids.push('no rack frontal como motivo principal');
  if (kind !== 'cctv') avoids.push('no camara CCTV generica si no corresponde al alcance');
  return avoids.join('; ');
}

function itemPrompt(item, index, kindIndex) {
  const { kind, name, scene } = recipeFor(item, kindIndex);
  const composition = compositionFor(kind, index);
  const context = contextFor(item);
  const filename = `${item.expected_filename || `${item.antecedente_id}-${item.slug}-principal`}.png`;

  return `----
ID antecedente: ${item.antecedente_id}
Nombre esperado al descargar: ${filename}
Cliente: ${item.cliente}
Sector / area: ${item.area}
Titulo: ${item.titulo}
Descripcion: ${item.descripcion}
Concepto visual unico: ${name}.
Escena concreta: ${scene}, ubicado en ${context}.
Composicion obligatoria: ${composition}. Mantener estetica documental realista, luz natural o LED de trabajo, materiales reales y detalle tecnico.
Elementos a priorizar: dispositivo final, cableado prolijo, herramientas o instrumentos de diagnostico, arquitectura del sector y evidencia fisica del trabajo.
Evitar en esta imagen: ${specificAvoid(kind)}.
Instruccion especifica:
Generar UNA imagen separada para este antecedente, horizontal 16:10 o 16:9, minimo 1600 px de ancho si la herramienta lo permite.`;
}

function promptForLote(lote) {
  const manifest = readManifest(lote);
  const kindCounts = new Map();
  const products = manifest.map((item, index) => {
    const kind = classify(item);
    const kindIndex = kindCounts.get(kind) ?? 0;
    kindCounts.set(kind, kindIndex + 1);
    return itemPrompt(item, index, kindIndex);
  }).join('\n\n');
  return `# Prompt para ChatGPT Images - Antecedentes UMSA

Actua como director de fotografia documental para una empresa argentina de tecnologia e infraestructura digital.

Objetivo:
Crear una imagen separada por antecedente, apta para el sitio www.ultimamilla.com.ar.

Reglas visuales:
- Estetica documental realista, no render 3D, no stock generico, no ilustracion.
- Escenas tecnicas creibles: equipos instalados, cableado, fibra optica, tableros, camaras CCTV, detectores, salas tecnicas, obras, puestos de operacion o software segun el caso.
- Luz natural o LED de trabajo, composicion sobria, materiales reales y detalle tecnico.
- Formato horizontal 16:10 o 16:9, minimo 1600 px de ancho si la herramienta lo permite.
- Sin texto visible agregado, sin marcas de agua, sin logos inventados.
- Sin inventar logos ni marcas de clientes. Evitar rostros reconocibles y personas identificables.
- No generar collage ni grillas. Generar una imagen individual por cada ID.

Reglas anti-repeticion:
- No resolver el lote con la misma escena repetida. Especialmente evitar el comodin "tecnico de espaldas frente a un rack".
- Cada ID debe respetar su "Concepto visual unico" y variar escala, angulo, fondo y objeto protagonista.
- Usar contexto sectorial cuando aparezca en el antecedente: aeropuerto, hospital, bodega, edificio, oficina publica, hotel, planta industrial u oficina corporativa.
- Si aparece una persona, que sea parcial: manos, antebrazo o silueta secundaria. Nunca convertirla en protagonista ni mostrar un rostro identificable.
- Un rack completo solo puede aparecer como elemento secundario cuando el antecedente realmente sea de redes/soporte. Priorizar dispositivo final, detalle instalado, mesa tecnica o contexto real.

Regla operativa:
Este flujo es manual: Codex prepara lotes y prompts, la generacion/descarga se hace manualmente en ChatGPT Images, sin automatizar chatgpt.com.

Productos del lote:

${products}
`;
}

function resolveTargets(args) {
  const lotes = listLotes();
  if (args.lote) return [args.lote];
  const from = args.from ? loteNumber(args.from) : loteNumber(lotes[0]);
  const to = args.to ? loteNumber(args.to) : loteNumber(lotes.at(-1));
  return lotes.filter((lote) => loteNumber(lote) >= from && loteNumber(lote) <= to);
}

const args = parseArgs(process.argv.slice(2));
const targets = resolveTargets(args);

for (const lote of targets) {
  const out = path.join(ROOT, 'lotes', lote, 'prompt_chatgpt.md');
  fs.writeFileSync(out, promptForLote(lote), 'utf8');
  console.log(`Rewritten ${out}`);
}
