import './styles/origin.css';
import {mountOriginScene} from './OriginScene';
const root=document.querySelector<HTMLElement>('#origin')!;
const qa=import.meta.env.DEV?new URLSearchParams(location.search):null;
const scene=mountOriginScene(root,{quality:'auto',forceFallback:qa?.has('fallback'),reducedMotion:qa?.has('reduced')?true:undefined});
if(import.meta.hot)import.meta.hot.dispose(()=>scene.dispose());
