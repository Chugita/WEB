import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {LivingMatter} from './LivingMatter';
import {ElectromagneticTrail} from './ElectromagneticTrail';
import {visual,composition,chooseQuality,type Quality} from './config/originVisualConfig';
import {spring,type Contact} from './physics';

export type OriginSceneProps={onBegin?:()=>void;quality?:Quality;forceFallback?:boolean;reducedMotion?:boolean};
export function mountOriginScene(root:HTMLElement,options:OriginSceneProps={}) {
  const host=root.querySelector<HTMLElement>('#scene')!;
  const button=root.querySelector<HTMLButtonElement>('#begin')!;
  const toggle=root.querySelector<HTMLButtonElement>('#motion-toggle')!;
  const status=root.querySelector<HTMLElement>('#status')!;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const reduced=()=>options.reducedMotion??media.matches;
  const diagnostics=import.meta.env.DEV;
  const abort=new AbortController(),events={signal:abort.signal};
  let disposed=false,lost=false,paused=false,frame=0,last=0,time=0,wall=0,geometryTime=0,average=1/60;
  let geometryStatic=false,needsRender=true;
  let pointerDown=false,onMass=false,pressure=0,velocity=0,target=0,releaseAge=10;
  let lastPointerTime=0,buttonX=0,buttonY=0,buttonTargetX=0,buttonTargetY=0,clickEnergy=0;
  const quality=chooseQuality(options.quality??'auto',innerWidth,navigator.hardwareConcurrency);
  const preset=visual.quality[quality];
  button.style.setProperty('--bubble-scale',String(visual.bubbleScale));
  let renderer:THREE.WebGLRenderer;
  const onBegin=()=>{
    clickEnergy=1;button.classList.add('pulse');
    if(diagnostics)root.dataset.begins=String(Number(root.dataset.begins??0)+1);
    try{options.onBegin?.();}finally{document.dispatchEvent(new CustomEvent('sinapsis:begin'));}
  };
  button.addEventListener('click',onBegin,events);
  button.addEventListener('pointermove',event=>{
    if(reduced())return;
    const bounds=button.getBoundingClientRect();
    buttonTargetX=(event.clientX-bounds.left-bounds.width/2)*.025;
    buttonTargetY=(event.clientY-bounds.top-bounds.height/2)*.025;
  },events);
  button.addEventListener('pointerleave',()=>{buttonTargetX=0;buttonTargetY=0;},events);
  try{if(options.forceFallback)throw new Error('Explicit fallback');renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});}catch{
    if(diagnostics)root.dataset.renderer='fallback';
    toggle.hidden=true;
    status.textContent='La representación estática está activa. Comenzar está disponible.';
    return {dispose:()=>abort.abort(),quality:'fallback' as const};
  }
  renderer.setClearColor(0x000000,1);renderer.setPixelRatio(Math.min(devicePixelRatio||1,preset.dpr));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  host.append(renderer.domElement);
  if(diagnostics){root.dataset.renderer='webgl';root.dataset.quality=quality;root.dataset.surfaceContacts='0';}
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-5,5,3.75,-3.75,.1,30);camera.position.set(0,0,9);
  const matter=new LivingMatter(preset.segments,preset.rings);scene.add(matter.group);
  const trail=new ElectromagneticTrail();scene.add(trail.group);
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),visual.bloomIntensity,.35,1.08);bloom.enabled=preset.bloom;composer.addPass(bloom);
  const output=new OutputPass();composer.addPass(output);
  const raycaster=new THREE.Raycaster();
  const pointer=new THREE.Vector2(10,10),contact=new THREE.Vector3(0,0,1),desired=new THREE.Vector3(0,0,1);
  const plane=new THREE.Plane(new THREE.Vector3(0,0,1),-2.5),trailPoint=new THREE.Vector3();
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),bary=new THREE.Vector3();
  let layout=composition(innerWidth,innerHeight);
  function resize(){
    needsRender=true;
    const width=root.clientWidth,height=root.clientHeight;layout=composition(width,height);
    const half=layout.viewHeight/2;camera.left=-half*width/height;camera.right=half*width/height;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
    renderer.setSize(width,height);composer.setSize(width,height);
    matter.group.scale.setScalar(layout.scale);matter.group.position.y=layout.centerY;
    button.style.top=`${layout.bubbleTop*100}%`;
  }
  const observer=new ResizeObserver(resize);observer.observe(root);resize();
  function hit(event:PointerEvent){
    const bounds=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);
    matter.group.updateWorldMatrix(true,true);raycaster.setFromCamera(pointer,camera);
    const intersection=raycaster.intersectObject(matter.surface,false)[0];
    onMass=Boolean(intersection);
    if(intersection?.face){
      if(diagnostics)root.dataset.surfaceContacts=String(Number(root.dataset.surfaceContacts??0)+1);
      const local=matter.surface.worldToLocal(intersection.point.clone());
      const positions=matter.geometry.getAttribute('position'),face=intersection.face;
      a.fromBufferAttribute(positions,face.a);b.fromBufferAttribute(positions,face.b);c.fromBufferAttribute(positions,face.c);
      THREE.Triangle.getBarycoord(local,a,b,c,bary);
      const dirs=matter.directions;
      desired.set(dirs[face.a*3]*bary.x+dirs[face.b*3]*bary.y+dirs[face.c*3]*bary.z,dirs[face.a*3+1]*bary.x+dirs[face.b*3+1]*bary.y+dirs[face.c*3+1]*bary.z,dirs[face.a*3+2]*bary.x+dirs[face.b*3+2]*bary.y+dirs[face.c*3+2]*bary.z).normalize();
    }
    target=reduced()||paused?0:onMass?(pointerDown?visual.dragInfluence:visual.hoverInfluence):0;
  }
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    pointerDown=true;releaseAge=10;hit(event);contact.copy(desired);lastPointerTime=wall;
    canvas.setPointerCapture(event.pointerId);
  },events);
  canvas.addEventListener('pointermove',event=>{
    hit(event);
    if(pointerDown&&!reduced()&&!paused&&wall-lastPointerTime>.007){
      raycaster.ray.intersectPlane(plane,trailPoint);trail.add(trailPoint,wall);lastPointerTime=wall;
    }
  },events);
  const release=(event:PointerEvent)=>{
    pointerDown=false;target=0;releaseAge=0;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener('pointerup',release,events);canvas.addEventListener('pointercancel',release,events);
  canvas.addEventListener('lostpointercapture',()=>{pointerDown=false;target=0;},events);
  canvas.addEventListener('pointerleave',()=>{if(!pointerDown){onMass=false;target=0;}},events);
  window.addEventListener('blur',()=>{pointerDown=false;target=0;trail.clear();},events);
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();lost=true;root.classList.remove('webgl-ready');canvas.style.visibility='hidden';
    status.textContent='La representación estática está activa. Comenzar está disponible.';
  },events);
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;needsRender=true;canvas.style.visibility='';last=0;},events);
  toggle.addEventListener('click',()=>{paused=!paused;needsRender=true;target=0;trail.clear();toggle.textContent=paused?'Activar movimiento':'Pausar movimiento';},events);
  media.addEventListener('change',()=>{needsRender=true;target=0;trail.clear();},events);
  document.addEventListener('visibilitychange',()=>{
    last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;pointerDown=false;target=0;trail.clear();}else if(!frame&&!disposed)frame=requestAnimationFrame(tick);
  },events);
  function tick(now:number){
    frame=0;if(disposed||document.hidden)return;
    const raw=last?(now-last)/1000:1/60,dt=Math.min(raw,1/30);last=now;wall+=dt;
    const moving=!reduced()&&!paused;
    if(moving)time+=dt;
    releaseAge+=dt;
    const response=spring(pressure,velocity,target,dt,visual.elasticStiffness,visual.elasticDamping);pressure=response.value;velocity=response.velocity;
    contact.lerp(desired,1-Math.exp(-dt*12));
    geometryTime+=dt;
    if(geometryTime>=1/(pointerDown?45:30)&&(moving||!geometryStatic)){
      const field:Contact={x:contact.x,y:contact.y,z:contact.z,strength:moving?pressure:0,age:moving?releaseAge:10};
      matter.update(time,field,1);geometryTime=0;geometryStatic=!moving;needsRender=true;
    }
    matter.group.rotation.set(Math.sin(time*.13)*.06,Math.sin(time*.11)*.1,.05+Math.sin(time*.17)*.035);
    matter.group.position.y=layout.centerY+(Math.sin(time*.51)*.64+Math.sin(time*.23)*.26)*visual.idleMotionAmplitude;
    trail.update(wall,!moving);
    buttonX+=(buttonTargetX-buttonX)*(1-Math.exp(-dt*8));buttonY+=(buttonTargetY-buttonY)*(1-Math.exp(-dt*8));
    clickEnergy=Math.max(0,clickEnergy-dt*2.8);
    if(!clickEnergy)button.classList.remove('pulse');
    const float=Math.sin(time*.63)*2+Math.sin(time*.27)*1;
    button.style.transform=`translate(calc(-50% + ${buttonX}px),${buttonY+float}px) scale(${1-clickEnergy*.022})`;
    if(moving)button.style.borderRadius=`${48+Math.sin(time*.25)*2}% ${53+Math.cos(time*.3)*2}% 46% 49% / 58% 54% ${47+Math.sin(time*.35)*2}% 45%`;
    average=average*.98+Math.min(raw,.15)*.02;
    if((options.quality??'auto')==='auto'&&wall>6&&average>.03&&renderer.getPixelRatio()>1){
      renderer.setPixelRatio(Math.max(1,renderer.getPixelRatio()-.2));composer.setPixelRatio(renderer.getPixelRatio());bloom.enabled=false;average=1/60;
    }
    if(!lost&&(moving||needsRender)){composer.render(dt);root.classList.add('webgl-ready');needsRender=false;}
    if(diagnostics&&Math.floor(wall*4)!==Math.floor((wall-dt)*4)){
      root.dataset.pressure=pressure.toFixed(4);root.dataset.trailPoints=String(trail.pointCount);root.dataset.averageFrameMs=(average*1000).toFixed(1);
      root.dataset.motionTime=time.toFixed(4);
      root.dataset.trailEmitted=String(trail.emitted);
    }
    frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  return {
    quality,
    dispose(){
      if(disposed)return;disposed=true;cancelAnimationFrame(frame);abort.abort();observer.disconnect();
      matter.dispose();trail.dispose();bloom.dispose();output.dispose();composer.dispose();renderer.dispose();canvas.remove();root.classList.remove('webgl-ready');
    }
  };
}
