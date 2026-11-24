'use strict';
const {admin,query,send}=require('./core');
const host='jakgastudio-temp.vercel.app';
const permitted=/^\/(?:$|news(?:\/[a-z0-9-]{1,90})?|books(?:\/[a-z0-9-]{1,90})?|calendar(?:\/events\/[a-f0-9-]{36})?|programs(?:\/[a-z0-9-]{1,90})?|space|visit)$/i;
async function all(path,token){
 const result=[];for(let offset=0;offset<5000;offset+=500){
  const list=await query(path+(path.includes('?')?'&':'?')+'limit=500&offset='+offset,'GET',undefined,token);
  if(!Array.isArray(list))throw Error('Unexpected report response');result.push(...list);if(list.length<500)break;
 }return result;
}
module.exports=async(req,res)=>{
 try{
  if(req.headers.host!==host)return send(res,404,{error:'Not found'});
  if(req.method==='GET'&&req.query?.config==='1'){
   const id=process.env.CLARITY_PROJECT_ID||'';
   return send(res,200,{projectId:/^[a-z0-9]{5,24}$/i.test(id)?id:null});
  }
  if(req.method==='POST'){
   if(/(?:^|;\s*)jakgastudio_analytics_excluded_v1=1(?:;|$)/.test(req.headers.cookie||''))return send(res,202,{ok:true});
   if(req.headers.origin&&req.headers.origin!=='https://'+host)return send(res,403,{error:'Origin blocked'});
   if(!['same-origin','none',undefined].includes(req.headers['sec-fetch-site']))return send(res,403,{error:'Request blocked'});
   if(Number(req.headers['content-length'])>1400)return send(res,413,{error:'Too large'});
   const secret=process.env.VISIT_ANALYTICS_INGEST_SECRET;
   if(!secret)return send(res,503,{error:'Not configured'});
   const b=req.body||{};
   const sources=new Set(['직접 방문','사이트 내부','기타 외부','출처 미확인','Google','Naver','Instagram','Threads','naver','google','instagram','threads','kakao']);
   const clicks=new Set(['전화 클릭','이메일 클릭','길찾기 클릭','내부 링크 클릭','문자 신청 열기','캘린더 날짜']);
   if((b.kind==='page_view'&&!sources.has(b.detail))||(b.kind==='click'&&!clicks.has(b.detail))||(b.kind==='transition'&&!permitted.test(b.detail)))return send(res,400,{error:'Invalid analytics detail'});
   if(!['page_view','click','transition'].includes(b.kind)||typeof b.path!=='string'||!permitted.test(b.path)
    ||typeof b.detail!=='string'||b.detail.length<1||b.detail.length>160||/[?#<>\x00-\x1f]/.test(b.detail))
    return send(res,400,{error:'Invalid event'});
   await query('/rest/v1/rpc/record_visit_aggregate','POST',{p_secret:secret,p_kind:b.kind,p_path:b.path,p_detail:b.detail});
   return send(res,202,{ok:true});
  }
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  const jwt=await admin(req);
  const from=new Date(Date.now()-31*86400000).toISOString().slice(0,10);
  const [counts,snapshots]=await Promise.all([
   all('/rest/v1/visit_daily_counts?select=day,kind,path,detail,event_count&day=gte.'+from+'&order=day.desc',jwt),
   all('/rest/v1/visit_clarity_snapshots?select=day_utc,dimension,collected_at,window_days,payload&window_days=eq.3&order=day_utc.desc',jwt)
  ]);
  const latest={};
  const day=snapshots[0]?.day_utc;
  for(const x of snapshots)if(x.day_utc===day)latest[x.dimension]=x;
  // Allow the daily 01:00 UTC cron hour to finish before marking a run overdue.
  const expected=new Date(Date.now()-2*3600000).toISOString().slice(0,10);
  const failed=Object.values(latest).some(row=>row.payload?.[0]?.collectionFailed===true);
  const status=failed?'failed':!day?'waiting':day<expected?'overdue':['Overall','Channel','Source','URL'].every(k=>latest[k])?'ready':'partial';
  return send(res,200,{status:'ready',counts,clarity:{
   projectConfigured:!!process.env.CLARITY_PROJECT_ID,apiConfigured:!!process.env.CLARITY_API_TOKEN,latest,status
  }});
 }catch(e){return send(res,[401,403].includes(e.status)?e.status:502,{error:[401,403].includes(e.status)?e.message:'방문 통계를 불러오지 못했습니다.'});}
};