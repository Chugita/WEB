import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {LivingMatter} from './LivingMatter';
import {OrganicNetwork} from './OrganicNetwork';
import {ElectromagneticTrail} from './ElectromagneticTrail';
import {JourneyInterface} from './JourneyInterface';
import {visual,composition,chooseQuality,type Quality} from './config/originVisualConfig';
import {spring,clamp,smooth,type Contact} from './physics';
import {branchPoints} from './JourneyController';
export type OriginSceneProps={onBegin?:()=>void;quality?:Quality;forceFallback?:boolean;reducedMotion?:boolean};
export function mountOriginScene(root:HTMLElement,options:OriginSceneProps={}){
  const host=root.querySelector<HTMLElement>('#scene')!,zone=root.querySelector<HTMLElement>('#matter-touch-zone')!;
  const toggle=root.querySelector<HTMLButtonElement>('#motion-toggle')!,status=root.querySelector<HTMLElement>('#status')!;
  const media=matchMedia('(prefers-reduced-motion: reduce)'),reduced=()=>options.reducedMotion??media.matches;
  const abort=new AbortController(),events={signal:abort.signal},diagnostics=import.meta.env.DEV;
  let disposed=false,lost=false,paused=false,frame=0,last=0,time=0,wall=0,pressure=0,velocity=0,target=0,onMass=false,pointerDown=false,pickTimer=0,average=1/60,started=false;
  let selected=-1,selectedAt=0,hadSelection=false;
  let captureElement:HTMLElement|null=null,capturedId=-1;
  const selectionFrom=new THREE.Vector3(),selectedPosition=new THREE.Vector3(),junctionPosition=new THREE.Vector3(0,-4.5,0);
  let rig:{matter:LivingMatter;network:OrganicNetwork}|null=null;
  const ui=new JourneyInterface(root,index=>{
    hadSelection=selected>=0;selected=index;selectedAt=wall;
    if(rig){selectionFrom.copy(rig.matter.group.position);rig.network.setSelection(index);}
    if(diagnostics)root.dataset.selected=String(index);
  },reduced);
  let renderer:THREE.WebGLRenderer;
  try{if(options.forceFallback)throw new Error('Forced fallback');renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:import.meta.env.DEV});}
  catch{
    root.classList.add('fallback-mode');toggle.hidden=true;zone.hidden=true;
    status.textContent='La vista alternativa está activa. Podés desplazarte hasta la primera pregunta.';
    if(diagnostics)root.dataset.renderer='fallback';
    const svg=root.querySelector<SVGSVGElement>('#fallback svg')!;
    const draw=()=>{
      if(disposed)return;
      const{layout,pose}=ui.update(innerWidth,innerHeight),pixels=innerHeight/layout.viewHeight;
      svg.style.transform=`translate(${pose.x*pixels}px,${-(pose.y-pose.cameraY-layout.centerY)*pixels}px) scale(${pose.scale/layout.scale})`;
      svg.style.opacity=String(pose.junction>.9?.6:1);
      if(diagnostics)root.dataset.progress=ui.progress.toFixed(3);
      frame=requestAnimationFrame(draw);
    };frame=requestAnimationFrame(draw);
    return{quality:'fallback' as const,dispose(){disposed=true;cancelAnimationFrame(frame);ui.dispose();abort.abort();}};
  }
  renderer.setClearColor(new THREE.Color(0x05050b).multiplyScalar(.16),1);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const quality=chooseQuality(options.quality??'auto',innerWidth,navigator.hardwareConcurrency),preset=visual.quality[quality];
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,preset.dpr));host.append(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-5,5,3.8,-3.8,.1,35);camera.position.set(0,0,9);
  const matter=new LivingMatter(preset.segments,preset.rings),network=new OrganicNetwork();rig={matter,network};scene.add(matter.group,network.group);
  const trail=new ElectromagneticTrail();scene.add(trail.group);
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),visual.bloomIntensity,.3,1.05);bloom.enabled=preset.bloom;composer.addPass(bloom);
  const output=new OutputPass();composer.addPass(output);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(10,10),contact=new THREE.Vector3(0,0,1),desired=new THREE.Vector3(0,0,1);
  const trailPlane=new THREE.Plane(new THREE.Vector3(0,0,1),-2.3),trailPoint=new THREE.Vector3();
  let layout=composition(innerWidth,innerHeight),lastProgress=0,mobile=layout.mobile;
  function resize(){
    layout=composition(root.clientWidth,root.clientHeight);
    const half=layout.viewHeight/2;camera.left=-half*root.clientWidth/root.clientHeight;camera.right=-camera.left;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
    renderer.setSize(root.clientWidth,root.clientHeight);composer.setSize(root.clientWidth,root.clientHeight);
    if(mobile!==layout.mobile){mobile=layout.mobile;network.resize(mobile);}
    else if(!network.orbs.length)network.resize(mobile);
  }
  network.resize(mobile);const observer=new ResizeObserver(resize);observer.observe(root);resize();
  function hit(event:PointerEvent){
    const bounds=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);
    camera.updateMatrixWorld();raycaster.setFromCamera(pointer,camera);
    matter.syncPicking();
    const intersection=ui.progress<.35?raycaster.intersectObject(matter.hitSurface,false)[0]:undefined;
    onMass=Boolean(intersection);
    if(intersection){
      desired.copy(matter.surface.worldToLocal(intersection.point.clone())).normalize();

      if(diagnostics)root.dataset.surfaceContacts=String(Number(root.dataset.surfaceContacts??0)+1);
    }
    target=reduced()||paused?0:onMass?(pointerDown?visual.dragInfluence:visual.hoverInfluence):0;
  }
  window.addEventListener('pointermove',event=>{
    hit(event);
    if(!reduced()&&!paused&&(event.pointerType!=='touch'||pointerDown)){
      trail.setIntensity(pointerDown?1:onMass||ui.hover>=0?.55:0);
      if(raycaster.ray.intersectPlane(trailPlane,trailPoint)){
        if(onMass)trailPoint.lerp(matter.group.position,.025);
        trail.add(trailPoint,wall);

        if(diagnostics&&!pointerDown)root.dataset.freeTrailSamples=String(Number(root.dataset.freeTrailSamples??0)+1);
      }
    }
  },events);
  const down=(event:PointerEvent)=>{
    if(event.button!==0||(event.target as Element).closest('button'))return;
    hit(event);if(!onMass||reduced()||paused)return;
    pointerDown=true;contact.copy(desired);target=visual.dragInfluence;
    const element=event.target instanceof HTMLElement?event.target:renderer.domElement;
    element.setPointerCapture(event.pointerId);captureElement=element;capturedId=event.pointerId;event.preventDefault();
  };
  window.addEventListener('pointerdown',down,{...events,passive:false});
  const release=()=>{
    if(pointerDown)matter.release(contact,pressure);
    pointerDown=false;target=0;
    if(captureElement?.hasPointerCapture(capturedId))captureElement.releasePointerCapture(capturedId);
    captureElement=null;capturedId=-1;
  };
  window.addEventListener('pointerup',release,events);window.addEventListener('pointercancel',release,events);window.addEventListener('blur',()=>{release();trail.clear();},events);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;root.classList.remove('webgl-ready');renderer.domElement.style.visibility='hidden';root.classList.add('fallback-mode');},events);
  renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;renderer.domElement.style.visibility='';root.classList.remove('fallback-mode');last=0;},events);
  toggle.addEventListener('click',()=>{paused=!paused;target=0;trail.clear();toggle.textContent=paused?'Activar movimiento':'Pausar movimiento';},events);
  media.addEventListener('change',()=>{target=0;trail.clear();},events);
  document.addEventListener('visibilitychange',()=>{
    last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;release();trail.clear();}else if(!frame&&!disposed)frame=requestAnimationFrame(tick);
  },events);
  function tick(now:number){
    frame=0;if(disposed||document.hidden)return;
    const raw=last?(now-last)/1000:1/60,dt=clamp(raw,0,1/30);last=now;wall+=dt;
    const moving=!reduced()&&!paused;if(moving)time+=dt;
    const{pose}=ui.update(root.clientWidth,root.clientHeight);
    if(ui.progress>.02&&!started){started=true;options.onBegin?.();document.dispatchEvent(new CustomEvent('sinapsis:begin'));}
    if(ui.progress<.01)started=false;
    if(Math.abs(ui.progress-lastProgress)>.007)trail.clear();lastProgress=ui.progress;
    if(ui.progress<.81&&selected>=0){selected=-1;network.setSelection(-1);ui.resetSelection();}
    
    const response=spring(pressure,velocity,target,dt);pressure=response.value;velocity=response.velocity;contact.lerp(desired,1-Math.exp(-dt*12));
    pickTimer+=dt;
    const field:Contact={x:contact.x,y:contact.y,z:contact.z,strength:moving?pressure:0,age:10};
    matter.update(time,field,pose.morph,moving?dt:0,pickTimer>.1);if(pickTimer>.1)pickTimer=0;
    matter.group.scale.setScalar(pose.scale);matter.group.position.set(pose.x,pose.y+(1-pose.morph)*Math.sin(time*.42)*.045,0);
    matter.group.rotation.set(Math.sin(time*.09)*.022*(1-pose.morph),Math.sin(time*.07)*.028*(1-pose.morph),0);
    let selectionProgress=0;
    if(selected>=0){
      const t=reduced()?1:clamp((wall-selectedAt)/1.8);
      if(hadSelection&&t<.3){selectedPosition.lerpVectors(selectionFrom,junctionPosition,smooth(t/.3));}
      else{selectionProgress=smooth(hadSelection?(t-.3)/.7:t);network.selectionPosition(selectionProgress,selectedPosition);}
      matter.group.position.lerp(selectedPosition,pose.junction*pose.junction);
    }
    camera.position.y=pose.cameraY;camera.updateMatrixWorld();
    network.update(pose.descent,pose.junction,time,ui.hover,selected,selectionProgress,reduced());trail.update(wall,!moving);
    const pixels=root.clientHeight/layout.viewHeight,diameter=layout.scale*2.45*pixels;
    zone.style.width=`${diameter}px`;zone.style.height=`${diameter}px`;zone.style.left=`${root.clientWidth/2-diameter/2}px`;zone.style.top=`${root.clientHeight/2-layout.centerY*pixels-diameter/2}px`;
    zone.style.pointerEvents=ui.progress<.12?'auto':'none';
    average=average*.98+Math.min(raw,.15)*.02;
    if((options.quality??'auto')==='auto'&&wall>6&&average>.03&&renderer.getPixelRatio()>1){renderer.setPixelRatio(Math.max(1,renderer.getPixelRatio()-.2));composer.setPixelRatio(renderer.getPixelRatio());bloom.enabled=false;average=1/60;}
    if(!lost){composer.render(dt);root.classList.add('webgl-ready');}
    if(diagnostics&&Math.floor(wall*4)!==Math.floor((wall-dt)*4)){
      root.dataset.renderer='webgl';root.dataset.progress=ui.progress.toFixed(3);root.dataset.morph=pose.morph.toFixed(3);root.dataset.pressure=pressure.toFixed(4);root.dataset.motionTime=time.toFixed(3);root.dataset.trailPoints=String(trail.pointCount);root.dataset.trailEmitted=String(trail.emitted);root.dataset.stage=pose.junction>.98?'junction':pose.descent>.01?'descent':pose.morph>.01?'metamorphosis':'origin';
    }
    frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  return{quality,dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);abort.abort();observer.disconnect();ui.dispose();matter.dispose();network.dispose();trail.dispose();bloom.dispose();output.dispose();composer.dispose();renderer.dispose();renderer.domElement.remove();root.classList.remove('webgl-ready');}};
}



