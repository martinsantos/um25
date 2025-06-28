#!/bin/bash

# Crear directorio de servicios en Directus
mkdir -p directus-admin/uploads/services

# Copiar imágenes al directorio de uploads de Directus
echo "Copiando imágenes..."
cp public/images/services/*.jpg directus-admin/uploads/services/

# Generar SQL para insertar las imágenes
cat > directus-admin/import-services.sql << EOL
-- Crear carpeta de servicios
INSERT INTO directus_folders (id, name, parent)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Servicios', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insertar imágenes
INSERT INTO directus_files (
    id,
    storage,
    filename_disk,
    filename_download,
    title,
    type,
    folder,
    uploaded_by,
    uploaded_on,
    modified_by,
    modified_on,
    metadata
)
VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'local', 'services/servicios-it.jpg', 'servicios-it.jpg', 'Servicios IT y Consultoría', 'image/jpeg', '550e8400-e29b-41d4-a716-446655440000', NULL, NOW(), NULL, NOW(), '{"type":"image/jpeg"}'),
    ('550e8400-e29b-41d4-a716-446655440002', 'local', 'services/servicios-web.jpg', 'servicios-web.jpg', 'Servicios Web y Desarrollo', 'image/jpeg', '550e8400-e29b-41d4-a716-446655440000', NULL, NOW(), NULL, NOW(), '{"type":"image/jpeg"}'),
    ('550e8400-e29b-41d4-a716-446655440003', 'local', 'services/redes-comunicaciones.jpg', 'redes-comunicaciones.jpg', 'Redes y Comunicaciones', 'image/jpeg', '550e8400-e29b-41d4-a716-446655440000', NULL, NOW(), NULL, NOW(), '{"type":"image/jpeg"}'),
    ('550e8400-e29b-41d4-a716-446655440004', 'local', 'services/ciberseguridad.jpg', 'ciberseguridad.jpg', 'Ciberseguridad', 'image/jpeg', '550e8400-e29b-41d4-a716-446655440000', NULL, NOW(), NULL, NOW(), '{"type":"image/jpeg"}'),
    ('550e8400-e29b-41d4-a716-446655440005', 'local', 'services/seguridad-informatica.jpg', 'seguridad-informatica.jpg', 'Seguridad Informática', 'image/jpeg', '550e8400-e29b-41d4-a716-446655440000', NULL, NOW(), NULL, NOW(), '{"type":"image/jpeg"}'),
    ('550e8400-e29b-41d4-a716-446655440006', 'local', 'services/telefonia.jpg', 'telefonia.jpg', 'Telefonía y Citofonía', 'image/jpeg', '550e8400-e29b-41d4-a716-446655440000', NULL, NOW(), NULL, NOW(), '{"type":"image/jpeg"}')
ON CONFLICT (id) DO NOTHING;
EOL

# Ejecutar SQL en el contenedor de la base de datos
echo "Importando imágenes a la base de datos..."
cd directus-admin
docker-compose exec -T database psql -U myuser mydatabase < import-services.sql

echo "✨ Migración completada!" 