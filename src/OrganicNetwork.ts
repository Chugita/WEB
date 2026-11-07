import * as THREE from 'three';
import {branchPoints} from './JourneyController';
import {palette} from './config/originVisualConfig';
type Filament={mesh:THREE.Mesh;curve:THREE.CubicBezierCurve3;material:THREE.MeshBasicMaterial};
const point=(x:number,y:number,z=0)=>new THREE.Vector3(x,y,z);
function filament(curve:THREE.CubicBezierCurve3,radius=.007):Filament{
  const material=new THREE.MeshBasicMaterial({color:palette.ice,transparent:true,opacity:.4,depthWrite:false,blending:THREE.AdditiveBlending});
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,100,radius,5,false),material);mesh.frustumCulled=false;
  return{mesh,curve,material};
}
function grow(f:Filament,amount:number){const count=f.mesh.geometry.index?.count??0;f.mesh.geometry.setDrawRange(0,Math.floor(count*Math.max(0,Math.min(1,amount))/3)*3);f.mesh.visible=amount>.001;}
const orbVertex=`varying vec3 n,v;void main(){vec4 p=modelMatrix*vec4(position,1.);n=normalize(mat3(modelMatrix)*normal);v=cameraPosition-p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`;
const orbFragment=`uniform vec3 tint;uniform float light;varying vec3 n,v;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(v))),2.5);vec3 c=tint*(.16+f*.7)*light;gl_FragColor=vec4(c,.12+f*.42);}`;
export class OrganicNetwork{
  group=new THREE.Group();
  stem:Filament;
  branches:Filament[]=[];
  orbs:THREE.Mesh[]=[];
  private pulse:THREE.Mesh;
  private central:THREE.Mesh;
  private dormant:THREE.Mesh;
  private continuation:Filament|null=null;
  private mobile=false;
  private selected=-1;
  private end=point(0,-8.05);
  private temp=new THREE.Vector3();
  constructor(){
    this.stem=filament(new THREE.CubicBezierCurve3(point(0,.2),point(.9,-1.4),point(-.6,-3.5),point(0,-4.5)),.008);this.group.add(this.stem.mesh);
    this.central=new THREE.Mesh(new THREE.SphereGeometry(.065,24,16),new THREE.MeshBasicMaterial({color:palette.core}));this.central.position.set(0,-4.5,0);this.group.add(this.central);
    this.pulse=new THREE.Mesh(new THREE.SphereGeometry(.025,12,8),new THREE.MeshBasicMaterial({color:palette.core}));this.group.add(this.pulse);
    this.dormant=new THREE.Mesh(new THREE.SphereGeometry(.055,18,12),new THREE.MeshBasicMaterial({color:palette.lilac,transparent:true,opacity:.4}));this.group.add(this.dormant);
    this.resize(false);
  }
  resize(mobile:boolean){
    this.mobile=mobile;
    for(const f of this.branches){this.group.remove(f.mesh);f.mesh.geometry.dispose();f.material.dispose();}
    for(const orb of this.orbs){this.group.remove(orb);orb.geometry.dispose();(orb.material as THREE.Material).dispose();}
    this.branches=[];this.orbs=[];
    branchPoints(mobile).forEach((p,i)=>{
      const curve=new THREE.CubicBezierCurve3(point(0,-4.5),point(p.x*.18+(i===1?.25:0),-5.1,-.08),point(p.x*.93-(i===1?.2:0),p.y+.5,.06),point(p.x,p.y));
      const f=filament(curve);this.group.add(f.mesh);this.branches.push(f);
      const material=new THREE.ShaderMaterial({vertexShader:orbVertex,fragmentShader:orbFragment,transparent:true,depthWrite:false,uniforms:{tint:{value:new THREE.Color(palette.lilac)},light:{value:1}}});
      const orb=new THREE.Mesh(new THREE.SphereGeometry(1,36,24),material);orb.position.set(p.x,p.y,0);orb.scale.set(mobile?.46:.68,mobile?.34:.44,.3);this.group.add(orb);this.orbs.push(orb);
    });
    if(this.selected>=0)this.setSelection(this.selected);
  }
  setSelection(index:number){
    this.selected=index;
    if(this.continuation){this.group.remove(this.continuation.mesh);this.continuation.mesh.geometry.dispose();this.continuation.material.dispose();this.continuation=null;}
    if(index<0)return;
    const p=branchPoints(this.mobile)[index];this.end.set(p.x*.65,-8.05,0);this.dormant.position.copy(this.end);
    this.continuation=filament(new THREE.CubicBezierCurve3(point(p.x,p.y),point(p.x+.2,p.y-.5),point(this.end.x-.3,-7.7),this.end.clone()));
    this.continuation.material.color.set(palette.champagne);this.group.add(this.continuation.mesh);
  }
  selectionPosition(t:number,out:THREE.Vector3){
    if(this.selected<0)return out.set(0,-4.5,0);
    if(t<.62)return this.branches[this.selected].curve.getPoint(Math.min(1,t/.62),out);
    return this.continuation!.curve.getPoint(Math.min(1,(t-.62)/.38),out);
  }
  update(descent:number,junction:number,time:number,hover:number,selected:number,selectionProgress:number,reduced:boolean){
    grow(this.stem,descent);this.stem.material.opacity=.3;
    this.central.visible=junction>.05;
    this.branches.forEach((f,i)=>{
      grow(f,junction);
      const chosen=selected===i,active=hover===i;
      f.material.color.set(chosen||active?palette.champagne:palette.ice);
      f.material.opacity=junction*(chosen?.9:active?.7:selected<0?.3:.1);
      const orb=this.orbs[i];orb.visible=junction>.01;
      const u=(orb.material as THREE.ShaderMaterial).uniforms;u.light.value=junction*(chosen?1.8:active?1.45:selected<0?1:.36);
    });
    this.pulse.visible=hover>=0&&junction>.9&&!reduced;
    if(this.pulse.visible){this.branches[hover].curve.getPoint((time*.65)%1,this.temp);this.pulse.position.copy(this.temp);}
    const continuationGrowth=Math.max(0,(selectionProgress-.62)/.38);
    if(this.continuation){grow(this.continuation,continuationGrowth*junction);this.continuation.material.opacity=.65*junction;}
    this.dormant.visible=selected>=0&&continuationGrowth>.95&&junction>.9;
  }
  dispose(){
    const objects=[this.stem,...this.branches,...(this.continuation?[this.continuation]:[])];for(const f of objects){f.mesh.geometry.dispose();f.material.dispose();}
    for(const mesh of [...this.orbs,this.central,this.pulse,this.dormant]){mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();}
  }
}
