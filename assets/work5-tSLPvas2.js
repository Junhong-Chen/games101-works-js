var X=(i,t,e)=>{if(!t.has(i))throw TypeError("Cannot "+e)};var w=(i,t,e)=>(X(i,t,"read from private field"),e?e.call(i):t.get(i)),L=(i,t,e)=>{if(t.has(i))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(i):t.set(i,e)};import"./modulepreload-polyfill-B5Qt9EMX.js";import{f as m,b as v,c as r,e as d,n as C,g as q,h as Z,s as p,a as y,i as H,m as tt,j as et}from"./vec3-DxJeS3HW.js";import{f as O}from"./vec2-AJwhbUHB.js";const E={DIFFUSE_AND_GLOSSY:0,REFLECTION_AND_REFRACTION:1,REFLECTION:2};class G{constructor({materialType:t=E.DIFFUSE_AND_GLOSSY,ior:e=1.3,kd:s=.8,ks:o=.2,diffuseColor:n=m(.2,.2,.2),specularExponent:c=25}){this.materialType=t,this.ior=e,this.kd=s,this.ks=o,this.diffuseColor=n,this.specularExponent=c}intersect(){}getSurfaceProperties(){}evalDiffuseColor(){return this.diffuseColor}}class U{constructor({position:t,intensity:e}){this.position=t,this.intensity=e}}var T,b,k;class st{constructor({width:t=1280,height:e=720,fov:s=90,backgroundColor:o=m(.235294,.67451,.843137)}){L(this,T,[]);L(this,b,[]);L(this,k,5);this.width=t,this.height=e,this.fov=s,this.backgroundColor=o}get objects(){return w(this,T)}get lights(){return w(this,b)}get maxDepth(){return w(this,k)}add(t){t instanceof G?w(this,T).push(t):t instanceof U&&w(this,b).push(t)}}T=new WeakMap,b=new WeakMap,k=new WeakMap;function nt(i,t,e){const s=t*t-4*i*e;let o,n;if(s<0)return!1;if(s===0)o=n=-.5*t/i;else{const c=t>0?-.5*(t+Math.sqrt(s)):-.5*(t-Math.sqrt(s));o=c/i,n=e/c}return o>n&&([o,n]=[n,o]),{x0:o,x1:n}}class J extends G{constructor({center:t,radius:e}){super(arguments[0]),this.center=t,this.radius=e,this.radius2=e*e}intersect(t,e,s){const o=v(r(),t,this.center),n=d(e,e),c=d(e,o)*2,a=d(o,o)-this.radius2,f=nt(n,c,a);if(f){const{x0:g,x1:h}=f,u=g<0?h:g;if(u>=0&&u<s)return{tNear:u,hitObj:this}}return!1}getSurfaceProperties({hitPoint:t}){return{normal:C(r(),v(r(),t,this.center))}}}function ot(i,t,e,s,o){const n=v(r(),t,i),c=v(r(),e,i),a=v(r(),s,i),f=q(r(),o,c),g=q(r(),a,n),h=p(r(),m(d(g,c),d(f,a),d(g,o)),1/d(f,n)),[u,l,x]=h;if(u>=0&&l>=0&&x>=0&&l+x<=1)return{tNear:u,u:l,v:x}}class rt extends G{constructor({vertices:t,vertexIndices:e,numTriangles:s,stCoordinates:o}){super(arguments[0]),this.vertices=t,this.vertexIndices=e,this.numTriangles=s,this.stCoordinates=o}intersect(t,e,s){let o=!1;for(let n=0;n<this.numTriangles;n++){const c=n*3,a=this.vertices[this.vertexIndices[c]],f=this.vertices[this.vertexIndices[c+1]],g=this.vertices[this.vertexIndices[c+2]],h=ot(a,f,g,t,e);h&&h.tNear<s&&(o={tNear:h.tNear,uv:O(h.u,h.v),index:n,hitObj:this})}return o}getSurfaceProperties({index:t,uv:e}){const s=t*3,o=this.vertices[this.vertexIndices[s]],n=this.vertices[this.vertexIndices[s+1]],c=this.vertices[this.vertexIndices[s+2]],a=C(r(),v(r(),n,o)),f=C(r(),v(r(),c,n)),g=C(r(),q(r(),a,f)),h=this.stCoordinates[this.vertexIndices[s]],u=this.stCoordinates[this.vertexIndices[s+1]],l=this.stCoordinates[this.vertexIndices[s+2]],x=O(h[0]*(1-e[0]-e[1])+u[0]*e[0]+l[0]*e[1],h[1]*(1-e[0]-e[1])+u[1]*e[0]+l[1]*e[1]);return{normal:g,st:x}}evalDiffuseColor(t){const s=Math.round(t[0]*5%1)^Math.round(t[1]*5%1);return Z(r(),m(.815,.235,.031),m(.937,.937,.231),s)}}const V=1e-5;function $(i){return m(i,i,i)}function K(i,t,e){return Math.max(i,Math.min(t,e))}function it(i){return i*Math.PI/180}function z(i,t){return v(r(),i,p(r(),t,2*d(i,t)))}function ct(i,t,e){let s=K(-1,1,d(i,t)),o=1,n=e,c=et(t);s<0?s=-s:([o,n]=[n,o],H(c,t));const a=o/n,f=1-a*a*(1-s*s);return f<0?r():y(r(),p(r(),i,a),p(r(),c,a*s-Math.sqrt(f)))}function B(i,t,e){let s=K(-1,1,d(i,t)),o=1,n=e;s>0&&([o,n]=[n,o]);const c=o/n*Math.sqrt(Math.max(0,1-s*s));if(c>=1)return 1;{const a=Math.sqrt(Math.max(0,1-c*c));s=Math.abs(s);const f=(n*s-o*a)/(n*s+o*a),g=(o*s-n*a)/(o*s+n*a);return(f*f+g*g)/2}}function Q(i,t,e){let s=1/0,o=null;for(const n of e){const c=n.intersect(i,t,s);c&&c.tNear<s&&(o=c,s=c.tNear)}return o}class at{constructor(t){this.canvasEl=t}render(t){const{width:e,height:s,fov:o}=t,n=new Array(e*s),c=Math.tan(it(o*.5)),a=t.width/t.height,f=r();let g=0;for(let h=0;h<s;h++){for(let u=0;u<e;u++){const l=(2*(u+.5)/e-1)*a*c,x=-(2*(h+.5)/s-1)*c,R=C(r(),m(l,x,-1));n[g++]=this.castRay(f,R,t,0)}this.updateProgress((h+1)/s)}this.draw(t,n)}draw(t,e){const s=this.canvasEl.getContext("2d"),o=e.length,n=s.createImageData(t.width,t.height);for(var c=0;c<o;c++){var a=c*4;n.data[a]=e[c][0]*255,n.data[a+1]=e[c][1]*255,n.data[a+2]=e[c][2]*255,n.data[a+3]=255}s.putImageData(n,0,0)}updateProgress(t){const e=Math.max(0,Math.min(100,t*100));console.info(`%c${e.toFixed(1)}%`,"color:dodgerblue")}castRay(t,e,s,o){if(o>s.maxDepth)return r();let n=s.backgroundColor;const c=Q(t,e,s.objects);if(c){const{tNear:a,index:f,uv:g,hitObj:h}=c,u=y(r(),t,p(r(),e,a)),{normal:l,st:x}=h.getSurfaceProperties({index:f,uv:g,hitPoint:u}),R=y(r(),u,p(r(),l,V)),A=v(r(),u,p(r(),l,V));switch(h.materialType){case E.REFLECTION_AND_REFRACTION:{const S=C(r(),z(e,l)),I=C(r(),ct(e,l,h.ior)),F=d(S,l)<0?A:R,N=d(I,l)<0?A:R,D=this.castRay(F,S,s,o+1),j=this.castRay(N,I,s,o+1),_=B(e,l,h.ior);n=y(r(),p(r(),D,_),p(r(),j,1-_));break}case E.REFLECTION:{const S=B(e,l,h.ior),I=this.reflect(e,l),F=d(I,l)<0?R:A,N=this.castRay(F,I,s,o+1);n=p(r(),N,S);break}case E.DIFFUSE_AND_GLOSSY:default:{let S=r(),I=r();const F=d(e,l)<0?R:A;for(const N of s.lights){const D=v(r(),N.position,u),j=d(D,D);C(D,D);const _=Math.max(0,d(D,l)),P=Q(F,D,s.objects);P&&P.tNear*P.tNear<j||y(S,S,$(N.intensity*_));const W=z(H(r(),D),l);y(I,I,$(Math.pow(Math.max(0,-d(W,e)),h.specularExponent)*N.intensity))}n=y(r(),p(r(),tt(r(),S,h.evalDiffuseColor(x)),h.kd),p(r(),I,h.ks));break}}}return n}}const Y=document.querySelector("#canvas-el"),ht=parseInt(Y.getAttribute("width")),lt=parseInt(Y.getAttribute("height")),M=new st({width:ht,height:lt}),ft=new at(Y),ut=new J({center:m(-1,0,-12),radius:2,diffuseColor:m(.6,.7,.8),materialType:E.DIFFUSE_AND_GLOSSY}),dt=new J({center:m(.5,-.5,-8),radius:1.5,ior:1.5,materialType:E.REFLECTION_AND_REFRACTION});M.add(ut);M.add(dt);const gt=[m(-5,-3,-6),m(5,-3,-6),m(5,-3,-16),m(-5,-3,-16)],mt=[0,1,3,1,2,3],pt=[O(0,0),O(1,0),O(1,1),O(0,1)],vt=new rt({vertices:gt,vertexIndices:mt,numTriangles:2,stCoordinates:pt,materialType:E.DIFFUSE_AND_GLOSSY});M.add(vt);M.add(new U({position:m(-20,70,20),intensity:.5}));M.add(new U({position:m(30,50,-12),intensity:.5}));ft.render(M);