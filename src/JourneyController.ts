import {clamp,smooth} from './physics.ts';
export const answers=[
  {id:'project',label:'Concretar un proyecto'},
  {id:'stability',label:'Tener mayor estabilidad'},
  {id:'independence',label:'Tener más independencia'}
] as const;
export type AnswerId=typeof answers[number]['id'];
export const question='Si pensaras en los próximos años, ¿qué te gustaría conseguir?';
export function journeyPose(progress:number,massScale:number,centerY=.2){
  const p=clamp(progress),concentration=smooth(p/.25),morph=smooth((p-.18)/.3),descent=smooth((p-.45)/.37);
  const u=descent,v=1-u;
  return{progress:p,concentration,morph,descent,
    scale:massScale*(1-morph)+.115*morph,
    x:3*v*v*u*.9+3*v*u*u*(-.6),
    y:v*v*v*centerY+3*v*v*u*(-1.4)+3*v*u*u*(-3.5)+u*u*u*(-4.5),
    cameraY:-5.5*descent,
    junction:smooth((p-.79)/.15),
    hint:1-smooth(p/.12)
  };
}
export function branchPoints(mobile:boolean){
  return mobile?[{x:-1.05,y:-5.95},{x:0,y:-7.05},{x:1.05,y:-5.95}]:[{x:-2.35,y:-6.15},{x:0,y:-6.65},{x:2.35,y:-6.15}];
}
export function normalizedScroll(scroll:number,documentHeight:number,viewportHeight:number){return clamp(scroll/Math.max(1,documentHeight-viewportHeight));}
