# Software v23 · permisos, contrato y procedencia

## Contrato de comunicación

Audiencia: responsables de una operación que necesitan entender qué resuelve el software a medida. Pregunta: ¿cómo llega una aprobación desde la interfaz a un registro verificable?

Tipo: vista UML-like de interacción y procedencia de objetos, presentada como una película de producto en Blender. No es UML formal ni un mapa de infraestructura real de un cliente. La alternativa accesible es la explicación de capas existente debajo del banner y los capítulos de texto sincronizados. Se conserva la orden 0248, la solicitud 0248-A, el proyecto P-104 y la versión v3 a lo largo del recorrido.

La fuente Python modela superficies, textos, puertos y conexiones con identificadores estables. El layout mantiene columnas fijas y canales propios para cada relación: las correspondencias del contrato no atraviesan campos; las relaciones Proyecto → Orden → Versión ocupan una banda separada del historial. Las fases autorizan, validan y registran. Las tablas de permisos son una demostración del mecanismo, no una política de acceso real declarada para un cliente.

## Cambios frente a v22

- Matriz de tres roles y tres acciones; la columna efectiva está elevada, con celdas de permiso y prohibición diferenciadas.
- Navegación del contrato, protocolo REST/JSON, campos tipados, puertos e indicadores de validación asociados a la solicitud.
- Registro con relaciones, estados en planos distintos, pestaña de eventos, códigos de origen ACL/API/DB, marcas temporales y verificación de integridad.
- Se conservan el logo vectorial, imagen de proyecto, mapa, cámara continua y transparencias selectivas. Los cambios concentran detalle en los módulos antes más sintéticos.

## Formatos y accesibilidad

Salida prevista: dos películas de 20 segundos y 60 fps nativos, 3840 × 2160 y 2160 × 2160, más póster JPEG/AVIF. En retrato 390 × 844 la composición cuadrada se acerca al mecanismo activo; en paisaje se conserva el cuadro completo. La página no captura gestos de arrastre ni exige hover, clic o búsqueda para avanzar. Pausa accesible, reducción de movimiento y suspensión fuera de pantalla se mantienen. El texto exterior explica lo esencial sin exigir leer los microdetalles del render.

Validación prevista: rangos y hashes de las dos películas completas, decodificación, auditoría proyectada de texto en 1.200 posiciones por composición, reproducción en navegador, pausa, autoplay, encuadre responsive y contraste directo con los instantes de contenido de Hill. Los checks técnicos no certifican equivalencia artística.

## Estado

Fuente final del render: `feb08d50fc135ae7eee829e575a137882d713490`. Pruebas nativas: 38144355483 y 38144896792. Render completo: [38146133734](https://github.com/martinsantos/um25/actions/runs/38146133734), completado correctamente. Las dos películas completas están integradas con la bandera v23. 61.292.074 bytes, 20 segundos y 1.200 fotogramas por composición; build correcto.

La inspección nativa corrigió una etiqueta de protocolo oculta, líneas traseras que cruzaban el pie del registro y el margen izquierdo de la composición móvil. La auditoría final recorre 1.200 posiciones en dos composiciones: 190 combinaciones de texto/composición dentro del encuadre, sin intersecciones de límites de texto. Esto complementa la revisión visual; no certifica equivalencia artística.

La integración preparada amplía el banner de escritorio y coloca el capítulo antes del render. Se reserva su altura para que el cambio automático del texto no desplace la película. Sigue pendiente verificar ese comportamiento con el archivo completo en navegador.


## Hallazgo de la película completa

La comparación temporal y la revisión móvil detectaron un vacío excesivo alrededor de 17,1 segundos: el registro desaparecía antes de que la interfaz recuperara presencia. La candidata v24 corrige ese relevo conservando visibles los datos hasta la entrada del producto. Se reutilizan los primeros 960 fotogramas, inalterados, con su fuente v23 registrada; se vuelven a renderizar los últimos 240 por composición. La v23 no se declara equivalente a Hill ni lista para producción.
