'use strict';
const {query,ready}=require('../lib/core');
const {origin,xmlEscape,isoDate}=require('../lib/seo');
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
module.exports=async(req,res)=>{
  if(req.method!=='GET')return res.status(405).end();
  if(!ready())return res.status(503).send('Database not configured');
  try{
    const base=origin(req);
    const posts=[];
    for(let offset=0;offset<10000;offset+=500){
      const rows=await query('/rest/v1/news_posts?select=slug,status,published_at,updated_at,created_at&status=in.(ongoing,ended)&published_at=not.is.null&order=published_at.desc&limit=500&offset='+offset);
      posts.push(...rows);
      if(rows.length<500)break;
    }
    const urls=[{path:'/'},{path:'/news'}];
    const seen=new Set();
    for(const p of posts){
      if(!['ongoing','ended'].includes(p.status)||!p.published_at||!SLUG.test(String(p.slug||''))||seen.has(p.slug))continue;
      seen.add(p.slug);
      urls.push({path:'/news/'+encodeURIComponent(p.slug),lastmod:isoDate(p.updated_at||p.published_at)});
    }
    const xml='<?xml version="1.0" encoding="UTF-8"?>\n'+
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
      urls.map(({path,lastmod})=>'  <url><loc>'+xmlEscape(base+path)+'</loc>'+(lastmod?'<lastmod>'+xmlEscape(lastmod)+'</lastmod>':'')+'</url>').join('\n')+
      '\n</urlset>';
    res.setHeader('Content-Type','application/xml; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
    return res.status(200).send(xml);
  }catch(error){
    return res.status(error.status||500).send('Sitemap temporarily unavailable');
  }
};
