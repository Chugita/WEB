uniform float uTime;
uniform float uOpacity;
uniform float uWarm;
uniform float uCool;
uniform float uFresnel;
uniform float uPressure;
uniform float uLayer;
varying vec3 vPosition;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vView;
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise3(p)*.57+noise3(p*2.07+3.1)*.28+noise3(p*4.17-2.1)*.15;}
void main(){
  vec3 N=normalize(vNormal);if(!gl_FrontFacing)N=-N;
  vec3 V=normalize(vView);
  float facing=abs(dot(N,V));
  float edge=pow(1.-facing,2.2);
  vec3 p=vPosition;
  float tissue=fbm(p*3.4+vec3(uTime*.027,uLayer*1.7,0));
  float fine=fbm(p*11.+vec3(tissue*2.,uTime*.012,0));
  float fibers=pow(1.-abs(fine-.49)*2.,18.);
  float thickness=.32+.68*tissue;
  vec3 lavender=vec3(.37,.25,.55),pearl=vec3(.78,.59,.72);
  vec3 ice=vec3(.48,.68,.84),champagne=vec3(1.,.72,.48);
  vec3 lightDir=normalize(vec3(.35,.4,.8)-p*.45);
  float diffuse=pow(max(dot(N,lightDir),0.),1.5);
  float iceSide=pow(max(dot(N,normalize(vec3(-.8,.3,.4))),0.),3.);
  float warmSide=pow(max(dot(N,normalize(vec3(.8,.6,-.1))),0.),4.);
  float centerLight=exp(-dot(p.xy-vec2(-.1,-.03),p.xy-vec2(-.1,-.03))*2.5);
  vec3 color=lavender*(.16+thickness*.21)+pearl*diffuse*.18;
  color+=mix(lavender,pearl,tissue)*edge*uFresnel*.65;
  color+=ice*iceSide*uCool*(edge+.3);
  color+=champagne*(warmSide*.48+centerLight*(.14+.13*(1.-facing)))*uWarm;
  color+=champagne*edge*smoothstep(-.25,1.,p.x+p.y*.65)*.2;
  color+=pearl*fibers*.038;
  color*=.85+uLayer*.12;
  color+=champagne*uPressure*centerLight*.6;
  float alpha=clamp(uOpacity*(.32+edge*1.7+thickness*.65+diffuse*.3),.055,.75);
  gl_FragColor=vec4(color,alpha);
}
