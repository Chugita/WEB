(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const canvas = $('#origin'), ctx = canvas.getContext('2d');
  const field = $('.neural-field'), main = $('main');
  const skip = $('#skip'), replay = $('#replay'), pause = $('#pause'), status = $('#status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width=0, height=0, frame=null, last=null, elapsed=0, ready=false, paused=reduced.matches;
  let accumulator=0;
  const total=4.8;
  const strands=Array.from({length:82},(_,i)=>({a:i*2.399963,span:.2+((i*71)%100)/180,bend:Math.sin(i*7.1)*.65,warm:i%10<3}));
  const motes=Array.from({length:170},(_,i)=>({a:i*2.399963,r:Math.sqrt(((i*67)%173)/173),speed:.25+((i*13)%60)/100,size:i%17===0?1.5:.4+(i%3)*.2}));
  function glow(x,y,r,alpha,color='255,177,128') {
    if(!ctx||r<=0||alpha<=0)return;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.14,`rgba(${color},${alpha*.5})`);g.addColorStop(1,`rgba(${color},0)`);
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function finish(announce=false){
    ready=true;elapsed=Math.max(elapsed,total);main.className='ready';skip.hidden=true;replay.hidden=false;
    if(announce){status.textContent='Introducción finalizada.';$('#begin').focus({preventScroll:true});}
    draw();
  }
  function resize(){
    width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);
    draw();
  }
  function draw(){
    const t=elapsed,cx=width*.5,cy=height*.352;
    // Composited macro-depth imagery plus animated light, not a video or mockup.
    const reveal=ready?1:Math.min(1,Math.max(0,(t-1.7)/1.45));
    field.style.opacity=String(reveal);
    if(!ctx)return;
    ctx.clearRect(0,0,width,height);
    ctx.globalCompositeOperation='lighter';
    if(!ready&&t>.18&&t<1.8){
      const phase=(t-.18)/1.62, spread=1-Math.pow(1-phase,3);
      const alpha=Math.pow(Math.sin(Math.PI*phase),.8);
      const reach=Math.min(width*.68,height*.7);
      strands.forEach((s,i)=>{
        const len=reach*s.span*spread,x=cx+Math.cos(s.a)*len,y=cy+Math.sin(s.a)*len*.7;
        const color=s.warm?'255,181,131':'162,133,255';
        ctx.lineWidth=i%8===0?1.2:.5;ctx.strokeStyle=`rgba(${color},${alpha*(i%3===0?.66:.3)})`;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.bezierCurveTo(cx+Math.cos(s.a+s.bend)*len*.3,cy+Math.sin(s.a+s.bend)*len*.3,x-Math.sin(s.a)*len*.16,y+Math.cos(s.a)*len*.16,x,y);ctx.stroke();
        glow(x,y,i%8===0?11:4,alpha*.7,color);
      });
      motes.forEach((m,i)=>{
        const d=reach*m.r*spread,x=cx+Math.cos(m.a)*d,y=cy+Math.sin(m.a)*d*.72;
        ctx.fillStyle=`rgba(255,${i%4===0?'221,209':'179,128'},${alpha*(1-m.r*.5)})`;
        ctx.beginPath();ctx.arc(x,y,m.size,0,Math.PI*2);ctx.fill();
      });
      glow(cx,cy,85,alpha*.65);glow(cx,cy,27,alpha*.95,'255,217,182');glow(cx,cy,9,alpha,'255,247,237');
    }
    if(t>.15){
      const fade=ready?1:Math.min(1,(t-.15)*2);
      const breath=.8+Math.sin(t*1.3)*.15;
      glow(cx,cy,35,fade*breath*.25);glow(cx,cy,11,fade*.48,'255,213,196');
      if(ready||t>1.7){
        ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.sin(t*.21)*.3);
        ctx.strokeStyle=`rgba(255,221,196,${.3*fade})`;ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(0,0,Math.max(8,Math.min(width,height)*.014),Math.max(4,Math.min(width,height)*.008),-.5,.2,5);ctx.stroke();ctx.restore();
        motes.slice(0,50).forEach((m,i)=>{
          const orbit=(m.r*115+12)*(width<600?.65:1);
          const a=m.a+t*.015*m.speed,x=cx+Math.cos(a)*orbit,y=cy+Math.sin(a)*orbit*.5;
          const brightness=(.22+Math.sin(t*m.speed+i)*.15)*fade;
          ctx.fillStyle=`rgba(255,191,151,${brightness})`;ctx.beginPath();ctx.arc(x,y,m.size*.6,0,Math.PI*2);ctx.fill();
        });
      }
    }
    ctx.globalCompositeOperation='source-over';
  }
  function tick(now){
    frame=null;if(document.hidden||paused){last=null;return;}
    const delta=last===null?0:Math.min((now-last)/1000,.1);last=now;elapsed+=delta;accumulator+=delta;
    // 30fps ceiling, bounded particles, capped resolution; suspended in hidden tabs.
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
