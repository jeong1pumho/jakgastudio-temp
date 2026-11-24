'use strict';
const {query}=require('../lib/core');
const {linkColumns,postPath}=require('../lib/calendar-news');
const {publicCalendarEnd}=require('../lib/public-calendar-range');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Robots-Tag','noindex, follow');
 if(req.method!=='GET'&&req.method!=='HEAD')return res.status(405).end();
 const id=req.query?.event_id;
 if(!id)return res.redirect(302,'/calendar');
 if(!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id))return res.status(404).end();
 try{
  const rows=await query('/rest/v1/schedule_events?select=id,'+linkColumns+'&id=eq.'+id+
   '&category=in.(meeting,custom)&event_date=gte.2026-10-22&event_date=lt.'+publicCalendarEnd()+'&limit=1');
  if(!rows.length)return res.status(404).end();
  const href=postPath(rows[0]);
  if(href)return res.redirect(302,href);
  return res.status(410).send('개별 행사 안내가 종료되었습니다. <a href="/calendar">월간 캘린더 보기</a>');
 }catch{return res.status(503).end();}
};
