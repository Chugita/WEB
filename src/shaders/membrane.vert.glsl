varying vec3 vPosition;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vec4 world=modelMatrix*vec4(position,1.0);
  vPosition=position;
  vWorld=world.xyz;
  vNormal=normalize(mat3(modelMatrix)*normal);
  vView=cameraPosition-world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
}
