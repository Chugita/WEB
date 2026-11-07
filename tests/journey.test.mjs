import test from 'node:test';
import assert from 'node:assert/strict';
import {journeyPose,normalizedScroll,answers,branchPoints} from '../src/JourneyController.ts';
test('scroll journey is deterministic, reversible and bounded',()=>{
  const snapshots=Array.from({length:101},(_,i)=>journeyPose(i/100,2.15));
  for(let i=100;i>=0;i--)assert.deepEqual(journeyPose(i/100,2.15),snapshots[i]);
  assert.equal(journeyPose(-1,2.15).scale,2.15);
  assert.equal(journeyPose(2,2.15).scale,.115);
  assert.equal(snapshots[100].junction,1);
  assert.equal(normalizedScroll(0,4000,900),0);
  assert.equal(normalizedScroll(3100,4000,900),1);
  for(let i=1;i<snapshots.length;i++)assert.ok(Math.abs(snapshots[i].scale-snapshots[i-1].scale)<.11);
});
test('first junction has exactly the approved three endpoints on both layouts',()=>{
  assert.deepEqual(answers.map(a=>a.label),['Concretar un proyecto','Tener mayor estabilidad','Tener más independencia']);
  for(const mobile of [false,true]){
    const p=branchPoints(mobile);assert.equal(p.length,3);
    assert.ok(p[0].x<p[1].x&&p[1].x<p[2].x);
    assert.ok(p.every(v=>v.y<-4.5));
  }
});
