(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const canvas = $('#origin'), ctx = canvas.getContext('2d');
  const field = $('.neural-field'), main = $('main');
  const skip = $('#skip'), replay = $('#replay'), pause = $('#pause'), status = $('#status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width=0, height=0, frame=null, last=null, elapsed=0, ready=false, paused=reduced.matches;
  let accumulator=0;
  const total=4.8, tau=Math.PI*2;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  // Stable seeds, several depth planes, no allocations or random changes per frame.
  const strands=Array.from({length:112},(_,i)=>({
    angle:i*2.399963, length:.28+((i*71)%101)/135,
    bend:Math.sin(i*7.1)*.85, depth:.45+(i%7)/8, warm:i%10<4
  }));
  const motes=Array.from({length:240},(_,i)=>({
    angle:i*2.399963, radius:Math.sqrt(((i*67)%241)/241),
    speed:.3+((i*13)%60)/100, size:i%19===0?1.7:.35+(i%3)*.25
  }));
  function glow(x,y,r,alpha,color='255,177,128') {
    if(!ctx||r<=0||alpha<=0)return;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,`rgba(${color},${alpha})`);
    g.addColorStop(.17,`rgba(${color},${alpha*.45})`);
    g.addColorStop(1,`rgba(${color},0)`);
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function finish(announce=false){
    ready=true;elapsed=Math.max(elapsed,total);main.className='ready';skip.hidden=true;replay.hidden=false;
    if(announce){status.textContent='Introducción finalizada.';$('#begin').focus({preventScroll:true});}
    draw();
  }
  function resize(){
    width=innerWidth;height=innerHeight;
    const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);
    // Remove the baked nucleus from the depth image; only the live orb remains.
    const coverScale=Math.max(width/1672,height/941);
    field.style.setProperty?.('--core-hole',`${Math.max(21,coverScale*28)}px`);
    draw();
  }
  function burst(t,cx,cy){
    // Compress → luminous release → trailing filaments → silence.
    if(t<.18||t>2.08)return;
    const compression=clamp((t-.18)/.3);
    if(t<.48){
      glow(cx,cy,30-18*compression,.22+compression*.6,'235,191,255');
      glow(cx,cy,7,.35+compression*.6,'255,237,218');
      return;
    }
    const age=t-.48, expansion=1-Math.exp(-age*3.3);
    const fade=1-smooth((age-.58)/1.02);
    const attack=1-Math.exp(-age*26);
    const alpha=fade*attack;
    const reach=Math.min(width*.66,height*.74);
    glow(cx,cy,155*expansion+15,alpha*.36,'183,128,241');
    glow(cx,cy,105*expansion+8,alpha*.78);
    strands.forEach((s,i)=>{
      const angle=s.angle+Math.sin(age*1.4+i)*.06;
      const distance=reach*s.length*expansion*s.depth;
      const ex=cx+Math.cos(angle)*distance,ey=cy+Math.sin(angle)*distance*.73;
      const bx=cx+Math.cos(angle+s.bend)*distance*.42;
      const by=cy+Math.sin(angle+s.bend)*distance*.42;
      const color=s.warm?'255,183,135':'173,145,255';
      ctx.lineWidth=i%9===0?1.4:.35+s.depth*.35;
      ctx.strokeStyle=`rgba(${color},${alpha*(i%9===0?.8:.29)*s.depth})`;
      ctx.beginPath();ctx.moveTo(cx,cy);
      ctx.bezierCurveTo(bx,by,ex-Math.sin(angle)*distance*.17,ey+Math.cos(angle)*distance*.17,ex,ey);ctx.stroke();
      if(i%4===0){
        ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(bx,by);
        ctx.quadraticCurveTo(ex,ey,ex+Math.cos(angle+.5)*distance*.2,ey+Math.sin(angle+.5)*distance*.14);ctx.stroke();
      }
      if(i%9===0)glow(ex,ey,9+s.depth*5,alpha*.7,color);
    });
    motes.forEach((m,i)=>{
      const d=reach*m.radius*expansion*(.6+m.speed*.7);
      const angle=m.angle+Math.sin(age+i)*.025;
      const x=cx+Math.cos(angle)*d,y=cy+Math.sin(angle)*d*.72;
      ctx.strokeStyle=`rgba(${i%4===0?'194,168,255':'255,191,144'},${alpha*(.35+m.radius*.4)})`;
      ctx.lineWidth=m.size*.65;ctx.beginPath();
      const tail=(2+m.radius*12)*(1-clamp(age/1.6));
      ctx.moveTo(x-Math.cos(angle)*tail,y-Math.sin(angle)*tail*.72);ctx.lineTo(x,y);ctx.stroke();
    });
    glow(cx,cy,40,alpha*.95,'255,213,181');
    glow(cx,cy,13,alpha,'255,245,225');
    glow(cx,cy,4,alpha,'255,255,250');
  }
  function guide(t,cx,cy,reveal){
    const life=Math.max(0,t-2.1);
    const amount=smooth(life/2.4),mobile=width<600?.7:1;
    const x=cx+amount*mobile*(Math.sin(life*.54)*23+Math.sin(life*.91)*5);
    const y=cy+amount*mobile*(Math.sin(life*.43)*17+Math.sin(life*.78)*4);
    const breath=1+Math.sin(life*1.5)*.09;
    const radius=Math.max(13,Math.min(width,height)*.025)*breath;
    const visibility=ready?1:smooth((t-2.1)/.55);
    if(!visibility)return;
    // Connect the fixed depth layer to the drifting living nucleus.
    for(let i=0;i<12;i++){
      const a=i*tau/12+.2,reach=82+(i%3)*24;
      const ax=cx+Math.cos(a)*reach,ay=cy+Math.sin(a)*reach*.64;
      const color=i%3===0?'251,192,146':'177,143,236';
      ctx.strokeStyle=`rgba(${color},${reveal*visibility*(i%3===0?.33:.16)})`;ctx.lineWidth=.55;
      ctx.beginPath();ctx.moveTo(ax,ay);
      ctx.bezierCurveTo(ax+Math.sin(life*.4+i)*22,ay+Math.cos(life*.35+i)*16,x+Math.cos(a+.5)*30,y+Math.sin(a+.5)*22,x,y);ctx.stroke();
    }
    glow(cx,cy,62,.1*reveal*visibility,'179,133,214');
    glow(x,y,radius*5,.36*visibility);
    glow(x,y,radius*2.5,.55*visibility,'255,190,148');
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=visibility;
    // Volumetric membrane, warm white heart and intertwined internal light.
    const sphere=ctx.createRadialGradient(-radius*.28,-radius*.3,.4,0,0,radius);
    sphere.addColorStop(0,'rgba(255,255,244,.98)');
    sphere.addColorStop(.23,'rgba(255,226,194,.87)');
    sphere.addColorStop(.62,'rgba(255,173,156,.4)');
    sphere.addColorStop(.86,'rgba(200,149,255,.22)');
    sphere.addColorStop(1,'rgba(255,220,188,.8)');
    ctx.fillStyle=sphere;ctx.beginPath();ctx.arc(0,0,radius,0,tau);ctx.fill();
    for(let i=0;i<4;i++){
      ctx.save();ctx.rotate(life*.1+i*.8);
      ctx.strokeStyle=i%2?'rgba(224,189,255,.65)':'rgba(255,239,206,.85)';ctx.lineWidth=.6;
      ctx.beginPath();ctx.ellipse(0,0,radius*(.84+Math.sin(life*.5+i)*.08),radius*(.3+Math.sin(life*.35+i)*.1),i*.5,0,tau);ctx.stroke();ctx.restore();
    }
    ctx.restore();
    glow(x-radius*.15,y-radius*.15,radius*.43,.8*visibility,'255,249,230');
    motes.slice(0,38).forEach((m,i)=>{
      const d=radius*1.7+m.radius*48,a=m.angle+life*.055*m.speed;
      const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d*.6;
      const alpha=(.2+Math.sin(life*m.speed+i)*.14)*visibility;
      ctx.fillStyle=`rgba(255,197,157,${alpha})`;ctx.beginPath();ctx.arc(px,py,m.size*.55,0,tau);ctx.fill();
    });
  }
  function draw(){
    const cx=width*.5,cy=height*.352,t=elapsed;
    const reveal=ready?1:smooth((t-2.3)/.85);
    field.style.opacity=String(reveal);
    if(!ctx)return;
    ctx.clearRect(0,0,width,height);ctx.globalCompositeOperation='lighter';
    if(!ready)burst(t,cx,cy);
    guide(t,cx,cy,reveal);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  function tick(now){
    frame=null;if(document.hidden||paused){last=null;return;}
    const delta=last===null?0:Math.min((now-last)/1000,.1);last=now;elapsed+=delta;accumulator+=delta;
    if(accumulator>=1/30){
      accumulator%=1/30;
      if(!ready&&elapsed>=3.15)main.className='message';
      if(!ready&&elapsed>=total)finish();
      draw();
    }
    frame=requestAnimationFrame(tick);
  }
  function loop(){if(frame===null&&!paused&&!document.hidden){last=null;frame=requestAnimationFrame(tick);}}
  function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;}
  skip.addEventListener('click',()=>finish(true));
  replay.addEventListener('click',()=>{
    if(reduced.matches){status.textContent='Movimiento reducido activado: se muestra la apertura sin animación.';return;}
    stop();elapsed=0;accumulator=0;ready=false;paused=false;main.className='intro';skip.hidden=false;replay.hidden=true;pause.textContent='Pausar movimiento';skip.focus({preventScroll:true});status.textContent='Reproduciendo introducción.';draw();loop();
  });
  pause.addEventListener('click',()=>{
    paused=!paused;pause.textContent=paused?'Activar movimiento':'Pausar movimiento';
    if(paused){stop();if(!ready)finish();}else loop();
  });
  $('#begin').addEventListener('click',()=>{
    document.dispatchEvent(new CustomEvent('sinapsis:begin'));
    status.textContent='La siguiente etapa todavía no está disponible en esta primera versión.';
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else loop();});
  reduced.addEventListener('change',()=>{if(reduced.matches){paused=true;stop();finish();pause.textContent='Activar movimiento';}});
  addEventListener('resize',resize,{passive:true});
  resize();
  if(reduced.matches||!ctx){finish();pause.textContent='Activar movimiento';}else loop();
})();
