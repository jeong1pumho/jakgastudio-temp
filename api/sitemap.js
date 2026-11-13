'use strict';
const {query,ready}=require('../lib/core');
const {origin,xmlEscape,isoDate}=require('../lib/seo');
const {programs}=require('../lib/programs-page');
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
    const urls=[{path:'/'},{path:'/news'},{path:'/calendar'},{path:'/books'},{path:'/space'},{path:'/programs'},{path:'/visit'}];
    urls.push(...programs.map(program=>({path:'/programs/'+program.slug})));
    const books=await query('/rest/v1/recommended_books?select=id,updated_at&published=eq.true&limit=1000');
    for(const book of books)urls.push({path:'/books/'+book.id,lastmod:isoDate(book.updated_at)});
    const seen=new Set();
    for(const p of posts){
      if(!['ongoing','ended'].includes(p.status)||!p.published_at||!SLUG.test(String(p.slug||''))||seen.has(p.slug))continue;
      seen.add(p.slug);
      urls.push({path:'/news/'+encodeURIComponent(p.slug),lastmod:isoDate(p.updated_at||p.published_at)});
    }
    // Only genuinely listed, public-facing meetings and special events get
    // individual SEO URLs; private rentals, closures and auto free slots do not.
    const todayParts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());
    const todayValue=k=>Number(todayParts.find(p=>p.type===k)?.value||0);
    const y=todayValue('year'),m=todayValue('month'),d=todayValue('day');
    const today=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const future=new Date(Date.UTC(y,m+3,1)).toISOString().slice(0,10);
    const events=await query('/rest/v1/schedule_events?select=id,event_date,category,updated_at'+
      '&event_date=gte.'+today+'&event_date=lt.'+future+
      '&category=in.(meeting,custom)&order=event_date.asc,start_time.asc&limit=300');
    for(const event of events){
      if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(event.id||'')))continue;
      urls.push({path:'/calendar/events/'+event.id,lastmod:isoDate(event.updated_at)});
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
