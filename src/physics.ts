import {visual} from './config/originVisualConfig.ts';
export function noise3(x:number,y:number,z:number):number {
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);
  const fx=x-ix,fy=y-iy,fz=z-iz;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz);
  const hash=(a:number,b:number,c:number)=>{let h=Math.imul(a,374761393)^Math.imul(b,668265263)^Math.imul(c,2147483647);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
  const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
  return mix(mix(mix(hash(ix,iy,iz),hash(ix+1,iy,iz),u),mix(hash(ix,iy+1,iz),hash(ix+1,iy+1,iz),u),v),mix(mix(hash(ix,iy,iz+1),hash(ix+1,iy,iz+1),u),mix(hash(ix,iy+1,iz+1),hash(ix+1,iy+1,iz+1),u),v),w)*2-1;
}
export function spring(current:number,velocity:number,target:number,dt:number,stiffness=65,damping=13) {
  dt=Math.max(0,Math.min(dt,1/30));
  const nextVelocity=velocity+(stiffness*(target-current)-damping*velocity)*dt;
  return {value:current+nextVelocity*dt,velocity:nextVelocity};
}
export function pressureFalloff(distance:number,radius:number) {
  return Math.exp(-(distance*distance)/(2*radius*radius));
}
export type Contact = { x:number; y:number; z:number; strength:number; age:number };
export function deform(x:number,y:number,z:number,time:number,contact:Contact, motion=1,out:[number,number,number]=[0,0,0]): [number,number,number] {
  const t=time*visual.idleMotionSpeed*motion;
  const warp=noise3(x*1.4+2.1,y*1.4-1.3,z*1.4+t*.4);
  const f=visual.largeNoiseFrequency,ff=visual.foldFrequency;
  const large=noise3(x*f+warp*.5+t*.25,y*f+2.4,z*f-1.7);
  const folds=noise3(x*ff+warp*.8,y*ff+t*.48,z*ff+.6);
  const fine=noise3(x*8.2+t*.2,y*8.2,z*8.2);
  const ridge=Math.tanh(folds*2.5)*visual.foldAmplitude;
  const radius=1+large*visual.largeNoiseAmplitude+ridge+fine*visual.microNoiseStrength;
  const distance=Math.hypot(x-contact.x,y-contact.y,z-contact.z);
  const press=pressureFalloff(distance,visual.pressureRadius)*contact.strength;
  const release=contact.age<1.2 ? Math.sin(distance*13-contact.age*11)*Math.exp(-contact.age*4-distance*1.8)*Math.min(contact.age*5,1)*.018*motion : 0;
  // Low-frequency directional asymmetry prevents a radial/petalled silhouette.
  out[0]=(x*radius+.065*y*z)*1.07-x*press+x*release;
  out[1]=(y*radius+.08*x*x-.04*z)*.86-y*press+y*release;
  out[2]=(z*radius+.055*x*y)*.83-z*press+z*release;
  return out;
}
