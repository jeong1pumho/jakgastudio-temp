const {root,key,ready,query,send,admin,selected}=require('../lib/core');
const {cleanHtml}=require('../lib/rich');
const MAX_PHOTOS=20;
module.exports=async(req,res)=>{try{
 if(req.method==='GET'&&req.query.action==='config')return send(res,200,{configured:ready(),url:root(),key:key(),maxPhotos:MAX_PHOTOS});
 if(req.method==='POST'&&req.body?.action==='login'){
  const data=await query('/auth/v1/token?grant_type=password','POST',{email:req.body.email,password:req.body.password});
  const token=data?.access_token;await admin({headers:{authorization:'Bearer '+token}});
  return send(res,200,{token,expires_in:data.expires_in});
 }
 const token=await admin(req);
 if(req.method==='GET'){
  const items=await query('/rest/v1/news_posts?select='+selected+'&order=updated_at.desc&limit=200','GET',undefined,token);
  return send(res,200,{items});
 }
 if(['POST','PATCH'].includes(req.method)){
  const b=req.body||{};const title=String(b.title||'').trim();
  if(title.length<2||title.length>150)return send(res,400,{error:'제목은 2~150자'});
  const content=cleanHtml(String(b.content||'').slice(0,100000));
  if(content.length>60000)return send(res,400,{error:'본문 길이를 줄여주세요'});
  const images=b.images||[];
  if(!Array.isArray(images)||images.length>MAX_PHOTOS)return send(res,400,{error:'사진은 최대 20장입니다'});
  const prefix=root()+'/storage/v1/object/public/news-media/';
  if(!images.every(x=>typeof x==='string'&&x.startsWith(prefix)&&x.length<1000))return send(res,400,{error:'허용되지 않은 사진 주소'});
  const slug=String(b.slug||('news-'+Date.now())).toLowerCase().trim();
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return send(res,400,{error:'URL 주소 오류'});
  const status=String(b.status||'ongoing');
  if(!['ongoing','ended'].includes(status))return send(res,400,{error:'게시 상태 오류'});
  const cover_index=images.length?Math.max(0,Math.min(images.length-1,Number(b.cover_index)||0)):0;
  const post={slug,title,content,images,cover_index,status,sort_order:Number(b.sort_order)||0};
  if(req.method==='PATCH'){
   if(!/^[a-f0-9-]{36}$/i.test(b.id||''))return send(res,400,{error:'ID 오류'});
   const rows=await query('/rest/v1/news_posts?select=id,published_at&id=eq.'+encodeURIComponent(b.id),'GET',undefined,token);
   if(!rows?.length)return send(res,404,{error:'게시물을 찾을 수 없음'});
   if(status==='ongoing'&&!rows[0].published_at)post.published_at=new Date().toISOString();
   const updated=await query('/rest/v1/news_posts?id=eq.'+encodeURIComponent(b.id)+'&select=*','PATCH',post,token);
   return send(res,200,{item:updated[0]});
  }
  post.published_at=new Date().toISOString();
  const added=await query('/rest/v1/news_posts?select=*','POST',post,token);
  return send(res,201,{item:added[0]});
 }
 if(req.method==='DELETE'){
  const id=req.query.id;if(!/^[a-f0-9-]{36}$/i.test(id||''))return send(res,400,{error:'ID 오류'});
  await query('/rest/v1/news_posts?id=eq.'+encodeURIComponent(id),'DELETE',undefined,token);
  return send(res,200,{ok:true});
 }
 return send(res,405,{error:'Method not allowed'});
}catch(e){return send(res,e.status||500,{error:e.status>=500?'서버 오류가 발생했습니다.':e.message})}};