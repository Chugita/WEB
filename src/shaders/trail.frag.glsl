uniform float uTime;
uniform float uLifetime;
uniform float uOpacity;
uniform vec3 uColor;
varying float vBirth;
void main(){float age=(uTime-vBirth)/uLifetime;float alpha=pow(max(0.,1.-age),2.)*uOpacity;gl_FragColor=vec4(uColor,alpha);}
