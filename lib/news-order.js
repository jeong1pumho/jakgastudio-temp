'use strict';
const {query,selected}=require('./core');
const descending=(a,b)=>String(b||'').localeCompare(String(a||''));
function compareEnded(a,b){
 return (Number(b.sort_order)||0)-(Number(a.sort_order)||0)
  ||descending(a.event_date_end||a.event_date_start,b.event_date_end||b.event_date_start)
  ||descending(a.published_at,b.published_at)
  ||descending(a.created_at,b.created_at)||descending(a.id,b.id);
}
async function loadEnded(page=1,pageSize=6,rental=false){
 const filter='&published_at=not.is.null&status=eq.ended'+(rental?'&operator_type=eq.rental':'');
 const metadata=[];
 // Sort the full lightweight index before pagination; only load bodies for this page.
 for(let offset=0;;){
  const rows=await query('/rest/v1/news_posts?select=id,sort_order,event_date_start,event_date_end,published_at,created_at'+filter+'&order=id.asc&limit=200&offset='+offset);
  if(!Array.isArray(rows))throw Error('Invalid event list');
  if(!rows.length)break;
  metadata.push(...rows);offset+=rows.length;
  if(rows.length<200)break;
 }
 metadata.sort(compareEnded);
 const total=metadata.length,pages=Math.max(1,Math.ceil(total/pageSize));
 if(page>pages)throw Object.assign(Error('Missing page'),{status:404});
 const chosen=metadata.slice((page-1)*pageSize,page*pageSize);
 if(!chosen.length)return {items:[],page,pages,total};
 const ids=chosen.map(row=>row.id);
 if(!ids.every(id=>/^[a-f0-9-]{36}$/i.test(id)))throw Error('Invalid event id');
 const rows=await query('/rest/v1/news_posts?select='+selected+filter+'&id=in.('+ids.join(',')+')');
 const byId=new Map(rows.map(row=>[row.id,row]));
 return {items:ids.map(id=>byId.get(id)).filter(Boolean),page,pages,total};
}
module.exports={compareEnded,loadEnded};
