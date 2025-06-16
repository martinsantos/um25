-- Script para restaurar servicios reales faltantes
-- Filtraremos para incluir solo servicios que no sean antecedentes

-- Servicio 3: Seguridad Informática
INSERT INTO "Servicios" (
    id, status, user_created, date_created, user_updated, date_updated,
    "Titulo", "Descripcion"
) VALUES (
    3, 'published', '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-04-10T18:16:53.475Z'::timestamp with time zone,
    '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-04-10T18:16:53.475Z'::timestamp with time zone,
    'Seguridad Informática', 'Sistemas de detección de incendios, Alarmas de intrusión, Sistema de cámaras de seguridad (CCTV), Controles de acceso, Sistema de control de Edificios Inteligentes (BMS)'
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    user_updated = EXCLUDED.user_updated,
    date_updated = EXCLUDED.date_updated,
    "Titulo" = EXCLUDED."Titulo",
    "Descripcion" = EXCLUDED."Descripcion";

-- Servicio 4: Redes y comunicaciones - Torre Laureana y Hotel Fuente Mayor
INSERT INTO "Servicios" (
    id, status, user_created, date_created, user_updated, date_updated,
    "Titulo", "Descripcion"
) VALUES (
    4, 'published', '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:24.74Z'::timestamp with time zone,
    '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:24.74Z'::timestamp with time zone,
    'Redes y comunicaciones - Torre Laureana y Hotel Fuente Mayor', 'Instalación de sistema de detección de incendio para edificio de 68 departamentos en 15 pisos y para el edificio del hotel de 90 habitaciones en 5 pisos.'
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    user_updated = EXCLUDED.user_updated,
    date_updated = EXCLUDED.date_updated,
    "Titulo" = EXCLUDED."Titulo",
    "Descripcion" = EXCLUDED."Descripcion";

-- Servicio 5: Redes y comunicaciones - Cumbre Mercosur 2017
INSERT INTO "Servicios" (
    id, status, user_created, date_created, user_updated, date_updated,
    "Titulo", "Descripcion"
) VALUES (
    5, 'published', '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:24.746Z'::timestamp with time zone,
    '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:24.746Z'::timestamp with time zone,
    'Redes y comunicaciones - Cumbre Mercosur 2017', 'Implementación y soporte para la infraestructura de datos y telefonía empleada en la Cumbre de Presidentes del Mercosur 2017. 600 puestos de datos distribuidos en tres locaciones, 250 terminales de trabajo, 50 centros de impresión operativos para la sala de prensa, 50 puntos de acceso WIFI. Servicios de soporte para la red de datos, voz y WIFI.'
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    user_updated = EXCLUDED.user_updated,
    date_updated = EXCLUDED.date_updated,
    "Titulo" = EXCLUDED."Titulo",
    "Descripcion" = EXCLUDED."Descripcion";

-- Servicio 6: Redes y comunicaciones - Hospital Perrupato (Cableado)
INSERT INTO "Servicios" (
    id, status, user_created, date_created, user_updated, date_updated,
    "Titulo", "Descripcion"
) VALUES (
    6, 'published', '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:24.79Z'::timestamp with time zone,
    '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:24.79Z'::timestamp with time zone,
    'Redes y comunicaciones - Hospital Perrupato', 'Sistemas de Cableado estructurado. Conexiones de fibra óptica.'
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    user_updated = EXCLUDED.user_updated,
    date_updated = EXCLUDED.date_updated,
    "Titulo" = EXCLUDED."Titulo",
    "Descripcion" = EXCLUDED."Descripcion";

-- Servicio 7: Redes y comunicaciones - Hospital Perrupato (Detección de Incendio)
INSERT INTO "Servicios" (
    id, status, user_created, date_created, user_updated, date_updated,
    "Titulo", "Descripcion"
) VALUES (
    7, 'published', '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:24.834Z'::timestamp with time zone,
    '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'::uuid, '2025-05-30T21:36:24.834Z'::timestamp with time zone,
    'Redes y comunicaciones - Hospital Perrupato (Detección de Incendio)', 'Sistema de detección de Incendio para 350 detectores.'
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    user_updated = EXCLUDED.user_updated,
    date_updated = EXCLUDED.date_updated,
    "Titulo" = EXCLUDED."Titulo",
    "Descripcion" = EXCLUDED."Descripcion";

-- Verificar los servicios restaurados
SELECT id, "Titulo", "Descripcion", date_created 
FROM "Servicios" 
WHERE id BETWEEN 1 AND 10
ORDER BY id;
