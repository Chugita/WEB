uniform float uTime,uMorph,uPressure,uReleaseAge;
uniform vec3 uContact;
uniform vec4 uImpulses[3];
uniform float uImpulseAges[3];
varying vec3 vPosition,vWorld,vNormal,vView,vLocalView;
varying float vDensity;
float cell(vec3 p){return fract(sin(dot(p,vec3(19.19,71.17,113.13)))*17453.671)*2.-1.;}
float fieldNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(cell(i),cell(i+vec3(1,0,0)),f.x),mix(cell(i+vec3(0,1,0)),cell(i+vec3(1,1,0)),f.x),f.y),mix(mix(cell(i+vec3(0,0,1)),cell(i+vec3(1,0,1)),f.x),mix(cell(i+vec3(0,1,1)),cell(i+vec3(1,1,1)),f.x),f.y),f.z);}
vec3 body(vec3 d){
  float t=uTime;
  // Reference: short travelling corrugations over a round, continuously deforming body.
  vec3 flow=vec3(t*.21,-t*.17,t*.13);
  float large=fieldNoise(d*2.8+flow+vec3(1.8,.7,-2.1))*.14;
  float crests=sin(d.x*10.+t*.92+sin(d.z*4.-t*.3))
              *sin(d.y*9.-t*.74+cos(d.x*3.+t*.21))*.075;
  float detail=fieldNoise(d*5.2-flow*.6)*.035;
  float rest=fieldNoise(d*1.1+vec3(1.8,.7,-2.1))*.025;
  float dist=distance(d,uContact);
  float contact=-uPressure*exp(-dist*dist/.18)+uPressure*.004;
  float rebound=0.;
  for(int i=0;i<3;i++){
    float age=uImpulseAges[i],r=distance(d,uImpulses[i].xyz);
    rebound+=sin(r*13.-age*10.)*exp(-age*4.-r*2.)*uImpulses[i].w*.1*min(age*5.,1.);
  }
  float radial=1.+(large+crests+detail+rest)*(1.-uMorph*.98)+(contact+rebound)*(1.-uMorph);
  return d*clamp(radial,.7,1.35)*mix(vec3(1.02,1.,.97),vec3(1.),uMorph);
}

void main(){
  vec3 d=normalize(position);
  vec3 axis=abs(d.z)<.9?vec3(0,0,1):vec3(0,1,0);
  vec3 tangent=normalize(cross(axis,d)),bitangent=cross(d,tangent);
  vec3 p=body(d),pa=body(normalize(d+tangent*.012)),pb=body(normalize(d+bitangent*.012));
  vec3 n=normalize(cross(pa-p,pb-p));if(dot(n,d)<0.)n=-n;
  vec4 world=modelMatrix*vec4(p,1.);
  vPosition=p;vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*n);vView=cameraPosition-world.xyz;
  vec3 viewAxis=vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2]);
  vLocalView=vec3(dot(modelMatrix[0].xyz,viewAxis),dot(modelMatrix[1].xyz,viewAxis),dot(modelMatrix[2].xyz,viewAxis));
  vDensity=fieldNoise(d*2.2+vec3(.6,uTime*.015,2.1))*.5+.5;
  gl_Position=projectionMatrix*viewMatrix*world;
}


