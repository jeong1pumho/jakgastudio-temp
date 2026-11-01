'use strict';
const {admin,query,send}=require('../lib/core');
const columns='id,event_date,category,category_label,title,start_time,end_time,created_at,updated_at';
const validId=s=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s);
function validDate(s){
  if(typeof s!=='string'||! /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s))return false;
  const d=new Date(s+'T00:00:00Z');
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;
}
function validTime(s){return typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);}
function monthRange(value){
  if(typeof value!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(value))return null;
  const [y,m]=value.split('-').map(Number);
  if(y<2000||y>2100)return null;
  return {start:value+'-01',end:new Date(Date.UTC(y,m,1)).toISOString().slice(0,10)};
}
module.exports=async(req,res)=>{
 try{
  const token=await admin(req);
  if(req.method==='GET'){
   const range=monthRange(req.query?.month);
   if(!range)return send(res,400,{error:'월을 YYYY-MM 형식으로 선택해 주세요.'});
   const items=await query('/rest/v1/schedule_events?select='+columns+
     '&event_date=gte.'+range.start+'&event_date=lt.'+range.end+
     '&order=event_date.asc,start_time.asc&limit=500','GET',undefined,token);
   return send(res,200,{items,month:req.query.month});
  }
  if(req.method==='DELETE'){
   const id=req.query?.id;
   if(!validId(id))return send(res,400,{error:'잘못된 일정 ID입니다.'});
   const rows=await query('/rest/v1/schedule_events?select=id&id=eq.'+id,'GET',undefined,token);
   if(!rows.length)return send(res,404,{error:'일정을 찾을 수 없습니다.'});
   await query('/rest/v1/schedule_events?id=eq.'+id,'DELETE',undefined,token);
   return send(res,200,{ok:true});
  }
  if(req.method!=='POST'&&req.method!=='PATCH')return send(res,405,{error:'허용되지 않은 요청입니다.'});
  const b=req.body||{};
  if(!validDate(b.event_date))return send(res,400,{error:'올바른 일정 날짜를 선택해 주세요.'});
  if(!['meeting','rental','custom','closure'].includes(b.category))return send(res,400,{error:'일정 구분을 선택해 주세요. 자유방문은 자동 계산됩니다.'});
  const title=String(b.title||'').trim();
  if(title.length<1||title.length>150)return send(res,400,{error:'일정 제목은 1~150자로 입력해 주세요.'});
  const category_label=b.category==='custom'?String(b.category_label||'').trim():null;
  if(b.category==='custom'&&(category_label.length<1||category_label.length>50))
   return send(res,400,{error:'추가 구분 이름은 1~50자로 입력해 주세요.'});
  const isClosure=b.category==='closure';
  if(!isClosure&&(!validTime(b.start_time)||!validTime(b.end_time)||b.end_time<=b.start_time))
   return send(res,400,{error:'시간을 24시간 형식(HH:MM)으로 입력해 주세요. 종료시간은 시작시간보다 늦어야 합니다.'});
  // A closure always occupies the complete date and blocks all other events.
  const post={event_date:b.event_date,category:b.category,category_label,title,
    start_time:isClosure?'00:00:00':b.start_time+':00',
    end_time:isClosure?'24:00:00':b.end_time+':00',updated_at:new Date().toISOString()};
  if(req.method==='PATCH'){
   if(!validId(b.id))return send(res,400,{error:'잘못된 일정 ID입니다.'});
   const rows=await query('/rest/v1/schedule_events?select=id&id=eq.'+b.id,'GET',undefined,token);
   if(!rows.length)return send(res,404,{error:'수정할 일정을 찾을 수 없습니다.'});
   const updated=await query('/rest/v1/schedule_events?id=eq.'+b.id+'&select='+columns,'PATCH',post,token);
   return send(res,200,{item:updated[0]});
  }
  const added=await query('/rest/v1/schedule_events?select='+columns,'POST',post,token);
  return send(res,201,{item:added[0]});
 }catch(e){
  if(e.status===409)return send(res,409,{error:'이미 등록된 일정과 시간이 겹칩니다. 다른 시간으로 수정해 주세요.'});
  return send(res,e.status||500,{error:e.status>=500?'일정 처리 중 서버 오류가 발생했습니다.':e.message});
 }
};
