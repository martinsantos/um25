import {composeAffine} from '../public/cine/discipline-camera-v1.js';

test('a legacy SVG matrix can compose a moving cover without a DOMMatrix API conversion',()=>{
 const parent={a:2,b:0,c:0,d:2,e:30,f:50,multiply:()=>{throw Error('requires SVGMatrix');}};
 expect(composeAffine(parent,[1,0,0,1,-15,-80])).toEqual({a:2,b:0,c:0,d:2,e:0,f:-110});
});
test('a rotated parent preserves the hinge origin while the leaf opens',()=>{
 const parent={a:0,b:2,c:-2,d:0,e:100,f:80};
 const result=composeAffine(parent,[-1,.5,0,1,0,0]);
 expect(result).toEqual({a:-1,b:-2,c:-2,d:0,e:100,f:80});
});
