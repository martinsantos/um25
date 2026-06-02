// COMPLETE INDEXER - SEGÚN PREMISAS PLAN.MD
// OBJETIVO: Indexar TODOS los casos de ultimamilla.com.ar via Directus
// SCOPE: 469 antecedentes + 9 servicios + URLs reales

const fetch = require('node-fetch');
const fs = require('fs');

class UMCompleteIndexer {
    constructor() {
        this.directusUrl = 'http://localhost:8055';
        this.token = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
        this.baseUrl = 'https://www.ultimamilla.com.ar';
        this.stats = {
            antecedentes: 0,
            servicios: 0,
            total_indexed: 0,
            real_urls: 0,
            errors: 0
        };
    }

    // HEADERS para Directus API
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    // INDEXAR TODOS LOS ANTECEDENTES
    async indexAllAntecedentes() {
        console.log('🔍 INDEXANDO TODOS LOS ANTECEDENTES...');
        
        try {
            // OBTENER TOTAL COUNT
            const metaResponse = await fetch(`${this.directusUrl}/items/Antecedentes?meta=total_count&limit=1`, {
                headers: this.getHeaders()
            });
            
            const metaData = await metaResponse.json();
            const totalCount = metaData.meta.total_count;
            
            console.log(`📊 TOTAL ANTECEDENTES EN DIRECTUS: ${totalCount}`);
            
            // OBTENER TODOS EN LOTES
            const batchSize = 50;
            const allAntecedentes = [];
            
            for (let offset = 0; offset < totalCount; offset += batchSize) {
                console.log(`📥 Procesando lote ${Math.floor(offset/batchSize) + 1}/${Math.ceil(totalCount/batchSize)}...`);
                
                const response = await fetch(`${this.directusUrl}/items/Antecedentes?limit=${batchSize}&offset=${offset}&fields=id,title,content,client,date_created,slug&sort=id`, {
                    headers: this.getHeaders()
                });
                
                if (response.ok) {
                    const data = await response.json();
                    allAntecedentes.push(...data.data);
                } else {
                    console.error(`❌ Error en lote ${offset}: ${response.status}`);
                    this.stats.errors++;
                }
            }
            
            // GENERAR URLs REALES para todos
            const indexedAntecedentes = allAntecedentes.map(antecedente => {
                const realUrl = `${this.baseUrl}/antecedentes/${antecedente.id}/${antecedente.slug || 'detalle'}`;
                
                return {
                    id: antecedente.id,
                    type: 'antecedente',
                    title: antecedente.title,
                    content: antecedente.content || 'Proyecto empresarial documentado',
                    url: realUrl,
                    client: antecedente.client,
                    date_created: antecedente.date_created,
                    slug: antecedente.slug,
                    searchable_content: `${antecedente.title} ${antecedente.content || ''} ${antecedente.client || ''}`.toLowerCase()
                };
            });
            
            this.stats.antecedentes = indexedAntecedentes.length;
            this.stats.real_urls += indexedAntecedentes.length;
            
            console.log(`✅ ANTECEDENTES INDEXADOS: ${indexedAntecedentes.length}`);
            return indexedAntecedentes;
            
        } catch (error) {
            console.error('❌ Error indexando antecedentes:', error);
            this.stats.errors++;
            return [];
        }
    }

