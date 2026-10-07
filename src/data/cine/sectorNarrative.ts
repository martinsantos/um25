import {SERVICE_NARRATIVE,type ServiceChapter} from './serviceNarrative';
import {operationScenes,operationOverview} from './operationNarrative';
import type {Scene} from './scenes';
export type SiteScene='building'|'clinic'|'terminal'|'plant'|'winery'|'mine';
export interface SectorProject {scene:SiteScene;name:string;headline:string;lead:string;chapters:ServiceChapter[]}
const routes:Record<SiteScene,Record<string,[string,string]>>={
 building:{'101':['Del cuarto técnico a cada puesto.','La montante conecta los pisos; las bandejas llevan el cableado hasta cada ambiente. El recorrido se resuelve antes de cerrar la obra.'],'103':['La fibra une los niveles.','El enlace óptico sale del cuarto técnico y recorre la montante. Cada terminación conserva su identificación y su acceso para mantenimiento.'],'102':['Ver los accesos del mismo edificio.','Cámaras y lectores se ubican en ingresos y circulaciones. Sus conexiones vuelven a la misma red y al sistema de grabación.'],'107':['Un lazo que se puede seguir.','Los detectores de cada nivel llegan a la central por un circuito supervisado. El trazado conserva su relación con los espacios protegidos.'],'108':['Respaldo para las cargas del proyecto.','La UPS y la distribución alimentan el rack y los equipos críticos. Energía y datos tienen recorridos y funciones propios.'],'104':['El edificio también tiene una operación.','Puestos, aplicaciones y responsables utilizan la infraestructura instalada. La herramienta organiza los datos y las tareas.'],'105':['Lo instalado sigue teniendo un responsable.','La operación del sitio se conecta con el monitoreo y la mesa de ayuda. Cada incidente conserva el equipo y el circuito que lo originó.'],'106':['El proyecto queda en las manos de quien lo opera.','Planos, identificación y pruebas permiten leer la instalación que se entrega. La arquitectura sigue siendo útil después de la obra.']},
 clinic:{'101':['Del puesto clínico a la sala IT.','Admisión, consultorios y puestos de atención comparten una red identificada. Las bandejas vinculan esos espacios con el cuarto técnico.'],'102':['Proteger accesos y circulaciones.','Cámaras y accesos acompañan la circulación del centro de salud. La ubicación parte de los espacios que necesitan protección.'],'103':['Los enlaces sostienen la información.','La fibra y los equipos de red comunican el sitio con sus sistemas. Se definen capacidad, recorrido y extremos del enlace.'],'107':['Detectar dentro de cada ambiente.','Los dispositivos del sitio llegan a la central mediante un lazo supervisado. El diseño conserva la relación con los espacios atendidos.'],'108':['Respaldo para la infraestructura IT.','La UPS sostiene las cargas de comunicaciones previstas. El alcance y la autonomía se especifican para los equipos del proyecto.']},
 terminal:{'101':['La red une cada punto de la terminal.','Check-in, puertas de embarque y operación se conectan con la sala técnica. Cada punto tiene un recorrido dentro del mismo sitio.'],'102':['De los accesos a la supervisión.','Cámaras y control de acceso se relacionan con los puntos de circulación. La red lleva la información a la operación de seguridad.'],'103':['La terminal también se conecta hacia afuera.','Fibra y equipos de enlace comunican el sitio con otros sistemas. El recorrido tiene extremos, capacidad y mantenimiento definidos.'],'107':['Un circuito supervisado en la terminal.','Los dispositivos de cada zona se conectan con la central. Alarmas y fallas conservan su localización dentro del proyecto.'],'108':['Sostener los puntos que deben seguir activos.','Alimentación, UPS y distribución respaldan las cargas de IT definidas para la operación de la terminal.']},
 plant:{'101':['La red acompaña el proceso de la nave.','Producción, laboratorio y operación se vinculan con la sala técnica. Los recorridos se definen para los espacios y las condiciones del sitio.'],'102':['Ver los ingresos y los puntos de trabajo.','Cámaras y accesos se integran con la red de la nave. La cobertura parte del lugar y de lo que necesita observar la operación.'],'103':['El enlace conecta el sitio con su operación.','Radio o fibra se especifican según el recorrido entre extremos. Alimentación, interfaz y montaje forman parte del mismo enlace.'],'107':['Detectar y localizar dentro de la nave.','Los dispositivos distribuidos se conectan con una central supervisada. Cada circuito conserva su identificación.'],'108':['La energía también tiene un recorrido.','El respaldo y la distribución alimentan las cargas de IT. Su alcance se define junto con los equipos que deben sostener.']},
 winery:{'101':['La red llega al proceso de la bodega.','Tanques, laboratorio y línea de embotellado se conectan con la sala técnica. Cada puesto y cada equipo tiene un recorrido identificado.'],'103':['La fibra comunica la bodega.','El enlace óptico vincula producción, laboratorio y administración. Los extremos se entregan identificados y accesibles.'],'104':['Del tanque al registro de producción.','La aplicación reúne lotes, estados y tareas de la bodega. Los puestos del laboratorio y la línea aportan datos al mismo proceso.'],'108':['Respaldo para la red de producción.','La UPS y la distribución sostienen las cargas de comunicaciones definidas para la bodega. El proceso determina el alcance del respaldo.']},
 mine:{'101':['La red conecta el sitio de operación.','Despacho, módulos de comunicación y sala técnica forman una instalación identificada. Sus recorridos se definen para las condiciones del emplazamiento.'],'103':['Unir los extremos en el terreno.','Mástiles, radios, alimentación y red comunican el sitio con su operación. El montaje y la alineación pertenecen al mismo enlace.'],'105':['Sostener un sitio que está lejos.','Monitoreo, incidentes y responsables conservan el contexto del equipo remoto. La intervención se prepara con diagnóstico y documentación.'],'108':['Respaldo donde la operación lo necesita.','La energía sostiene el cuarto técnico y los equipos de comunicaciones. Cargas y autonomía se definen para el emplazamiento.']},
};
// Software and public services have their own operation; a generic building
// is not the narrative context for their applications.
const sectorContexts:Record<string,Record<string,[string,string]>>={
 software:{
  '104':['Una acción visible, una arquitectura detrás.','Interfaz, reglas, integraciones y datos convierten tareas en una herramienta de trabajo. Definimos el primer alcance útil y cómo podrá evolucionar.'],
  '101':['La aplicación depende de una red operable.','Puestos, entornos y recursos necesitan comunicarse. Relevamos conectividad y permisos para que las personas lleguen a sus herramientas.'],
  '105':['Cada incidente conserva el proceso afectado.','Reunimos síntomas, versiones y contexto para distinguir problemas de aplicación, datos o infraestructura. El caso acompaña la intervención.'],
  '106':['Las necesidades se convierten en arquitectura.','Relacionamos procesos, datos, sistemas existentes y restricciones. Las decisiones de alcance y las etapas de entrega quedan explícitas.'],
  '103':['Conectar sedes también es conectar sus aplicaciones.','El enlace se diseña según la demanda y el recorrido. Los usuarios y sistemas de cada extremo definen lo que la conexión debe sostener.'],
  '102':['La infraestructura también necesita accesos definidos.','Cuando el proyecto incluye instalaciones propias, integramos control y supervisión de los espacios técnicos con sus responsables.'],
  '108':['Respaldar los recursos que sostienen la aplicación.','Identificamos las cargas de IT previstas, su consumo y la autonomía requerida. El diseño distingue la aplicación de la infraestructura que la sostiene.'],
  '107':['Proteger los espacios donde opera la infraestructura.','Si el alcance incluye instalaciones físicas, la detección se diseña para esos ambientes. El sistema se prueba y documenta según el proyecto.'],
 },
 gobiernosectorpublico:{
  '104':['Del trámite a su siguiente responsable.','Roles, estados y registros organizan la atención y el trabajo interno. La aplicación integra información y conserva el contexto de cada gestión.'],
  '105':['Sostener las herramientas de atención.','El incidente conserva la dependencia, el puesto y la gestión afectados. Prioridad, diagnóstico y seguimiento organizan la respuesta.'],
  '106':['Una arquitectura que acompaña la gestión.','Relevamos sistemas, conexiones y necesidades de las áreas. Las dependencias y los recursos disponibles ordenan las etapas del proyecto.'],
 },
};
export const siteSceneForSector=(slug:string,scene:Scene):SiteScene=>slug==='bodegas'?'winery':slug==='mineria'?'mine':scene==='hospital'?'clinic':scene==='aeropuerto'?'terminal':scene==='bodega'||scene==='planta'?'plant':'building';
const sectorOrders:Record<string,string[]>={
 constructoras:['101','103','108','102','107','106'],
 bodegas:['101','104','108','107','102','103','105','106'],
 mineria:['103','101','108','102','107','105','106','104'],
 salud:['101','108','104','102','107','105','103','106'],
 aeropuertos:['102','101','103','108','107','105','106','104'],
 industria:['101','103','108','104','102','107','105','106'],
 gobiernosectorpublico:['104','101','102','105','103','106','108','107'],
 'seguridad-electronica':['102','101','103','108','107','105','106','104'],
 software:['104','101','105','106','103','102','108','107'],
};
export function sectorProject(slug:string,scene:Scene,codes?:string[]):SectorProject{
 const type=siteSceneForSector(slug,scene);
 const names={building:'Un edificio, de la obra a la operación',clinic:'Un centro de salud conectado',terminal:'Una terminal conectada',plant:'Una nave en operación',winery:'Del tanque a la operación de la bodega',mine:'Un sitio minero conectado'};
 const order=sectorOrders[slug]||SERVICE_NARRATIVE.map(chapter=>chapter.code);
 const selected=order.filter(code=>!codes?.length||codes.includes(code));
 const chapters=selected.map(code=>{
  const context=sectorContexts[slug]?.[code]||routes[type][code];
  const part=['building','clinic','terminal','winery'].includes(type)&&code==='103'?'fiber':undefined;
  const scenes=operationScenes(code,context,part);
  return {code,scenes,overview:operationOverview(code,part)};
 });
 return {scene:type,name:names[type],headline:slug==='software'?'Una herramienta útil, con todas sus capas resueltas.':slug==='gobiernosectorpublico'?'Tecnología que sostiene la atención y la gestión.':slug==='constructoras'?'La infraestructura se resuelve con la obra.':type==='clinic'?'La infraestructura acompaña cada espacio de atención.':type==='terminal'?'Cada punto de la terminal pertenece al mismo sistema.':type==='winery'?'Del proceso de la bodega a una operación conectada.':type==='mine'?'Cada enlace sostiene la operación en el terreno.':type==='plant'?'Los sistemas siguen el recorrido de la operación.':'Los sistemas comparten un mismo proyecto.',lead:slug==='constructoras'?'Un edificio, sus recorridos y el equipo que resuelve cada conexión. Del plano a una instalación que se puede operar y mantener.':'Del sitio a sus sistemas: cómo se conectan, qué hacen y qué resuelve Última Milla en cada etapa.',chapters};
}
