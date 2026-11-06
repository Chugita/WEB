module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if(req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({error:'Method not allowed'});
  }
  const base = process.env.SUPABASE_URL;
  if(!base) return res.status(200).json({status:'ok',version:'0.2.0',supabase:'not_configured'});
  try {
    const url=new URL(base);
    if(url.protocol!=='https:' || !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname)) throw new Error('Invalid configured endpoint');
    // Public JWKS health check. No user data, privileged key, table or account required.
    const response=await fetch(new URL('/auth/v1/.well-known/jwks.json',url),{signal:AbortSignal.timeout(4000)});
    if(!response.ok) throw new Error('Service unavailable');
    const body=await response.json();
    if(!Array.isArray(body.keys)) throw new Error('Unexpected response');
    return res.status(200).json({status:'ok',version:'0.2.0',supabase:'reachable'});
  }catch{
    return res.status(503).json({status:'degraded',version:'0.2.0',supabase:'unavailable'});
  }
};
