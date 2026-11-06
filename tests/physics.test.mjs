import test from 'node:test';
import assert from 'node:assert/strict';
import {noise3,spring,pressureFalloff,deform} from '../src/physics.ts';
test('coherent deformation is deterministic, smooth and bounded',()=>{
  const idle={x:0,y:0,z:1,strength:0,age:10};
  for(let i=0;i<80;i++){
    const a=i*2.39996,z=1-2*(i+.5)/80,r=Math.sqrt(1-z*z),x=r*Math.cos(a),y=r*Math.sin(a);
    const p=deform(x,y,z,12,idle),next=deform(x,y,z,12.016,idle);
    assert.deepEqual(p,deform(x,y,z,12,idle));
    assert.ok(Math.hypot(...p)>.45&&Math.hypot(...p)<1.7);
    assert.ok(Math.hypot(...p.map((v,j)=>v-next[j]))<.02);
  }
  assert.ok(Math.abs(noise3(1,2,3)-noise3(1.001,2,3))<.01);
});
test('pressure indents only the contacted region and release is stable',()=>{
  const idle={x:0,y:0,z:1,strength:0,age:10},touch={...idle,strength:.19};
  const a=deform(0,0,1,0,idle),b=deform(0,0,1,0,touch);
  assert.ok(b[2]<a[2]-.15);
  const far=deform(0,0,-1,0,touch),farIdle=deform(0,0,-1,0,idle);
  assert.ok(Math.abs(far[2]-farIdle[2])<.001);
  assert.ok(pressureFalloff(1,.28)<.01);
  let value=.19,velocity=0;
  for(let i=0;i<120;i++){const n=spring(value,velocity,0,1/60);value=n.value;velocity=n.velocity;assert.ok(Number.isFinite(value)&&Math.abs(value)<.25);}
  assert.ok(Math.abs(value)<.0001);
});
test('reduced motion removes temporal geometry movement',()=>{
  const contact={x:0,y:0,z:1,strength:0,age:10};
  assert.deepEqual(deform(.6,.8,0,0,contact,0),deform(.6,.8,0,100,contact,0));
});
