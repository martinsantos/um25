// Conceptual connected networks. Coordinates use Blender metres, Z up.
// Every endpoint has a continuous source-to-terminal route; shared edges are
// deduplicated by the renderer. This is not engineering documentation.
export const SYSTEM_STYLE={
 Data:{color:'#168daa',code:'D',label:'Datos · cableado',radius:.007},
 'Fire-detection':{color:'#d64032',code:'F',label:'Detección · lazo',radius:.006},
 Telecom:{color:'#8056be',code:'C',label:'Comunicaciones',radius:.006},
 Security:{color:'#268369',code:'S',label:'Control de accesos',radius:.006},
 CCTV:{color:'#cf528a',code:'V',label:'CCTV · video IP',radius:.006},
 Power:{color:'#b88122',code:'E',label:'Energía IT',radius:.011},
 Software:{color:'#467aca',code:'L',label:'Software · tráfico lógico',radius:.004},
};
const beds=[-12,-9,-5,-2,2,5];
export const DATA_TERMINALS=[
 ...[[-8,2.15,.79],[-4,3.1,1.21],[-2,3.1,1.21],[0,3.1,1.21]].map(([x,y,desk])=>({end:[x+.50,y-.135,desk+.09],mount:'post',bottom:desk,patch:[x+.36,y-.083,desk+.10]})),
 ...beds.map(x=>({end:[x+.28,15.515,1.35],mount:'wall',patch:[x+1,13.54,1.17]}))
];
const network=(source,y,z,ends)=>ends.map(terminal=>{
 const end=terminal.end||terminal,dropY=terminal.mount==='wall'?15.72:end[1];
 const xs=[...new Set([source[0],...ends.map(p=>(p.end||p)[0])])].filter(x=>x>=Math.min(source[0],end[0])&&x<=Math.max(source[0],end[0])).sort((a,b)=>end[0]<source[0]?b-a:a-b);
 return {source,end,...(terminal.end?terminal:{}),points:[source,[source[0],source[1],z],...xs.map(x=>[x,y,z]),[end[0],dropY,z],[end[0],dropY,end[2]],end].filter((p,i,a)=>!i||p.some((v,k)=>v!==a[i-1][k]))};
});
export const NETWORKS={
 Data:network([10.3,3.46,1.75],7.8,3.26,DATA_TERMINALS),
 'Fire-detection':network([-13.5,15.69,1.55],8.95,3.20,[...[-12,-8,-4,0,4,8,12].map(x=>[x,6.5,3.13]),...[-10.5,-3.5,3.5,10.5].map(x=>[x,12,3.16]),[-9.5,3.9,3.16]]),
 Telecom:network([10.3,3.46,1.48],8.1,3.23,[...beds.map(x=>({end:[x+.62,15.54,1.05],mount:'wall'})),...[-12,-8,-4,0,4,8,12].map(x=>[x,7.3,3.15])]),
 Security:network([11.1,3.46,1.6],8.35,3.17,[[13.7,15.76,1.2],[.05,-2.2,1.32],[12.12,.08,1.26]]),
 CCTV:network([17.5,12.64,1.4],8.35,3.10,[[-13.5,15.47,2.83],[13.5,15.47,2.83],[3.3,-1.8,3.1],[-3.5,6.25,3.25],[16.1,.5,3.05]]),
 Power:network([17.15,6.74,1.4],8.65,3.29,[[9.5,3.49,.3],[10.3,3.49,.3],[11.1,3.49,.3],[-8.55,2.1,.35],...beds.map(x=>({end:[x+.85,15.54,.35],mount:'wall'}))]),
 Software:network([10.3,3.46,1.75],7.8,3.26,DATA_TERMINALS.filter(t=>t.mount==='post')),
};
export function uniqueSegments(routes){
 const segments=new Map();
 for(const {points} of routes)for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],key=[a.join(','),b.join(',')].sort().join('|');
  if(a.some((v,k)=>v!==b[k]))segments.set(key,[a,b]);
 }
 return [...segments.values()];
}
