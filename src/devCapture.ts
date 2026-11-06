// Development-only artifact export. No visible controls or production bundle code.
import html2canvas from 'html2canvas';
let busy=false;
let recording:MediaRecorder|null=null;
let stopTimer=0;
async function record(name:'idle'|'drag'|'trail'){
  const root=document.querySelector<HTMLElement>('#origin')!;
  const source=root.querySelector('canvas');
  if(!source||typeof MediaRecorder==='undefined'){root.dataset.recordingError='Recording unsupported';return;}
  busy=true;
  try{
    const stream=source.captureStream(20);
    const chunks:BlobPart[]=[];
    recording=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:2_000_000});
    recording.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
    recording.onstop=async()=>{
      for(const track of stream.getTracks())track.stop();
      try{
        const result=await fetch(`/__qa/recording?name=${name}`,{method:'POST',headers:{'Content-Type':'video/webm'},body:new Blob(chunks,{type:'video/webm'})});
        if(!result.ok)throw new Error('Recording export failed');
        root.dataset.recording=`${name}:saved`;
      }catch{root.dataset.recordingError='Recording export failed';}finally{recording=null;busy=false;}
    };
    recording.start(250);root.dataset.recording=`${name}:recording`;
    stopTimer=window.setTimeout(()=>{if(recording?.state==='recording')recording.stop();},5000);
  }catch{busy=false;root.dataset.recordingError='Recording unsupported';}
}
async function capture(event:KeyboardEvent){
  if(!(event.altKey&&event.shiftKey)||busy)return;
  const recordings:Record<string,'idle'|'drag'|'trail'>={KeyI:'idle',KeyD:'drag',KeyT:'trail'};
  if(recordings[event.code]){event.preventDefault();void record(recordings[event.code]);return;}
  if(event.code!=='KeyS')return;
  event.preventDefault();busy=true;
  const root=document.querySelector<HTMLElement>('#origin')!;
  try{
    await document.fonts.ready;
    const canvas=await html2canvas(root,{backgroundColor:'#000000',scale:1,logging:false,foreignObjectRendering:true});
    const name=innerWidth<760?'mobile':'desktop';
    const response=await fetch('/__qa/snapshot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,image:canvas.toDataURL('image/png')})});
    if(!response.ok)throw new Error('Artifact export failed');
    root.dataset.lastCapture=name;
  }catch(error){root.dataset.captureError=error instanceof Error?error.message:'Capture failed';}
  finally{busy=false;}
}
window.addEventListener('keydown',capture);
if(import.meta.hot)import.meta.hot.dispose(()=>{window.removeEventListener('keydown',capture);clearTimeout(stopTimer);if(recording?.state==='recording')recording.stop();});
