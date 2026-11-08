import * as THREE from 'three';
import {palette} from './config/originVisualConfig';
import matterVertex from './shaders/matter.vert.glsl?raw';
import matterFragment from './shaders/matter.frag.glsl?raw';
// Bounded dynamic triangle strips: width survives WebGL's one-pixel line limit.
export class ElectromagneticTrail{
 group=new THREE.Group();emitted=0;cuts=0;
 private fragmentGeometry=new THREE.SphereGeometry(1,28,20);
 private fragmentMaterial:THREE.ShaderMaterial;
 private fragments:{mesh:THREE.Mesh;birth:number;radius:number;vx:number;vy:number;origin:THREE.Vector3}[]=[];
 private fragmentIndex=0;
 private bridge:THREE.Mesh;private bridgeMaterial:THREE.ShaderMaterial;
 private anchor=new THREE.Vector3();private tip=new THREE.Vector3();private wantedTip=new THREE.Vector3();
 private attached=false;private cutAt=-10;private lastPointer=-10;private lastTime=0;private speed=0;
 private bridgeRings=32;private bridgeSides=8;
 get isAttached(){return this.attached;}
 get stretch(){return this.anchor.distanceTo(this.wantedTip);}
 get activeFragments(){return this.fragments.filter(f=>f.mesh.visible).length;}
 setSurfaceContact(point:THREE.Vector3,time:number){
  this.anchor.copy(point);this.anchor.z=2.31;this.tip.copy(this.anchor);this.wantedTip.copy(this.anchor);
  this.attached=true;this.cutAt=-10;this.lastPointer=time;
 }
 private cut(time:number){
  if(!this.attached)return;this.cuts++;this.attached=false;this.cutAt=time;
  for(let i=0;i<2;i++){
   const f=this.fragments[this.fragmentIndex++%this.fragments.length];
   f.origin.lerpVectors(this.anchor,this.tip,i===0?.66:1);f.birth=time;f.radius=i===0?.075:.10;
   const dx=this.tip.x-this.anchor.x,dy=this.tip.y-this.anchor.y,len=Math.hypot(dx,dy)||1;
   f.vx=dx/len*.14-dy/len*(i===0?.10:-.10);f.vy=dy/len*.14+dx/len*(i===0?.10:-.10);
   f.mesh.rotation.set(i*.7,this.fragmentIndex*.4,0);
  }
 }
 private updateBridge(time:number,reduced:boolean){
  const dt=Math.min(.04,Math.max(0,time-this.lastTime));this.lastTime=time;
  this.tip.lerp(this.wantedTip,1-Math.exp(-dt*23));
  if(this.attached&&(this.anchor.distanceTo(this.tip)>1.08||(time-this.lastPointer>.65&&this.stretch>.12)))this.cut(time);
  const retract=this.attached?1:Math.max(0,1-(time-this.cutAt)/.18);
  const length=this.anchor.distanceTo(this.tip);
  this.bridge.visible=!reduced&&length>.025&&retract>0;if(!this.bridge.visible)return;
  const g=this.bridge.geometry,pos=g.getAttribute('position') as THREE.BufferAttribute,uv=g.getAttribute('uv') as THREE.BufferAttribute;
  const dx=this.tip.x-this.anchor.x,dy=this.tip.y-this.anchor.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  const tension=Math.min(1,length/1.08);
  for(let ring=0;ring<=this.bridgeRings;ring++){
   const u=ring/this.bridgeRings,v=u*retract;
   const sag=Math.sin(v*Math.PI)*length*.10;
   const x=this.anchor.x+dx*v+nx*sag,y=this.anchor.y+dy*v+ny*sag;
   const neck=1-tension*.82*Math.exp(-Math.pow((u-.68)/.25,2));
   const radius=(.095*(1-u)+.045*u)*neck*Math.pow(retract,.5);
   for(let side=0;side<=this.bridgeSides;side++){
    const a=side/this.bridgeSides*Math.PI*2,i=ring*(this.bridgeSides+1)+side;
    pos.setXYZ(i,x+nx*Math.cos(a)*radius,y+ny*Math.cos(a)*radius,2.31+Math.sin(a)*radius);
    uv.setXY(i,u,side/this.bridgeSides);
   }
  }pos.needsUpdate=true;uv.needsUpdate=true;g.computeVertexNormals();
 }
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
  for(let i=0;i<2;i++){const mesh=new THREE.Mesh(this.fragmentGeometry,this.fragmentMaterial);mesh.visible=false;mesh.frustumCulled=false;mesh.renderOrder=11;this.group.add(mesh);this.fragments.push({mesh,birth:-10,radius:0,vx:0,vy:0,origin:new THREE.Vector3()});}
  const bg=new THREE.BufferGeometry(),vertices=(this.bridgeRings+1)*(this.bridgeSides+1);
  bg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(vertices*3),3).setUsage(THREE.DynamicDrawUsage));
  bg.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(vertices*2),2));
  const bi:number[]=[];for(let r=0;r<this.bridgeRings;r++)for(let j=0;j<this.bridgeSides;j++){const a=r*(this.bridgeSides+1)+j,b=a+this.bridgeSides+1;bi.push(a,b,a+1,b,b+1,a+1);}bg.setIndex(bi);bg.computeVertexNormals();
  this.bridgeMaterial=new THREE.ShaderMaterial({uniforms:this.fragmentMaterial.uniforms,fragmentShader:matterFragment,vertexShader:
   'varying vec3 vPosition,vWorld,vNormal,vView;varying float vDensity;void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vPosition=vec3((uv.x-.5)*1.4,(uv.y-.5)*1.3,.4);vNormal=normalize(mat3(modelMatrix)*normal);vView=cameraPosition-world.xyz;vDensity=.5;gl_Position=projectionMatrix*viewMatrix*world;}',side:THREE.DoubleSide,transparent:true,depthWrite:false});
  this.bridge=new THREE.Mesh(bg,this.bridgeMaterial);this.bridge.frustumCulled=false;this.bridge.visible=false;this.bridge.renderOrder=10;this.group.add(this.bridge);
  for(let layer=0;layer<3;layer++){
  const g=new THREE.BufferGeometry(),n=this.count;
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*6),3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(n*4),2));
  g.setAttribute('aFade',new THREE.BufferAttribute(new Float32Array(n*2),1).setUsage(THREE.DynamicDrawUsage));
  const idx=[];for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}g.setIndex(idx);
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,side:THREE.DoubleSide,uniforms:{uIntensity:{value:0}},
   vertexShader:'attribute float aFade;varying vec2 vUv;varying float vFade;void main(){vUv=uv;vFade=aFade;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'varying vec2 vUv;varying float vFade;uniform float uIntensity;void main(){float edge=pow(max(0.,1.-abs(vUv.y*2.-1.)),.8);float membrane=.7+.3*sin(vUv.x*23.+vUv.y*6.);vec3 color=mix(vec3(.62,.48,.8),vec3(.96,.77,.6),vUv.y);float alpha=edge*vFade*(.3+uIntensity*.32)*membrane;gl_FragColor=vec4(color,alpha);}'
  });const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=10;mesh.visible=false;this.group.add(mesh);this.strips.push(mesh);
 }}
 add(p:THREE.Vector3,t:number){
  let last=this.samples.at(-1);if(last&&last.p.distanceToSquared(p)<.0001)return;
  if(last&&last.p.distanceTo(p)>1.8){this.samples.length=0;last=undefined;}
  if(last){const speed=p.distanceTo(last.p)/Math.max(.008,t-last.t);this.speed=this.speed*.6+speed*.4;}
  this.lastPointer=t;this.wantedTip.copy(p);this.wantedTip.z=2.31;
  this.samples.push({p:p.clone(),t});this.emitted++;if(this.samples.length>28)this.samples.shift();
  let length=0;for(let i=this.samples.length-1;i>0;i--){length+=this.samples[i].p.distanceTo(this.samples[i-1].p);if(length>.85+this.intensity*.25){this.samples.splice(0,i);break;}}
 }
 update(time:number,reduced:boolean){const life=.24+this.intensity*.14;
  this.fragmentMaterial.uniforms.uTime.value=time;
  this.updateBridge(time,reduced);
  for(const f of this.fragments){const age=(time-f.birth)/.45;f.mesh.visible=age>=0&&age<1&&!reduced;if(f.mesh.visible){f.mesh.position.copy(f.origin);f.mesh.position.x+=f.vx*age;f.mesh.position.y+=f.vy*age;f.mesh.scale.setScalar(f.radius*Math.pow(1-age,1.1));}}
 while(this.samples.length&&time-this.samples[0].t>life)this.samples.shift();
  const active=this.samples.length>1&&!reduced;this.strips.forEach(s=>s.visible=active);if(!active)return;
  this.curve.points=this.samples.map(s=>s.p);const first=this.samples[0].t,last=this.samples.at(-1)!.t;
  for(let layer=0;layer<3;layer++){
   const mesh=this.strips[layer],g=mesh.geometry,pos=g.getAttribute('position') as THREE.BufferAttribute,uv=g.getAttribute('uv') as THREE.BufferAttribute,fade=g.getAttribute('aFade') as THREE.BufferAttribute;
   for(let i=0;i<this.count;i++){
    const u=i/(this.count-1);this.curve.getPoint(u,this.p);this.curve.getTangent(u,this.tangent);
    const age=Math.max(0,1-(time-(first+(last-first)*u))/life);
    const width=(.14+this.intensity*.10)*Math.max(.55,1.25/(1+this.speed*.07))*(layer===0?1:.38)*Math.pow(age,.6)*Math.pow(Math.sin(Math.PI*u),.4)*(1.+Math.sin(u*19.+layer)*.2);
    const offset=layer===0?0:Math.sin(u*9.+layer*2.)*.09*(.3+this.intensity)*Math.sin(u*Math.PI);
    const len=Math.hypot(this.tangent.x,this.tangent.y)||1,nx=-this.tangent.y/len,ny=this.tangent.x/len;
    for(let side=0;side<2;side++){const v=i*2+side,w=(side*2-1)*width+offset;pos.setXYZ(v,this.p.x+nx*w,this.p.y+ny*w,this.p.z+layer*.001);uv.setXY(v,u,side);fade.setX(v,age*age*(layer===0?1:this.intensity*.5));}
   }pos.needsUpdate=true;uv.needsUpdate=true;fade.needsUpdate=true;(mesh.material as THREE.ShaderMaterial).uniforms.uIntensity.value=this.intensity;
  }
 }
 clear(){this.samples.length=0;this.attached=false;this.cutAt=-10;this.bridge.visible=false;for(const f of this.fragments){f.birth=-10;f.mesh.visible=false;}this.strips.forEach(s=>s.visible=false);}
 dispose(){this.bridge.geometry.dispose();this.bridgeMaterial.dispose();this.fragmentGeometry.dispose();this.fragmentMaterial.dispose();for(const s of this.strips){s.geometry.dispose();(s.material as THREE.Material).dispose();}this.samples.length=0;}
}



