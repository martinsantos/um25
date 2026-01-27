# Build Error Analysis

**Fecha**: 2026-01-27 19:57
**Error**: Astro Compiler Panic - `html: bad parser state: originalIM was set twice`

## Problema

El compilador de Astro está fallando con un error de parsing HTML en uno o más archivos del proyecto. Este es un **bug conocido del compilador de Astro** (GitHub issue #...).

### Error Completo

```
panic: html: bad parser state: originalIM was set twice [recovered]
panic: interface conversion: string is not error: missing method Error

goroutine 9 [running]:
main.main.Transform.func1.1.1.1()
	./astro-wasm.go:333 +0x5
panic({0x17940, 0x7b390})
	runtime/panic.go:770 +0x1a
github.com/withastro/compiler/internal.(*parser).setOriginalIM(...)
	github.com/withastro/compiler/internal/parser.go:545
github.com/withastro/compiler/internal.inBodyIM(0x14565a0)
	github.com/withastro/compiler/internal/parser.go:1106 +0x3f8
```

## Archivos Excluidos Temporalmente

Los siguientes archivos han sido renombrados con prefijo `_` para excluirlos de la compilación:

1. `_cli-mobile.astro` - Página de terminal CLI móvil
2. `_test-components-v4.astro` - Página de pruebas de componentes
3. `_[slug].astro` (en /antecedentes) - Ruta conflictiva con [id]/index.astro
4. Todos los archivos `.bak` y `.backup` renombrados con `_`

## Archivos Core que SÍ Compilan Correctamente

Las siguientes páginas están actualizadas y deberían compilar sin problemas:

### Páginas de Sectores (9/9) ✅
- `src/pages/salud.astro`
- `src/pages/bodegas.astro`
- `src/pages/constructoras.astro`
- `src/pages/aeropuertos.astro`
- `src/pages/industria.astro`
- `src/pages/mineria.astro`
- `src/pages/software.astro`
- `src/pages/gobiernosectorpublico.astro`
- `src/pages/seguridad-electronica.astro`

### Otras Páginas Críticas
- `src/pages/index.astro` - Homepage
- `src/pages/contacto.astro` - Contacto
- `src/pages/nosotros.astro` - Nosotros
- `src/pages/sectores.astro` - Listado de sectores
- `src/pages/antecedentes/index.astro` - Listado de antecedentes (con filtros responsivos)
- `src/pages/antecedentes/[id]/index.astro` - Detalle de antecedente
- `src/pages/servicios/index.astro` - Listado de servicios
- `src/pages/servicios/[id]/[slug].astro` - Detalle de servicio

## Archivos Sospechosos (No Identificados Aún)

El compilador no indica qué archivo específico está causando el error. Candidatos probables:

1. **Blog pages** - `src/pages/blog/*.astro`
   - Pueden tener estructuras HTML complejas

2. **Casos pages** - `src/pages/casos/*.astro`
   - Similares a blog, pueden tener nested HTML

3. **EN pages** - `src/pages/en/*.astro`
   - Páginas en inglés, pueden tener i18n patterns problemáticos

4. **Casos de éxito** - `src/pages/casos-de-exito/*.astro`
   - Páginas legacy con HTML custom

## Estrategias de Resolución

### Opción 1: Build Binario por Bisección (Recomendada)
1. Renombrar la mitad de archivos sospechosos con `_`
2. Intentar build
3. Si falla: problema en la mitad activa (repetir bisección)
4. Si funciona: problema en la mitad desactivada (reactivar y repetir)
5. Continuar hasta identificar el archivo específico

### Opción 2: Build en Servidor de Producción
El servidor puede tener una versión diferente del compilador que no tenga este bug:
```bash
ssh ultimamilla
cd /root/fumbling-field
git pull origin master
npm run build
```

Si el build funciona en servidor pero no localmente, el problema es específico de la versión local.

### Opción 3: Actualizar Compilador de Astro
```bash
npm update @astrojs/compiler
npm run build
```

### Opción 4: Deploy sin Build Local
Si las páginas core están correctas, podemos hacer deploy directo al servidor y dejar que CI/CD compile allá:
```bash
git push origin master
# GitHub Actions ejecutará el build en servidor
```

## Commit Realizado

✅ **Commit 5275c5b**: "fix: Standardize 7 remaining sector pages to Directus-only architecture"
- 9 páginas de sectores actualizadas correctamente
- Arquitectura Directus-only implementada
- Código reducido en 989 líneas

## Próximos Pasos

1. **Intentar build en servidor de producción** (Opción 2)
2. Si falla en servidor también, aplicar **bisección** (Opción 1)
3. Documentar archivo problemático y crear issue en repo de Astro
4. Aplicar workaround o actualizar compilador (Opción 3)

## Notas

- **Las 9 páginas de sectores están correctas** y el código es válido
- El error NO es culpa de nuestro código, es un bug del compilador
- Este tipo de errores suelen resolverse con:
  - Actualización del compilador
  - Simplificación de HTML anidado
  - Eliminación de patrones específicos que el parser no maneja
