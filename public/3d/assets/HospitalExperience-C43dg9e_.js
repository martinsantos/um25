import{r as x,j as n}from"./sector-public-B8yzLp3T.js";import{at as gi,a5 as Ca,au as Lt,av as Me,aw as wi,B as _t,a8 as Fa,r as V,j as bi,ax as rt,ay as Wa,V as Va,az as ot,M as F,aA as Be,aB as Si,$ as xi,a9 as jt,C as Ut,c as zt,J as Ei,aq as Mi,G as Ga,aC as qa,aD as Ot,v as Di,w as Ai,L as Ha,ac as Rt,i as oe,aE as Ci,m as Ti,Z as Ne,b as Ii,k as Ta,ag as Pi,P as ki,W as Li,A as ji,a6 as Oi,O as Ri,R as _i,d as Ui,H as zi,D as Ni,ap as tt,a7 as Bi,q as ze,a0 as Ia,ae as Fi,S as K,aa as Pa,a3 as Wi,a1 as Vi,X as Gi,n as qi,o as at,g as Hi,t as Yi,E as $i,ai as Xi,s as Zi}from"./facadeScene-CgOw1GER.js";import{a as Ji}from"./hospitalFinishes-W3fFFzSr.js";import{c as Qi,R as Ki,e as es,b as ts,d as as,h as ka,f as is,w as ss,a as ns,A as rs,i as os,j as ls,k as La,I as cs,g as ds}from"./facadeMaps-BIxj5xYN.js";import{c as ps}from"./scenePost-CUljpoJs.js";import{c as us,i as fs}from"./cameraCoverage-BcLJxWeP.js";import{i as ms}from"./industrialInventory-WqBMd18g.js";const ja=new _t,it=new V;class Ya extends gi{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],s=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],p=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(p),this.setAttribute("position",new Ca(e,3)),this.setAttribute("uv",new Ca(s,2))}applyMatrix4(e){const s=this.attributes.instanceStart,p=this.attributes.instanceEnd;return s!==void 0&&(s.applyMatrix4(e),p.applyMatrix4(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let s;e instanceof Float32Array?s=e:Array.isArray(e)&&(s=new Float32Array(e));const p=new Lt(s,6,1);return this.setAttribute("instanceStart",new Me(p,3,0)),this.setAttribute("instanceEnd",new Me(p,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let s;e instanceof Float32Array?s=e:Array.isArray(e)&&(s=new Float32Array(e));const p=new Lt(s,6,1);return this.setAttribute("instanceColorStart",new Me(p,3,0)),this.setAttribute("instanceColorEnd",new Me(p,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new wi(e.geometry)),this}fromLineSegments(e){const s=e.geometry;return this.setPositions(s.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new _t);const e=this.attributes.instanceStart,s=this.attributes.instanceEnd;e!==void 0&&s!==void 0&&(this.boundingBox.setFromBufferAttribute(e),ja.setFromBufferAttribute(s),this.boundingBox.union(ja))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Fa),this.boundingBox===null&&this.computeBoundingBox();const e=this.attributes.instanceStart,s=this.attributes.instanceEnd;if(e!==void 0&&s!==void 0){const p=this.boundingSphere.center;this.boundingBox.getCenter(p);let g=0;for(let f=0,m=e.count;f<m;f++)it.fromBufferAttribute(e,f),g=Math.max(g,p.distanceToSquared(it)),it.fromBufferAttribute(s,f),g=Math.max(g,p.distanceToSquared(it));this.boundingSphere.radius=Math.sqrt(g),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}}ot.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new Va},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}};rt.line={uniforms:Wa.merge([ot.common,ot.fog,ot.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		float trimSegmentAlpha( const in vec4 start, const in vec4 end ) {

			// compute the interpolation factor needed to trim the segment so it terminates
			// between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column

			// we need different nearEstimate formula for reversed and default depth buffer
			// a is positive with a reversed depth buffer so it can be used for controlling the code flow
			float nearEstimate = ( a > 0.0 ) ? ( - b / ( a + 1.0 ) ) : ( - 0.5 * b / a );

			return ( nearEstimate - start.z ) / ( end.z - start.z );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef USE_DASH

				float lineDistanceStart = dashScale * instanceDistanceStart;
				float lineDistanceEnd = dashScale * instanceDistanceEnd;

			#endif

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( start, end );
					end.xyz = mix( start.xyz, end.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceEnd = mix( lineDistanceStart, lineDistanceEnd, alpha );

					#endif

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( end, start );
					start.xyz = mix( end.xyz, start.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceStart = mix( lineDistanceEnd, lineDistanceStart, alpha );

					#endif

				}

			}

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? lineDistanceStart : lineDistanceEnd;
				vUv = uv;

			#endif

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			float alpha = opacity;
			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};class $a extends bi{constructor(e){super({type:"LineMaterial",uniforms:Wa.clone(rt.line.uniforms),vertexShader:rt.line.vertexShader,fragmentShader:rt.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(e){e===!0!==this.worldUnits&&(this.needsUpdate=!0),e===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return"USE_DASH"in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}}const Ct=new Be,Oa=new V,Ra=new V,U=new Be,z=new Be,ee=new Be,Tt=new V,It=new xi,N=new Si,_a=new V,st=new _t,nt=new Fa,te=new Be;let ae,ge;function Ua(h,e,s){return te.set(0,0,-e,1).applyMatrix4(h.projectionMatrix),te.multiplyScalar(1/te.w),te.x=ge/s.width,te.y=ge/s.height,te.applyMatrix4(h.projectionMatrixInverse),te.multiplyScalar(1/te.w),Math.abs(Math.max(te.x,te.y))}function hs(h,e){const s=h.matrixWorld,p=h.geometry,g=p.attributes.instanceStart,f=p.attributes.instanceEnd,m=Math.min(p.instanceCount,g.count);for(let u=0,o=m;u<o;u++){N.start.fromBufferAttribute(g,u),N.end.fromBufferAttribute(f,u),N.applyMatrix4(s);const S=new V,l=new V;ae.distanceSqToSegment(N.start,N.end,l,S),l.distanceTo(S)<ge*.5&&e.push({point:l,pointOnLine:S,distance:ae.origin.distanceTo(l),object:h,face:null,faceIndex:u,uv:null,uv1:null})}}function vs(h,e,s){const p=e.projectionMatrix,f=h.material.resolution,m=h.matrixWorld,u=h.geometry,o=u.attributes.instanceStart,S=u.attributes.instanceEnd,l=Math.min(u.instanceCount,o.count),d=-e.near;ae.at(1,ee),ee.w=1,ee.applyMatrix4(e.matrixWorldInverse),ee.applyMatrix4(p),ee.multiplyScalar(1/ee.w),ee.x*=f.x/2,ee.y*=f.y/2,ee.z=0,Tt.copy(ee),It.multiplyMatrices(e.matrixWorldInverse,m);for(let w=0,I=l;w<I;w++){if(U.fromBufferAttribute(o,w),z.fromBufferAttribute(S,w),U.w=1,z.w=1,U.applyMatrix4(It),z.applyMatrix4(It),U.z>d&&z.z>d)continue;if(U.z>d){const le=U.z-z.z,X=(U.z-d)/le;U.lerp(z,X)}else if(z.z>d){const le=z.z-U.z,X=(z.z-d)/le;z.lerp(U,X)}U.applyMatrix4(p),z.applyMatrix4(p),U.multiplyScalar(1/U.w),z.multiplyScalar(1/z.w),U.x*=f.x/2,U.y*=f.y/2,z.x*=f.x/2,z.y*=f.y/2,N.start.copy(U),N.start.z=0,N.end.copy(z),N.end.z=0;const D=N.closestPointToPointParameter(Tt,!0);N.at(D,_a);const ie=jt.lerp(U.z,z.z,D),pe=ie>=-1&&ie<=1,Fe=Tt.distanceTo(_a)<ge*.5;if(pe&&Fe){N.start.fromBufferAttribute(o,w),N.end.fromBufferAttribute(S,w),N.start.applyMatrix4(m),N.end.applyMatrix4(m);const le=new V,X=new V;ae.distanceSqToSegment(N.start,N.end,X,le),s.push({point:X,pointOnLine:le,distance:ae.origin.distanceTo(X),object:h,face:null,faceIndex:w,uv:null,uv1:null})}}}class ys extends F{constructor(e=new Ya,s=new $a({color:Math.random()*16777215})){super(e,s),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const e=this.geometry,s=e.attributes.instanceStart,p=e.attributes.instanceEnd,g=new Float32Array(2*s.count);for(let m=0,u=0,o=s.count;m<o;m++,u+=2)Oa.fromBufferAttribute(s,m),Ra.fromBufferAttribute(p,m),g[u]=u===0?0:g[u-1],g[u+1]=g[u]+Oa.distanceTo(Ra);const f=new Lt(g,2,1);return e.setAttribute("instanceDistanceStart",new Me(f,1,0)),e.setAttribute("instanceDistanceEnd",new Me(f,1,1)),this}raycast(e,s){const p=this.material.worldUnits,g=e.camera;if(g===null&&!p&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.'),p===!1&&(this.material.resolution.x===0||this.material.resolution.y===0))return;const f=e.params.Line2!==void 0&&e.params.Line2.threshold||0;ae=e.ray;const m=this.matrixWorld,u=this.geometry,o=this.material;ge=o.linewidth+f,u.boundingSphere===null&&u.computeBoundingSphere(),nt.copy(u.boundingSphere).applyMatrix4(m);let S;if(p)S=ge*.5;else{const d=Math.max(g.near,nt.distanceToPoint(ae.origin));S=Ua(g,d,o.resolution)}if(nt.radius+=S,ae.intersectsSphere(nt)===!1)return;u.boundingBox===null&&u.computeBoundingBox(),st.copy(u.boundingBox).applyMatrix4(m);let l;if(p)l=ge*.5;else{const d=Math.max(g.near,st.distanceToPoint(ae.origin));l=Ua(g,d,o.resolution)}st.expandByScalar(l),ae.intersectsBox(st)!==!1&&(p?hs(this,s):vs(this,g,s))}onBeforeRender(e){const s=this.material.uniforms;s&&s.resolution&&(e.getViewport(Ct),this.material.uniforms.resolution.value.set(Ct.z,Ct.w))}}function gs(){const h=document.createElement("canvas");h.width=512,h.height=384;const e=h.getContext("2d"),s=new Ut(h);s.colorSpace=zt,s.flipY=!1;let p=-1/0;function g(f,m=!1){if(f-p<100||m&&p!==-1/0)return;p=f,e.fillStyle="#071619",e.fillRect(0,0,512,384),e.fillStyle="#819b9d",e.font="16px Arial",e.fillText("UM / ESTUDIO CLÍNICO",18,25),e.fillStyle="#eac574",e.fillText("DEMO",438,25),e.strokeStyle="#173136",e.lineWidth=1;for(let o=15;o<370;o+=20)e.beginPath(),e.moveTo(o,48),e.lineTo(o,335),e.stroke();for(let o=48;o<340;o+=20)e.beginPath(),e.moveTo(15,o),e.lineTo(365,o),e.stroke();const u=m?0:f*55e-6;for(let o=0;o<3;o++){const S=94+o*95;e.strokeStyle=["#6bcc96","#61afcc","#e6c077"][o],e.lineWidth=2,e.beginPath();for(let l=18;l<365;l++){const d=(l/115+u)%1,w=o===0?-.2*Math.exp(-(((d-.28)/.05)**2))+1.3*Math.exp(-(((d-.38)/.018)**2))-.45*Math.exp(-(((d-.42)/.025)**2))+.28*Math.exp(-(((d-.64)/.08)**2)):Math.sin(d*Math.PI*2)*(o===1?.55:.3),I=S-w*31;l===18?e.moveTo(l,I):e.lineTo(l,I)}e.stroke(),e.fillStyle=["#6bcc96","#61afcc","#e6c077"][o],e.font="13px Arial",e.fillText(["ECG SIM","SpO2 SIM","RESP SIM"][o],391,S-25),e.font="bold 43px Arial",e.fillText(["72","98","16"][o],390,S+18)}e.fillStyle="#92aaaa",e.font="13px Arial",e.fillText("SEÑALES ILUSTRATIVAS / SIN DATOS REALES",18,369),s.needsUpdate=!0}return g(0),{texture:s,update:g,dispose:()=>s.dispose()}}function ws(){const h=document.createElement("canvas");h.width=1024,h.height=576;const e=h.getContext("2d"),s=new Ut(h);s.colorSpace=zt,s.flipY=!1;let p=-1/0,g="";function f(m,u=!1,o="",S=0){const l=o+S;if(!(l!==g)&&(m-p<500||u&&p!==-1/0))return;p=m,g=l,e.fillStyle="#101e27",e.fillRect(0,0,1024,576),e.fillStyle="#f2f5f5",e.font="bold 27px Arial",e.fillText("ULTIMA MILLA / OPERACIÓN",32,48),e.font="16px Arial",e.fillStyle="#74baa9",e.fillText("DEMOSTRACIÓN · DATOS ILUSTRATIVOS",32,77);const w=["RED DE DATOS","SEGURIDAD IP","COMUNICACIONES"];for(let v=0;v<3;v++){const D=32+v*329;e.fillStyle="#1b303c",e.fillRect(D,108,305,112),e.fillStyle="#94aebd",e.font="16px Arial",e.fillText(w[v],D+18,138),e.font="bold 30px Arial",e.fillStyle="#daf4e7",e.fillText("Disponible",D+18,186)}e.fillStyle="#182c37",e.fillRect(32,244,627,268),e.fillRect(683,244,308,268),e.font="18px Arial",e.fillStyle="#c9dce4",e.fillText("Actividad de infraestructura",54,278),e.fillText("Puestos conectados",704,278),e.strokeStyle="#314953",e.lineWidth=1;for(let v=0;v<6;v++)e.beginPath(),e.moveTo(54,309+v*32),e.lineTo(637,309+v*32),e.stroke();e.strokeStyle="#e1473b",e.lineWidth=3,e.beginPath();for(let v=0;v<580;v++){const D=403-Math.sin(v*.038+(u?0:m*3e-4))*22-Math.sin(v*.017)*37;v?e.lineTo(54+v,D):e.moveTo(54+v,D)}e.stroke(),["Admisión","Consultorios","Internación","Sala técnica"].forEach((v,D)=>{e.font="17px Arial",e.fillStyle="#d4e3e8",e.fillText(v,706,322+D*43),e.fillStyle="#63c4a2",e.beginPath(),e.arc(958,316+D*43,5,0,Math.PI*2),e.fill()});const I={wifi:"AP-04 / Dispositivo DEMO asociado",phone:"PBX / Llamada DEMO 201 → 203",fire:"CT-01 / Evento de prueba · sin emergencia real",power:"UPS / Operación DEMO sobre batería",access:"Acceso técnico / Credencial DEMO autorizada",fiber:"ODF / Enlace DEMO verificado · sin certificación real"};e.font="16px Arial",e.fillStyle=o?"#ffbd80":"#93acb7",e.fillText(o?`${S+1}/3 · ${I[o]}`:"Conectividad • Supervisión • Continuidad operativa",32,551),s.needsUpdate=!0}return f(0),{texture:s,update:f,dispose:()=>s.dispose()}}function bs(){const h=[];function e(f=!1){const m=document.createElement("canvas");m.width=m.height=128;const u=m.getContext("2d"),o=u.createImageData(128,128);let S=17;for(let d=0;d<128;d++)for(let w=0;w<128;w++){S=S*1664525+1013904223>>>0;const I=128+(S/4294967296-.5)*34+(f?Math.sin(w*Math.PI/2)*18+Math.cos(d*Math.PI/2)*18:0),v=(d*128+w)*4;o.data[v]=o.data[v+1]=o.data[v+2]=I,o.data[v+3]=255}u.putImageData(o,0,0);const l=new Ut(m);return l.wrapS=l.wrapT=Ei,l.repeat.set(f?6:2,f?6:2),h.push(l),l}const s=e(),p=e(!0);function g(f,m){const u=/linen|textile|curtain|upholstery/.test(m),o=/resin|stone/.test(m),S=/chalk|paint/.test(m);if(!u&&!o&&!S&&!/polymer|oak/.test(m))return;const l=f.geometry,d=l.attributes.position,w=l.attributes.normal,I=new Float32Array(d.count*2);for(let v=0;v<d.count;v++){const D=Math.abs(w.getX(v)),ie=Math.abs(w.getY(v)),pe=Math.abs(w.getZ(v));I[v*2]=D>ie&&D>pe?d.getY(v):d.getX(v),I[v*2+1]=pe>D&&pe>ie?d.getY(v):d.getZ(v)}l.setAttribute("uv",new Mi(I,2)),f.material.bumpMap=u?p:s,f.material.bumpScale=u?.0014:o?6e-4:35e-5,f.material.roughness=u?.91:o?.48:S?.85:.42}return{apply:g,dispose(){h.forEach(f=>f.dispose())}}}const de=[{p:[21,-13,18],look:[0,8,1]},{p:[1.8,-3,2.1],look:[1.8,7,1.65]},{p:[1.8,7,1.65],look:[-8,7,1.65]},{p:[-8,7,1.65],look:[-8,3,1.3]},{p:[-8,4.1,1.65],look:[-11,2.8,.9]},{p:[-8,7,1.65],look:[3.5,7,1.65]},{p:[3.5,7,1.65],look:[3.5,12,1.2]},{p:[3.5,10.5,1.65],look:[2,13,1]},{p:[3.5,7,1.65],look:[8.8,7,1.65]},{p:[8.8,7,1.65],look:[8.8,2,1.65]},{p:[8.8,2,1.65],look:[9,4,1.3]},{p:[16.3,1.2,1.65],look:[16.6,4.2,1.35]},{p:[-2,4.55,1.65],look:[-2,3.1,1.51]},{p:[0,6,1.65],look:[0,7.3,3.13]},{p:[8.8,7,1.65],look:[11,2,1.5]},{p:[11,2.4,1.65],look:[12,.05,1.45]},{p:[12.1,-2.1,1.75],look:[10.1,-4.7,1.3]},{p:[1.8,-7,2.1],look:[1.5,0,1.8]},{p:[1.1,-3.5,1.6],look:[.05,-2.2,1.35]},{p:[9.6,2.4,1.92],look:[9.65,3.4,1.55]},{p:[16.2,2.1,1.8],look:[17.6,6.4,1.4]},{p:[16.2,10.1,1.8],look:[17,12.7,1.4]}],lt=[{name:"Vista general",step:0,description:"Una infraestructura. Sistemas que trabajan juntos."},{name:"Pasillo",step:2,description:"La red troncal distribuye conectividad y servicios hacia cada ambiente."},{name:"Consultorio",step:4,description:"Datos, telefonía y acceso a las aplicaciones de gestión."},{name:"Internación",step:7,description:"Llamado de enfermería, conectividad y detección: continuidad asistencial."},{name:"Sala técnica",step:11,description:"Racks, distribución y respaldo de energía sostienen toda la operación."},{name:"Puestos IT",step:12,description:"PCs, telefonía IP y supervisión: la infraestructura al servicio de las personas."},{name:"Wi-Fi",step:13,description:"AP-04: montaje, alimentación PoE y conectividad para dispositivos móviles."},{name:"Acceso técnico",step:15,description:"Lector, contacto de puerta y conexión al controlador. Demostración de autorización."},{name:"Calderas",step:16,description:"Equipamiento térmico como contexto. Detección, notificación y supervisión como servicios UM."},{name:"Exterior",step:17,description:"Marquesina, entrada y vigilancia: la infraestructura comienza antes de entrar."},{name:"Acceso principal",step:18,description:"Videoportero, lector, controlador y contacto de puerta. Acceso conectado."},{name:"Fibra y certificación",step:19,description:"ODF integrado al rack, conectores LC y backbone. Instrumental móvil para mantenimiento."},{name:"Energía IT",step:20,description:"Sala eléctrica propia: tableros, UPS modular, baterías, distribución y tierra."},{name:"Grabación CCTV",step:21,description:"Grabador y almacenamiento: del punto de vigilancia al registro y la supervisión."}],Ss=[["all","Todos","Infraestructura integrada. Equipamiento y recorridos ilustrativos."],["Data","Datos","Cableado estructurado y backbone: de la sala técnica a cada puesto."],["Fire-detection","Incendio","Detección, aviso manual y central de alarma. Sin simular una emergencia real."],["Telecom","Comunicaciones","Wi-Fi, telefonía IP y llamado de enfermería conectados a la infraestructura."],["Security","Accesos","Lectores, videoportero y control de puertas. CCTV se inspecciona en su capa independiente."],["CCTV","CCTV","Cámaras y enlaces de video hacia un rack PoE/NVR y puesto de supervisión independientes."],["Power","Energía","Respaldo y distribución eléctrica para la infraestructura IT."],["Software","Software / operación","Terminales, gestión y supervisión sobre la red. Sin datos reales del SGI."]],ct=(h,e=0,s=1)=>Math.max(e,Math.min(s,h));function za(h){const e=ct(h)*(de.length-1),s=Math.min(Math.floor(e),de.length-2),p=e-s,g=de[s],f=de[s+1];return{p:g.p.map((m,u)=>m+(f.p[u]-m)*p),look:g.look.map((m,u)=>m+(f.look[u]-m)*p)}}function Na(h){return lt.reduce((e,s)=>Math.abs(s.step/(de.length-1)-h)<Math.abs(e.step/(de.length-1)-h)?s:e)}const Pt=de.length-1,ye={wifi:{label:"Conexión Wi-Fi",stop:"Wi-Fi",layer:"Telecom",title:"AP-04 / Movilidad",steps:["La tablet se asocia al punto de acceso.","El enlace PoE lleva los datos hasta el switch.","El dispositivo aparece en supervisión · cobertura ilustrativa."]},phone:{label:"Llamada IP",stop:"Puestos IT",layer:"Telecom",title:"Interno 201 → 203",steps:["Admisión inicia una llamada DEMO.","La central IP establece la comunicación.","Enfermería recibe la llamada · registro en supervisión."]},fire:{label:"Prueba de detección",stop:"Calderas",layer:"Fire-detection",title:"Zona CT-01 / Prueba de incendio",steps:["Entrada de prueba del detector térmico.","La central identifica la zona CT-01.","Avisador y evento de supervisión · sin descarga ni maniobras reales."]},power:{label:"Respaldo UPS",stop:"Energía IT",layer:"Power",title:"Continuidad IT / DEMO",steps:["Se simula pérdida de alimentación de red.","El UPS sostiene la carga IT representada.","La supervisión registra operación sobre batería."]},access:{label:"Probar credencial",stop:"Acceso técnico",layer:"Security",title:"Puerta técnica / DEMO",steps:["Se presenta una credencial ilustrativa.","El controlador valida el permiso de acceso.","Indicador autorizado · evento registrado en supervisión."]},fiber:{label:"Fibra y certificación",stop:"Fibra y certificación",layer:"Data",title:"ODF → switch / DEMO",steps:["El certificador verifica el enlace hacia el distribuidor óptico.","Reserva de fibra y LC quedan documentados.","El enlace aparece operativo en supervisión · sin certificación real."]}},xs=h=>Math.min(2,Math.max(0,Math.floor(h/2500))),Es={wifi:[[-1.42,3.3,1.25],[0,7.3,3.13],[0,7.3,3.23],[0,8.1,3.23],[16.2,8.1,3.23],[16.2,2.2,3.23],[16.2,2.2,1.48]],phone:[[-4.37,3.2,1.25],[-3.5,2.965,1.3],[-3.5,2.965,3.23],[-3.5,8.1,3.23],[16.2,8.1,3.23],[16.2,2.2,3.23],[16.2,2.2,1.22],[16.2,2.2,3.23],[16.2,8.1,3.23],[.5,8.1,3.23],[.5,2.965,3.23],[.5,2.965,1.3],[-.37,3.2,1.25]],fire:[[10.5,-3.55,3.4],[10.5,-5.77,3.4],[12.9,-5.77,3.4],[12.9,-5.77,1.7],[13.18,-5.6,1.7],[13.18,-5.6,3.35],[13.18,-.08,3.35],[12.3,-.08,3.35],[12.3,-.08,2.45]],power:[[18.6,7.64,1.9],[18.6,7.64,3.15],[17.15,7.64,3.15],[17.15,6.74,3.15],[17.15,6.74,1.4],[17.15,6.74,3.29],[17.15,8.65,3.29],[16.2,8.65,3.29],[16.2,2.2,3.29],[16.2,2.2,.3]],access:[[12.12,.08,1.26],[12.12,.08,3.18],[12.12,7.2,3.18],[17.5,7.2,3.18],[17.5,12.73,3.18],[17.5,12.73,1.6]],fiber:[[16.15,1.2,1.52],[16.15,1.26,1.62],[16.2,2.2,1.62],[16.2,2.2,1.75],[16.2,2,1.3]]},kt={wifi:"#8056be",phone:"#8056be",fire:"#d64032",power:"#c79238",access:"#268369",fiber:"#168daa"};function Ms(h,e){const s=new Ga;h.add(s);const p={};for(const[l,d]of Object.entries(Es)){const w=new qa;d.slice(1).forEach((D,ie)=>w.add(new Ot(e(d[ie]),e(D))));const I=new Di(new Ai().setFromPoints(d.map(e)),new Ha({color:kt[l],transparent:!0,opacity:.65,depthTest:!0})),v=new F(new Rt(.027,12,8),new oe({color:kt[l]}));s.add(I,v),p[l]={line:I,packet:v,curve:w}}const g=new F(new Ci(.14,.17,48),new oe({color:kt.wifi,transparent:!0,opacity:.45,side:Ti,depthWrite:!1}));g.rotation.x=-Math.PI/2,g.position.copy(e([0,7.3,3.11])),s.add(g);const f=new F(new Ne(.14,.045,.008),new oe({color:"#ff563d"}));f.position.copy(e([12.3,-.145,2.49])),s.add(f);const m=new F(new Ne(.045,.008,.006),new oe({color:"#63efb0"}));m.position.copy(e([12.12,.116,1.3])),s.add(m);const u=[-4,0].map(l=>{const d=new F(new Rt(.012,12,8),new oe({color:"#83e4ce"}));return d.position.copy(e([l-.343,3.23,1.278])),s.add(d),d}),o=new F(new Ne(.25,.09,.008),new oe({color:"#d69b45"}));o.position.copy(e([17.15,6.681,1.3])),s.add(o);const S=new F(new Ne(.08,.03,.05),new oe({color:"#168daa"}));return S.position.copy(e([16.15,1.22,1.56])),s.add(S),{update(l,d,w){for(const[v,D]of Object.entries(p))D.line.visible=D.packet.visible=l===v,D.packet.position.copy(D.curve.getPoint(w?.65:d%7500/7500));g.visible=l==="wifi",g.scale.setScalar(w?2:1+d%3e3/1500),g.material.opacity=w?.35:.55*(1-d%3e3/3e3),f.visible=l==="fire"&&d>=2500;const I=w?1:.7+.3*Math.sin(d*.0015);f.material.color.setRGB(I,.16*I,.09*I),m.visible=l==="access"&&d>=2500,u.forEach((v,D)=>{v.visible=l==="phone"&&d>=D*2500}),o.visible=l==="power"&&d>=2500,S.visible=l==="fiber"&&d>=2500},dispose(){s.traverse(l=>{var d,w;(d=l.geometry)==null||d.dispose(),(w=l.material)==null||w.dispose()}),h.remove(s)}}}const Ba=[{id:"ODF-01",name:"Fibra / distribución óptica",stop:"Fibra y certificación",layer:"Data",route:"ODF → patch óptico → SFP → switch",detail:"Bandeja de empalmes, reserva de fibra y adaptadores LC."},{id:"TEST-01",name:"Certificación del enlace",stop:"Fibra y certificación",layer:"Data",route:"Certificador → enlace bajo prueba → remoto",detail:"Registro ilustrativo: identificación, continuidad y resultado DEMO. No constituye certificación real."},{id:"CCTV-01",name:"Cámara y grabación",stop:"Grabación CCTV",layer:"CCTV",route:"Cámara exterior → PoE → NVR → supervisión",detail:"Sala de seguridad independiente: cámaras, red PoE, grabador y supervisión."},{id:"AP-04",name:"Wi-Fi / movilidad",stop:"Wi-Fi",layer:"Telecom",route:"Dispositivo → AP → switch PoE → aplicaciones",detail:"Puntos de acceso, uplinks y alimentación sobre el mismo enlace."},{id:"IP-201",name:"Telefonía IP",stop:"Puestos IT",layer:"Telecom",route:"Interno 201 → PBX → interno 203",detail:"Terminales físicos y comunicación representada en la demo de llamada."},{id:"PWR-01",name:"Energía IT / tablero",stop:"Energía IT",layer:"Power",route:"Distribución → UPS / batería → carga IT",detail:"Protecciones, rieles DIN, borneras, canaletas y barra de tierra. Esquema conceptual, no unifilar aprobado."},{id:"ACC-01",name:"Acceso principal",stop:"Acceso principal",layer:"Security",route:"Lector / videoportero → controlador → acceso",detail:"Entrada cubierta, pedestal, lector, videoportero y contacto de puerta."},{id:"FIRE-01",name:"Detección y aviso",stop:"Calderas",layer:"Fire-detection",route:"Detector → central → notificación / supervisión",detail:"Detección y aviso en sala técnica; equipos térmicos solamente como contexto."},{id:"OPS-01",name:"Software y soporte",stop:"Puestos IT",layer:"Software",route:"Activo → incidencia → atención → cierre",detail:"Flujo local demostrativo de soporte, sin datos ni conexión al SGI."}],T=([h,e,s])=>new V(h,s,-e);function Ls({modelBase:h="/models/"}){const e=x.useRef(null),s=x.useRef(null),[p,g]=x.useState(!1),[f,m]=x.useState(""),[u,o]=x.useState(!1),[S,l]=x.useState(!1),[d,w]=x.useState("all"),[I,v]=x.useState(0),[D,ie]=x.useState(!1),[pe,Fe]=x.useState(""),[le,X]=x.useState(!0),[Y,dt]=x.useState(""),[We,Nt]=x.useState(0),[Bt,Xa]=x.useState(!1),[Za,Ja]=x.useState(0),[pt,Qa]=x.useState("orbit"),[Ft,Ka]=x.useState("building"),[De,ei]=x.useState(!1),[Z,Ve]=x.useState(null),[Ae,ti]=x.useState(!0),[Wt,ai]=x.useState(0),[ii,si]=x.useState([]),[Vt,ni]=x.useState(!1),[ri,ut]=x.useState(null),[ue,oi]=x.useState(!0);x.useEffect(()=>{if(!Ae||!Z&&!ue)return;const r=setInterval(()=>{document.hidden||ai(A=>A+1)},1e3);return()=>clearInterval(r)},[Z,Ae,ue]),x.useEffect(()=>{if(!De)return;const r=document.body.style.overflow;return document.body.style.overflow="hidden",()=>{document.body.style.overflow=r}},[De]);const[Ce,li]=x.useState("ODF-01"),[ci,di]=x.useState({}),[ft,pi]=x.useState(!1),Te=Ba.find(r=>r.id===Ce),Ie=ci[Ce]||0,J=x.useRef({explore:!1,playing:!1,layer:"all",progress:0,systemsView:!0}),Gt=x.useRef(null);J.current={explore:u,playing:S,layer:d,progress:I,systemsView:le,demo:Y,demoRun:Za,navigation:pt,viewMode:Ft,traffic:Ae,arEnabled:ue,selection:Z,measuring:D},x.useEffect(()=>{const r=e.current;let A=!0,H,Q,R,ht=0,Ht=0,fe=0,Yt=0,$t=!0;const Pe=matchMedia("(prefers-reduced-motion: reduce)"),E=new Ii;E.background=new Ta("#dfe4df"),E.fog=new Pi("#dfe4df",55,125);const P=new ki(52,1,.06,140),k=Qi(P,{colliders:()=>q.filter(i=>i.userData.system==="Architecture"||i.userData.system==="Architectural-detail")});let Xt=!1,Zt="",be=!1;try{R=new Li({antialias:!0,powerPreference:"low-power"})}catch{m("Tu navegador no pudo iniciar WebGL. El recorrido requiere aceleración gráfica.");return}R.setPixelRatio(Math.min(devicePixelRatio,1.5)),R.outputColorSpace=zt,R.toneMapping=ji,R.toneMappingExposure=.9,R.localClippingEnabled=!0,R.shadowMap.enabled=!0,R.shadowMap.type=Oi;const y=R.domElement;y.tabIndex=0,y.setAttribute("aria-label","Hospital 3D. Clic para inspeccionar sistemas. Activá Explorar para orbitar o entrar."),r.appendChild(y);const j=new Ri(P,y);j.enabled=!1,j.enableDamping=!0,j.dampingFactor=.09,j.minDistance=.15,j.maxDistance=100,j.maxPolarAngle=Math.PI-.001,j.minPolarAngle=.001,j.zoomSpeed=.8,j.screenSpacePanning=!0;const Ge=new Xi,qe=new Va,He=new Ga;E.add(He);const Jt=new Ha({color:"#758982",transparent:!0,opacity:.34}),Qt=i=>{if(!["Architecture","Architectural-detail"].includes(i.userData.system))return;i.updateWorldMatrix(!0,!1);const t=new Yi(new $i(i.geometry,35),Jt);t.matrix.copy(i.matrixWorld),t.matrixAutoUpdate=!1,He.add(t)},Kt=new Ui(R),ea=new _i,ta=Kt.fromScene(ea,.04);E.environment=ta.texture,ea.dispose(),Kt.dispose(),E.environmentIntensity=.26,E.add(new zi(15068659,5327939,.4));const G=new Ni(16772559,2.6);G.position.set(-7,9,-24),G.target.position.set(0,0,-10),G.castShadow=!0,G.shadow.mapSize.set(2048,2048),Object.assign(G.shadow.camera,{left:-22,right:22,top:18,bottom:-18,near:.5,far:65}),G.shadow.normalBias=.012,E.add(G,G.target),Ki.init();for(const i of[-10.5,-3.5,3.5,10.5]){const t=new tt(14740991,2.6,5.6,1.25);t.position.copy(T([i,15.6,2.4])),t.lookAt(T([i,11,1.2])),E.add(t);const a=new tt(16773852,1.2,1.2,.6);a.position.copy(T([i,12,3.38])),a.lookAt(T([i,12,0])),E.add(a)}for(const[i,t,a,b,M]of[[[-10,3,3.37],[-11,2.8,.7],3.5,1.2,.6],[[10.3,2.8,2.8],[10.3,4,1.1],4.5,2.2,.25]]){const L=new tt(15791359,a,b,M);L.position.copy(T(i)),L.lookAt(T(t)),E.add(L)}const aa=Ji(E,T),Ye=gs(),$e=ws(),ia=bs(),sa=Ms(E,T),vt=new tt(16772827,4.5,5,2);vt.position.copy(T([10.5,-2.5,3.42])),vt.lookAt(T([10.5,-4.3,.5])),E.add(vt);const na=new Bi(14806527,9,9,2);na.position.copy(T([11,-1.1,2.6])),E.add(na);const fi=new Zi(new V(0,-1,0),1.4),q=[],ke=[],Xe=[],yt=[],Ze=[],gt=[],Je=es(E);Gt.current=Je;for(const i of[-10.5,-3.5,3.5,10.5]){const t=new ze({color:14606297,roughness:.5}),a=new F(new Ia(.075,.065,.045,20),t);a.position.copy(T([i,12,3.16])),a.userData={system:"Fire-detection",base:t.color.clone(),emission:t.emissive.clone()},E.add(a),q.push(a),Ze.push(a)}Object.entries(Fi).forEach(([i,t])=>{const a=K[i];if(i!=="Software"){const b=Pa(t).map(([c,O])=>new Wi(new Ot(T(c),T(O)),1,a.radius,6,!1)),M=Vi(b);b.forEach(c=>c.dispose());const L=new ze({color:a.color,emissive:a.color,emissiveIntensity:.12,roughness:.38}),_=new F(M,L);_.userData.system=i,E.add(_),ke.push(_);const C=new Ya;C.setPositions(Pa(t).flatMap(c=>c.flatMap(O=>T(O).toArray())));const $=new $a({color:a.color,linewidth:2.5,depthTest:!0,depthWrite:!1,transparent:!0,opacity:.95,toneMapped:!1}),ve=new ys(C,$);ve.userData.system=i,ve.renderOrder=10,E.add(ve),Xe.push(ve)}t.forEach(({points:b,end:M},L)=>{const _=new qa;if(b.slice(1).forEach((C,$)=>_.add(new Ot(T(b[$]),T(C)))),L<3){const C=new F(new Rt(.036,8,6),new oe({color:a.color,depthTest:!0,depthWrite:!1}));C.renderOrder=5,E.add(C),yt.push({dot:C,curve:_,system:i,offset:L*.13+Object.keys(K).indexOf(i)*.07})}if(i!=="Software"){const C=new F(new Gi(.075,.006,5,24),new oe({color:a.color,depthTest:!0,depthWrite:!1}));C.position.copy(T(M)),C.renderOrder=4,E.add(C),gt.push({marker:C,system:i})}if(i==="Power"){const C=new ze({color:"#dedacc",roughness:.45}),$=new F(new Ne(.1,.07,.018),C);$.position.copy(T(M)),$.userData={system:i,base:C.color.clone(),emission:C.emissive.clone()},E.add($),q.push($),Ze.push($)}})});const me=new F(new Ia(.075,.065,.045,20),new ze({color:"#dedacc",roughness:.5}));me.position.copy(T([-9.5,3.9,3.16])),me.userData={system:"Fire-detection",base:me.material.color.clone(),emission:me.material.emissive.clone()},E.add(me),q.push(me),Ze.push(me);const mi=us(E),wt=ts(ms("hospital"));E.add(wt.root),q.push(...wt.meshes);const bt=as("hospital",T);E.add(bt.group);const ce=i=>i.traverse(t=>{if(t.isMesh){t.geometry.dispose();for(const a of Array.isArray(t.material)?t.material:[t.material])a.dispose()}}),Le=new qi().setDecoderPath(`${h}draco/`).setWorkerLimit(1);let je,Se,se;new at().setDRACOLoader(Le).load(`${h}hospital-services.glb`,i=>{if(!A){ce(i.scene);return}se=i.scene,se.traverse(t=>{t.isMesh&&(t.material=t.material.clone(),t.userData={system:t.name.split("__")[0],base:t.material.color.clone(),emission:t.material.emissive.clone(),baseIntensity:t.material.emissiveIntensity},t.castShadow=!0,t.receiveShadow=!0,q.push(t))}),E.add(se),se.traverse(t=>{t.isMesh&&Qt(t)}),B.markEmissives(),Ee="",Xa(!0)},void 0,()=>{A&&m("No se pudo cargar la ampliación de servicios. Recargá para volver a intentarlo.")}),new at().setDRACOLoader(Le).load(`${h}hospital-terminals.glb`,i=>{if(!A){ce(i.scene);return}Se=i.scene,Se.traverse(t=>{t.isMesh&&(t.material=t.material.clone(),t.userData={system:t.name.split("__")[0],base:t.material.color.clone(),emission:t.material.emissive.clone(),baseIntensity:t.material.emissiveIntensity},t.castShadow=!0,t.receiveShadow=!0,q.push(t))}),E.add(Se),B.markEmissives(),Ee=""},void 0,()=>{A&&m("No se pudieron cargar las terminaciones de red. Recargá para volver a intentarlo.")}),new at().setDRACOLoader(Le).load(`${h}hospital-walkthrough.glb`,i=>{if(!A){ce(i.scene);return}Q=i.scene,Q.traverse(t=>{var L,_;if(!t.isMesh)return;const a=t.name.split("__")[0];t.userData.system=a,t.material=t.material.clone();const b=t.name.split("__")[1],M={chalk:"#c6c4b7",stone:"#687a79",resin:"#8daba5",metal:"#647572",wood:"#87654b",upholstery:"#304e59",dark:"#172f34"};M[b]&&t.material.color.set(M[b]),a==="Data"&&b==="dark"&&(t.material.color.set("#111820"),t.material.roughness=.48),a==="Ceiling"&&b==="chalk"&&t.material.color.set("#c4c3b8"),ia.apply(t,b||""),b==="red"&&K[a]&&(t.material.color.set(K[a].color),(L=t.material.emissive)==null||L.set(K[a].color),t.material.emissiveIntensity=.16),t.name.includes("clinical-screen")&&(t.material.map=Ye.texture,t.material.emissiveMap=Ye.texture,t.material.color.set("#ffffff"),t.material.emissive.set("#ffffff"),t.material.emissiveIntensity=.6,t.material.roughness=.35,t.material.metalness=0),t.userData.base=t.material.color.clone(),t.userData.emission=(_=t.material.emissive)==null?void 0:_.clone(),t.userData.baseIntensity=t.material.emissiveIntensity,t.userData.legacyWorkstation=a==="Software",t.userData.legacyAP=a==="Telecom"&&b==="chalk",t.userData.legacyEquipment=a==="Power"||a==="Security",t.castShadow=a!=="Ceiling"&&!t.name.includes("__glass"),t.receiveShadow=!0,t.material.clipShadows=!0,t.name.includes("__glass")&&(t.material.transmission=0,t.material.transparent=!0,t.material.opacity=.15,t.material.depthWrite=!1),q.push(t)}),E.add(Q),Q.traverse(t=>{t.isMesh&&Qt(t)}),B.markEmissives(),St.dress(Q),Ee="",g(!0),new at().setDRACOLoader(Le).load(`${h}hospital-workstations.glb`,t=>{if(!A){ce(t.scene);return}je=t.scene,t.scene.traverse(a=>{a.isMesh&&(a.material=a.material.clone(),a.userData.system="Software",a.name.includes("workstation-screen")&&(a.material.map=$e.texture,a.material.emissiveMap=$e.texture,a.material.emissive.set("#ffffff"),a.material.emissiveIntensity=.7),a.userData.base=a.material.color.clone(),a.userData.emission=a.material.emissive.clone(),a.userData.baseIntensity=a.material.emissiveIntensity,a.castShadow=!0,a.receiveShadow=!0,q.push(a))}),E.add(t.scene),B.markEmissives(),Ee=""},void 0,()=>{A&&m("No se pudieron cargar los puestos IT. Recargá para volver a intentarlo.")})},void 0,()=>{A&&m("No se pudo cargar el hospital. Recargá esta página para volver a intentarlo.")});const B=ps(R,E,P,"hospital",{contactShadows:ka(r.clientWidth,devicePixelRatio,matchMedia("(pointer: coarse)").matches).contactShadows}),Qe=is(),ra=new ze({map:Qe.concrete,color:"#b5b8b1",roughnessMap:Qe.grain,roughness:.95,bumpMap:Qe.grain,bumpScale:.5});ss(ra,Qe.concrete,7);const Oe=new F(new Hi(180,180),ra);Oe.rotation.x=-Math.PI/2,Oe.position.y=-.35,Oe.receiveShadow=!0,E.add(Oe);const St=ns({scene:E,sector:"hospital",ground:Oe,sun:G,post:B});let Re=!1,oa=600;const la=()=>{var b;const{width:i,height:t}=r.getBoundingClientRect();oa=t;const a=ka(i,devicePixelRatio,matchMedia("(pointer: coarse)").matches);R.setPixelRatio(a.pixelRatio),R.setSize(i,t),G.shadow.mapSize.x!==a.shadowSize&&((b=G.shadow.map)==null||b.dispose(),G.shadow.map=null,G.shadow.mapSize.set(a.shadowSize,a.shadowSize)),P.aspect=i/t,P.updateProjectionMatrix(),Re=a.contactShadows,B.setSize(i,t),B.setContactShadows(Re),B.setEnabled(Re),y.dataset.pixelRatio=String(a.pixelRatio),y.dataset.shadowSize=String(a.shadowSize),Xe.forEach(M=>M.material.resolution.set(i,t))},ca=new ResizeObserver(la);ca.observe(r),la();const da=new IntersectionObserver(([i])=>{$t=i.isIntersecting});da.observe(r);const ne=new Map;let he=null,xt=0,_e=null,xe=null,Et=null,Ke=null,pa=0,Mt="";const hi=ds(P,()=>q.filter(i=>{var t;return i.visible&&!((t=i.material.clippingPlanes)!=null&&t.length)&&(!i.material.transparent||i.material.opacity>.5)}),(i,t)=>{si(i),ni(t),y.dataset.arSettled=String(t),y.dataset.arLabels=String(i.length)}),ua=i=>{if(i.buttons||performance.now()-pa<140)return;pa=performance.now();const t=y.getBoundingClientRect();qe.set((i.clientX-t.left)/t.width*2-1,-(i.clientY-t.top)/t.height*2+1),Ge.setFromCamera(qe,P);const a=Ge.intersectObjects([...q,...ke].filter(C=>C.visible),!1).find(C=>!C.object.material.transparent||C.object.material.opacity>.3),b=a==null?void 0:a.object.userData.system;if(!K[b]){clearTimeout(Ke),Mt="",Et=null,ut(null),y.style.cursor="";return}const M=a.point,L=[M.x,-M.z,M.y],_=La(b,L);y.style.cursor="pointer",_.id!==Mt&&(Mt=_.id,clearTimeout(Ke),Ke=setTimeout(()=>{Et={asset:_,p:L},ut(_)},350))},vi=i=>{const t=y.getBoundingClientRect();qe.set((i.clientX-t.left)/t.width*2-1,-(i.clientY-t.top)/t.height*2+1),Ge.setFromCamera(qe,P);const b=Ge.intersectObjects([...q,...ke].filter(M=>M.visible),!1).find(M=>!M.object.material.transparent||M.object.material.opacity>.3);if(b){if(J.current.measuring){const M=Je.add(b.point);Fe(M===1?"Marcá el segundo punto":`${Je.distance().toFixed(2)} m · tercer clic reinicia`);return}if(K[b.object.userData.system]){const M=b.point;Ve(La(b.object.userData.system,[M.x,-M.z,M.y])),l(!1)}}},fa=i=>{if(xe=[i.clientX,i.clientY,performance.now()],J.current.explore||(o(!0),l(!1)),y.focus({preventScroll:!0}),J.current.navigation!=="orbit"&&(y.setPointerCapture(i.pointerId),ne.set(i.pointerId,[i.clientX,i.clientY]),he=[i.clientX,i.clientY],l(!1),ne.size===2)){const t=[...ne.values()];xt=Math.hypot(t[0][0]-t[1][0],t[0][1]-t[1][1]),_e=[(t[0][0]+t[1][0])/2,(t[0][1]+t[1][1])/2]}},ma=i=>{if(ne.has(i.pointerId))if(ne.set(i.pointerId,[i.clientX,i.clientY]),ne.size===2){const t=[...ne.values()],a=Math.hypot(t[0][0]-t[1][0],t[0][1]-t[1][1]),b=[(t[0][0]+t[1][0])/2,(t[0][1]+t[1][1])/2];k.dolly(-(a-xt)*.012),_e&&k.pan(-(b[0]-_e[0])*.008,(b[1]-_e[1])*.008),xt=a,_e=b}else he&&(k.rotate(i.clientX-he[0],i.clientY-he[1]),he=[i.clientX,i.clientY])},et=i=>{xe&&Math.hypot(i.clientX-xe[0],i.clientY-xe[1])<5&&performance.now()-xe[2]<500&&vi(i),xe=null,ne.delete(i.pointerId),he=null,y.hasPointerCapture(i.pointerId)&&y.releasePointerCapture(i.pointerId)},ha=i=>{!J.current.explore||J.current.navigation==="orbit"||(i.preventDefault(),k.dolly(-ct(i.deltaY,-100,100)*.012))},va=i=>{if(i.key==="Escape"){k.clear(),o(!1),l(!1),ne.clear(),he=null;return}if(!J.current.explore||["INPUT","SELECT","TEXTAREA"].includes(i.target.tagName))return;const t=i.key.toLowerCase();J.current.navigation==="walk"&&["w","a","s","d","q","e","arrowup","arrowdown","arrowleft","arrowright","shift"].includes(t)&&(i.preventDefault(),k.keys.add(t))},ya=i=>k.keys.delete(i.key.toLowerCase()),ga=()=>k.clear();window.addEventListener("keyup",ya),window.addEventListener("blur",ga),y.addEventListener("pointerdown",fa),y.addEventListener("pointermove",ma),y.addEventListener("pointermove",ua),y.addEventListener("pointerup",et),y.addEventListener("pointercancel",et),y.addEventListener("wheel",ha,{passive:!1}),window.addEventListener("keydown",va),s.current={focus:i=>{be=!0,k.clear(),j.target.copy(T(i.p)).add(new V(i.kind==="door"?-.72:0,0,0)),P.position.copy(j.target).add(new V(.3,.12,i.kind==="door"?3.4:1.15)),P.lookAt(j.target),k.capture()},resetLook:()=>{Yt=0,k.clear(),be=!1},nudge:(i,t,a)=>{const b=P.position.clone();k.pan(i,t),k.dolly(a),J.current.navigation==="orbit"&&j.target.add(P.position.clone().sub(b))}};let Ee="",wa,ba,Sa,Ue=0,Dt=0,xa="",Ea=-1,Ma=0,At=-1;function Da(i){H=requestAnimationFrame(Da);const t=Math.min((i-ht)/1e3,.08);if(i-ht<33)return;if(ht=i,!$t||document.hidden){k.clear();return}const a=J.current;(a.demo!==xa||a.demoRun!==Ea)&&(xa=a.demo,Ea=a.demoRun,Ma=i,At=-1);const b=i-Ma,M=xs(b);if(a.demo&&M!==At&&(At=M,Nt(M)),sa.update(a.demo,b,Pe.matches||!a.traffic),a.playing&&Q){const c=ct(a.progress+t/65);a.progress=c,i-Ht>90&&(v(c),Ht=i),c===1&&l(!1)}if(fe=Pe.matches?a.progress:jt.damp(fe,a.progress,4,t),j.enabled=a.explore&&a.navigation==="orbit",a.explore){if(!Xt||Zt!==a.navigation){if(k.capture(),!be)j.target.copy(T(za(fe).look));else{const c=P.getWorldDirection(new V);j.target.copy(P.position).addScaledVector(c,5)}be=!0}a.navigation==="orbit"?j.update():k.update(t)}else if(!be||a.playing){const c=za(fe),O=T(c.p),re=T(c.look),W=1+(Math.max(1,1.6/P.aspect)-1)*ct(1-fe/.08);P.position.copy(re).add(O.sub(re).multiplyScalar(W)),P.lookAt(re),k.clear()}else k.clear();Xt=a.explore,Zt=a.navigation;const L=be?P.position.y>5:fe<.06;mi.update(a.selection);const _=r.getBoundingClientRect(),C=a.playing&&!a.demo?Na(a.progress):null,$=C?fs(cs.filter(c=>a.layer==="all"||c.system===a.layer),de[C.step].look):null;hi.update(i,{width:_.width,height:_.height,layer:a.layer,playing:a.playing,tourPool:$,enabled:a.arEnabled&&!a.selection,hover:Et}),(Ee!==a.layer||wa!==L||ba!==a.systemsView||Sa!==a.viewMode)&&(He.visible=a.viewMode==="skeleton",aa.setVisible(a.viewMode==="building"),q.forEach(c=>{var Aa;const O=c.userData.system,re=O===a.layer,W=c.material,yi=!!K[O];c.visible=(!c.userData.legacyWorkstation||!je)&&(!c.userData.legacyAP||!se)&&(!c.userData.legacyEquipment||!se)&&(O!=="Ceiling"||!L)&&(a.viewMode==="building"||yi)&&(a.viewMode==="building"||a.layer==="all"||re||a.layer==="Software"&&O==="Data"),W.clippingPlanes=(O==="Architecture"||O==="Architectural-detail")&&L?[fi]:null,W.color.copy(c.userData.base),c.userData.emission&&W.emissive.copy(c.userData.emission),W.emissiveIntensity=c.userData.baseIntensity??0,a.systemsView&&a.layer!=="all"&&!re&&W.color.multiplyScalar(.66),re&&a.systemsView&&!c.name.includes("screen")&&(W.color.lerp(new Ta(K[O].color),.08),(Aa=W.emissive)==null||Aa.set(K[O].color),W.emissiveIntensity=.045),W.needsUpdate=!0}),ke.forEach(c=>{c.visible=a.layer==="all"||c.userData.system===a.layer||a.layer==="Software"&&c.userData.system==="Data",c.material.emissiveIntensity=.12,c.material.depthTest=!0,c.material.depthWrite=!0}),Xe.forEach(c=>{c.visible=a.systemsView&&(a.layer==="all"||c.userData.system===a.layer||a.layer==="Software"&&c.userData.system==="Data"),c.material.linewidth=a.layer==="all"?1.4:2.8}),Ee=a.layer,wa=L,ba=a.systemsView,Sa=a.viewMode);const ve=c=>2*P.position.distanceTo(c.position)*Math.tan(jt.degToRad(P.fov/2))/oa;if(yt.forEach(({dot:c,curve:O,system:re,offset:W})=>{c.visible=a.systemsView&&(re===a.layer||a.layer==="all"),c.position.copy(O.getPoint((Pe.matches||!a.traffic?W:i*4e-5+W)%1)),c.scale.setScalar(Math.max(1,ve(c)*5/.072)),c.renderOrder=12}),gt.forEach(({marker:c,system:O})=>{c.visible=a.systemsView&&O===a.layer,c.quaternion.copy(P.quaternion),c.scale.setScalar(Math.max(1,ve(c)*11/.15)),c.renderOrder=11}),y.dataset.progress=fe.toFixed(3),y.dataset.yaw=Yt.toFixed(3),y.dataset.layer=a.layer,y.dataset.explore=String(a.explore),y.dataset.systems=String(a.systemsView),y.dataset.workstations=String(!!je),y.dataset.terminals=String(!!Se),y.dataset.services=String(!!se),y.dataset.demo=a.demo,y.dataset.demoStage=String(M),y.dataset.cameraPosition=P.position.toArray().map(c=>c.toFixed(2)).join(","),y.dataset.viewMode=a.viewMode,y.dataset.navigation=a.navigation,a.explore&&(y.dataset.yaw=(a.navigation==="walk"?k.yaw:j.getAzimuthalAngle()).toFixed(3)),St.update(i),Ye.update(i,Pe.matches),$e.update(i,Pe.matches,a.demo,M),bt.update(i),B.setAOEnabled(Re&&a.viewMode==="building"),B.setBloom(a.viewMode==="building"),B.render(),Ue||(Ue=i),Dt++,i-Ue>=2e3){const c=Dt*1e3/(i-Ue);y.dataset.renderFps=c.toFixed(1),B.govern(c,i),y.dataset.quality=(Re&&!L?"contact-shadows":"direct")+(B.adaptLevel?`-adapt${B.adaptLevel}`:""),Dt=0,Ue=i}}return H=requestAnimationFrame(Da),()=>{A=!1,cancelAnimationFrame(H),ca.disconnect(),da.disconnect(),window.removeEventListener("keydown",va),window.removeEventListener("keyup",ya),window.removeEventListener("blur",ga),k.clear(),clearTimeout(Ke),y.removeEventListener("pointermove",ua),y.removeEventListener("wheel",ha),y.removeEventListener("pointerdown",fa),y.removeEventListener("pointermove",ma),y.removeEventListener("pointerup",et),y.removeEventListener("pointercancel",et),wt.dispose(),Q&&ce(Q),je&&ce(je),Se&&ce(Se),se&&ce(se),sa.dispose(),[...ke,...Xe,...Ze,...gt.map(i=>i.marker),...yt.map(i=>i.dot)].forEach(i=>{i.geometry.dispose(),i.material.dispose()}),j.dispose(),He.children.forEach(i=>i.geometry.dispose()),Jt.dispose(),B.dispose(),St.dispose(),Je.dispose(),Ye.dispose(),$e.dispose(),bt.dispose(),ia.dispose(),aa.dispose(),Le.dispose(),ta.dispose(),R.dispose(),y.remove(),s.current=null}},[]);const mt=Na(I),ui=Ss.find(r=>r[0]===d),we=(r,A=!1)=>{var H;A||dt(""),o(!1),l(!1),v(r),(H=s.current)==null||H.resetLook()},qt=r=>{var A;dt(r),Ja(H=>H+1),Nt(0),o(!1),X(!0),r?(w(ye[r].layer),we(lt.find(H=>H.name===ye[r].stop).step/Pt,!0),(A=e.current)==null||A.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"center"})):w("all")};return n.jsxs("section",{className:"hospital-experience",children:[n.jsxs("div",{className:"hospital-heading",children:[n.jsxs("div",{children:[n.jsx("span",{className:"hospital-kicker",children:"ULTIMA MILLA / INFRAESTRUCTURA VIVA"}),n.jsx("h1",{children:"Sistemas integrales por SECTOR"}),n.jsx("p",{children:"Un hospital desde adentro. Descubrí la infraestructura detrás de cada operación."})]}),n.jsxs("span",{className:"hospital-badge",children:["01 / SALUD",n.jsx("br",{}),"Estudio interactivo"]})]}),n.jsxs("div",{className:`hospital-stage ${De?"is-expanded":""}`,children:[n.jsx("div",{className:`hospital-canvas ${u?"is-exploring":""}`,ref:e}),!p&&!f?n.jsx("div",{className:"hospital-loading",role:"status",children:"Preparando arquitectura y sistemas…"}):null,f?n.jsx("div",{className:"hospital-loading",role:"alert",children:f}):null,n.jsxs("div",{className:"hospital-location","aria-live":"polite",children:[n.jsx("span",{children:u?"Exploración libre":Y?ye[Y].title:mt.name}),n.jsx("p",{children:Z?`${Z.id} · ${Z.name} · DEMO`:Y?`${We+1}/3 · ${ye[Y].steps[We]}`:mt.description})]}),D?n.jsx("p",{className:"measure-chip",role:"status","aria-live":"polite",children:pe||"Clic en dos puntos para medir"}):null,n.jsxs("div",{className:"um-ar-status",children:[n.jsxs("button",{"aria-pressed":ue,onClick:()=>oi(r=>!r),children:["◎ Lentes AR ",ue?"activados":"desactivados"]}),n.jsx("span",{children:u?pt==="orbit"?"Orbitar: arrastre · Zoom: rueda · Esc libera el cursor":"Entrar: WASD · Altura: Q/E · Mirar: arrastre · Rueda: avanzar · Esc libera el cursor":Z?"Inspector fijado · datos DEMO":ue?Vt?"Apuntá o tocá una etiqueta para ver su servicio":"Mové la cámara y detenete para detectar sistemas":"Tocá la escena para tomar el control · Rueda con zoom una vez adentro · Esc para soltar."})]}),!Z&&ue?n.jsx(rs,{labels:ii,settled:Vt,hover:ri,time:Wt,active:Ae,onHover:ut,onSelect:r=>{Ve(r),l(!1)}}):null,n.jsxs("div",{className:"hospital-actions",children:[n.jsx("button",{disabled:!p,"aria-pressed":u,onClick:()=>{o(!u),l(!1)},children:u?"Salir de Explorar · Esc":"Explorar 3D"}),n.jsx("button",{disabled:!p,"aria-pressed":S,onClick:()=>{o(!1),I>.99&&we(0),l(!S)},children:S?"Pausar":"Recorrido automático"}),n.jsx("div",{role:"group","aria-label":"Representación",children:[["building","Edificio"],["skeleton","Esqueleto"],["systems","Sólo sistemas"]].map(([r,A])=>n.jsx("button",{"aria-pressed":Ft===r,onClick:()=>Ka(r),children:A},r))}),n.jsx("button",{disabled:!p,"aria-label":"Volver a la vista general",onClick:()=>we(0),children:"Vista general ↗"}),n.jsx("button",{"aria-pressed":D,onClick:()=>{var r;ie(A=>!A),(r=Gt.current)==null||r.reset(),Fe("")},children:"Medir"}),n.jsxs("select",{"aria-label":"Modo de navegación",value:pt,onChange:r=>{Qa(r.target.value),o(!0),l(!1),dt("")},children:[n.jsx("option",{value:"orbit",children:"Orbitar / desplazar"}),n.jsx("option",{value:"walk",children:"Entrar / caminar"})]}),n.jsx("button",{"aria-pressed":De,onClick:()=>ei(r=>!r),children:De?"Reducir visor":"Ampliar visor"})]}),Z?n.jsx(os,{asset:Z,time:Wt,active:Ae,onClose:()=>Ve(null),onToggle:()=>ti(r=>!r)}):null]}),u?n.jsxs("div",{className:"hospital-free-controls","aria-label":"Desplazamiento libre",children:[[["← Izquierda",-.5,0,0],["Adelante",0,0,-.5],["Atrás",0,0,.5],["Derecha →",.5,0,0],["Subir",0,.4,0],["Bajar",0,-.4,0]].map(([r,A,H,Q])=>n.jsx("button",{"aria-label":r,onClick:()=>{var R;return(R=s.current)==null?void 0:R.nudge(A,H,Q)},children:r},r)),n.jsx("span",{children:"Inspección libre con roce suave en muros. Elegí una ubicación para reorientarte."})]}):null,n.jsxs("div",{className:"hospital-controlbar",children:[n.jsxs("label",{children:["Recorrido ",n.jsx("input",{"aria-label":"Avance del recorrido",type:"range",min:"0",max:"1000",value:Math.round(I*1e3),onChange:r=>we(Number(r.target.value)/1e3)})]}),n.jsx("div",{className:"hospital-stops",children:lt.map(r=>n.jsx("button",{"aria-pressed":mt.name===r.name,disabled:!p,onClick:()=>we(r.step/Pt),children:r.name},r.name))})]}),n.jsx(ls,{sector:"hospital",disabled:!p,onSelect:r=>{var A;l(!1),o(!1),w(r.system),Ve(r),(A=s.current)==null||A.focus(r)}}),n.jsxs("div",{className:"hospital-demo-panel",children:[n.jsxs("div",{children:[n.jsx("span",{className:"hospital-kicker",children:"PROBÁ UN SERVICIO · DEMO"}),n.jsx("p",{children:"Del dispositivo al evento en supervisión."})]}),n.jsxs("div",{className:"hospital-demo-buttons",children:[Object.entries(ye).map(([r,A])=>n.jsx("button",{disabled:!Bt,"aria-pressed":Y===r,onClick:()=>qt(r),children:A.label},r)),Y?n.jsx("button",{onClick:()=>qt(""),children:"Finalizar demo"}):null]}),n.jsxs("div",{className:"hospital-demo-status",role:"status",children:[n.jsx("strong",{children:Y?ye[Y].title:"Seis recorridos funcionales"}),n.jsx("span",{children:Y?`${We+1}/3 · ${ye[Y].steps[We]}`:"Seleccioná una prueba para seguir una conexión. Sin equipos reales conectados."})]})]}),n.jsxs("div",{className:"hospital-asset-panel",children:[n.jsxs("div",{children:[n.jsx("span",{className:"hospital-kicker",children:"ACTIVOS / OPERACIÓN DEMO"}),n.jsx("h2",{children:"Del detalle al servicio."}),n.jsx("p",{children:"Inspeccioná cada equipo y probá el circuito de soporte. Todo sucede en esta sesión, sin sistemas externos."}),n.jsxs("label",{children:["Activo ",n.jsx("select",{value:Ce,onChange:r=>li(r.target.value),children:Ba.map(r=>n.jsxs("option",{value:r.id,children:[r.id," · ",r.name]},r.id))})]})]}),n.jsxs("div",{children:[n.jsx("h3",{children:Te.name}),n.jsx("p",{children:Te.detail}),n.jsx("p",{className:"hospital-asset-route",children:Te.route}),n.jsx("button",{disabled:!Bt,onClick:()=>{var r;we(lt.find(A=>A.name===Te.stop).step/Pt),w(Te.layer),X(!0),(r=e.current)==null||r.scrollIntoView({block:"center",behavior:"smooth"})},children:"Ver equipo en 3D ↗"}),n.jsxs("div",{className:"hospital-incident",role:"status",children:[n.jsx("strong",{children:["Disponible · DEMO","Incidencia abierta · DEMO","En atención · DEMO","Resuelta · DEMO"][Ie]}),n.jsx("p",{children:["Creá una incidencia de prueba sobre este activo.","Se registró la solicitud en la sesión local.","Diagnóstico y atención simulados.","Cierre ilustrativo. No se ha intervenido ningún equipo."][Ie]}),n.jsx("button",{"aria-label":["Crear incidencia DEMO","Iniciar atención DEMO","Resolver DEMO","Reiniciar prueba"][Ie],onClick:()=>di(r=>({...r,[Ce]:(Ie+1)%4})),children:["Crear incidencia DEMO","Iniciar atención DEMO","Resolver DEMO","Reiniciar prueba"][Ie]})]}),Ce==="TEST-01"?n.jsxs("div",{children:[n.jsx("button",{"aria-pressed":ft,onClick:()=>pi(r=>!r),children:ft?"Limpiar registro":"Generar registro de prueba DEMO"}),ft?n.jsx("p",{role:"status",children:"TEST-01 · Enlace ilustrativo · Continuidad: SIMULADA · Resultado: DEMO, sin mediciones ni validez de certificación."}):null]}):null]})]}),n.jsxs("div",{className:"hospital-systems",children:[n.jsxs("div",{children:[n.jsx("span",{className:"hospital-kicker",children:"SEGUÍ UN SISTEMA"}),n.jsxs("h2",{children:["Lo que no se ve.",n.jsx("br",{})," Lo que no puede fallar."]})]}),n.jsx("div",{children:n.jsx("p",{"aria-live":"polite",children:ui[2]})})]}),n.jsx("p",{className:"hospital-disclaimer",children:"Esquema conceptual creado en Blender. No representa un hospital real ni un proyecto aprobado. Equipos médicos como contexto; pantallas DEMO con señales sintéticas, sin datos clínicos ni conexión al SGI. Recorrido guiado e inspección libre 360° con roce suave en muros; no es un simulador de circulación clínica. Incidencias y registros son pruebas locales sin persistencia."})]})}export{Ls as default};
