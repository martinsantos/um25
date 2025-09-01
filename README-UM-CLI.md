# UM CLI - Terminal Interactivo ULTIMA MILLA 🖥️

Una experiencia única que combina la nostalgia de los comandos Linux con 22 años de historia empresarial real de ULTIMA MILLA.

## 🎯 Características Principales

- **Terminal auténtico**: Replica la experiencia de un terminal Linux moderno
- **Datos reales**: Información empresarial verificada de 22 años de historia
- **Comandos interactivos**: +30 comandos funcionales con datos en tiempo real
- **Interfaz moderna**: Diseño responsive con themes dark/light
- **Embeddable**: Integración sencilla en cualquier sitio web
- **Autocompletado**: TAB completion y navegación por historial
- **Fullscreen**: Experiencia inmersiva opcional

## 🏗️ Arquitectura del Sistema

```
/src/
├── plugins/
│   └── UMCliPlugin.js          # Plugin principal embeddable
├── components/
│   ├── UMTerminal.astro        # Componente React del terminal
│   └── UMTerminalEngine.js     # Motor de comandos y lógica
├── data/
│   ├── servicios.json          # Base de datos de servicios
│   ├── antecedentes.json       # Historia de proyectos 
│   └── clientes.json           # Cartera de clientes
└── pages/
    ├── home-with-cli.astro     # Integración en homepage
    └── cli-demo.astro          # Página demo standalone
```

## 🚀 Instalación Rápida

### 1. Integración en Astro (Recomendado)

```astro
---
// En tu página .astro
---

<div id="um-cli-container"></div>

<script>
  import('../plugins/UMCliPlugin.js').then(module => {
    const UMCliPlugin = module.default;
    
    const umCli = new UMCliPlugin({
      container: '#um-cli-container',
      theme: 'dark',
      showWelcome: true,
      autoFocus: false
    });
  });
</script>
```

### 2. Integración HTML Vanilla

```html
<!DOCTYPE html>
<html>
<head>
    <title>Mi Sitio con UM CLI</title>
</head>
<body>
    <div id="um-cli-container"></div>
    
    <script type="module">
        import UMCliPlugin from './plugins/UMCliPlugin.js';
        
        const umCli = new UMCliPlugin({
            container: '#um-cli-container'
        });
    </script>
</body>
</html>
```

### 3. Embedding con iframe

```html
<iframe src="https://ultimamilla.com/cli-demo?embed=true" 
        width="100%" 
        height="600" 
        frameborder="0"
        title="ULTIMA MILLA CLI">
</iframe>
```

## ⚙️ Configuración

### Opciones del Plugin

```javascript
const umCli = new UMCliPlugin({
    // Contenedor donde montar el terminal
    container: '#mi-contenedor',
    
    // Tema visual (dark/light)
    theme: 'dark',
    
    // Mostrar mensaje de bienvenida
    showWelcome: true,
    
    // Autofocus en el input
    autoFocus: false,
    
    // Permitir modo fullscreen
    fullscreen: true,
    
    // API endpoint personalizado
    apiEndpoint: '/api/um-cli',
    
    // Comandos personalizados
    customCommands: {
        'mi-comando': async () => ({
            success: true,
            output: 'Mi respuesta personalizada'
        })
    }
});
```

### Parámetros URL (para embed)

- `?embed=true` - Modo embedding (sin header/footer)
- `?minimal=true` - Solo terminal, sin información adicional
- `?theme=light` - Tema claro (por defecto: dark)
- `?autorun=comando` - Ejecutar comando automáticamente

## 🎮 Comandos Disponibles

### 📁 Navegación y Listado
```bash
ls [directorio]        # Listar contenido
cd [directorio]        # Cambiar directorio
pwd                    # Directorio actual
tree                   # Vista de árbol
```

### 🔍 Búsqueda y Filtros
```bash
grep "término"         # Buscar en proyectos
find -name "archivo"   # Buscar archivos
locate "cliente"       # Localizar información
```

### 📊 Estadísticas y Análisis
```bash
stats [--opción]       # Estadísticas generales
top [--tipo]          # Rankings y tops
wc [archivo]          # Contar elementos
du -h                 # Uso de espacio/recursos
```

### ℹ️ Información del Sistema
```bash
whoami                # Usuario actual
uname -a              # Información del sistema
ps aux                # Procesos activos
uptime                # Tiempo de actividad
df -h                 # Información de almacenamiento
```

### 🛠️ Utilidades
```bash
help [comando]        # Ayuda general o específica
history               # Historial de comandos
clear                 # Limpiar pantalla
sudo ultimamilla.py   # Demo completa de la empresa
```

### 🎊 Easter Eggs
```bash
fortune               # Frases motivacionales
cowsay "mensaje"      # Vaca hablando ASCII
matrix                # Efecto Matrix
```

## 📝 Ejemplos de Uso

### Explorar servicios de la empresa
```bash
$ ls servicios
redes-comunicaciones/    software-desarrollo/    seguridad-cctv/
soporte-it/             consultoria/            proyectos-especiales/

$ cd servicios/redes-comunicaciones
$ ls
proyectos-backbone/    instalaciones-fibra/    redes-empresariales/
```

### Buscar información específica
```bash
$ grep "Quilmes"
Encontrados 3 resultados en proyectos:
- Red de fibra óptica Quilmes Centro (2019)
- Sistema CCTV Quilmes Berazategui (2020)  
- Modernización IT Quilmes Oeste (2022)

$ stats --clientes
📊 ESTADÍSTICAS DE CLIENTES

Total de clientes: 52
Activos: 47 (90.4%)
Clientes premium: 12
Promedio duración relación: 4.2 años
```

