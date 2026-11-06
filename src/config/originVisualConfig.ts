export type Quality = 'auto' | 'high' | 'medium' | 'low';
export const visual = {
  background: '#05050b',
  massScale: 2.45,
  massPositionY: .55,
  largeNoiseFrequency: 1.05,
  largeNoiseAmplitude: .28,
  foldFrequency: 2.45,
  foldAmplitude: .14,
  microNoiseStrength: .013,
  membraneOpacity: .22,
  edgeFresnelStrength: .88,
  warmLightIntensity: 1.15,
  coolReflectionIntensity: .7,
  coreBrightness: 1.8,
  coreRadius: .67,
  bloomIntensity: .26,
  idleMotionSpeed: .15,
  idleMotionAmplitude: .07,
  hoverInfluence: .035,
  dragInfluence: .19,
  elasticStiffness: 65,
  elasticDamping: 13,
  pressureRadius: .28,
  trailLifetime: .82,
  trailWidth: .65,
  trailGlow: .28,
  bubbleScale: 1,
  quality: {
    high: { segments: 112, rings: 80, dpr: 1.65, bloom: true },
    medium: { segments: 80, rings: 56, dpr: 1.35, bloom: true },
    low: { segments: 56, rings: 40, dpr: 1, bloom: false }
  }
} as const;
export function chooseQuality(request: Quality, width: number, cores = 4): Exclude<Quality,'auto'> {
  if(request !== 'auto')return request;
  return cores < 4 ? 'low' : width < 760 ? 'medium' : 'high';
}
export function composition(width: number, height: number) {
  const aspect=width/Math.max(1,height);
  const viewHeight=7.5;
  const scale=Math.min(visual.massScale, aspect*viewHeight/3.0);
  const centerY=height<500 ? .72 : aspect<.8 ? .65 : visual.massPositionY;
  return {viewHeight,scale,centerY,bubbleTop:aspect<.8 ? .68 : .755};
}
