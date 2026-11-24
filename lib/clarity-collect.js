'use strict';
const {timingSafeEqual}=require('node:crypto');
const {query,send}=require('./core');
function equal(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);}
module.exports=async(req,res)=>{
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const cron=process.env.CRON_SECRET;
 if(!cron||!equal(req.headers.authorization,'Bearer '+cron))return send(res,401,{error:'Unauthorized'});
 if(process.env.VERCEL_ENV!=='production')return send(res,403,{error:'Production only'});
 const token=process.env.CLARITY_API_TOKEN,project=process.env.CLARITY_PROJECT_ID,secret=process.env.VISIT_ANALYTICS_INGEST_SECRET;
 if(!token||!project||!secret)return send(res,200,{status:'unconfigured',requests:0});
 let calls=0,activeDimension;
 try{
  const reserved=await query('/rest/v1/rpc/reserve_clarity_daily','POST',{p_secret:secret});
  if(reserved!==true)return send(res,200,{status:'already_reserved',requests:0});
  for(const dimension of ['Overall','Channel','Source','URL']){
   activeDimension=dimension;
   const url=new URL('https://www.clarity.ms/export-data/api/v1/project-live-insights');
   url.searchParams.set('numOfDays','3');if(dimension!=='Overall')url.searchParams.set('dimension1',dimension);
   ++calls;
   const response=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('Clarity HTTP '+response.status);
   const data=await response.json();const traffic=Array.isArray(data)&&data.find(metric=>metric?.metricName==='Traffic')?.information;
   const count=value=>(typeof value==='number'||typeof value==='string'&&value.trim()!=='')&&Number.isSafeInteger(Number(value))&&Number(value)>=0;
   if(!Array.isArray(traffic)||!traffic.every(row=>count(row?.totalSessionCount))
     ||dimension==='Overall'&&(traffic.length!==1||!count(traffic[0].distinctUserCount??traffic[0].distantUserCount)))
    throw Error('Unexpected Clarity Traffic response');
   await query('/rest/v1/rpc/store_clarity_snapshot_72h','POST',{p_secret:secret,p_dimension:dimension,p_payload:data});
  }
  return send(res,200,{status:'stored',requests:calls});
 }catch(e){
  if(activeDimension){
   try{await query('/rest/v1/rpc/store_clarity_snapshot_72h','POST',{p_secret:secret,p_dimension:activeDimension,p_payload:[{collectionFailed:true}]});}catch{}
  }
  return send(res,502,{status:'failed',requests:calls,error:String(e.message).slice(0,100)});}
};