### Información técnica
```bash
$ sudo ultimamilla.py --info
🏢 ULTIMA MILLA - PERFIL TÉCNICO

Fundación: 2003
Empleados: 25+
Proyectos completados: 150+
Tecnologías: Linux, Windows, Cisco, Mikrotik, Ubiquiti
Especializaciones: Redes, Software, Seguridad, IoT
```

## 🎨 Personalización

### Temas Personalizados
```css
:root {
    --um-cli-primary: #your-color;
    --um-cli-background: #your-bg;
    --um-cli-text: #your-text;
}
```

### Comandos Personalizados
```javascript
const umCli = new UMCliPlugin({
    customCommands: {
        'mi-empresa': async () => ({
            success: true,
            output: 'Información de mi empresa...',
            type: 'info'
        }),
        
        'contacto': async () => ({
            success: true,
            output: 'Email: contacto@miempresa.com',
            type: 'success'
        })
    }
});
```

## 📊 Analytics y Tracking

El CLI incluye eventos personalizados para tracking:

```javascript
// Escuchar eventos
umCli.on('commandExecuted', (event) => {
    console.log('Comando:', event.detail.command);
    
    // Enviar a analytics
    gtag('event', 'cli_command', {
        'command': event.detail.command.name,
        'success': event.detail.command.success
    });
});

umCli.on('fullscreenToggled', (event) => {
    console.log('Fullscreen:', event.detail.isFullscreen);
});
```

## 🔧 API Backend (Opcional)

Para funcionalidad completa, implementa estos endpoints:

```
GET /api/um-cli/servicios      # Lista de servicios
GET /api/um-cli/proyectos      # Lista de proyectos  
GET /api/um-cli/clientes       # Lista de clientes
GET /api/um-cli/stats          # Estadísticas generales
POST /api/um-cli/search        # Búsqueda avanzada
```

Ejemplo de respuesta:
```json
{
  "success": true,
  "data": [...],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🧪 Testing

### Comandos de Prueba
```bash
# Navegación básica
ls
cd servicios
pwd

# Búsquedas
grep "empresa"
find -name "*.pdf"

# Estadísticas
stats --all
top --clientes

# Sistema
whoami
uname -a
help
```

### Escenarios de Prueba
1. **Responsive**: Probar en móvil, tablet, desktop
2. **Performance**: Comandos con grandes datasets
3. **Accesibilidad**: Navegación con teclado
4. **Cross-browser**: Chrome, Firefox, Safari, Edge

## 🚀 Deployment

### Astro Build
```bash
npm run build
npm run preview
```

### Variables de Entorno
```env
UM_CLI_API_URL=https://api.ultimamilla.com
UM_CLI_VERSION=1.0.0
UM_CLI_ANALYTICS_ID=GA_TRACKING_ID
```

## 📱 Responsive Design

El CLI es completamente responsive:
- **Desktop**: Experiencia completa con todos los features
- **Tablet**: Interfaz optimizada con teclado virtual
- **Mobile**: Layout compacto con gestos touch

## ♿ Accesibilidad

- **ARIA labels** en todos los elementos interactivos  
- **Navegación por teclado** completa (Tab, Arrow keys)
- **Screen reader** compatible
- **Alto contraste** para usuarios con discapacidad visual
- **Texto escalable** respeta preferencias del sistema

## 🛡️ Seguridad

- **Input sanitization** previene XSS
- **Rate limiting** en comandos pesados
- **No ejecución** de código real del sistema
- **Datos mockups** no exponen información sensible

## 🔄 Actualizaciones

### Versión 1.0.0 (Actual)
- Terminal básico funcional
- 30+ comandos implementados
- Datos reales de ULTIMA MILLA
- Plugin embeddable
- Tema dark/light

### Roadmap v1.1.0
- [ ] Más comandos avanzados (vim, nano, ssh)
- [ ] Multi-session support
- [ ] Comandos con output en tiempo real
- [ ] Integración con APIs externas
- [ ] Sistema de plugins extendible

### Roadmap v2.0.0
- [ ] Terminal colaborativo (multi-user)
- [ ] Integración con GitHub/GitLab
- [ ] Comandos de deployment
- [ ] Machine learning para sugerencias
- [ ] VR/AR terminal interface

## 🤝 Contribuir

¿Ideas para nuevos comandos? ¿Mejoras en la UX?

1. Fork el repositorio
2. Crea una branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Add nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Submit Pull Request

## 📞 Soporte

- **Email**: soporte@ultimamilla.com
- **Documentación**: https://docs.ultimamilla.com/cli
- **Issues**: https://github.com/ultimamilla/um-cli/issues
- **Demos**: https://ultimamilla.com/cli-demo

## 📜 Licencia

© 2003-2024 ULTIMA MILLA. Todos los derechos reservados.
Este proyecto es propiedad de ULTIMA MILLA y está protegido por derechos de autor.

---

> **🎯 ¿Listo para revolucionar la experiencia de tu sitio web?**  
> Integra el UM CLI y ofrece a tus usuarios una forma única de explorar tu empresa.  
> **Conectando el futuro desde 2003** ⚡

---

**Desarrollado con ❤️ en Mendoza, Argentina**  
**ULTIMA MILLA - Tecnología que conecta**
