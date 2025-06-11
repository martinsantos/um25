#!/bin/bash

echo "=== SOLUCIÓN DE PROBLEMAS DE AUTENTICACIÓN EN DIRECTUS Y ASTRO ==="
echo ""
echo "Paso 1: Actualizando configuración de Directus para permitir acceso público..."
echo ""

# Ejecutar la solución #2: Actualizar configuración de Directus
bash update_directus_config.sh

# Esperar un tiempo para que los cambios surtan efecto
echo ""
echo "Esperando 30 segundos para que los cambios surtan efecto..."
sleep 30

# Verificar si el problema persiste
echo ""
echo "Verificando si el problema persiste..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://23.105.176.45:8080/antecedentes)

if [ "$RESPONSE" == "200" ]; then
    echo ""
    echo "¡Éxito! El problema ha sido resuelto con la solución #2."
    echo "La página de antecedentes ahora responde correctamente (código HTTP 200)."
    exit 0
else
    echo ""
    echo "La solución #2 no ha resuelto el problema (código HTTP: $RESPONSE)."
    echo "Procediendo con la solución #3: Modificar Astro para no requerir autenticación..."
    echo ""
    
    # Ejecutar la solución #3: Modificar Astro para no requerir autenticación
    bash fix_astro_auth.sh
    
    # Esperar un tiempo para que los cambios surtan efecto
    echo ""
    echo "Esperando 30 segundos para que los cambios surtan efecto..."
    sleep 30
    
    # Verificar si el problema persiste después de la solución #3
    echo ""
    echo "Verificando si el problema persiste después de la solución #3..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://23.105.176.45:8080/antecedentes)
    
    if [ "$RESPONSE" == "200" ]; then
        echo ""
        echo "¡Éxito! El problema ha sido resuelto con la solución #3."
        echo "La página de antecedentes ahora responde correctamente (código HTTP 200)."
        exit 0
    else
        echo ""
        echo "Ambas soluciones han fallado (código HTTP: $RESPONSE)."
        echo "Se recomienda revisar los logs de los contenedores para más información:"
        echo "  docker logs astro-app"
        echo "  docker logs directus-app"
        exit 1
    fi
fi
