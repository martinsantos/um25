export const REQUEST_SEQUENCE = [
 {title:'Una anomalía se convierte en una orden.',copy:'Una persona solicita revisar un tablero eléctrico de la planta. La orden 024 reúne ubicación, tarea y origen: el mismo registro acompaña todo el proceso.',role:'Persona',status:'Preparada'},
 {title:'La red lleva el pedido al switch.',copy:'El cableado llega al patch panel y al switch del gabinete. Cada puerto tiene una función: conectar el puesto con los sistemas de la operación.',role:'Red de acceso',status:'En tránsito'},
 {title:'El enlace llega a la aplicación.',copy:'La infraestructura transporta la solicitud hasta el sistema que debe procesarla. Red y software forman parte del mismo recorrido.',role:'Enlace de red',status:'Enviada'},
 {title:'La aplicación recibe el pedido 024.',copy:'El sistema registra la orden 024: inspeccionar la alimentación del tablero. La tarea queda identificada y disponible para su seguimiento.',role:'Recepción',status:'Recibida'},
 {title:'Las reglas ordenan el siguiente paso.',copy:'El sistema verifica los datos y los permisos, y deriva la orden al equipo de mantenimiento. La responsabilidad queda explícita.',role:'Validación',status:'Validada'},
 {title:'La intervención queda registrada.',copy:'El equipo realiza la intervención y adjunta su evidencia. El sistema conserva responsable, verificación y resultado; el trabajo técnico lo hacen las personas.',role:'Responsable',status:'Resuelta'},
 {title:'La respuesta vuelve a la persona.',copy:'El resultado recorre la red de vuelta al puesto. La persona puede consultar el estado de su solicitud.',role:'Respuesta',status:'Confirmada'},
 {title:'Infraestructura y software, conectados.',copy:'Última Milla diseña e instala la red y desarrolla las aplicaciones e integraciones que necesita tu operación.',role:'Última Milla',status:'Recorrido completo'},
];
