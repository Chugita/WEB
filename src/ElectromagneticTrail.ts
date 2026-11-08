import * as THREE from 'three';
// Bounded dynamic triangle strips: width survives WebGL's one-pixel line limit.
export class ElectromagneticTrail{
 group=new THREE.Group();emitted=0;
 private glow:THREE.Sprite;private glowTexture:THREE.CanvasTexture;
 private cursor=new THREE.Vector3();private lastMove=-10;
 private samples:{p:THREE.Vector3;t:number}[]=[];
 private strips:THREE.Mesh[]=[];private intensity=0;private count=72;
 private curve=new THREE.CatmullRomCurve3();private p=new THREE.Vector3();private tangent=new THREE.Vector3();
 setIntensity(value:number){this.intensity=value;}
 get pointCount(){return this.samples.length;}
 constructor(){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!,g=ctx.createRadialGradient(64,64,0,64,64,64);
 g.addColorStop(0,'rgba(255,247,230,1)');g.addColorStop(.10,'rgba(255,244,231,1)');g.addColorStop(.24,'rgba(240,213,191,.8)');g.addColorStop(.5,'rgba(200,181,223,.22)');g.addColorStop(1,'rgba(189,175,212,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
 this.glowTexture=new THREE.CanvasTexture(c);this.glow=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glowTexture,color:0xfff4e7,transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending}));this.glow.scale.setScalar(.40);this.glow.visible=false;this.glow.renderOrder=15;this.group.add(this.glow);

  for(let layer=0;layer<1;layer++){
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
  this.cursor.copy(p);this.cursor.z=2.35;this.lastMove=t;
  let last=this.samples.at(-1);if(last&&last.p.distanceToSquared(p)<.0001)return;
  if(last&&last.p.distanceTo(p)>1.8){this.samples.length=0;last=undefined;}
  this.samples.push({p:p.clone(),t});this.emitted++;if(this.samples.length>28)this.samples.shift();
  let length=0;for(let i=this.samples.length-1;i>0;i--){length+=this.samples[i].p.distanceTo(this.samples[i-1].p);if(length>.85+this.intensity*.25){this.samples.splice(0,i);break;}}
 }
 update(time:number,reduced:boolean){const life=.24+this.intensity*.14;

 this.glow.visible=!reduced&&this.lastMove>=0;
 if(this.glow.visible){this.glow.position.copy(this.cursor);(this.glow.material as THREE.SpriteMaterial).opacity=.9+Math.sin(time*.8)*.08;}

 while(this.samples.length&&time-this.samples[0].t>life)this.samples.shift();
  const active=this.samples.length>1&&!reduced;this.strips.forEach(s=>s.visible=active);if(!active)return;
  this.curve.points=this.samples.map(s=>s.p);const first=this.samples[0].t,last=this.samples.at(-1)!.t;
  for(let layer=0;layer<this.strips.length;layer++){
   const mesh=this.strips[layer],g=mesh.geometry,pos=g.getAttribute('position') as THREE.BufferAttribute,uv=g.getAttribute('uv') as THREE.BufferAttribute,fade=g.getAttribute('aFade') as THREE.BufferAttribute;
   for(let i=0;i<this.count;i++){
    const u=i/(this.count-1);this.curve.getPoint(u,this.p);this.curve.getTangent(u,this.tangent);
    const age=Math.max(0,1-(time-(first+(last-first)*u))/life);
    const width=(.14+this.intensity*.10)*(layer===0?1:.38)*Math.pow(age,.6)*Math.pow(u,.55)*(1.+Math.sin(u*19.+layer)*.2);
    const offset=layer===0?0:Math.sin(u*9.+layer*2.)*.09*(.3+this.intensity)*Math.sin(u*Math.PI);
    const len=Math.hypot(this.tangent.x,this.tangent.y)||1,nx=-this.tangent.y/len,ny=this.tangent.x/len;
    for(let side=0;side<2;side++){const v=i*2+side,w=(side*2-1)*width+offset;pos.setXYZ(v,this.p.x+nx*w,this.p.y+ny*w,this.p.z+layer*.001);uv.setXY(v,u,side);fade.setX(v,age*age*(layer===0?1:this.intensity*.5));}
   }pos.needsUpdate=true;uv.needsUpdate=true;fade.needsUpdate=true;(mesh.material as THREE.ShaderMaterial).uniforms.uIntensity.value=this.intensity;
  }
 }
 clear(){this.lastMove=-10;this.glow.visible=false;this.samples.length=0;this.strips.forEach(s=>s.visible=false);}
 dispose(){this.glowTexture.dispose();(this.glow.material as THREE.Material).dispose();for(const s of this.strips){s.geometry.dispose();(s.material as THREE.Material).dispose();}this.samples.length=0;}
}




