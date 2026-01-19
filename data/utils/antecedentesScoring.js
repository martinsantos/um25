/**
 * Sistema de Scoring para Ordenar Antecedentes por Impacto
 * Considera: Envergadura de marca, complejidad, sector, recencia
 */

// Marcas de alto impacto (clientes importantes/reconocibles)
const MARCAS_IMPACTO_ALTO = [
  'gobierno', 'mendoza', 'afip', 'municipalidad', 'ministerio', 'provincia',
  'hospital', 'unidad sanitaria', 'clínica', 'salud',
  'aeropuerto', 'aeroparque', 'aviación',
  'banco', 'credicoop', 'financiero', 'seguros',
  'universidad', 'instituto técnico', 'educación',
  'minería AngloGold', 'minera', 'codelco',
  'yacimiento', 'explotación minera',
  'gendarmería', 'policía', 'seguridad pública',
  'obra pública', 'construcción mayor'
];

const MARCAS_IMPACTO_MEDIO = [
  'constructora', 'empresa constructora', 'constructor',
  'bodega vitivinícola', 'bodega', 'viña',
  'agroindustria', 'agrícola', 'agroalimentaria',
  'manufactura', 'industrial', 'fábrica',
  'logística', 'distribuidora', 'transporte',
  'retail', 'comercio', 'centro comercial',
  'hogar', 'residencia', 'desarrollo inmobiliario'
];

// Sectores de alto impacto
const SECTORES_IMPACTO_ALTO = [
  'gobierno',
  'salud',
  'aeropuertos',
  'minería',
  'defensa',
  'educación',
  'finanzas'
];

const SECTORES_IMPACTO_MEDIO = [
  'industria',
  'construcción',
  'bodegas',
  'logística',
  'manufacturá'
];

/**
 * Calcula score de impacto para un antecedente
 * Rango: 0 (bajo) a 100 (muy alto)
 */
export const calculateImpactScore = (antecedente) => {
  let score = 50; // Score base

  // 1. Score por Envergadura de Cliente (25 puntos máx)
  const clienteLower = (antecedente.Cliente || '').toLowerCase();
  const titleLower = (antecedente.Titulo || '').toLowerCase();
  const descLower = (antecedente.Descripcion || '').toLowerCase();
  const fullText = `${clienteLower} ${titleLower} ${descLower}`;

  // Verificar marcas de alto impacto
  const esClienteAlto = MARCAS_IMPACTO_ALTO.some(marca =>
    fullText.includes(marca.toLowerCase())
  );
  if (esClienteAlto) score += 25;

  // Verificar marcas de impacto medio
  const esClienteMedio = !esClienteAlto && MARCAS_IMPACTO_MEDIO.some(marca =>
    fullText.includes(marca.toLowerCase())
  );
  if (esClienteMedio) score += 12;

  // 2. Score por Sector (20 puntos máx)
  const unidadLower = (antecedente.Unidad_de_negocio || '').toLowerCase();
  const areaLower = (antecedente.Area || '').toLowerCase();

  const esSectorAlto = SECTORES_IMPACTO_ALTO.some(sector =>
    unidadLower.includes(sector.toLowerCase()) ||
    areaLower.includes(sector.toLowerCase())
  );
  if (esSectorAlto) score += 20;

  const esSectorMedio = !esSectorAlto && SECTORES_IMPACTO_MEDIO.some(sector =>
    unidadLower.includes(sector.toLowerCase()) ||
    areaLower.includes(sector.toLowerCase())
  );
  if (esSectorMedio) score += 10;

  // 3. Score por Complejidad (15 puntos máx)
  // Indicadores de proyecto complejo:
  // - Múltiples áreas mencionadas
  // - Texto largo (>500 caracteres = proyecto ambicioso)
  // - Palabras clave de integración

  const palabrasComplejas = ['integración', 'sistema', 'infraestructura', 'telecomunicaciones',
    'seguridad', 'red', 'datos', 'automatización', 'control', 'monitoreo', 'cctv',
    'incendio', 'acceso', 'comunicaciones', 'corrientes débiles', 'arquitectura'];

  const palabrasComplejasEncontradas = palabrasComplejas.filter(palabra =>
    fullText.includes(palabra)
  ).length;

  const complejidadScore = Math.min(15, Math.floor(palabrasComplejasEncontradas * 1.5));
  score += complejidadScore;

  // Bonus por descripción detallada
  if ((antecedente.Descripcion || '').length > 300) {
    score += 5;
  }

  // 4. Score por Recencia (10 puntos máx)
  if (antecedente.Fecha) {
    try {
      const fechaProyecto = new Date(antecedente.Fecha);
      const ahora = new Date();
      const diasAtras = (ahora - fechaProyecto) / (1000 * 60 * 60 * 24);

      if (diasAtras < 90) {
        score += 10; // Muy reciente (< 3 meses)
      } else if (diasAtras < 180) {
        score += 7; // Reciente (< 6 meses)
      } else if (diasAtras < 365) {
        score += 5; // Año actual
      } else if (diasAtras < 730) {
        score += 3; // Último año
      }
    } catch (e) {
      // Sin penalización si no se puede parsear la fecha
    }
  }

  // 5. Penalización por proyectos pequeños/simples
  if ((antecedente.Descripcion || '').length < 50) {
    score = Math.max(30, score - 10);
  }

  // Asegurar que el score esté entre 0 y 100
  return Math.min(100, Math.max(0, Math.round(score)));
};

