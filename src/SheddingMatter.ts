import * as THREE from 'three';
import {clamp,smooth} from './physics';

/** Scroll alone determines each fragment's path, so reversing scroll reassembles it. */
export class SheddingMatter{
  private count=30;
  private fade=new THREE.InstancedBufferAttribute(new Float32Array(this.count),1);
  private geometry=new THREE.SphereGeometry(1,16,12);
  private material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:`attribute float aFade;varying vec3 p,n;varying float fade;
      void main(){p=position;n=normal;fade=aFade;
        vec3 q=position*(1.+sin(position.x*5.+position.y*4.)*.12);
        gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(q,1.);}`,
    fragmentShader:`varying vec3 p,n;varying float fade;
      void main(){float folds=pow(.5+.5*sin(p.x*6.+sin(p.y*5.)+p.z*4.),3.);
        float rim=pow(1.-abs(n.z),2.);
        vec3 color=mix(vec3(.21,.13,.32),vec3(.66,.49,.77),folds);
        color+=vec3(.85,.65,.48)*exp(-dot(p.xy,p.xy)*6.)*.4;
        color+=vec3(.42,.53,.72)*rim*.35;
        gl_FragColor=vec4(color,fade*(.38+folds*.4+rim*.15));}`
  });
  mesh:THREE.InstancedMesh;
  private dummy=new THREE.Object3D();
  constructor(){
    this.geometry.setAttribute('aFade',this.fade);
    this.mesh=new THREE.InstancedMesh(this.geometry,this.material,this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.mesh.frustumCulled=false;
  }
  update(morph:number,scale:number,centerY:number){
    this.mesh.visible=morph>.015&&morph<.98;if(!this.mesh.visible)return;
    for(let i=0;i<this.count;i++){
      const start=.02+(i%10)*.043,t=clamp((morph-start)/.49);
      const z=1-2*(i+.5)/this.count,r=Math.sqrt(1-z*z),angle=i*2.399963;
      const x=r*Math.cos(angle),y=r*Math.sin(angle);
      const distance=scale*(1-start)*(.96+t*.26);
      this.dummy.position.set(x*distance,y*distance+centerY-t*t*.35,z*distance);
      const size=scale*(.026+(i%4)*.012)*Math.sin(Math.PI*t)*Math.pow(1-t,.3);
      this.dummy.scale.set(size*(1+t*.6),size*(1-t*.3),size);
      this.dummy.rotation.set(i*.6+t*.7,i*.9-t*.5,t*.4);
      this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix);
      this.fade.setX(i,smooth(t/.12)*(1-smooth((t-.55)/.45)));
    }
    this.mesh.instanceMatrix.needsUpdate=true;this.fade.needsUpdate=true;
  }
  dispose(){this.geometry.dispose();this.material.dispose();}
}
