uniform float uTime,uMorph,uPressure;
uniform vec3 uLavender,uMauve,uChampagne,uPearl,uIce,uCore;
varying vec3 vPosition,vWorld,vNormal,vView;
varying float vDensity;
float field(vec3 p){return sin(p.x*3.1+sin(p.y*2.8+p.z*1.7))*.5+sin(p.y*3.8+sin(p.z*3.1-p.x*2.2))*.3+sin(p.z*4.7+sin(p.x*3.3+p.y*2.))*.2;}
void main(){
 vec3 N=normalize(vNormal),V=normalize(vView),p=vPosition;
 float facing=max(dot(N,V),0.),rim=pow(1.-facing,2.8);
 vec3 color=vec3(0.);float opacity=0.;
 vec3 nucleus=vec3(-.08+sin(uTime*.32)*.18,.02+sin(uTime*.25+.4)*.14,.04+cos(uTime*.21)*.10);
 // Front-to-back integration: density, absorption, folded tissue and embedded source.
 // The enclosing mesh remains a single closed body.
 for(int i=0;i<40;i++){
  float depth=(float(i)+.5)*.045;
  vec3 q=p-V*depth;
  q+=vec3(sin(uTime*.09+q.y)*.035,cos(uTime*.07+q.x)*.025,0.);
  vec3 warp=vec3(field(q*1.7+2.),field(q*1.5-1.3),field(q*1.6+4.));
  float f=field(q+warp*.18),fine=field(q*3.7+warp*.8+2.4);
  float body=smoothstep(1.22,.38,length(q*vec3(.85,1.,1.)));
  float fold=exp(-abs(f-.08)*12.);float filigree=exp(-abs(fine+.1)*28.);
  float density=body*(.08+fold*.66+filigree*.27+smoothstep(.1,.65,fine)*.07);
  float alpha=1.-exp(-density*.13);
  vec3 tint=mix(uMauve,uLavender,.35+smoothstep(-.5,.6,f)*.6);
  tint=mix(tint,uIce,smoothstep(.1,.9,-q.x+q.y*.2)*.35);
  float coreDistance=length((q-nucleus)*vec3(1.,1.12,1.));
  float pulse=1.+sin(uTime*.72)*.045+uPressure*.8;
  float source=exp(-coreDistance*coreDistance*9.)*pulse;
  tint=mix(tint,uChampagne,source*.8);
  vec3 light=tint*(.22+fold*.9+filigree*.6)+vec3(1.,.40,.12)*source*2.5;
  // Irregular source, attenuated by dense foreground tissue.
  light+=uCore*exp(-coreDistance*coreDistance*28.)*(.7+.3*fine)*4.3*pulse;
  color+=(1.-opacity)*light*alpha*2.;opacity+=(1.-opacity)*alpha;
 }
 vec3 L=normalize(vec3(.5,.7,1.)),C=normalize(vec3(-.8,.2,.5));
 float diffuse=max(dot(N,L),0.);
 color+=uMauve*.028+uLavender*diffuse*.035;
 float spec=pow(max(dot(N,normalize(V+L)),0.),65.);
 float cool=pow(max(dot(N,normalize(V+C)),0.),52.);
 color+=uChampagne*spec*.20+uIce*cool*.16;
 color+=mix(uIce,uChampagne,smoothstep(-.6,.9,p.x+p.y))*rim*(.08+vDensity*.11);
 color=mix(color,uCore*(1.2+facing*.9),uMorph);
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}
