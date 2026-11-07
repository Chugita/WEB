export const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value));
export const smooth=(value:number)=>{const t=clamp(value);return t*t*(3-2*t);};
export function noise3(x:number,y:number,z:number){
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;
  const u=smooth(fx),v=smooth(fy),w=smooth(fz);
  const hash=(a:number,b:number,c:number)=>{const s=Math.sin(a*19.19+b*71.17+c*113.13)*17453.671;return(s-Math.floor(s))*2-1;};
  const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
  return mix(mix(mix(hash(ix,iy,iz),hash(ix+1,iy,iz),u),mix(hash(ix,iy+1,iz),hash(ix+1,iy+1,iz),u),v),mix(mix(hash(ix,iy,iz+1),hash(ix+1,iy,iz+1),u),mix(hash(ix,iy+1,iz+1),hash(ix+1,iy+1,iz+1),u),v),w);
}
export function spring(current:number,velocity:number,target:number,dt:number,stiffness=64,damping=13){
  dt=clamp(dt,0,1/30);const speed=velocity+(stiffness*(target-current)-damping*velocity)*dt;return{value:current+speed*dt,velocity:speed};
}
export function pressureFalloff(distance:number,radius:number){return Math.exp(-distance*distance/(2*radius*radius));}
export type Contact={x:number;y:number;z:number;strength:number;age:number};
// Coarse CPU picking approximation of the independently implemented GPU field.
// Trigonometric hashes differ slightly in CPU/GPU precision; this is not an exact collision solver.
export function deform(x:number,y:number,z:number,time:number,contact:Contact,motion=1,out:[number,number,number]=[0,0,0]):[number,number,number]{
  const t=time*.22*motion,warp=noise3(x*.8+2,y*.8-1,z*.8+.4);
  const fixed=noise3(x*1.12+warp*.27+1.8,y*1.12+.7,z*1.12-2.1)*.15;
  const flow=noise3(x*.92+t*.24,y*.92-t*.17+4,z*.92+t*.2)*.085;
  const detail=noise3(x*3.1+warp*.2,y*3.1+t*.12,z*3.1+1)*.033;
  const distance=Math.hypot(x-contact.x,y-contact.y,z-contact.z);
  const push=-contact.strength*pressureFalloff(distance,.3)+contact.strength*.004;
  const r=clamp(1+fixed+flow+detail+push,.7,1.35);
  out[0]=x*r*1.06;out[1]=y*r*.98;out[2]=z*r*.91;return out;
}

