#!/bin/bash

FILE="/Volumes/SDTERA/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/mineria.astro"

# Cards section
sed -i '' 's/Proyectos a Gran Escala/Conectividad Remota/g' "$FILE"
sed -i '' 's/Gestionamos proyectos complejos con precisión y eficiencia./Enlaces de alta disponibilidad en zonas aisladas y de difícil acceso./g' "$FILE"
sed -i '' 's/Innovación Tecnológica/Seguridad Industrial/g' "$FILE"
sed -i '' 's/Implementamos las últimas tecnologías para optimizar cada fase./Sistemas CCTV y control de accesos robustos para ambientes hostiles./g' "$FILE"
sed -i '' 's/Seguridad y Certificación/IoT y Telemetría/g' "$FILE"
sed -i '' 's/Cumplimiento riguroso de normativas y estándares de seguridad./Monitoreo en tiempo real de activos y condiciones ambientales./g' "$FILE"

# Services section title
sed -i '' 's/Servicios Ofrecidos/Soluciones para Minería/g' "$FILE"
sed -i '' 's/Ofrecemos un portafolio de servicios tecnológicos diseñados para optimizar cada fase del ciclo de vida del proyecto de construcción./Infraestructura tecnológica diseñada para garantizar la continuidad operativa en yacimientos y plantas de procesamiento./g' "$FILE"

# Casos de éxito
sed -i '' 's/Proyectos Realizados/Proyectos en Minería/g' "$FILE"
sed -i '' 's/Nuestras soluciones han impulsado la eficiencia y productividad de importantes proyectos de/Soluciones implementadas en los principales yacimientos de la región./g' "$FILE"
sed -i '' 's/construcción en todo el país//g' "$FILE"

# Contact form
sed -i '' 's/¿Listo para Digitalizar/Soluciones Críticas para/g' "$FILE"
sed -i '' 's/Su Próximo Proyecto?/Minería/g' "$FILE"
sed -i '' 's/Contáctenos y nuestro equipo de expertos le ayudará a encontrar la solución tecnológica perfecta para su proyecto de construcción./Contáctenos para diseñar la infraestructura tecnológica que su operación minera necesita./g' "$FILE"
sed -i '' 's/Software ABC/Empresa Minera/g' "$FILE"
sed -i '' 's/juan@software.com/contacto@minera.com/g' "$FILE"
sed -i '' 's/Solicitar Consultoría Ahora/Solicitar Contacto/g' "$FILE"

echo "✅ Transformación completada"
