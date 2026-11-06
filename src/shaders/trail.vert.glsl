attribute float aBirth;
varying float vBirth;
void main(){vBirth=aBirth;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
