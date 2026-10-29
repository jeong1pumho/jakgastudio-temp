'use strict';
const root=()=>String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const key=()=>process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||'';
const ready=()=>!!(root()&&key());
const send=(res,status,obj)=>res.status(status).setHeader('Cache-Control','no-store').json(obj);
async function query(path,method='GET',body,token){if(!ready())throw Object.assign(Error('Supabase configuration missing'),{status:503});
const headers={apikey:key(),Accept:'application/json'};
if(token)headers.Authorization='Bearer '+token;
if(body!==undefined)headers['Content-Type']='application/json';
if(method==='POST'||method==='PATCH')headers.Prefer='return=representation';
const r=await fetch(root()+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
const str=await r.text();let data;try{data=str?JSON.parse(str):null}catch{data=str}
if(!r.ok)throw Object.assign(Error(data?.message||data?.msg||String(str).slice(0,200)||'Supabase failed'),{status:r.status});
return data;}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function admin(req){const h=String(req.headers.authorization||'');if(!h.startsWith('Bearer '))throw Object.assign(Error('로그인이 필요합니다.'),{status:401});
const jwt=h.slice(7);const user=await query('/auth/v1/user','GET',undefined,jwt);
if(!user?.id)throw Object.assign(Error('인증에 실패했습니다.'),{status:401});
const rows=await query('/rest/v1/news_admins?select=user_id&user_id=eq.'+encodeURIComponent(user.id),'GET',undefined,jwt);
if(!rows?.length)throw Object.assign(Error('관리자 권한이 없습니다.'),{status:403});return jwt;}
const selected='id,slug,title,content,images,cover_index,status,sort_order,published_at,created_at,updated_at';
module.exports={root,key,ready,send,query,esc,admin,selected};