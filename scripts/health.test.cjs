const assert=require('node:assert/strict');
const health=require('../api/health.js');
async function request(method='GET'){
  const result={headers:{},code:200};
  const res={setHeader:(k,v)=>result.headers[k]=v,status:code=>{result.code=code;return res;},json:body=>{result.body=body;return result;}};
  await health({method},res);return result;
}
(async()=>{
  const saved=process.env.SUPABASE_URL,originalFetch=global.fetch;
  try{
    delete process.env.SUPABASE_URL;
    assert.equal((await request()).body.supabase,'not_configured');
    assert.equal((await request('POST')).code,405);
    process.env.SUPABASE_URL='https://exampleproject.supabase.co';
    global.fetch=async()=>({ok:true,json:async()=>({keys:[]})});
    assert.equal((await request()).body.supabase,'reachable');
    global.fetch=async()=>{throw new Error('offline');};
    assert.equal((await request()).code,503);
    process.env.SUPABASE_URL='http://localhost:4000';
    assert.equal((await request()).code,503);
    console.log('PASS: unconfigured, method restriction, valid response, unavailable service and invalid endpoint. Mocked network.');
  }finally{
    global.fetch=originalFetch;if(saved===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=saved;
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
