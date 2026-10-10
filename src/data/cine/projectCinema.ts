import registry from './site-movies-v1.json';
import {siteSceneForSector,type SiteScene} from './sectorNarrative';
import {sectorBySlug,type Scene} from './scenes';
interface ProjectMovie {scene:string;status:string;duration?:number;assets:{file:string;bytes:number;sha256:string}[]}
const stored=registry as typeof registry & {projects?:Partial<Record<SiteScene,ProjectMovie>>;services?:Record<string,ProjectMovie>};
export const PROJECT_CINEMA:Partial<Record<SiteScene,ProjectMovie>>={building:stored.constructoras,...stored.projects};
export const PROJECT_SCENE_KEYS:Record<SiteScene,string>={building:'fachada-proyecto-v2',clinic:'hospital-proyecto-v3',terminal:'aeropuerto-proyecto-v3',plant:'planta-proyecto-v3',winery:'bodega-proyecto-v4',mine:'mineria-proyecto-v3'};
export function sectorMovie(slug:string){if(slug==='software')return serviceMovie('104');const sector=sectorBySlug(slug);return PROJECT_CINEMA[siteSceneForSector(slug,sector?.scene||'fachada')];}
export const SERVICE_PROJECTS:Record<string,SiteScene>={'101':'building','102':'terminal','103':'mine','104':'building','105':'terminal','106':'building','107':'winery','108':'clinic'};
// An explicit local preview flag selects the candidate without promoting it
// into the production media registry. Start the preview only after asset import.
const softwareReviews:Record<string,ProjectMovie>={
 v19:{scene:'software-system-v19',status:'ready',duration:20,assets:[]},
 v18:{scene:'software-system-v18',status:'ready',duration:20,assets:[]},
 v17:{scene:'software-system-v17',status:'ready',duration:20,assets:[]},
 v15:{scene:'software-system-v15',status:'ready',duration:20,assets:[]},
 v14:{scene:'software-system-v14',status:'ready',duration:16,assets:[]},
 v13:{scene:'software-system-v13',status:'ready',duration:16,assets:[]},
 v12:{scene:'software-system-v12',status:'ready',duration:16,assets:[]},
 v11:{scene:'software-system-v11',status:'ready',duration:16,assets:[]},
 v9:{scene:'software-system-v9',status:'ready',duration:12,assets:[]},
 v10:{scene:'software-system-v10',status:'ready',duration:12,assets:[]},
};
export function serviceMovie(code:string){if(code==='104'&&softwareReviews[process.env.UM_SOFTWARE_REVIEW||''])return softwareReviews[process.env.UM_SOFTWARE_REVIEW||''];return stored.services?.[code]?.status==='ready'?stored.services[code]:PROJECT_CINEMA[SERVICE_PROJECTS[code]||'building'];}
export function serviceProjectScene(code:string):{slug:string;scene:Scene}{const site=SERVICE_PROJECTS[code];return site==='mine'?{slug:'mineria',scene:'planta'}:site==='winery'?{slug:'bodegas',scene:'bodega'}:site==='terminal'?{slug:'aeropuertos',scene:'aeropuerto'}:site==='clinic'?{slug:'salud',scene:'hospital'}:{slug:'integral',scene:'fachada'};}
const chapters:{site:SiteScene;name:string;text:string}[]=[{site:'winery',name:'Bodegas',text:'Del proceso a la operación'},{site:'terminal',name:'Aeropuertos',text:'Redes y seguridad en una terminal'},{site:'building',name:'Edificios',text:'Infraestructura incorporada desde la obra'},{site:'clinic',name:'Salud',text:'Cada espacio de atención conectado'},{site:'plant',name:'Industria',text:'Sistemas que acompañan la producción'},{site:'mine',name:'Minería',text:'Conectividad en el terreno'}];
export function cinemaChapters(){return chapters.flatMap(({site,name,text})=>{const movie=PROJECT_CINEMA[site];return movie?.status==='ready'?[{scene:movie.scene,name,text}]:[];});}
