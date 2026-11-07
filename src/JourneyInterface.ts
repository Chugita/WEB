import {answers,question,branchPoints,normalizedScroll,journeyPose,type AnswerId} from './JourneyController';
import {composition} from './config/originVisualConfig';
export class JourneyInterface{
  progress=0;hover=-1;selected=-1;
  buttons:HTMLButtonElement[];
  private abort=new AbortController();
  private hint:HTMLElement;private section:HTMLElement;private heading:HTMLElement;private advance:HTMLButtonElement;
  private focusQuestion=false;private previousVisible=false;
  constructor(private root:HTMLElement,onSelect:(index:number)=>void,private reduced:()=>boolean){
    this.buttons=Array.from(root.querySelectorAll<HTMLButtonElement>('.answer-orb'));
    this.hint=root.querySelector('#scroll-hint')!;this.section=root.querySelector('#junction')!;this.heading=root.querySelector('#question')!;this.advance=root.querySelector('#advance')!;
    const events={signal:this.abort.signal};
    this.buttons.forEach((button,i)=>{
      button.addEventListener('pointerenter',()=>this.hover=i,events);button.addEventListener('pointerleave',()=>this.hover=-1,events);
      button.addEventListener('focus',()=>this.hover=i,events);button.addEventListener('blur',()=>this.hover=-1,events);
      button.addEventListener('click',()=>{
        this.selected=i;onSelect(i);
        root.querySelector('#status')!.textContent=`Elegiste «${answers[i].label}». Podés volver al nodo para cambiar la opción.`;
        document.dispatchEvent(new CustomEvent('sinapsis:decision',{detail:{question:'future-goal',answer:answers[i].id,label:answers[i].label}}));
      },events);
    });
    this.advance.addEventListener('click',()=>{this.focusQuestion=true;window.scrollTo({top:document.documentElement.scrollHeight-innerHeight,behavior:this.reduced()?'auto':'smooth'});},events);
    root.querySelector('#return')!.addEventListener('click',()=>window.scrollTo({top:0,behavior:this.reduced()?'auto':'smooth'}),events);
    const read=()=>this.progress=normalizedScroll(scrollY,document.documentElement.scrollHeight,innerHeight);
    window.addEventListener('scroll',read,{...events,passive:true});window.addEventListener('resize',read,events);read();
  }
  update(width:number,height:number){
    const layout=composition(width,height),pose=journeyPose(this.progress,layout.scale,layout.centerY);
    this.hint.style.opacity=String(pose.hint);this.advance.hidden=pose.junction>.9;
    const visible=pose.junction>.7;
    if(visible!==this.previousVisible){this.section.hidden=!visible;this.previousVisible=visible;}
    if(visible){
      this.section.style.opacity=String(pose.junction);
      const points=branchPoints(layout.mobile),pixels=height/layout.viewHeight;
      this.buttons.forEach((button,i)=>{
        const p=points[i];button.style.left=`${width/2+p.x*pixels}px`;button.style.top=`${height/2-(p.y-pose.cameraY)*pixels}px`;
        button.style.width=`${(layout.mobile?.92:1.36)*pixels}px`;button.style.height=`${(layout.mobile?.68:.88)*pixels}px`;
        button.classList.toggle('selected',this.selected===i);button.classList.toggle('dim',this.selected>=0&&this.selected!==i);button.setAttribute('aria-pressed',String(this.selected===i));
      });
      if(this.focusQuestion&&pose.junction>.98){this.heading.focus({preventScroll:true});this.focusQuestion=false;}
    }
    return{layout,pose};
  }
  resetSelection(){this.selected=-1;this.root.querySelector('#status')!.textContent='';delete this.root.dataset.selected;for(const button of this.buttons){button.setAttribute('aria-pressed','false');button.classList.remove('selected','dim');}}
  dispose(){this.abort.abort();}
}

