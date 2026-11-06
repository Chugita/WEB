import {defineConfig} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const captureDirectory=process.env.ORIGIN_CAPTURE_DIR??fileURLToPath(new URL('./.review/',import.meta.url));
export default defineConfig({plugins:[{
  name:'local-review-artifacts',apply:'serve',
  configureServer(server){
    server.middlewares.use('/__qa/recording',async(req,res)=>{
      if(req.method!=='POST'){res.statusCode=405;res.end();return;}
      try{
        const origin=new URL(req.headers.origin??'https://invalid');
        const name=new URL(req.url??'/',origin).searchParams.get('name');
        if(!['127.0.0.1','localhost'].includes(origin.hostname)||origin.host!==req.headers.host||!['idle','drag','trail'].includes(name??'')){res.statusCode=403;res.end();return;}
        const chunks:Buffer[]=[];let size=0;
        for await(const part of req){const chunk=Buffer.from(part);size+=chunk.length;if(size>20_000_000)throw new Error('Too large');chunks.push(chunk);}
        const directory=captureDirectory;
        await mkdir(directory,{recursive:true});await writeFile(join(directory,`${name}.webm`),Buffer.concat(chunks));
        res.setHeader('Content-Type','application/json');res.end('{"saved":true}');
      }catch{res.statusCode=400;res.end('{"saved":false}');}
    });
    server.middlewares.use('/__qa/snapshot',async(req,res)=>{
      if(req.method!=='POST'){res.statusCode=405;res.end();return;}
      try{
        const origin=new URL(req.headers.origin??'https://invalid');
        if(!['127.0.0.1','localhost'].includes(origin.hostname)||origin.host!==req.headers.host){res.statusCode=403;res.end();return;}
        const chunks:Buffer[]=[];let size=0;
        for await(const part of req){const chunk=Buffer.from(part);size+=chunk.length;if(size>8_000_000)throw new Error('Too large');chunks.push(chunk);}
        const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if(!['desktop','mobile'].includes(data.name)||typeof data.image!=='string'||!data.image.startsWith('data:image/png;base64,'))throw new Error('Invalid capture');
        const directory=captureDirectory;
        await mkdir(directory,{recursive:true});await writeFile(join(directory,`${data.name}.png`),Buffer.from(data.image.slice(22),'base64'));
        res.setHeader('Content-Type','application/json');res.end('{"saved":true}');
      }catch{res.statusCode=400;res.end('{"saved":false}');}
    });
  }
}]});
