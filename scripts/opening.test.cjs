const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('public/app.js','utf8');
function setup(reduced=false){
  const callbacks=new Map();let next=0,focus=null;const events=[];
  const translations=[];
  const context=new Proxy({translate:(x,y)=>translations.push([x,y]),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{}});
  const nodes={};
  for(const selector of ['#origin','.neural-field','main','#skip','#replay','#pause','#status','#begin'])nodes[selector]={style:{},hidden:false,textContent:'',handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},focus(){focus=selector;}};
  nodes['#origin'].getContext=()=>context;
  const document={hidden:false,querySelector:q=>nodes[q],handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},dispatchEvent:e=>events.push(e.type)};
  const media={matches:reduced,addEventListener(name,fn){this.change=fn;}};
  const sandbox={document,matchMedia:()=>media,innerWidth:1280,innerHeight:720,devicePixelRatio:2,requestAnimationFrame:fn=>{const id=++next;callbacks.set(id,fn);return id;},cancelAnimationFrame:id=>callbacks.delete(id),CustomEvent:class{constructor(type){this.type=type;}},addEventListener(){}};
  vm.runInNewContext(source,sandbox);
  const click=q=>nodes[q].handlers.click();
  const advance=(from,to)=>{for(let t=from;t<=to;t+=16.667){const jobs=[...callbacks.values()];callbacks.clear();jobs.forEach(fn=>fn(t));}};
  return{nodes,click,advance,document,callbacks,events,media,translations,focus:()=>focus};
}
const normal=setup();
normal.advance(0,3400);assert.equal(normal.nodes.main.className,'message');
normal.advance(3417,5300);assert.equal(normal.nodes.main.className,'ready');assert.equal(normal.nodes['#skip'].hidden,true);assert.equal(normal.nodes['.neural-field'].style.opacity,'1');
const before=normal.translations.at(-1);
normal.advance(5317,10300);
const after=normal.translations.at(-1);
assert.ok(Math.hypot(after[0]-before[0],after[1]-before[1])>8,'The guide itself must drift visibly after the intro');
assert.ok(Math.abs(after[0]-640)<30 && Math.abs(after[1]-720*.352)<24,'Guide remains in its bounded floating area');
normal.click('#begin');assert.deepEqual(normal.events,['sinapsis:begin']);assert.match(normal.nodes['#status'].textContent,/todavía no/);
normal.click('#replay');assert.equal(normal.nodes.main.className,'intro');assert.equal(normal.focus(),'#skip');
normal.click('#skip');assert.equal(normal.nodes.main.className,'ready');assert.equal(normal.focus(),'#begin');
normal.click('#pause');assert.equal(normal.callbacks.size,0);const frozen=normal.translations.length;normal.advance(10317,11000);assert.equal(normal.translations.length,frozen,'Pause freezes the guide');normal.click('#pause');assert.equal(normal.callbacks.size,1);
normal.document.hidden=true;normal.document.handlers.visibilitychange();assert.equal(normal.callbacks.size,0);normal.document.hidden=false;normal.document.handlers.visibilitychange();assert.equal(normal.callbacks.size,1);
normal.media.matches=true;normal.media.change();assert.equal(normal.callbacks.size,0);assert.equal(normal.nodes.main.className,'ready');
const reduced=setup(true);assert.equal(reduced.nodes.main.className,'ready');assert.equal(reduced.callbacks.size,0);reduced.click('#replay');assert.equal(reduced.callbacks.size,0);
console.log('PASS: sequence, visible bounded guide drift, begin event, replay, skip/focus, freeze/resume, hidden tab and reduced motion. Logic simulation.');

