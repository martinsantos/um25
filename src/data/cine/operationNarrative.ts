import {SERVICE_NARRATIVE,type ServiceScene} from './serviceNarrative';
import {DISCIPLINE_SYSTEMS} from './disciplineSystems';
import {NETWORK_EQUIPMENT} from './networkAssembly';
interface Operation {nodes:[string,string,string]; steps:[string,string][]; reverse?:boolean}
const operations:Record<string,Operation>={
 '101':{nodes:['Puestos y Wi-Fi','Red de datos','Aplicaciones'],reverse:true,steps:[['Cada puesto necesita llegar a sus sistemas.','Identificamos dónde trabajan las personas y qué equipos necesitan comunicarse.'],['El tráfico encuentra su recorrido.','Cableado, fibra, switches y Wi-Fi conectan esos puntos con los sistemas del sitio.'],['Una red instalada, identificada y probada.','Última Milla diseña, instala y verifica las conexiones. La documentación permite operarlas y mantenerlas.']]},
 '103':{nodes:['Un sitio','Fibra o radioenlace','Otro sitio'],steps:[['La operación continúa en otro lugar.','Definimos los extremos y la capacidad que necesita el enlace entre sitios.'],['Los extremos intercambian información.','Fibra o radio transportan los datos según la distancia, el recorrido y las condiciones del lugar.'],['El enlace se entrega con sus extremos verificados.','Última Milla integra equipos, alimentación y montaje, verifica la comunicación y documenta el enlace.']]},
 '102':{nodes:['Cámaras y accesos','Red y grabación','Supervisión'],reverse:true,steps:[['Un acceso genera información.','Las cámaras observan y los lectores registran accesos en los puntos definidos por el proyecto.'],['La señal llega a quien debe actuar.','La red comunica cámaras, grabación y control. La información se reúne para supervisar el sitio.'],['Cobertura y permisos definidos para el lugar.','Última Milla diseña la cobertura e integra cámaras, grabación y accesos con la infraestructura de red.']]},
 '107':{nodes:['Dispositivos','Lazo supervisado','Central y aviso'],reverse:true,steps:[['Cada dispositivo informa su estado.','Los dispositivos se distribuyen según el diseño del sistema y las condiciones del sitio.'],['La central recibe alarmas y fallas.','El circuito supervisado comunica los dispositivos con la central para localizar el aviso.'],['La respuesta empieza con un sistema probado.','Última Milla instala, prueba y documenta dispositivos, circuitos y central según el alcance del proyecto.']]},
 '108':{nodes:['Alimentación','UPS y distribución','Cargas de IT'],steps:[['Definimos qué equipos necesitan respaldo.','Identificamos las cargas críticas y dimensionamos su capacidad y autonomía requeridas.'],['La entrada falla. El respaldo sostiene las cargas.','En este ejemplo, la UPS alimenta los equipos previstos mientras se recupera la entrada. La autonomía depende de las cargas y del dimensionamiento.'],['Se recupera la entrada y se verifica el respaldo.','Última Milla integra y prueba alimentación, UPS y distribución. El resultado se documenta junto con las cargas atendidas.']]},
 '104':{nodes:['Personas y datos','Reglas del proceso','Acciones y registros'],reverse:true,steps:[['Una persona inicia una tarea.','Un pedido, un dato o una solicitud entra al proceso con su responsable y su contexto.'],['La aplicación ordena el siguiente paso.','Roles, estados e integraciones llevan la información a quien debe revisar, aprobar o resolver.'],['El proceso deja información para decidir.','Última Milla desarrolla aplicaciones e integraciones para convertir tareas dispersas en un trabajo trazable.']]},
 '105':{nodes:['Señal o incidente','Diagnóstico y prioridad','Resolución y registro'],steps:[['Una señal se convierte en un caso.','La mesa de ayuda recibe el incidente con el equipo, el sitio y la operación afectados.'],['El caso llega al responsable adecuado.','Diagnóstico y prioridad organizan la intervención y el seguimiento de la respuesta.'],['La intervención queda documentada.','Última Milla acompaña la resolución y el mantenimiento. El registro conserva lo aprendido para la próxima intervención.']]},
 '106':{nodes:['Sitio y necesidades','Arquitectura y prioridades','Plan y documentación'],steps:[['Primero entendemos la operación.','Relevamos equipos, conexiones, necesidades y riesgos antes de proponer una intervención.'],['Las dependencias ordenan las decisiones.','Relacionamos infraestructura, sistemas y prioridades para definir qué resolver y en qué orden.'],['Un proyecto que se puede operar.','Última Milla entrega alcance, criterios y documentación para evaluar la inversión y orientar su ejecución.']]},
};
function operationFor(code:string,part?:string):Operation{
 const operation:Operation=code==='103'&&part==='fiber'?{
  nodes:['Áreas del proyecto','Distribuidor óptico','Equipos de red'],
  steps:[['Las áreas se conectan con el cuarto técnico.','La fibra vincula los puntos previstos por el proyecto con su distribución central.'],
   ['Cada fibra tiene una terminación identificada.','El distribuidor óptico organiza y protege las terminaciones. Los latiguillos conectan cada enlace con los equipos de red del cuarto técnico.'],
   ['La conexión se entrega medida y documentada.','Última Milla instala y verifica los enlaces ópticos. La identificación y las mediciones permiten operar, mantener y ampliar la red.']],
 }:operations[code];
 return operation;
}
export function operationOverview(code:string,part?:string){
 if(DISCIPLINE_SYSTEMS[code])return DISCIPLINE_SYSTEMS[code].layers.map(layer=>({title:layer.name,copy:layer.decision}));
 return operationFor(code,part).steps.map(([title,copy])=>({title,copy}));
}
export function operationScenes(code:string,context:[string,string]|undefined,part?:string):ServiceScene[]{
 const discipline=DISCIPLINE_SYSTEMS[code];
 if(discipline){
  const operation=operations[code];
  const flow=(phase:number)=>({phase,nodes:operation.nodes,reverse:operation.reverse});
  return [
   {view:'system',disciplineStage:-1,open:true,duration:5500,title:context?.[0]||discipline.premise,copy:context?.[1]||operation.steps[0][1],flow:flow(0)},
   ...discipline.layers.map((layer,i):ServiceScene=>({view:'layers',disciplineStage:i,open:true,duration:8000,title:layer.title,copy:layer.copy,flow:flow(1)})),
   {view:'system',disciplineStage:6,open:true,duration:6500,title:discipline.result,copy:operation.steps[2][1],flow:flow(2)},
  ];
 }
 const operation=operationFor(code,part);
 const base=SERVICE_NARRATIVE.find(chapter=>chapter.code===code)!;
 const component=part||base.scenes.find(scene=>scene.part)?.part;
 const detail=base.scenes.filter(scene=>scene.view!=='system');
 const equipment=NETWORK_EQUIPMENT.find(item=>item.id===component);
 const equipmentCopy=equipment?[[equipment.title,equipment.copy],[equipment.construction,equipment.inside],[equipment.detail,equipment.closeup]]:null;
 const flow=(phase:number)=>({phase,nodes:operation.nodes,reverse:operation.reverse});
 // The complete explanation is the default route, including real equipment
 // interiors. Manual controls only let a visitor revisit something already shown.
 return [
  {view:'system',open:true,duration:5500,part:component,title:context?.[0]||operation.steps[0][0],copy:context?.[1]||operation.steps[0][1],flow:flow(0)},
  ...detail.map((scene,index)=>({...scene,part:component,open:true,duration:index===1?7500:5500,
   ...(equipmentCopy?{title:equipmentCopy[index][0],copy:equipmentCopy[index][1]}:{}),flow:flow(1)})),
  {view:'system',open:true,duration:6500,part:component,title:operation.steps[2][0],copy:operation.steps[2][1],flow:flow(2)},
 ];
}
