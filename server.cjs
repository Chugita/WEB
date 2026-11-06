const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'public');
const health=require('./api/health.js');
const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/assets/neural-origin-v2.png':'assets/neural-origin-v2.png'};
http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/api/health'){
    res.status=code=>{res.statusCode=code;return res;};
    res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
    return health(req,res);
  }
  const file=files[pathname];
  if(!file){res.writeHead(404);return res.end('Not found');}
  res.setHeader('Content-Type',file.endsWith('.png')?'image/png':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');
  fs.createReadStream(path.join(root,file)).pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
