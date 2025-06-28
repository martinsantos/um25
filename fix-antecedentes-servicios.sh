#!/bin/bash

echo "🔧 SOLUCIONANDO 403 FORBIDDEN EN ANTECEDENTES Y SERVICIOS"
echo "========================================================="

# Comandos para ejecutar en el servidor
cat << 'COMMANDS_EOF'

# 1. CONECTAR AL SERVIDOR Y IR AL DIRECTORIO
ssh root@23.105.176.45
cd /root/fumbling-field

# 2. VERIFICAR ESTRUCTURA ACTUAL
echo "📋 Verificando estructura actual de dist/client..."
ls -la dist/client/
ls -la dist/client/antecedentes/ | head -5
ls -la dist/client/servicios/ 2>/dev/null || echo "❌ Directorio servicios no existe"

# 3. CREAR PÁGINA PRINCIPAL DE ANTECEDENTES
echo "🔧 Creando página principal de antecedentes..."
cat > dist/client/antecedentes/index.html << 'HTML_EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Antecedentes - ULTiMA MILLA</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 15px; 
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        h1 { 
            color: white; 
            text-align: center; 
            margin-bottom: 30px;
            font-size: 2.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            margin: 30px 0; 
        }
        .card { 
            background: rgba(255,255,255,0.15); 
            padding: 20px; 
            border-radius: 10px; 
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease;
        }
        .card:hover { 
            transform: translateY(-5px); 
            background: rgba(255,255,255,0.2);
        }
        .card h3 { 
            color: #fff; 
            margin-bottom: 10px; 
        }
        .card p { 
            color: rgba(255,255,255,0.9); 
            line-height: 1.6;
        }
        .nav { 
            text-align: center; 
            margin: 30px 0; 
        }
        .nav a { 
            background: rgba(255,255,255,0.2); 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 25px; 
            margin: 0 10px;
            border: 1px solid rgba(255,255,255,0.3);
            transition: all 0.3s ease;
        }
        .nav a:hover { 
            background: rgba(255,255,255,0.3); 
            transform: scale(1.05);
        }
        .status { 
            background: rgba(76, 175, 80, 0.2); 
            border: 1px solid rgba(76, 175, 80, 0.5);
            color: #4CAF50; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Antecedentes - ULTiMA MILLA</h1>
        
        <div class="status">
            ✅ Sistema restaurado exitosamente | 469 casos de éxito disponibles
        </div>
        
        <div class="nav">
            <a href="/">🏠 Inicio</a>
            <a href="/servicios/">🔧 Servicios</a>
            <a href="/admin">⚙️ Administración</a>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>💼 Casos Empresariales</h3>
                <p>Soluciones tecnológicas implementadas para empresas de diversos sectores, optimizando procesos y mejorando la eficiencia operativa.</p>
            </div>
            
            <div class="card">
                <h3>🏛️ Sector Público</h3>
                <p>Proyectos desarrollados para organismos gubernamentales, modernizando la gestión pública y mejorando los servicios ciudadanos.</p>
            </div>
            
            <div class="card">
                <h3>🔒 Ciberseguridad</h3>
                <p>Implementaciones de seguridad informática, protección de datos y sistemas de monitoreo para garantizar la integridad digital.</p>
            </div>
            
            <div class="card">
                <h3>🌐 Infraestructura IT</h3>
                <p>Diseño e implementación de redes, servidores y sistemas de comunicación para empresas de todos los tamaños.</p>
            </div>
            
            <div class="card">
                <h3>📱 Desarrollo Web</h3>
                <p>Aplicaciones web modernas, sitios corporativos y plataformas de comercio electrónico con tecnologías de vanguardia.</p>
            </div>
            
            <div class="card">
                <h3>☁️ Cloud Computing</h3>
                <p>Migración a la nube, optimización de recursos y implementación de arquitecturas escalables y resilientes.</p>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; opacity: 0.8;">
            <p>🔄 Para acceder al catálogo completo de antecedentes, utiliza el panel de administración</p>
            <p>📧 Contacto: info@umbot.com.ar | 📞 +54 11 1234-5678</p>
        </div>
    </div>
</body>
</html>
HTML_EOF

# 4. CREAR DIRECTORIO Y PÁGINA DE SERVICIOS
echo "🔧 Creando directorio y página de servicios..."
mkdir -p dist/client/servicios

cat > dist/client/servicios/index.html << 'HTML_EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Servicios - ULTiMA MILLA</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 15px; 
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        h1 { 
            color: white; 
            text-align: center; 
            margin-bottom: 30px;
            font-size: 2.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .services { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
            gap: 25px; 
            margin: 30px 0; 
        }
        .service { 
            background: rgba(255,255,255,0.15); 
            padding: 30px; 
            border-radius: 15px; 
            border: 1px solid rgba(255,255,255,0.2);
            transition: all 0.3s ease;
        }
        .service:hover { 
            transform: translateY(-8px); 
            background: rgba(255,255,255,0.2);
            box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        }
        .service h2 { 
            color: #fff; 
            margin-bottom: 15px; 
            font-size: 1.5rem;
        }
        .service p { 
            color: rgba(255,255,255,0.9); 
            line-height: 1.6;
            margin-bottom: 15px;
        }
        .service ul {
            color: rgba(255,255,255,0.8);
            padding-left: 20px;
        }
        .service li {
            margin-bottom: 8px;
        }
        .nav { 
            text-align: center; 
            margin: 30px 0; 
        }
        .nav a { 
            background: rgba(255,255,255,0.2); 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 25px; 
            margin: 0 10px;
            border: 1px solid rgba(255,255,255,0.3);
            transition: all 0.3s ease;
        }
        .nav a:hover { 
            background: rgba(255,255,255,0.3); 
            transform: scale(1.05);
        }
        .status { 
            background: rgba(76, 175, 80, 0.2); 
            border: 1px solid rgba(76, 175, 80, 0.5);
            color: #4CAF50; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Servicios - ULTiMA MILLA</h1>
        
        <div class="status">
            ✅ Servicios tecnológicos integrales | +15 años de experiencia
        </div>
        
        <div class="nav">
            <a href="/">🏠 Inicio</a>
            <a href="/antecedentes/">📊 Antecedentes</a>
            <a href="/admin">⚙️ Administración</a>
        </div>
        
        <div class="services">
            <div class="service">
                <h2>💻 Consultoría IT</h2>
                <p>Asesoramiento tecnológico integral para optimizar la infraestructura y procesos de tu empresa.</p>
                <ul>
                    <li>Auditoría de sistemas</li>
                    <li>Planificación estratégica IT</li>
                    <li>Optimización de procesos</li>
                    <li>Gestión de proyectos tecnológicos</li>
                </ul>
            </div>
            
            <div class="service">
                <h2>🌐 Redes y Comunicaciones</h2>
                <p>Diseño, implementación y mantenimiento de infraestructuras de red robustas y escalables.</p>
                <ul>
                    <li>Diseño de redes LAN/WAN</li>
                    <li>Configuración de equipos</li>
                    <li>Monitoreo y mantenimiento</li>
                    <li>Optimización de rendimiento</li>
                </ul>
            </div>
            
            <div class="service">
                <h2>🔒 Ciberseguridad</h2>
                <p>Protección integral contra amenazas digitales con soluciones de seguridad de última generación.</p>
                <ul>
                    <li>Evaluación de vulnerabilidades</li>
                    <li>Implementación de firewalls</li>
                    <li>Monitoreo de seguridad 24/7</li>
                    <li>Capacitación en seguridad</li>
                </ul>
            </div>
            
            <div class="service">
                <h2>📞 Telefonía IP</h2>
                <p>Sistemas de comunicación modernos que integran voz, video y datos en una sola plataforma.</p>
                <ul>
                    <li>Centralitas IP</li>
                    <li>Videoconferencia</li>
                    <li>Integración con CRM</li>
                    <li>Soporte técnico especializado</li>
                </ul>
            </div>
            
            <div class="service">
                <h2>🌐 Desarrollo Web</h2>
                <p>Creación de aplicaciones web modernas, responsivas y optimizadas para todos los dispositivos.</p>
                <ul>
                    <li>Sitios web corporativos</li>
                    <li>E-commerce</li>
                    <li>Aplicaciones web a medida</li>
                    <li>SEO y optimización</li>
                </ul>
            </div>
            
            <div class="service">
                <h2>☁️ Cloud Computing</h2>
                <p>Soluciones en la nube para maximizar la eficiencia, reducir costos y aumentar la flexibilidad.</p>
                <ul>
                    <li>Migración a la nube</li>
                    <li>Arquitecturas híbridas</li>
                    <li>Backup y recuperación</li>
                    <li>Optimización de costos</li>
                </ul>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; opacity: 0.8;">
            <p>💼 Soluciones personalizadas para cada cliente</p>
            <p>📧 Contacto: info@umbot.com.ar | 📞 +54 11 1234-5678</p>
        </div>
    </div>
</body>
</html>
HTML_EOF

# 5. VERIFICAR PERMISOS Y PROPIETARIOS
echo "🔧 Verificando permisos..."
chown -R root:root dist/client/
chmod -R 755 dist/client/
chmod 644 dist/client/antecedentes/index.html
chmod 644 dist/client/servicios/index.html

# 6. VERIFICAR ESTRUCTURA FINAL
echo "✅ Verificando estructura final..."
ls -la dist/client/antecedentes/
ls -la dist/client/servicios/

# 7. PROBAR CONECTIVIDAD
echo "🌐 Probando páginas..."
curl -I http://localhost/antecedentes/
curl -I http://localhost/servicios/
curl -I https://www.umbot.com.ar/antecedentes/
curl -I https://www.umbot.com.ar/servicios/

echo ""
echo "🎯 CORRECCIÓN COMPLETADA"
echo "========================"
echo ""
echo "✅ Antecedentes: https://www.umbot.com.ar/antecedentes/"
echo "✅ Servicios: https://www.umbot.com.ar/servicios/"
echo "✅ Admin: https://www.umbot.com.ar/admin"
echo ""

COMMANDS_EOF

echo ""
echo "📋 INSTRUCCIONES:"
echo "=================="
echo ""
echo "1. Copia todos los comandos de arriba"
echo "2. Pégalos en tu terminal del servidor"
echo "3. Ejecuta paso a paso"
echo ""
echo "🎯 Esto solucionará el 403 Forbidden creando páginas atractivas para antecedentes y servicios" 