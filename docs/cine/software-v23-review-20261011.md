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

Fuente: 6580b988. Prueba remota: 38144355483. 196 combinaciones de textos/composición dentro del encuadre y sin intersecciones de texto visibles en el recorrido completo. La prueba nativa y la secuencia completa siguen en curso. La preview permanece en v22 hasta completar e inspeccionar v23.
