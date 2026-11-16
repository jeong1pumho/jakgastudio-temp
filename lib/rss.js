'use strict';
// Optional RSS 2.0 discovery feed for public NEWS posts, including full public body.
// This is not the canonical sitemap and never includes admin/draft content.
const {query,ready}=require('./core');
const {xmlEscape,origin}=require('./seo');
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const cdata=value=>'<![CDATA['+String(value??'').replaceAll(']]>',']]]]><![CDATA[>')+']]>';
const date=value=>{
 const d=new Date(value||'');
 return Number.isNaN(d.getTime())?'':d.toUTCString();
};
function build(posts){
 const base=origin();
 const entries=posts.filter(p=>SLUG.test(String(p.slug||''))&&['ongoing','ended'].includes(p.status)&&p.published_at);
 const items=entries.map(p=>{
  const url=base+'/news/'+p.slug;
  const publication=date(p.published_at);
  return '<item><title>'+xmlEscape(p.title||'')+'</title>'+
   '<link>'+xmlEscape(url)+'</link><guid isPermaLink="true">'+xmlEscape(url)+'</guid>'+
   (publication?'<pubDate>'+xmlEscape(publication)+'</pubDate>':'')+
   '<description>'+cdata(p.content||'')+'</description></item>';
 }).join('\n');
 return '<?xml version="1.0" encoding="UTF-8"?>\n'+
  '<rss version="2.0"><channel>'+
  '<title>작가작업실 제주 모임·행사</title>'+
  '<link>'+xmlEscape(base+'/news')+'</link>'+
  '<description>제주 이호테우 작가작업실 제주의 공개 모임 및 행사 소식</description>'+
  '<language>ko-KR</language>\n'+items+'\n</channel></rss>';
}
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).end();
 if(!ready())return res.status(503).send('RSS temporarily unavailable');
 try{
  const posts=await query('/rest/v1/news_posts?select=slug,title,content,status,published_at'+
   '&status=in.(ongoing,ended)&published_at=not.is.null'+
   '&order=published_at.desc,id.desc&limit=50');
  res.setHeader('Content-Type','application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
  return res.status(200).send(build(posts));
 }catch(error){
  console.error('RSS generation failed:',error.status||500);
  return res.status(503).send('RSS temporarily unavailable');
 }
};
module.exports.build=build;
