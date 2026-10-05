// Reuse static SVG subtrees without changing geometry, materials or precision.
// Hoist only when both markup bytes and parsed element count decrease.
export function shareSvgPrimitives(source) {
  const groups=/(<g\b[^>]*>)((?:(?!<g\b)[\s\S])*?)<\/g>/g;
  const counts=new Map();
  for(const match of source.matchAll(groups)){
    const body=match[2];
    if(/\b(?:id|class|data-[\w-]+)=/.test(body))continue;
    counts.set(body,(counts.get(body)||0)+1);
  }
  const shared=new Map();
  for(const [body,count] of counts){
    const id=`rk-geometry-${shared.size}`,use=`<use href="#${id}"/>`,definition=`<g id="${id}">${body}</g>`;
    const nodes=(body.match(/</g)||[]).length;
    if(nodes>=2&&count*nodes>count+nodes+1&&definition.length+count*use.length<count*body.length)shared.set(body,{use,definition});
  }
  const result=source.replace(groups,(_,opening,body)=>opening+(shared.get(body)?.use||body)+'</g>');
  return result.replace('<defs>','<defs>'+[...shared.values()].map(item=>item.definition).join(''));
}
