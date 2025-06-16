-- Script para restaurar servicios faltantes

-- Servicio 409: SDI: Bodela la Esmeralda
INSERT INTO "Servicios" (
    id, status, user_created, date_created, user_updated, date_updated,
    "Titulo", "Descripcion"
) VALUES (
    409, 'published', '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:38.284Z'::timestamp with time zone,
    '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:38.284Z'::timestamp with time zone,
    'SDI: Bodela la Esmeralda', 'Adicional - Detector de humo'
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    user_updated = EXCLUDED.user_updated,
    date_updated = EXCLUDED.date_updated,
    "Titulo" = EXCLUDED."Titulo",
    "Descripcion" = EXCLUDED."Descripcion";

-- Servicio 410: SDI: Gamas
INSERT INTO "Servicios" (
    id, status, user_created, date_created, user_updated, date_updated,
    "Titulo", "Descripcion"
) VALUES (
    410, 'published', '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:38.318Z'::timestamp with time zone,
    '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:38.318Z'::timestamp with time zone,
    'SDI: Gamas', 'SDI - Local Comercial N°11 -COMPLEJO PLANTA UNO'
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    user_updated = EXCLUDED.user_updated,
    date_updated = EXCLUDED.date_updated,
    "Titulo" = EXCLUDED."Titulo",
    "Descripcion" = EXCLUDED."Descripcion";

-- Servicio 411: Redes de Cableado Estructurado: Premix SA
INSERT INTO "Servicios" (
    id, status, user_created, date_created, user_updated, date_updated,
    "Titulo", "Descripcion"
) VALUES (
    411, 'published', '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:38.35Z'::timestamp with time zone,
    '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:38.35Z'::timestamp with time zone,
    'Redes de Cableado Estructurado: Premix SA', 'Cableado Estructurado oficinas'
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    user_updated = EXCLUDED.user_updated,
    date_updated = EXCLUDED.date_updated,
    "Titulo" = EXCLUDED."Titulo",
    "Descripcion" = EXCLUDED."Descripcion";

-- Servicio 412: SDI: Aeropuertos Argentina 2000
INSERT INTO "Servicios" (
    id, status, user_created, date_created, user_updated, date_updated,
    "Titulo", "Descripcion"
) VALUES (
    412, 'published', '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:38.384Z'::timestamp with time zone,
    '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:38.384Z'::timestamp with time zone,
    'SDI: Aeropuertos Argentina 2000', 'Insumos de SDI'
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    user_updated = EXCLUDED.user_updated,
    date_updated = EXCLUDED.date_updated,
    "Titulo" = EXCLUDED."Titulo",
    "Descripcion" = EXCLUDED."Descripcion";

-- Servicio 413: Internet: Fondo para la transformación y el Crecimiento de Mendoza (FTyC)
INSERT INTO "Servicios" (
    id, status, user_created, date_created, user_updated, date_updated,
    "Titulo", "Descripcion"
) VALUES (
    413, 'published', '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:38.426Z'::timestamp with time zone,
    '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:38.426Z'::timestamp with time zone,
    'Internet: Fondo para la transformación y el Crecimiento de Mendoza (FTyC)', 'Prestación de servicio de Internet compartido 20MB x 24 meses.'
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    user_updated = EXCLUDED.user_updated,
    date_updated = EXCLUDED.date_updated,
    "Titulo" = EXCLUDED."Titulo",
    "Descripcion" = EXCLUDED."Descripcion";

-- Verificar los servicios restaurados
SELECT id, "Titulo", "Descripcion", date_created 
FROM "Servicios" 
WHERE id IN (409, 410, 411, 412, 413)
ORDER BY id DESC;
