import * as THREE from 'three';
import {visual,palette} from './config/originVisualConfig';
import {deform,type Contact} from './physics';
import vertexShader from './shaders/matter.vert.glsl?raw';
import fragmentShader from './shaders/matter.frag.glsl?raw';
import pointFragment from './shaders/matter-points.frag.glsl?raw';
export class LivingMatter{
  group=new THREE.Group();
  surface:THREE.Mesh;
  hitSurface:THREE.Mesh;
  private material:THREE.ShaderMaterial;
  private directions:Float32Array;
  private particles:THREE.Points;
  private tuple:[number,number,number]=[0,0,0];
  private impulses=Array.from({length:3},()=>new THREE.Vector4(0,0,1,0));
  private ages=[10,10,10];
  private impulseIndex=0;
  constructor(segments:number,rings:number){
    this.material=new THREE.ShaderMaterial({vertexShader,fragmentShader,depthWrite:true,side:THREE.FrontSide,uniforms:{
      uTime:{value:0},uMorph:{value:0},uPressure:{value:0},uReleaseAge:{value:10},uContact:{value:new THREE.Vector3(0,0,1)},
      uImpulses:{value:this.impulses},uImpulseAges:{value:this.ages},
      uLavender:{value:new THREE.Color(palette.lavender)},uMauve:{value:new THREE.Color(palette.mauve)},uChampagne:{value:new THREE.Color(palette.champagne)},uPearl:{value:new THREE.Color(palette.pearl)},uIce:{value:new THREE.Color(palette.ice)},uCore:{value:new THREE.Color(palette.core)}
    }});
    this.surface=new THREE.Mesh(new THREE.SphereGeometry(1,segments,rings),this.material);this.surface.geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1.5);this.group.add(this.surface);
    const pointMaterial=new THREE.ShaderMaterial({
      vertexShader:vertexShader.replace('vec4 world=modelMatrix*vec4(p,1.);','p*=1.003;vec4 world=modelMatrix*vec4(p,1.);').replace('gl_Position=projectionMatrix*viewMatrix*world;','gl_Position=projectionMatrix*viewMatrix*world;gl_PointSize=1.1;'),
      fragmentShader:pointFragment,uniforms:this.material.uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
    });
    const pointPositions:number[]=[];
    for(let ring=1;ring<rings+24;ring++){
      const phi=ring*Math.PI/(rings+24),n=Math.max(3,Math.round((segments+48)*Math.sin(phi)));
      for(let j=0;j<n;j++){const theta=j*Math.PI*2/n;pointPositions.push(Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta));}
    }
    const pointGeometry=new THREE.BufferGeometry();pointGeometry.setAttribute('position',new THREE.Float32BufferAttribute(pointPositions,3));
    this.particles=new THREE.Points(pointGeometry,pointMaterial);this.particles.frustumCulled=false;this.group.add(this.particles);
    const coarse=new THREE.SphereGeometry(1,32,24);this.directions=new Float32Array(coarse.getAttribute('position').array);
    this.hitSurface=new THREE.Mesh(coarse,new THREE.MeshBasicMaterial());
  }
  update(time:number,contact:Contact,morph:number,dt:number,pickUpdate:boolean){
    const u=this.material.uniforms;u.uTime.value=time;u.uMorph.value=morph;u.uPressure.value=contact.strength;u.uContact.value.set(contact.x,contact.y,contact.z);
    for(let i=0;i<3;i++)this.ages[i]+=dt;
    if(pickUpdate){
      const p=this.hitSurface.geometry.getAttribute('position') as THREE.BufferAttribute;
      for(let i=0;i<p.count;i++){deform(this.directions[i*3],this.directions[i*3+1],this.directions[i*3+2],time,contact,1,this.tuple);p.setXYZ(i,...this.tuple);}
      p.needsUpdate=true;this.hitSurface.geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1.5);
    }
  }
  release(point:THREE.Vector3,strength:number){const i=this.impulseIndex++%3;this.impulses[i].set(point.x,point.y,point.z,strength);this.ages[i]=0;}
  syncPicking(){this.group.updateWorldMatrix(true,true);this.hitSurface.matrixWorld.copy(this.surface.matrixWorld);}
  dispose(){this.particles.geometry.dispose();(this.particles.material as THREE.Material).dispose();this.surface.geometry.dispose();this.material.dispose();this.hitSurface.geometry.dispose();(this.hitSurface.material as THREE.Material).dispose();}
}
