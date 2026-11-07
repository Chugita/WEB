import * as THREE from 'three';
import {palette} from './config/originVisualConfig';
import matterVertex from './shaders/matter.vert.glsl?raw';
import matterFragment from './shaders/matter.frag.glsl?raw';
// Bounded dynamic triangle strips: width survives WebGL's one-pixel line limit.
export class ElectromagneticTrail{
 group=new THREE.Group();emitted=0;
 private fragmentGeometry=new THREE.SphereGeometry(1,28,20);
 private fragmentMaterial:THREE.ShaderMaterial;
 private fragments:{mesh:THREE.Mesh;birth:number;radius:number;vx:number;vy:number;origin:THREE.Vector3}[]=[];
 private fragmentIndex=0;private lastFragment=-10;
 private samples:{p:THREE.Vector3;t:number}[]=[];
 private strips:THREE.Mesh[]=[];private intensity=0;private count=72;
 private curve=new THREE.CatmullRomCurve3();private p=new THREE.Vector3();private tangent=new THREE.Vector3();
 setIntensity(value:number){this.intensity=value;}
 get pointCount(){return this.samples.length;}
 constructor(){
  this.fragmentMaterial=new THREE.ShaderMaterial({vertexShader:matterVertex,fragmentShader:matterFragment,transparent:true,depthWrite:false,uniforms:{
   uTime:{value:0},uMorph:{value:0},uPressure:{value:0},uReleaseAge:{value:10},uContact:{value:new THREE.Vector3()},uImpulses:{value:Array.from({length:3},()=>new THREE.Vector4())},uImpulseAges:{value:[10,10,10]},
   uLavender:{value:new THREE.Color(palette.lavender)},uMauve:{value:new THREE.Color(palette.mauve)},uChampagne:{value:new THREE.Color(palette.champagne)},uPearl:{value:new THREE.Color(palette.pearl)},uIce:{value:new THREE.Color(palette.ice)},uCore:{value:new THREE.Color(palette.core)}
  }});
  for(let i=0;i<12;i++){const mesh=new THREE.Mesh(this.fragmentGeometry,this.fragmentMaterial);mesh.visible=false;mesh.frustumCulled=false;mesh.renderOrder=11;this.group.add(mesh);this.fragments.push({mesh,birth:-10,radius:0,vx:0,vy:0,origin:new THREE.Vector3()});}
  for(let layer=0;layer<3;layer++){
  const g=new THREE.BufferGeometry(),n=this.count;
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*6),3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(n*4),2));
  g.setAttribute('aFade',new THREE.BufferAttribute(new Float32Array(n*2),1).setUsage(THREE.DynamicDrawUsage));
  const idx=[];for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}g.setIndex(idx);
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,side:THREE.DoubleSide,uniforms:{uIntensity:{value:0}},
   vertexShader:'attribute float aFade;varying vec2 vUv;varying float vFade;void main(){vUv=uv;vFade=aFade;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'varying vec2 vUv;varying float vFade;uniform float uIntensity;void main(){float edge=pow(max(0.,1.-abs(vUv.y*2.-1.)),1.7);float membrane=.55+.45*sin(vUv.x*23.+vUv.y*6.);vec3 color=mix(vec3(.62,.48,.8),vec3(.96,.77,.6),vUv.y);float alpha=edge*vFade*(.18+uIntensity*.24)*membrane;gl_FragColor=vec4(color,alpha);}'
  });const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=10;mesh.visible=false;this.group.add(mesh);this.strips.push(mesh);
 }}
 add(p:THREE.Vector3,t:number){
  let last=this.samples.at(-1);if(last&&last.p.distanceToSquared(p)<.0001)return;
  if(last&&last.p.distanceTo(p)>1.8){this.samples.length=0;last=undefined;}
  if(last&&t-this.lastFragment>.045){
   const dx=p.x-last.p.x,dy=p.y-last.p.y,len=Math.hypot(dx,dy)||1;
   const f=this.fragments[this.fragmentIndex++%this.fragments.length],side=this.fragmentIndex%2?1:-1;
   f.origin.copy(last.p);f.birth=t;f.radius=.035+this.intensity*.035+(this.fragmentIndex%3)*.008;
   f.vx=-dy/len*side*.14-dx/len*.09;f.vy=dx/len*side*.14-dy/len*.09;
   f.mesh.rotation.set(this.fragmentIndex*.7,this.fragmentIndex*.4,0);this.lastFragment=t;
  }
  this.samples.push({p:p.clone(),t});this.emitted++;if(this.samples.length>28)this.samples.shift();
  let length=0;for(let i=this.samples.length-1;i>0;i--){length+=this.samples[i].p.distanceTo(this.samples[i-1].p);if(length>.85+this.intensity*.25){this.samples.splice(0,i);break;}}
 }
 update(time:number,reduced:boolean){const life=.24+this.intensity*.14;
  this.fragmentMaterial.uniforms.uTime.value=time;
  for(const f of this.fragments){const age=(time-f.birth)/.45;f.mesh.visible=age>=0&&age<1&&!reduced;if(f.mesh.visible){f.mesh.position.copy(f.origin);f.mesh.position.x+=f.vx*age;f.mesh.position.y+=f.vy*age;f.mesh.scale.setScalar(f.radius*Math.pow(1-age,1.1));}}
 while(this.samples.length&&time-this.samples[0].t>life)this.samples.shift();
  const active=this.samples.length>1&&!reduced;this.strips.forEach(s=>s.visible=active);if(!active)return;
  this.curve.points=this.samples.map(s=>s.p);const first=this.samples[0].t,last=this.samples.at(-1)!.t;
  for(let layer=0;layer<3;layer++){
   const mesh=this.strips[layer],g=mesh.geometry,pos=g.getAttribute('position') as THREE.BufferAttribute,uv=g.getAttribute('uv') as THREE.BufferAttribute,fade=g.getAttribute('aFade') as THREE.BufferAttribute;
   for(let i=0;i<this.count;i++){
    const u=i/(this.count-1);this.curve.getPoint(u,this.p);this.curve.getTangent(u,this.tangent);
    const age=Math.max(0,1-(time-(first+(last-first)*u))/life);
    const width=(.075+this.intensity*.065)*(layer===0?1:.38)*Math.pow(age,.6)*Math.pow(Math.sin(Math.PI*u),.4)*(1.+Math.sin(u*19.+layer)*.2);
    const offset=layer===0?0:Math.sin(u*9.+layer*2.)*.09*(.3+this.intensity)*Math.sin(u*Math.PI);
    const len=Math.hypot(this.tangent.x,this.tangent.y)||1,nx=-this.tangent.y/len,ny=this.tangent.x/len;
    for(let side=0;side<2;side++){const v=i*2+side,w=(side*2-1)*width+offset;pos.setXYZ(v,this.p.x+nx*w,this.p.y+ny*w,this.p.z+layer*.001);uv.setXY(v,u,side);fade.setX(v,age*age*(layer===0?1:this.intensity*.5));}
   }pos.needsUpdate=true;uv.needsUpdate=true;fade.needsUpdate=true;(mesh.material as THREE.ShaderMaterial).uniforms.uIntensity.value=this.intensity;
  }
 }
 clear(){this.samples.length=0;for(const f of this.fragments){f.birth=-10;f.mesh.visible=false;}this.strips.forEach(s=>s.visible=false);}
 dispose(){this.fragmentGeometry.dispose();this.fragmentMaterial.dispose();for(const s of this.strips){s.geometry.dispose();(s.material as THREE.Material).dispose();}this.samples.length=0;}
}
