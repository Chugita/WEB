uniform float uTime,uMorph,uPressure;
uniform vec3 uLavender,uMauve,uChampagne,uPearl,uIce,uCore;
varying vec3 vPosition,vWorld,vNormal,vView;
varying float vDensity;
float tissue(vec3 p){
  return sin(p.x*3.7+sin(p.y*3.1+p.z*1.9))* .52
       +sin(p.y*4.1+sin(p.z*3.3-p.x*2.))* .3
       +sin(p.z*5.2+sin(p.x*4.2+p.y*2.3))* .18;
}
void main(){
  vec3 N=normalize(vNormal),V=normalize(vView),p=vPosition;
  vec3 warmDirection=normalize(vec3(.5,.7,1.)),coolDirection=normalize(vec3(-.85,.25,.5));
  float facing=max(0.,dot(N,V)),rim=pow(1.-facing,3.2);
  float warmDiffuse=max(0.,dot(N,warmDirection)),coolDiffuse=max(0.,dot(N,coolDirection));
  float density=smoothstep(.12,.85,vDensity);
  vec3 albedo=mix(uMauve,uLavender,.3+density*.5);
  float pocket=pow(1.-density,2.);
  vec3 color=albedo*(.055+warmDiffuse*.16+coolDiffuse*.08)*(1.-pocket*.45);
  // Integrated translucent tissue within one closed surface; no layered shells.
  vec3 volume=vec3(0.);float optical=0.;
  for(int i=0;i<7;i++){
    float depth=float(i)*.13;
    vec3 samplePoint=p-V*depth+vec3(sin(uTime*.07)*.025,0.,0.);
    float field=tissue(samplePoint);
    float fold=exp(-abs(field-.12)*34.);
    float fine=exp(-abs(tissue(samplePoint*1.82+1.7)-.3)*90.)*.18;
    float attenuation=exp(-depth*2.7-optical*.24);
    vec3 tint=mix(uIce,uLavender,smoothstep(-.7,.6,samplePoint.x));
    tint=mix(tint,uChampagne,smoothstep(.2,.95,tissue(samplePoint*.54+3.)));
    volume+=tint*(fold+fine)*attenuation*.3;
    optical+=fold;
  }
  color+=volume*(.4+facing*.6);
  vec3 H=normalize(V+warmDirection),HC=normalize(V+coolDirection);
  float warmReflection=pow(max(0.,dot(N,H)),48.)*.2;
  float coolReflection=pow(max(0.,dot(N,HC)),42.)*.18;
  color+=uChampagne*warmReflection+uIce*coolReflection;
  color+=mix(uIce,uChampagne,smoothstep(-.7,.8,p.x+p.y*.5))*rim*.16;
  vec2 core=vec2(-.12+sin(uTime*.11)*.025,.04+sin(uTime*.17)*.02);
  float radius=dot(p.xy-core,p.xy-core);
  float transmission=exp(-radius*2.5)*(.25+.75*(1.-density));
  float heart=exp(-radius*17.)*(.5+.5*(1.-density));
  float pulse=1.+sin(uTime*.83)*.025+uPressure*1.4;
  color+=uChampagne*transmission*.48*pulse+uCore*heart*1.5*pulse;
  color=mix(color,uCore*(1.2+facing*.9),uMorph);
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
