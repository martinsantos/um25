# Sincronización de Servicios y Productos

Este conjunto de scripts sincroniza los productos de los documentos de marketing con Directus.

## Archivos Creados

```
scripts/
├── audit-all-servicios.mjs      # Audita estado actual de Directus
├── upload-service-images.mjs    # Sube imágenes a Directus
├── sync-productos-marketing.mjs # Sincroniza productos
├── README-SYNC-SERVICIOS.md     # Este archivo
└── data/
    ├── productos-marketing.json # 54 productos parseados del documento
    └── image-uuid-mapping.json  # Mapeo imagen → UUID (generado)
```

## Requisitos

1. **Directus corriendo** en `localhost:8055` o configurar `PUBLIC_DIRECTUS_URL`
2. **Token de Directus** válido
3. **Imágenes** en `/serviciosimg/limpias/`

## Uso

### Paso 1: Iniciar Directus

```bash
# Opción A: Docker local
cd directus-admin
docker-compose up -d

# Opción B: Conectar a producción (requiere VPN/acceso)
export PUBLIC_DIRECTUS_URL=https://admin.ultimamilla.com.ar
```

### Paso 2: Auditar Estado Actual

```bash
node scripts/audit-all-servicios.mjs
```

Esto genera:
- Mapeo de IDs de servicio a unidades del documento
- Lista de productos actuales vs esperados
- Estado de imágenes

### Paso 3: Subir Imágenes

```bash
node scripts/upload-service-images.mjs
```

Esto:
- Sube las 54 imágenes de `/serviciosimg/limpias/` a Directus
- Genera `scripts/data/image-uuid-mapping.json`
- Omite imágenes que ya existen

### Paso 4: Sincronizar Productos (Dry-Run)

```bash
node scripts/sync-productos-marketing.mjs
```

Esto muestra qué cambios se harían SIN aplicarlos.

### Paso 5: Aplicar Cambios

```bash
node scripts/sync-productos-marketing.mjs --execute
```

Esto aplica los cambios en Directus.

### Opciones Adicionales

```bash
# Sincronizar solo un servicio específico
node scripts/sync-productos-marketing.mjs --service=103

# Ejecutar solo para un servicio
node scripts/sync-productos-marketing.mjs --service=103 --execute
```

## Mapeo de Unidades a Servicios

| Unidad | Nombre | Productos | ID (a confirmar) |
|--------|--------|-----------|------------------|
| 1 | Infraestructura de Redes | 8 | ? |
| 2 | Seguridad Electrónica | 8 | ? |
| 3 | Telecomunicaciones | 6 | 103 |
| 4 | Desarrollo de Software | 6 | ? |
| 5 | Soporte TIC | 5 | ? |
| 6 | Consultoría IT | 5 | ? |
| 7 | Detección de Incendios | 8 | ? |
| 8 | Servicios Eléctricos | 8 | ? |

**Total: 54 productos**

## Estructura de Datos

Cada producto tiene:
- `titulo` - Nombre orientado a beneficio
- `descripcion` - Texto marketing + servicio que ofrece UM
- `destacado` - Headline (frase de impacto)
- `features` - 3 beneficios (array de strings)
- `imagen` - UUID de Directus
- `orden` - Posición (0-based)

## Verificación

Después de ejecutar, verificar visualmente:

```bash
npm run dev
# Navegar a cada servicio
```

Checklist por servicio:
- [ ] Número correcto de productos
- [ ] Títulos coinciden con documento
- [ ] Headlines visibles en campo destacado
- [ ] 3 beneficios con checkmarks
- [ ] Imágenes correctas
- [ ] Layout alternado (izq-der)

## Rollback

Si algo sale mal, los datos originales NO se eliminan del todo.
El script `sync-log.json` guarda los cambios realizados.

Para rollback manual:
1. Acceder a Directus Admin
2. Ir a colección `productos`
3. Restaurar/modificar manualmente

## Fuentes de Datos

- `SERVICIOS_MARKETING_COMPLETO.md` - Unidades 1-6
- `UNIDADES_7_8_NUEVOS_SERVICIOS.md` - Unidades 7-8
- `/serviciosimg/limpias/` - Imágenes generadas
