uniform float uTime,uMorph,uPressure,uReleaseAge;
uniform vec3 uContact;
uniform vec4 uImpulses[3];
uniform float uImpulseAges[3];
varying vec3 vPosition,vWorld,vNormal,vView;
varying float vDensity;
float cell(vec3 p){return fract(sin(dot(p,vec3(19.19,71.17,113.13)))*17453.671)*2.-1.;}
float fieldNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(cell(i),cell(i+vec3(1,0,0)),f.x),mix(cell(i+vec3(0,1,0)),cell(i+vec3(1,1,0)),f.x),f.y),mix(mix(cell(i+vec3(0,0,1)),cell(i+vec3(1,0,1)),f.x),mix(cell(i+vec3(0,1,1)),cell(i+vec3(1,1,1)),f.x),f.y),f.z);}
vec3 body(vec3 d){
  float t=uTime*.22,warp=fieldNoise(d*.8+vec3(2.,-1.,.4));
  float fixedField=fieldNoise(d*1.12+warp*.27+vec3(1.8,.7,-2.1))*.15;
  float circulation=fieldNoise(d*.92+vec3(t*.24,-t*.17+4.,t*.2))*.085;
  float secondary=fieldNoise(d*3.1+warp*.2+vec3(0,t*.12,1.))*.033;
  float asym=.065*exp(-dot(d-normalize(vec3(.7,.6,.2)),d-normalize(vec3(.7,.6,.2)))*4.);
  asym-=.045*exp(-dot(d-normalize(vec3(-.5,.3,.8)),d-normalize(vec3(-.5,.3,.8)))*5.);
  float dist=distance(d,uContact);
  float contact=-uPressure*exp(-dist*dist/.18)+uPressure*.004;
  float rebound=0.;
  for(int i=0;i<3;i++){
    float age=uImpulseAges[i],r=distance(d,uImpulses[i].xyz);
    rebound+=sin(r*13.-age*10.)*exp(-age*4.-r*2.)*uImpulses[i].w*.1*min(age*5.,1.);
  }
  float r=clamp(1.+(fixedField+circulation+secondary+asym)*(1.-uMorph*.94)+(contact+rebound)*(1.-uMorph),.7,1.35);
  vec3 q=d*r*vec3(1.04,.98,.85);
float upper=exp(-dot(d-normalize(vec3(.35,.85,.25)),d-normalize(vec3(.35,.85,.25)))*5.);
float left=exp(-dot(d-normalize(vec3(-.9,.1,.2)),d-normalize(vec3(-.9,.1,.2)))*6.);
float lower=exp(-dot(d-normalize(vec3(.5,-.8,.1)),d-normalize(vec3(.5,-.8,.1)))*7.);
q+=vec3(.13,.18,-.08)*upper+vec3(-.12,-.05,.12)*left+vec3(.10,-.14,.03)*lower;
float sag=exp(-dot(d-normalize(vec3(-.5,-.8,.3)),d-normalize(vec3(-.5,-.8,.3)))*4.);
q+=vec3(-.14,-.16,.07)*sag;
float shoulder=exp(-dot(d-normalize(vec3(.9,.05,.4)),d-normalize(vec3(.9,.05,.4)))*9.);
q+=vec3(.21,.04,.03)*shoulder;
q.x+=.11*d.y*d.y-.08*d.z;q.y+=.045*sin(d.x*3.+t*.6)*(1.-d.y*d.y);
return mix(q,d*(1.+fixedField*.04),uMorph);
}
void main(){
  vec3 d=normalize(position);
  vec3 axis=abs(d.z)<.9?vec3(0,0,1):vec3(0,1,0);
  vec3 tangent=normalize(cross(axis,d)),bitangent=cross(d,tangent);
  vec3 p=body(d),pa=body(normalize(d+tangent*.012)),pb=body(normalize(d+bitangent*.012));
  vec3 n=normalize(cross(pa-p,pb-p));if(dot(n,d)<0.)n=-n;
  vec4 world=modelMatrix*vec4(p,1.);
  vPosition=p;vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*n);vView=cameraPosition-world.xyz;
  vDensity=fieldNoise(d*2.2+vec3(.6,uTime*.015,2.1))*.5+.5;
  gl_Position=projectionMatrix*viewMatrix*world;
}

