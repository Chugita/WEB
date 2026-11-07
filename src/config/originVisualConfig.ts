export type Quality='auto'|'high'|'medium'|'low';
export const palette={background:'#05050b',lavender:'#BDAFD4',lilac:'#C8B5DF',mauve:'#5C4E73',champagne:'#F0D5BF',pearl:'#ECE5E5',ice:'#AFC9E8',core:'#FFF4E7'};
export const visual={
  massScale:2.15,massPositionY:.2,viewHeight:7.6,
  shapeFrequency:1.12,shapeAmplitude:.15,motionAmplitude:.085,secondaryAmplitude:.033,
  idleMotionSpeed:.22,hoverInfluence:.025,dragInfluence:.17,pressureRadius:.3,
  elasticStiffness:64,elasticDamping:13,bloomIntensity:.18,
  trailLifetime:.95,trailWidth:.65,trailGlow:.25,
  quality:{high:{segments:128,rings:96,dpr:1.5,bloom:true},medium:{segments:88,rings:64,dpr:1.25,bloom:true},low:{segments:56,rings:40,dpr:1,bloom:false}}
} as const;
export function chooseQuality(request:Quality,width:number,cores=4):Exclude<Quality,'auto'>{return request==='auto'?(cores<4?'low':width<760?'medium':'high'):request;}
export function composition(width:number,height:number){
  const viewHeight=visual.viewHeight,aspect=width/Math.max(1,height);
  return{viewHeight,scale:Math.min(visual.massScale,aspect*viewHeight/2.8),centerY:visual.massPositionY,mobile:aspect<.85};
}
