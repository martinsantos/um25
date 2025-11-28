#!/bin/bash

# CSS Responsive template
CSS_BLOCK='
<style>
  /* RESPONSIVE MOBILE - FUERZA OVERRIDE CON !important */
  @media (max-width: 768px) {
    /* GRIDS: Forzar 1 columna en móvil */
    [style*="grid-template-columns: repeat(3, 1fr)"] {
      grid-template-columns: 1fr !important;
    }
    
    [style*="grid-template-columns: repeat(2, 1fr)"] {
      grid-template-columns: 1fr !important;
    }
    
    [style*="grid-template-columns: 1fr 1fr"] {
      grid-template-columns: 1fr !important;
      gap: 40px !important;
    }
    
    /* TIPOGRAFÍA: Reducir tamaños */
    h1[style] {
      font-size: 32px !important;
    }
    
    h2[style] {
      font-size: 28px !important;
    }
    
    h3[style] {
      font-size: 18px !important;
    }
    
    /* SPACING: Reducir padding en secciones */
    section[style*="padding"] {
      padding: 40px 20px !important;
    }
    
    /* FORMS: Mejorar en móvil */
    #contacto form {
      padding: 24px !important;
    }
    
    /* CARDS: Mejorar legibilidad */
    [style*="padding: 30px"] {
      padding: 20px !important;
    }
  }
</style>'

# Lista de archivos a procesar
FILES=("aeropuertos" "bodegas" "constructoras" "industria")

for file in "${FILES[@]}"; do
  FILEPATH="/Volumes/SDTERA/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/${file}.astro"
  
  if [ -f "$FILEPATH" ]; then
    # Verificar si ya tiene responsive CSS
    if grep -q "RESPONSIVE MOBILE" "$FILEPATH"; then
      echo "✓ ${file}.astro ya tiene CSS responsive"
    else
      # Verificar si tiene </Layout> al final
      if grep -q "</Layout>" "$FILEPATH"; then
        # Agregar CSS antes del último </Layout>
        sed -i '' -e "\$a\\
$CSS_BLOCK
" "$FILEPATH"
        echo "✅ CSS responsive agregado a ${file}.astro"
      else
        echo "⚠️  ${file}.astro no tiene </Layout> - revisar manualmente"
      fi
    fi
  else
    echo "❌ ${file}.astro no encontrado"
  fi
done

echo "✨ Proceso completado"