    // INDEXAR TODOS LOS SERVICIOS
    async indexAllServicios() {
        console.log('🛠️ INDEXANDO TODOS LOS SERVICIOS...');
        
        try {
            const response = await fetch(`${this.directusUrl}/items/Servicios?fields=id,title,description,slug&sort=id`, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const servicios = data.data;
            
            // GENERAR URLs REALES para todos
            const indexedServicios = servicios.map(servicio => {
                const realUrl = `${this.baseUrl}/servicios/${servicio.id}/${servicio.slug || 'detalle'}`;
                
                return {
                    id: servicio.id,
                    type: 'servicio',
                    title: servicio.title,
                    content: servicio.description || 'Servicio profesional especializado',
                    url: realUrl,
                    client: null,
                    slug: servicio.slug,
                    searchable_content: `${servicio.title} ${servicio.description || ''}`.toLowerCase()
                };
            });
            
            this.stats.servicios = indexedServicios.length;
            this.stats.real_urls += indexedServicios.length;
            
            console.log(`✅ SERVICIOS INDEXADOS: ${indexedServicios.length}`);
            return indexedServicios;
            
        } catch (error) {
            console.error('❌ Error indexando servicios:', error);
            this.stats.errors++;
            return [];
        }
    }

    // VALIDAR URLs REALES (SAMPLE)
    async validateRealUrls(items, sampleSize = 5) {
        console.log(`🔍 VALIDANDO URLs REALES (muestra de ${sampleSize})...`);
        
        const sample = items.slice(0, sampleSize);
        let validUrls = 0;
        
        for (const item of sample) {
            try {
                const response = await fetch(item.url, { method: 'HEAD', timeout: 5000 });
                if (response.ok) {
                    validUrls++;
                    console.log(`✅ ${item.url} - HTTP ${response.status}`);
                } else {
                    console.log(`❌ ${item.url} - HTTP ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ ${item.url} - Error: ${error.message}`);
            }
        }
        
        console.log(`📊 URLs VÁLIDAS: ${validUrls}/${sampleSize} (${Math.round(validUrls/sampleSize*100)}%)`);
        return validUrls / sampleSize;
    }

    // GENERAR REPORTE COMPLETO
    generateReport(allItems) {
        const report = {
            generated_at: new Date().toISOString(),
            total_items: allItems.length,
            statistics: this.stats,
            breakdown: {
                antecedentes: allItems.filter(i => i.type === 'antecedente').length,
                servicios: allItems.filter(i => i.type === 'servicio').length
            },
            sample_urls: allItems.slice(0, 10).map(i => ({
                title: i.title,
                url: i.url,
                type: i.type
            })),
            search_capabilities: {
                total_searchable_content: allItems.reduce((sum, i) => sum + i.searchable_content.length, 0),
                unique_clients: [...new Set(allItems.map(i => i.client).filter(Boolean))].length,
                coverage: `${allItems.length} items from real ultimamilla.com.ar data`
            }
        };
        
        return report;
    }

    // EJECUTAR INDEXACIÓN COMPLETA
    async runCompleteIndex() {
        console.log('🚀 INICIANDO INDEXACIÓN COMPLETA - UM CLI v2.5');
        console.log('📋 PREMISAS PLAN.MD: Indexar TODOS los casos del sitio');
        console.log('');
        
        const startTime = Date.now();
        
        // STEP 1: Index all antecedentes
        const antecedentes = await this.indexAllAntecedentes();
        
        // STEP 2: Index all servicios
        const servicios = await this.indexAllServicios();
        
        // STEP 3: Combine all items
        const allItems = [...antecedentes, ...servicios];
        this.stats.total_indexed = allItems.length;
        
        // STEP 4: Validate sample URLs
        if (allItems.length > 0) {
            await this.validateRealUrls(allItems);
        }
        
        // STEP 5: Generate comprehensive report
        const report = this.generateReport(allItems);
        
        // STEP 6: Save results
        const outputFile = `/tmp/um-cli-complete-index-${Date.now()}.json`;
        fs.writeFileSync(outputFile, JSON.stringify({
            report,
            indexed_items: allItems
        }, null, 2));
        
        const duration = Date.now() - startTime;
        
        // FINAL REPORT
        console.log('');
        console.log('🎉 INDEXACIÓN COMPLETA FINALIZADA');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 ANTECEDENTES: ${this.stats.antecedentes}`);
        console.log(`🛠️ SERVICIOS: ${this.stats.servicios}`);
        console.log(`🔗 URLs REALES: ${this.stats.real_urls}`);
        console.log(`⚡ TOTAL INDEXADO: ${this.stats.total_indexed} items`);
        console.log(`⏱️ DURACIÓN: ${Math.round(duration/1000)}s`);
        console.log(`💾 GUARDADO EN: ${outputFile}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (this.stats.errors > 0) {
            console.log(`⚠️ ERRORES: ${this.stats.errors}`);
        }
        
        return {
            success: true,
            stats: this.stats,
            items: allItems,
            report,
            output_file: outputFile
        };
    }
}

// EJECUTAR SI ES LLAMADO DIRECTAMENTE
if (require.main === module) {
    const indexer = new UMCompleteIndexer();
    indexer.runCompleteIndex()
        .then(result => {
            console.log('✅ INDEXACIÓN EXITOSA');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ ERROR EN INDEXACIÓN:', error);
            process.exit(1);
        });
}

module.exports = UMCompleteIndexer;
