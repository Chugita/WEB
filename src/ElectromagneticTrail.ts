import * as THREE from 'three';
import vertexShader from './shaders/trail.vert.glsl?raw';
import fragmentShader from './shaders/trail.frag.glsl?raw';
import {visual} from './config/originVisualConfig';
export class ElectromagneticTrail {
  group=new THREE.Group();
  private samples:{p:THREE.Vector3;t:number}[]=[];
  private lines:THREE.Line[]=[];
  private count=96;
  private curve=new THREE.CatmullRomCurve3();
  private tmp=new THREE.Vector3();
  private speed=0;
  private acceleration=0;
  private intensity=0;
  setIntensity(value:number){this.intensity=value;}
  emitted=0;
  get pointCount(){return this.samples.length;}
  constructor(){
    for(let i=0;i<4;i++){
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(this.count*3),3).setUsage(THREE.DynamicDrawUsage));
      geometry.setAttribute('aBirth',new THREE.BufferAttribute(new Float32Array(this.count),1).setUsage(THREE.DynamicDrawUsage));
      const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uLifetime:{value:visual.trailLifetime},uOpacity:{value:i===0?visual.trailGlow*1.6:visual.trailGlow*.36},uColor:{value:new THREE.Color(i%2?'#b9b4db':'#a4c8e8')}},linewidth:visual.trailWidth});
      const line=new THREE.Line(geometry,material);line.frustumCulled=false;line.renderOrder=10;line.visible=false;
      this.group.add(line);this.lines.push(line);
    }
  }
  add(p:THREE.Vector3,time:number){
    const last=this.samples.at(-1);
    if(last&&last.p.distanceToSquared(p)<.0001)return;
    if(last){
      const current=Math.min(1,last.p.distanceTo(p)/Math.max(.008,time-last.t)/12);
      this.acceleration=Math.min(1,Math.abs(current-this.speed));this.speed=this.speed*.55+current*.45;
    }
    this.samples.push({p:p.clone(),t:time});this.emitted++;if(this.samples.length>40)this.samples.shift();
  }
  update(time:number,reduced:boolean){
    const lifetime=.46+this.intensity*.46;
    while(this.samples.length&&time-this.samples[0].t>lifetime)this.samples.shift();
    const active=this.samples.length>1&&!reduced;
    for(const l of this.lines)l.visible=active;
    if(!active)return;
    this.curve.points.length=0;for(const sample of this.samples)this.curve.points.push(sample.p);
    const first=this.samples[0].t,last=this.samples.at(-1)!.t;
    for(let layer=0;layer<this.lines.length;layer++){
      const line=this.lines[layer],position=line.geometry.getAttribute('position') as THREE.BufferAttribute,birth=line.geometry.getAttribute('aBirth') as THREE.BufferAttribute;
      for(let i=0;i<this.count;i++){
        const u=i/(this.count-1);this.curve.getPoint(u,this.tmp);
        const bend=layer*.006*(.4+this.speed*.6+this.acceleration*.2)*Math.sin(u*15+time*2+layer)*Math.sin(u*Math.PI);
        position.setXYZ(i,this.tmp.x+bend,this.tmp.y+bend*.7,this.tmp.z+layer*.001);birth.setX(i,first+(last-first)*u);
      }
      position.needsUpdate=true;birth.needsUpdate=true;
      const uniforms=(line.material as THREE.ShaderMaterial).uniforms;
      uniforms.uTime.value=time;uniforms.uLifetime.value=lifetime;
      uniforms.uOpacity.value=(layer===0?visual.trailGlow*(1+this.intensity):visual.trailGlow*.27*this.intensity)*(.65+this.speed*.35);
    }
  }
  clear(){this.samples.length=0;for(const l of this.lines)l.visible=false;}
  dispose(){for(const l of this.lines){l.geometry.dispose();(l.material as THREE.Material).dispose();}this.samples.length=0;}
}
