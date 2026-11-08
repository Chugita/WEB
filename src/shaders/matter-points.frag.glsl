uniform float uTime,uMorph;
uniform vec3 uLavender,uChampagne,uIce,uPearl;
varying vec3 vPosition,vNormal,vView;
void main(){
 float radius=length(gl_PointCoord-.5);if(radius>.5)discard;
 float facing=max(0.,dot(normalize(vNormal),normalize(vView)));
 vec3 nucleus=vec3(0.);
 float warmth=exp(-dot(vPosition-nucleus,vPosition-nucleus)*2.2);
 vec3 tint=mix(uLavender,uIce,smoothstep(.2,.9,-vPosition.x)*.4);
 tint=mix(tint,uChampagne,warmth);
 float alpha=(.18+pow(1.-facing,1.8)*.34)*(1.-smoothstep(.12,.5,radius))*(1.-uMorph);
 gl_FragColor=vec4(tint*.85,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}
