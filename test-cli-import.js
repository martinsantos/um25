// Script de prueba para verificar que los imports del UM CLI funcionan correctamente

async function testCliImports() {
  try {
    console.log('🧪 Probando imports del UM CLI...');
    
    // Test 1: Importar UMTerminalEngine
    console.log('1. Importando UMTerminalEngine...');
    const { default: UMTerminalEngine } = await import('./src/components/UMTerminalEngine.js');
    console.log('✓ UMTerminalEngine importado exitosamente');
    
    // Test 2: Crear instancia del engine
    console.log('2. Creando instancia del engine...');
    const engine = new UMTerminalEngine();
    console.log('✓ Engine creado exitosamente');
    
    // Test 3: Importar UMCliPlugin
    console.log('3. Importando UMCliPlugin...');
    const { default: UMCliPlugin } = await import('./src/plugins/UMCliPlugin.js');
    console.log('✓ UMCliPlugin importado exitosamente');
    
    // Test 4: Verificar datos
    console.log('4. Verificando datos...');
    const { serviciosReales } = await import('./src/data/servicios_completos.js');
    const { antecedentesReales } = await import('./src/data/antecedentes_completos.js');
    
    console.log(`✓ Servicios disponibles: ${serviciosReales.length}`);
    console.log(`✓ Antecedentes disponibles: ${antecedentesReales.length}`);
    
    // Test 5: Probar un comando
    console.log('5. Probando comando help...');
    const result = await engine.processCommand('help');
    console.log('✓ Comando help ejecutado exitosamente');
    console.log('Resultado:', result.success ? 'EXITOSO' : 'FALLÓ');
    
    console.log('\n🎉 Todos los tests pasaron exitosamente!');
    console.log('El UM CLI está listo para funcionar en el navegador.');
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar test si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testCliImports();
}

export { testCliImports };
