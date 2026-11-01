'use strict';
const {query,ready,send}=require('../lib/core');
const columns='id,event_date,category,category_label,title,start_time,end_time';
function monthRange(value){
  if(typeof value!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(value))return null;
  const [y,m]=value.split('-').map(Number);
  if(y<2000||y>2100)return null;
  const next=new Date(Date.UTC(y,m,1)).toISOString().slice(0,10);
  return {start:value+'-01',end:next};
}
module.exports=async(req,res)=>{
  try{
    if(req.method!=='GET')return send(res,405,{error:'허용되지 않은 요청입니다.'});
    if(!ready())return send(res,503,{error:'일정 데이터베이스가 연결되지 않았습니다.'});
    const range=monthRange(req.query?.month);
    if(!range)return send(res,400,{error:'조회할 월을 YYYY-MM 형식으로 입력해 주세요.'});
    const url='/rest/v1/schedule_events?select='+columns+
      '&event_date=gte.'+range.start+'&event_date=lt.'+range.end+
      '&order=event_date.asc,start_time.asc&limit=500';
    const items=await query(url);
    return send(res,200,{month:req.query.month,items});
  }catch(e){
    return send(res,e.status||500,{error:e.status>=500?'일정을 불러오는 중 오류가 발생했습니다.':e.message});
  }
};
