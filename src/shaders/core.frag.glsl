uniform float uTime;
uniform float uBrightness;
uniform float uPressure;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){
  vec2 p=(vUv-.5)*2.;float t=uTime*.09;
  vec2 warp=vec2(noise2(p*3.+t),noise2(p*3.-t+9.1))-.5;
  vec2 q=p+warp*.24;
  float r=length(q*vec2(.94,1.1));
  float angle=atan(q.y,q.x);
  float currents=noise2(vec2(angle*1.8+r*7.-t,r*4.+t));
  float veil=noise2(p*5.+vec2(t,-t));
  float envelope=exp(-r*r*3.8);
  float heart=exp(-r*r*25.)*(.8+currents*.3);
  float folds=pow(max(currents,0.),3.)*envelope;
  vec3 warm=mix(vec3(.8,.4,.24),vec3(1.,.8,.55),veil);
  float currentRidges=pow(max(0.,1.-abs(currents-.5)*2.),10.)*envelope;
  vec3 color=warm*envelope*.7+vec3(1.,.78,.48)*heart+vec3(.94,.68,.42)*folds*.55;
  color+=vec3(1.,.88,.69)*(currentRidges*.14+exp(-r*r*150.)*.25);
  float breathe=.97+sin(uTime*.91)*.025+sin(uTime*.37)*.015;
  color*=uBrightness*breathe*(1.+uPressure*.5);
  float alpha=(1.-smoothstep(.15,1.,r))*.85;
  gl_FragColor=vec4(color,alpha);
}
