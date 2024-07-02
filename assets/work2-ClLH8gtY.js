var it=(i,e,s)=>{if(!e.has(i))throw TypeError("Cannot "+s)};var n=(i,e,s)=>(it(i,e,"read from private field"),s?s.call(i):e.get(i)),h=(i,e,s)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,s)},P=(i,e,s,t)=>(it(i,e,"write to private field"),t?t.call(i,s):e.set(i,s),s);var dt=(i,e,s,t)=>({set _(o){P(i,e,o,s)},get _(){return n(i,e,t)}}),d=(i,e,s)=>(it(i,e,"access private method"),s);import"./modulepreload-polyfill-B5Qt9EMX.js";import{G as At}from"./lil-gui.esm-DNkUmkFf.js";import{f as Y,m as G,c as K,t as nt,a as rt,s as yt,b as It}from"./vec4-DVpAb33O.js";import{f as m,c as at,a as Ct,s as St}from"./vec3-DxJeS3HW.js";import{f as Bt}from"./vec2-AJwhbUHB.js";class Pt{get vector(){return this.v.map(e=>Y(...e,1))}constructor(){this.v=[],this.color=[],this.textureCoords=[],this.normal=[]}setVertex(e,s){this.v[e]=s}setNormal(e,s){this.normal[e]=s}getColor(){return this.color[0]}setColor(e,s,t,o){if(s<0||s>255||t<0||t>255||o<0||o>255)throw new Error("Invalid color values");this.color[e]=m(s,t,o)}setTextureCoord(e,s,t){this.textureCoords[e]=Bt(s,t)}}var N,k,H,L,U,J,D,F,V,b,y,I,st,ft,et,ot,wt,O,ct,Q,lt,W,ht,z,Z,T,_;class Dt{constructor({width:e,height:s}){h(this,ot);h(this,O);h(this,Q);h(this,W);h(this,z);h(this,T);h(this,N,void 0);h(this,k,void 0);h(this,H,void 0);h(this,L,new Map);h(this,U,new Map);h(this,J,new Map);h(this,D,[]);h(this,F,[]);h(this,V,[]);h(this,b,[]);h(this,y,void 0);h(this,I,void 0);h(this,st,0);h(this,ft,!1);h(this,et,[new Float32Array([.25,.25]),new Float32Array([.75,.25]),new Float32Array([.25,.75]),new Float32Array([.75,.75])]);const t=e*s;P(this,y,e),P(this,I,s),n(this,D).length=t,n(this,F).length=t,n(this,V).length=t*4,n(this,b).length=t*4}get framebuffers(){return n(this,D)}loadPositions(e){const s=d(this,T,_).call(this);return n(this,L).set(s,e),s}loadIndices(e){const s=d(this,T,_).call(this);return n(this,U).set(s,e),s}loadColors(e){const s=d(this,T,_).call(this);return n(this,J).set(s,e),s}setModel(e){P(this,N,e)}setView(e){P(this,k,e)}setProjection(e){P(this,H,e)}setPixel(e,s){const[t,o]=e;if(t>=0&&t<=n(this,y)&&o>=0&&o<=n(this,I)){const a=d(this,W,ht).call(this,t,o);n(this,D)[a]=s}}setDepthBuffer(e,s){const[t,o]=e,a=d(this,W,ht).call(this,t,o);if(n(this,F)[a]>s)return n(this,F)[a]=s,!0}setSamplePixel(e,s){const[t,o]=e;if(t>=0&&t<=n(this,y)*2&&o>=0&&o<=n(this,I)*2){const a=d(this,z,Z).call(this,t,o);n(this,V)[a]=s}}setSampleDepthBuffer(e,s){const[t,o]=e,a=d(this,z,Z).call(this,t,o);if(n(this,b)[a]>s)return n(this,b)[a]=s,!0}clear({colorBuffer:e=!1,depthBuffer:s=!1}){e&&(n(this,D).fill(at()),n(this,V).fill(at())),s&&(n(this,F).fill(1/0),n(this,b).fill(1/0))}draw(e,s,t,o){const a=n(this,L).get(e),l=n(this,U).get(s),c=n(this,J).get(t),f=(50-.1)/2,M=(50+.1)/2,g=G(K(),n(this,H),G(K(),n(this,k),n(this,N)));for(const p of l){const w=new Pt,x=[nt(rt(),Y(...a[p[0]],1),g),nt(rt(),Y(...a[p[1]],1),g),nt(rt(),Y(...a[p[2]],1),g)];for(const r of x)r[3]!==1&&r[3]!==0&&yt(r,r,1/r[3]);for(const r of x)r[0]=(1-r[0])*n(this,y)/2,r[1]=(1-r[1])*n(this,I)/2,r[2]=r[2]*f+M;for(let r=0;r<3;r++)w.setVertex(r,m(...x[r].slice(0,3)));w.setColor(0,...c[p[0]]),w.setColor(1,...c[p[1]]),w.setColor(2,...c[p[2]]),d(this,ot,wt).call(this,w,o)}}}N=new WeakMap,k=new WeakMap,H=new WeakMap,L=new WeakMap,U=new WeakMap,J=new WeakMap,D=new WeakMap,F=new WeakMap,V=new WeakMap,b=new WeakMap,y=new WeakMap,I=new WeakMap,st=new WeakMap,ft=new WeakMap,et=new WeakMap,ot=new WeakSet,wt=function(e,s){const t=e.vector,o=t[0][0],a=t[1][0],l=t[2][0],c=t[0][1],f=t[1][1],M=t[2][1],g=Math.floor(Math.max(Math.min(o,a,l),0)),p=Math.ceil(Math.min(Math.max(o,a,l),n(this,y))),w=Math.floor(Math.max(Math.min(c,f,M),0)),x=Math.ceil(Math.min(Math.max(c,f,M),n(this,I)));for(let r=g;r<p;r++)for(let u=w;u<x;u++){let E=!1;if(s){for(const[B,C]of n(this,et).entries())if(d(this,Q,lt).call(this,r+C[0],u+C[1],t)){const[A,$,R]=d(this,O,ct).call(this,r+C[0],u+C[1],e.v),X=1/(A/t[0][3]+$/t[1][3]+R/t[2][3]);let mt=A*t[0][2]/t[0][3]+$*t[1][2]/t[1][3]+R*t[2][2]/t[2][3];mt*=X;const pt=[r*2+B%2,u*2+~~(B/2)];this.setSampleDepthBuffer(pt,mt)&&(this.setSamplePixel(pt,e.getColor()),E=!0)}if(E){const B=[r,u],C=[new Float32Array([r*2,u*2]),new Float32Array([r*2+1,u*2]),new Float32Array([r*2,u*2+1]),new Float32Array([r*2+1,u*2+1])];let A=at();for(const $ of C)Ct(A,A,n(this,V)[d(this,z,Z).call(this,...$)]);St(A,A,1/4),this.setPixel(B,A)}}else if(d(this,Q,lt).call(this,r+.5,u+.5,t)){const[B,C,A]=d(this,O,ct).call(this,r+.5,u+.5,e.v),$=1/(B/t[0][3]+C/t[1][3]+A/t[2][3]);let R=B*t[0][2]/t[0][3]+C*t[1][2]/t[1][3]+A*t[2][2]/t[2][3];R*=$;const X=[r,u];this.setDepthBuffer(X,R)&&this.setPixel(X,e.getColor())}}},O=new WeakSet,ct=function(e,s,t){const o=(e*(t[1][1]-t[2][1])+(t[2][0]-t[1][0])*s+t[1][0]*t[2][1]-t[2][0]*t[1][1])/(t[0][0]*(t[1][1]-t[2][1])+(t[2][0]-t[1][0])*t[0][1]+t[1][0]*t[2][1]-t[2][0]*t[1][1]),a=(e*(t[2][1]-t[0][1])+(t[0][0]-t[2][0])*s+t[2][0]*t[0][1]-t[0][0]*t[2][1])/(t[1][0]*(t[2][1]-t[0][1])+(t[0][0]-t[2][0])*t[1][1]+t[2][0]*t[0][1]-t[0][0]*t[2][1]),l=(e*(t[0][1]-t[1][1])+(t[1][0]-t[0][0])*s+t[0][0]*t[1][1]-t[1][0]*t[0][1])/(t[2][0]*(t[0][1]-t[1][1])+(t[1][0]-t[0][0])*t[2][1]+t[0][0]*t[1][1]-t[1][0]*t[0][1]);return[o,a,l]},Q=new WeakSet,lt=function(e,s,t){function o(p,w,x,r,u,E){return(p-u)*(r-E)-(x-u)*(w-E)}const[a,l,c]=t,f=o(e,s,a[0],a[1],l[0],l[1]),M=o(e,s,l[0],l[1],c[0],c[1]),g=o(e,s,c[0],c[1],a[0],a[1]);return f>0&&M>0&&g>0||f<0&&M<0&&g<0},W=new WeakSet,ht=function(e,s){return n(this,y)*Math.floor(n(this,I)-1-s)+Math.floor(e)},z=new WeakSet,Z=function(e,s){return n(this,y)*2*Math.floor(n(this,I)*2-1-s)+Math.floor(e)},T=new WeakSet,_=function(){return dt(this,st)._++};function q(i,e,s,t,o,a,l,c,f,M,g,p,w,x,r,u){return It(i,o,f,w,e,a,M,x,s,l,g,r,t,c,p,u)}const ut=document.querySelector("#canvas-el"),Mt=ut.getContext("2d"),gt=ut.getAttribute("width"),xt=ut.getAttribute("height"),S=new Dt({width:gt,height:xt});function Ft(i,e){e=e/180*Math.PI;let[s,t,o]=i;const a=Math.cos(e),l=Math.sin(e),c=1-a,f=Math.sqrt(s*s+t*t+o*o);return s/=f,t/=f,o/=f,new q(c*s*s+a,c*s*t-l*o,c*s*o+l*t,0,c*s*t+l*o,c*t*t+a,c*t*o-l*s,0,c*s*o-l*t,c*t*o+l*s,c*o*o+a,0,0,0,0,1)}function Vt(i){let e=K();const s=new q(1,0,0,-i[0],0,1,0,-i[1],0,0,1,-i[2],0,0,0,1);return G(e,e,s),e}function bt(i,e,s,t){s=-s,t=-t;let o=K();const a=i/180/2*Math.PI,l=s*Math.tan(a),c=l*e,f=-c,M=-l,g=new q(s,0,0,0,0,s,0,0,0,0,s+t,-s*t,0,0,1,0),p=new q(2/(c-f),0,0,0,0,2/(l-M),0,0,0,0,2/(t-s),0,0,0,0,1),w=new q(1,0,0,-(f+c)/2,0,1,0,-(M+l)/2,0,0,1,-(s+t)/2,0,0,0,1),x=G(K(),p,w);return G(o,x,g),o}function v(i=0,e=!1){const s=m(0,0,5),t=[m(2,0,-2),m(0,2,-2),m(-2,0,-2),m(3.5,-1,-5),m(2.5,1.5,-5),m(-1,.5,-5)],o=[m(0,1,2),m(3,4,5)],a=[m(217,238,185),m(217,238,185),m(217,238,185),m(185,217,238),m(185,217,238),m(185,217,238)],l=S.loadPositions(t),c=S.loadIndices(o),f=S.loadColors(a);S.clear({colorBuffer:!0,depthBuffer:!0}),S.setModel(Ft(m(0,0,1),i)),S.setView(Vt(s)),S.setProjection(bt(45,1,.1,50)),S.draw(l,c,f,e),$t(S.framebuffers)}function $t(i){const e=i.length,s=Mt.createImageData(gt,xt);for(var t=0;t<e;t++){var o=t*4;s.data[o]=i[t][0],s.data[o+1]=i[t][1],s.data[o+2]=i[t][2],s.data[o+3]=255}Mt.putImageData(s,0,0)}let j=0;const jt=new At,tt={MSAA:!1};jt.add(tt,"MSAA").onChange(i=>{v(j,i)});window.addEventListener("keypress",function(i){i.code==="KeyA"&&(j-=1,v(j,tt.MSAA)),i.code==="KeyD"&&(j+=1,v(j,tt.MSAA))});v(j,tt.MSAA);