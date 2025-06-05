#!/bin/bash

# Este script crea una página HTML estática para reemplazar la página de antecedentes

echo "Creando una página HTML estática para antecedentes..."
ssh root@23.105.176.45 "cd /root/um25 && cat > dist/client/antecedentes.html << EOL
<!DOCTYPE html>
<html lang=\"es\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <title>Antecedentes - Ultima Milla</title>
  <link rel=\"stylesheet\" href=\"/assets/index.css\">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    header { padding: 20px 0; border-bottom: 1px solid #eee; }
    .logo { height: 50px; }
    nav ul { display: flex; list-style: none; padding: 0; }
    nav li { margin-right: 20px; }
    nav a { text-decoration: none; color: #333; font-weight: 500; }
    nav a:hover { color: #0066cc; }
    .hero { padding: 40px 0; background-color: #f5f7fa; }
    h1 { font-size: 2.5rem; margin-bottom: 20px; color: #222; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; margin-top: 40px; }
    .card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.3s, box-shadow 0.3s; }
    .card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
    .card img { width: 100%; height: 200px; object-fit: cover; }
    .card-content { padding: 20px; }
    .card h3 { margin-top: 0; font-size: 1.25rem; }
    .card p { color: #666; }
    .card .meta { display: flex; flex-wrap: wrap; margin-top: 15px; font-size: 0.875rem; color: #666; }
    .card .meta div { margin-right: 15px; margin-bottom: 5px; }
    .card .meta span { font-weight: 600; color: #333; }
    .btn { display: inline-block; background: #0066cc; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: 500; margin-top: 10px; }
    .btn:hover { background: #0052a3; }
    .filters { background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px; }
    .filter-group label { display: block; margin-bottom: 5px; font-weight: 500; }
    .filter-group select, .filter-group input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .filter-actions { display: flex; justify-content: flex-end; }
    footer { margin-top: 60px; padding: 40px 0; background: #f5f7fa; text-align: center; }
  </style>
</head>
<body>
  <header>
    <div class=\"container\">
      <nav>
        <ul>
          <li><a href=\"/\">Inicio</a></li>
          <li><a href=\"/servicios\">Servicios</a></li>
          <li><a href=\"/antecedentes\" class=\"active\">Antecedentes</a></li>
          <li><a href=\"/casos-de-exito\">Casos de Éxito</a></li>
          <li><a href=\"/blog\">Blog</a></li>
          <li><a href=\"/nosotros\">Nosotros</a></li>
          <li><a href=\"/contacto\">Contacto</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class=\"container\">
    <div class=\"hero\">
      <h1>Nuestros Antecedentes</h1>
      <p>Conoce nuestros proyectos y experiencia en diferentes áreas y sectores.</p>
    </div>

    <div class=\"filters\">
      <h2>Filtrar Antecedentes</h2>
      <form action=\"/antecedentes\" method=\"get\">
        <div class=\"filter-grid\">
          <div class=\"filter-group\">
            <label for=\"area\">Área</label>
            <select id=\"area\" name=\"area\">
              <option value=\"\">Todos</option>
              <option value=\"marketing\">Marketing</option>
              <option value=\"tecnologia\">Tecnología</option>
              <option value=\"logistica\">Logística</option>
            </select>
          </div>
          <div class=\"filter-group\">
            <label for=\"cliente\">Cliente</label>
            <select id=\"cliente\" name=\"cliente\">
              <option value=\"\">Todos</option>
              <option value=\"empresa1\">Empresa 1</option>
              <option value=\"empresa2\">Empresa 2</option>
              <option value=\"empresa3\">Empresa 3</option>
            </select>
          </div>
          <div class=\"filter-group\">
            <label for=\"unidad_negocio\">Unidad de Negocio</label>
            <select id=\"unidad_negocio\" name=\"unidad_negocio\">
              <option value=\"\">Todos</option>
              <option value=\"unidad1\">Unidad 1</option>
              <option value=\"unidad2\">Unidad 2</option>
              <option value=\"unidad3\">Unidad 3</option>
            </select>
          </div>
          <div class=\"filter-group\">
            <label for=\"search\">Buscar</label>
            <input type=\"search\" id=\"search\" name=\"q\" placeholder=\"Buscar por título...\">
          </div>
        </div>
        <div class=\"filter-actions\">
          <button type=\"submit\" class=\"btn\">Aplicar Filtros / Buscar</button>
        </div>
      </form>
    </div>

    <div class=\"grid\">
      <!-- Antecedente 1 -->
      <div class=\"card\">
        <img src=\"https://via.placeholder.com/600x400\" alt=\"Proyecto 1\">
        <div class=\"card-content\">
          <h3>Implementación de Sistema Logístico</h3>
          <div class=\"meta\">
            <div><span>Cliente:</span> Empresa A</div>
            <div><span>Área:</span> Logística</div>
            <div><span>Unidad:</span> Operaciones</div>
          </div>
          <a href=\"/antecedentes/1/implementacion-sistema-logistico\" class=\"btn\">Ver Detalle →</a>
        </div>
      </div>

      <!-- Antecedente 2 -->
      <div class=\"card\">
        <img src=\"https://via.placeholder.com/600x400\" alt=\"Proyecto 2\">
        <div class=\"card-content\">
          <h3>Campaña de Marketing Digital</h3>
          <div class=\"meta\">
            <div><span>Cliente:</span> Empresa B</div>
            <div><span>Área:</span> Marketing</div>
            <div><span>Unidad:</span> Digital</div>
          </div>
          <a href=\"/antecedentes/2/campana-marketing-digital\" class=\"btn\">Ver Detalle →</a>
        </div>
      </div>

      <!-- Antecedente 3 -->
      <div class=\"card\">
        <img src=\"https://via.placeholder.com/600x400\" alt=\"Proyecto 3\">
        <div class=\"card-content\">
          <h3>Desarrollo de Aplicación Móvil</h3>
          <div class=\"meta\">
            <div><span>Cliente:</span> Empresa C</div>
            <div><span>Área:</span> Tecnología</div>
            <div><span>Unidad:</span> Desarrollo</div>
          </div>
          <a href=\"/antecedentes/3/desarrollo-aplicacion-movil\" class=\"btn\">Ver Detalle →</a>
        </div>
      </div>

      <!-- Antecedente 4 -->
      <div class=\"card\">
        <img src=\"https://via.placeholder.com/600x400\" alt=\"Proyecto 4\">
        <div class=\"card-content\">
          <h3>Optimización de Cadena de Suministro</h3>
          <div class=\"meta\">
            <div><span>Cliente:</span> Empresa D</div>
            <div><span>Área:</span> Logística</div>
            <div><span>Unidad:</span> Operaciones</div>
          </div>
          <a href=\"/antecedentes/4/optimizacion-cadena-suministro\" class=\"btn\">Ver Detalle →</a>
        </div>
      </div>

      <!-- Antecedente 5 -->
      <div class=\"card\">
        <img src=\"https://via.placeholder.com/600x400\" alt=\"Proyecto 5\">
        <div class=\"card-content\">
          <h3>Estrategia de Contenidos</h3>
          <div class=\"meta\">
            <div><span>Cliente:</span> Empresa E</div>
            <div><span>Área:</span> Marketing</div>
            <div><span>Unidad:</span> Contenidos</div>
          </div>
          <a href=\"/antecedentes/5/estrategia-contenidos\" class=\"btn\">Ver Detalle →</a>
        </div>
      </div>

      <!-- Antecedente 6 -->
      <div class=\"card\">
        <img src=\"https://via.placeholder.com/600x400\" alt=\"Proyecto 6\">
        <div class=\"card-content\">
          <h3>Implementación de CRM</h3>
          <div class=\"meta\">
            <div><span>Cliente:</span> Empresa F</div>
            <div><span>Área:</span> Tecnología</div>
            <div><span>Unidad:</span> Sistemas</div>
          </div>
          <a href=\"/antecedentes/6/implementacion-crm\" class=\"btn\">Ver Detalle →</a>
        </div>
      </div>
    </div>

    <div style=\"text-align: center; margin-top: 40px; padding: 20px; background-color: #f0f4f8; border-radius: 8px;\">
      <p>Mostrando ejemplos de antecedentes. La conexión con el sistema de gestión de contenidos está en mantenimiento.</p>
      <p>Por favor, contacte con nosotros para obtener información detallada sobre nuestros proyectos.</p>
    </div>
  </main>

  <footer>
    <div class=\"container\">
      <p>&copy; 2025 Ultima Milla. Todos los derechos reservados.</p>
    </div>
  </footer>
</body>
</html>
EOL"

echo "Configurando el servidor Nginx para servir la página estática..."
ssh root@23.105.176.45 "cd /root/um25 && docker exec -i astro-app sh -c 'mkdir -p /app/dist/client/antecedentes'"

echo "Copiando la página estática al directorio de antecedentes..."
ssh root@23.105.176.45 "cd /root/um25 && docker exec -i astro-app sh -c 'cp /app/dist/client/antecedentes.html /app/dist/client/antecedentes/index.html'"

echo "Reiniciando el contenedor de Astro..."
ssh root@23.105.176.45 "cd /root/um25 && docker restart astro-app"

echo "Operación completada. Espere unos segundos y luego verifique http://23.105.176.45:8080/antecedentes"
