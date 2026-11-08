import * as THREE from 'three';

/** Soft light behind the subject, with a slower response than the foreground. */
export class AtmosphericDepth{
  private material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0},uStrength:{value:1}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float uTime,uStrength;
      void main(){
        vec2 p=(vUv-.5)*2.;
        vec2 drift=vec2(sin(uTime*.07),cos(uTime*.09))*.035;
        vec2 a=(p-drift-vec2(-.12,.07))*vec2(.96,1.18);
        vec2 b=(p+drift-vec2(.19,-.12))*vec2(1.25,.92);
        float violet=exp(-dot(a,a)*5.4);
        float mauve=exp(-dot(b,b)*7.);
        float warmth=exp(-dot(p,p)*21.);
        float fade=1.-smoothstep(.56,1.,length(p));
        vec3 light=vec3(.007,.0035,.012)*violet+vec3(.004,.0018,.005)*mauve;
        light+=vec3(.0035,.0022,.0012)*warmth;
        gl_FragColor=vec4(light*uStrength*fade,1.);
      }`
  });
  mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),this.material);
  private offset=new THREE.Vector2();
  constructor(){this.mesh.position.z=-3.5;this.mesh.renderOrder=-10;this.mesh.frustumCulled=false;}
  update(position:THREE.Vector3,scale:number,time:number,dt:number,pointer:THREE.Vector2,dragX:number,dragY:number,moving:boolean){
    const px=Math.abs(pointer.x)<=1?pointer.x:0,py=Math.abs(pointer.y)<=1?pointer.y:0;
    const x=moving?px*.10+Math.sin(dragY)*.13:0,y=moving?py*.08-Math.sin(dragX)*.10:0;
    if(moving){const follow=1-Math.exp(-dt*2.2);this.offset.x+=(x-this.offset.x)*follow;this.offset.y+=(y-this.offset.y)*follow;}else this.offset.set(0,0);
    this.mesh.position.set(position.x+this.offset.x,position.y+this.offset.y,-3.5);
    this.mesh.scale.set(scale*5.6,scale*5.2,1);
    this.material.uniforms.uTime.value=time;
  }
  dispose(){this.mesh.geometry.dispose();this.material.dispose();}
}

