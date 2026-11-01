'use strict';
const {admin,query,send}=require('../lib/core');
const {cleanHtml}=require('../lib/rich');
const columns='id,event_date,category,category_label,title,start_time,end_time,created_at,updated_at';
const embed=columns+',schedule_event_memos(memo)';
const normalize=items=>items.map(({schedule_event_memos:note,...item})=>({...item,memo:cleanHtml(Array.isArray(note)?note[0]?.memo||'':note?.memo||'')}));
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
   const items=await query('/rest/v1/schedule_events?select='+embed+
     '&event_date=gte.'+range.start+'&event_date=lt.'+range.end+
     '&order=event_date.asc,start_time.asc&limit=500','GET',undefined,token);
   return send(res,200,{items:normalize(items),month:req.query.month});
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
  const memoInput=String(b.memo??'');
  if(memoInput.length>30000)return send(res,400,{error:'메모는 최대 30,000자까지 입력할 수 있습니다.'});
  const memo=cleanHtml(memoInput);
  if(memo.length>30000)return send(res,400,{error:'메모가 너무 깁니다. 서식을 줄여주세요.'});
  const id=req.method==='PATCH'?b.id:null;
  if(req.method==='PATCH'){
   if(!validId(id))return send(res,400,{error:'잘못된 일정 ID입니다.'});
   const rows=await query('/rest/v1/schedule_events?select=id&id=eq.'+id,'GET',undefined,token);
   if(!rows.length)return send(res,404,{error:'수정할 일정을 찾을 수 없습니다.'});
  }
  // Atomic insert/update of event + protected memo. DB exclusion guard remains active.
  const payload={
   p_id:id||null,p_event_date:b.event_date,p_category:b.category,
   p_category_label:category_label,p_title:title,
   p_start_time:isClosure?'00:00:00':b.start_time+':00',
   p_end_time:isClosure?'24:00:00':b.end_time+':00',
   p_memo:memo
  };
  const savedId=await query('/rest/v1/rpc/save_schedule_event','POST',payload,token);
  return send(res,req.method==='POST'?201:200,{item:{id:savedId,event_date:b.event_date,category:b.category,category_label,title,start_time:payload.p_start_time,end_time:payload.p_end_time,memo}});

 }catch(e){
  if(e.status===409)return send(res,409,{error:'이미 등록된 일정과 시간이 겹칩니다. 다른 시간으로 수정해 주세요.'});
  return send(res,e.status||500,{error:e.status>=500?'일정 처리 중 서버 오류가 발생했습니다.':e.message});
 }
};
