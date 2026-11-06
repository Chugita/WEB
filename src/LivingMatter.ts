import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {visual} from './config/originVisualConfig';
import {deform,type Contact} from './physics';
import vertexShader from './shaders/membrane.vert.glsl?raw';
import fragmentShader from './shaders/membrane.frag.glsl?raw';
import coreVertex from './shaders/core.vert.glsl?raw';
import coreFragment from './shaders/core.frag.glsl?raw';

export class LivingMatter {
  group=new THREE.Group();
  geometry:THREE.BufferGeometry;
  surface:THREE.Mesh;
  directions:Float32Array;
  private materials:THREE.ShaderMaterial[]=[];
  private core:THREE.Mesh;
  private tuple:[number,number,number]=[0,0,0];
  private contact:Contact={x:0,y:0,z:1,strength:0,age:10};
  constructor(segments:number,rings:number){
    const sphere=new THREE.SphereGeometry(1,segments,rings);
    sphere.deleteAttribute('uv');sphere.deleteAttribute('normal');
    this.geometry=mergeVertices(sphere,1e-5);sphere.dispose();
    const pos=this.geometry.getAttribute('position') as THREE.BufferAttribute;
    pos.setUsage(THREE.DynamicDrawUsage);
    this.directions=new Float32Array(pos.array);
    this.geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1.7);
    const make=(opacity:number,layer:number,side:THREE.Side)=>{
      const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,transparent:true,depthWrite:false,side,uniforms:{uTime:{value:0},uOpacity:{value:opacity},uWarm:{value:visual.warmLightIntensity},uCool:{value:visual.coolReflectionIntensity},uFresnel:{value:visual.edgeFresnelStrength},uPressure:{value:0},uLayer:{value:layer}}});
      this.materials.push(material);return material;
    };
    const back=new THREE.Mesh(this.geometry,make(.13,0,THREE.BackSide));back.renderOrder=0;this.group.add(back);
    const coreMaterial=new THREE.ShaderMaterial({vertexShader:coreVertex,fragmentShader:coreFragment,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uBrightness:{value:visual.coreBrightness},uPressure:{value:0}}});
    this.materials.push(coreMaterial);
    this.core=new THREE.Mesh(new THREE.PlaneGeometry(visual.coreRadius*2.8,visual.coreRadius*2.8),coreMaterial);
    this.core.position.set(-.11,-.025,.04);this.core.renderOrder=1;this.group.add(this.core);
    for(let i=0;i<1;i++){
      const inner=new THREE.Mesh(this.geometry,make(.12,i+1,THREE.DoubleSide));
      inner.scale.setScalar(.83);inner.rotation.set(.26,.2,.4);inner.renderOrder=2+i;this.group.add(inner);
    }
    this.surface=new THREE.Mesh(this.geometry,make(visual.membraneOpacity,3,THREE.FrontSide));this.surface.renderOrder=5;this.group.add(this.surface);
    this.update(0,this.contact,0);
  }
  update(time:number,contact:Contact,motion:number){
    this.contact=contact;
    const pos=this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const a=pos.array as Float32Array,d=this.directions;
    for(let i=0;i<a.length;i+=3){
      deform(d[i],d[i+1],d[i+2],time,contact,motion,this.tuple);
      a[i]=this.tuple[0];a[i+1]=this.tuple[1];a[i+2]=this.tuple[2];
    }
    pos.needsUpdate=true;this.geometry.computeVertexNormals();
    for(const material of this.materials){material.uniforms.uTime.value=time;material.uniforms.uPressure.value=contact.strength;}
    this.core.position.x=-.11+Math.sin(time*.17)*.035*motion;
    this.core.position.y=-.025+Math.sin(time*.23)*.03*motion;
  }
  dispose(){this.geometry.dispose();this.core.geometry.dispose();for(const material of this.materials)material.dispose();}
}