/**
 * Ordena antecedentes por impacto (mayor a menor)
 */
export const sortByImpact = (antecedentes) => {
  return [...antecedentes].sort((a, b) => {
    const scoreA = calculateImpactScore(a);
    const scoreB = calculateImpactScore(b);

    // Ordenar por score descendente (mayor impacto primero)
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    // Si los scores son iguales, usar ID como desempate (más recientes primero)
    return (b.id || 0) - (a.id || 0);
  });
};

/**
 * Retorna análisis detallado del score (para debugging)
 */
export const getImpactScoreDetails = (antecedente) => {
  const clienteLower = (antecedente.Cliente || '').toLowerCase();
  const titleLower = (antecedente.Titulo || '').toLowerCase();
  const descLower = (antecedente.Descripcion || '').toLowerCase();
  const fullText = `${clienteLower} ${titleLower} ${descLower}`;

  const details = {
    titulo: antecedente.Titulo,
    cliente: antecedente.Cliente,
    totalScore: calculateImpactScore(antecedente),
    detalles: {
      clienteAlto: MARCAS_IMPACTO_ALTO.some(marca => fullText.includes(marca)),
      clienteMedio: MARCAS_IMPACTO_MEDIO.some(marca => fullText.includes(marca)),
      sectorAlto: SECTORES_IMPACTO_ALTO.some(sector =>
        (antecedente.Unidad_de_negocio || '').toLowerCase().includes(sector) ||
        (antecedente.Area || '').toLowerCase().includes(sector)
      ),
      complejidad: (antecedente.Descripcion || '').length > 300 ? 'Alta' : 'Media',
      descripcionLength: (antecedente.Descripcion || '').length
    }
  };

  return details;
};

/**
 * Grouping de antecedentes por tier de impacto
 */
export const groupByImpactTier = (antecedentes) => {
  const sorted = sortByImpact(antecedentes);

  return {
    premium: sorted.filter(a => calculateImpactScore(a) >= 80),      // Score >= 80
    destacados: sorted.filter(a => {
      const score = calculateImpactScore(a);
      return score >= 60 && score < 80;
    }),  // Score 60-79
    regular: sorted.filter(a => {
      const score = calculateImpactScore(a);
      return score < 60;
    })    // Score < 60
  };
};

/**
 * Retorna antecedentes principales (para hero, showcase)
 * Los 3-5 más impactantes
 */
export const getTopProjects = (antecedentes, count = 5) => {
  return sortByImpact(antecedentes).slice(0, count);
};
