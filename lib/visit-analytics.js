'use strict';
const {admin,query,send}=require('./core');
const host=process.env.SUPABASE_URL?.includes('qrbavxempotptnmflqoq.supabase.co')?'jakgastudio-temp.vercel.app':'www.jakgastudio.com';
const permitted=/^\/(?:$|news(?:\/[a-z0-9-]{1,90})?|books(?:\/[a-z0-9-]{1,90})?|calendar(?:\/events\/[a-f0-9-]{36})?|programs(?:\/[a-z0-9-]{1,90})?|space|visit)$/i;
const knownPath=/^\/(?:|space|visit|calendar|news(?:\/news-\d{1,18})?|books(?:\/[a-f0-9-]{36})?|programs(?:\/(?:bookstore|book-club|writing-class|space-rental|event-planning))?)$/;
function publicPath(path){return knownPath.test(path)?path:'/'+path.split('/')[1]}
async function all(path,token){
 const result=[];for(let offset=0;;offset+=500){
  const list=await query(path+(path.includes('?')?'&':'?')+'limit=500&offset='+offset,'GET',undefined,token);
  if(!Array.isArray(list))throw Error('Unexpected report response');result.push(...list);if(list.length<500)break;
 }return result;
}
module.exports=async(req,res)=>{
 try{
  if(req.headers.host!==host)return send(res,404,{error:'Not found'});
  if(req.method==='GET'&&req.query?.config==='2'){
   return send(res,200,{ga:null,clarity:null});
  }
  if(req.method==='GET'&&req.query?.config==='1'){
   return send(res,200,{projectId:null});
  }
  if(req.method==='POST'){
   if(/(?:^|;\s*)jakgastudio_analytics_excluded_v1=1(?:;|$)/.test(req.headers.cookie||''))return send(res,202,{ok:true});
   if(req.headers.origin&&req.headers.origin!=='https://'+host)return send(res,403,{error:'Origin blocked'});
   if(!['same-origin','none',undefined].includes(req.headers['sec-fetch-site']))return send(res,403,{error:'Request blocked'});
   if(Number(req.headers['content-length'])>1400)return send(res,413,{error:'Too large'});
   const secret=process.env.VISIT_ANALYTICS_INGEST_SECRET;
   if(!secret)return send(res,503,{error:'Not configured'});
   const b=req.body||{};
   const sources=new Set(['직접·확인 불가','Kakao','직접 방문','사이트 내부','기타 외부','출처 미확인','Google','Naver','Instagram','Threads','naver','google','instagram','threads','kakao']);
   const clicks=new Set(['문자 클릭','문자 신청 완료','전화 클릭','이메일 클릭','길찾기 클릭','내부 링크 클릭','문자 신청 열기','캘린더 날짜']);
   const route=typeof b.detail==='string'?b.detail.split('|'):[];
   const levels=new Set(['0','10','30','60','120','300','600']);
   const prior=route[2]?route[2].split(','):[];
   const validRoute=route.length===4&&route[0]==='route'&&sources.has(route[1])&&levels.has(route[3])&&prior.length<=8&&prior.every(step=>{
    const [path,level,...extra]=step.split('~');
    return !extra.length&&knownPath.test(path)&&levels.has(level);
   });
   if((b.kind==='page_view'&&!sources.has(b.detail))||(b.kind==='click'&&!clicks.has(b.detail)&&!(typeof b.detail==='string'&&/^(메뉴|링크) /.test(b.detail)&&permitted.test(b.detail.slice(3))))||(b.kind==='transition'&&!validRoute&&!permitted.test(b.detail)))return send(res,400,{error:'Invalid analytics detail'});
   if(!['page_view','click','transition'].includes(b.kind)||typeof b.path!=='string'||!permitted.test(b.path)
    ||typeof b.detail!=='string'||b.detail.length<1||b.detail.length>160||/[?#<>\x00-\x1f]/.test(b.detail))
    return send(res,400,{error:'Invalid event'});
   let detail=b.kind==='transition'&&!validRoute?publicPath(b.detail):b.detail;
   if(b.kind==='click'&&/^(메뉴|링크) /.test(detail))detail=detail.slice(0,3)+publicPath(detail.slice(3));
   if(b.kind==='click'&&sources.has(b.entry))detail+='|'+b.entry;
   if(b.kind==='page_view'){
    const campaign=b.campaign||'';
    if(typeof campaign!=='string'||campaign&&!/^(?:booknight|jangsakkunclub|readingclub|bookclub|writing|rental|studio)(?:-20\d{4})?(?:\/(?:feed|story|reel|profile|post|poster)(?:-[1-9]\d?)?)?$/.test(campaign))return send(res,400,{error:'Invalid campaign'});
    const hour=String((new Date().getUTCHours()+9)%24).padStart(2,'0');
    const platform=req.headers['sec-ch-ua-mobile'];
    const ua=String(req.headers['user-agent']||'');
    const device=/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)?'태블릿':platform==='?1'||/Mobile|iPhone/i.test(ua)?'모바일':platform==='?0'||/Windows NT|Macintosh|X11|CrOS/i.test(ua)?'PC':'미확인';
    const country=req.headers['x-vercel-ip-country']||'';
    detail=[detail,hour,campaign,/^[A-Z]{2}$/.test(country)?country:'미확인',device,['start','continue'].includes(b.visit)?b.visit:'unknown'].join('|');
   }
   await query('/rest/v1/rpc/record_visit_aggregate','POST',{p_secret:secret,p_kind:b.kind,p_path:publicPath(b.path),p_detail:detail});
   return send(res,202,{ok:true});
  }
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  const jwt=await admin(req);
  const from=new Date(Date.now()-65*86400000).toISOString().slice(0,10);
  const [counts,posts,books]=await Promise.all([
   all('/rest/v1/visit_daily_counts?select=day,kind,path,detail,event_count&day=gte.'+from+'&order=day.desc,kind,path,detail',jwt),
   all('/rest/v1/news_posts?select=slug,title&published_at=not.is.null&order=slug',jwt),
   all('/rest/v1/recommended_books?select=id,title&published=eq.true&order=id',jwt)
  ]);
  return send(res,200,{status:'ready',counts,titles:Object.fromEntries([...posts.map(x=>['/news/'+x.slug,x.title]),...books.map(x=>['/books/'+x.id,x.title])])});
 }catch(e){return send(res,[401,403].includes(e.status)?e.status:502,{error:[401,403].includes(e.status)?e.message:'방문 통계를 불러오지 못했습니다.'});}
};