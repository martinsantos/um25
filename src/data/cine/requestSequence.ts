export const REQUEST_SEQUENCE = [
 {title:'Una persona inicia una solicitud.',copy:'El pedido 024 nace en un puesto de trabajo. Seguimos el mismo pedido hasta recibir su respuesta.',role:'Persona',status:'Preparada'},
 {title:'La red lleva el pedido al switch.',copy:'El cableado conecta el puesto. El switch recibe los datos y los dirige hacia su destino.',role:'Red de acceso',status:'En tránsito'},
 {title:'El enlace llega a la aplicación.',copy:'La infraestructura transporta la solicitud hasta el sistema que debe procesarla. Red y software forman parte del mismo recorrido.',role:'Enlace de red',status:'Enviada'},
 {title:'La aplicación recibe el pedido 024.',copy:'La solicitud se convierte en un registro: conserva sus datos, su origen y su estado.',role:'Recepción',status:'Recibida'},
 {title:'Las reglas ordenan el siguiente paso.',copy:'La aplicación valida la información y los permisos, y asigna la tarea al responsable previsto por el proceso.',role:'Validación',status:'Validada'},
 {title:'La intervención queda registrada.',copy:'El responsable resuelve el pedido. La aplicación conserva quién actuó y cuál fue el resultado.',role:'Responsable',status:'Resuelta'},
 {title:'La respuesta vuelve a la persona.',copy:'El resultado recorre la red de vuelta al puesto. La persona puede consultar el estado de su solicitud.',role:'Respuesta',status:'Confirmada'},
 {title:'Infraestructura y software, conectados.',copy:'Última Milla diseña e instala la red y desarrolla las aplicaciones e integraciones que necesita tu operación.',role:'Última Milla',status:'Recorrido completo'},
];
