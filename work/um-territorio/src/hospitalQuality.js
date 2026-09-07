// Narrow/coarse-pointer clients get fewer shaded pixels, not less equipment.
export function hospitalQuality(width,dpr=1,coarse=false){
 const light=width<800||coarse;
 return {pixelRatio:Math.min(dpr,light?1:1.5),shadowSize:light?1024:2048,contactShadows:!light};
}
