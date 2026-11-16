'use strict';
const {query,ready}=require('../lib/core');
const {origin,xmlEscape,isoDate}=require('../lib/seo');
const {programs}=require('../lib/programs-page');
const {publicCalendarEnd}=require('../lib/public-calendar-range');

// Only indexable canonical routes. /programs redirects to /programs/bookstore.
const STATIC_PATHS=['/','/news','/calendar','/books','/space','/visit'];
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const PAGE_SIZE=500;
const MAX_URLS=50000;
async function allRows(baseQuery){
  const rows=[];
  for(let offset=0;offset<MAX_URLS;offset+=PAGE_SIZE){
    const batch=await query(baseQuery+'&limit='+PAGE_SIZE+'&offset='+offset);
    if(!Array.isArray(batch))throw Error('Unexpected sitemap data');
    rows.push(...batch);
    if(batch.length<PAGE_SIZE)return rows;
  }
  // Never return silently truncated sitemaps. Split into a sitemap index first.
  throw Error('Sitemap requires splitting: exceeds safe pagination bound');
}
function koreaToday(now=new Date()){
  const p=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const v=k=>p.find(item=>item.type===k)?.value||'';
  return v('year')+'-'+v('month')+'-'+v('day');
}
function toXml(base,entries){
  if(entries.length>MAX_URLS)throw Error('Sitemap exceeds XML URL limit');
  const seen=new Set();
  const lines=[];
  for(const item of entries){
    if(!item?.path || seen.has(item.path))continue;
    seen.add(item.path);
    lines.push('  <url><loc>'+xmlEscape(base+item.path)+'</loc>'+
      (item.lastmod?'<lastmod>'+xmlEscape(item.lastmod)+'</lastmod>':'')+'</url>');
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n'+
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
    lines.join('\n')+'\n</urlset>';
}
async function build(now=new Date()){
  const urls=STATIC_PATHS.map(path=>({path}));
  urls.push(...programs.map(program=>({path:'/programs/'+program.slug})));

  const [books,posts,events]=await Promise.all([
    allRows('/rest/v1/recommended_books?select=id,updated_at&published=eq.true&order=id.asc'),
    allRows('/rest/v1/news_posts?select=slug,status,published_at,updated_at&status=in.(ongoing,ended)&published_at=not.is.null&order=published_at.desc,id.desc'),
    allRows('/rest/v1/schedule_events?select=id,event_date,category,updated_at'+
      '&event_date=gte.'+koreaToday(now)+'&event_date=lt.'+publicCalendarEnd(now)+
      '&category=in.(meeting,custom)&order=event_date.asc,start_time.asc,id.asc')
  ]);

  for(const book of books){
    if(!UUID.test(String(book.id||'')))continue;
    urls.push({path:'/books/'+book.id,lastmod:isoDate(book.updated_at)});
  }
  for(const post of posts){
    if(!SLUG.test(String(post.slug||''))||!['ongoing','ended'].includes(post.status)||!post.published_at)continue;
    urls.push({path:'/news/'+post.slug,lastmod:isoDate(post.updated_at||post.published_at)});
  }
  for(const event of events){
    if(!UUID.test(String(event.id||''))||!['meeting','custom'].includes(event.category))continue;
    urls.push({path:'/calendar/events/'+event.id,lastmod:isoDate(event.updated_at)});
  }
  return toXml(origin(),urls);
}
module.exports=async(req,res)=>{
  if(req.method!=='GET')return res.status(405).end();
  if(req.query?._format==='rss')return require('../lib/rss')(req,res);
  if(!ready())return res.status(503).send('Sitemap temporarily unavailable');
  try{
    const xml=await build();
    res.setHeader('Content-Type','application/xml; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
    return res.status(200).send(xml);
  }catch(error){
    console.error('Sitemap generation failed:',error.status||500);
    return res.status(503).send('Sitemap temporarily unavailable');
  }
};
module.exports.build=build;
module.exports.toXml=toXml;
module.exports.koreaToday=koreaToday;
