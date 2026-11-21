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
 let calls=0;
 try{
  const reserved=await query('/rest/v1/rpc/reserve_clarity_daily','POST',{p_secret:secret});
  if(reserved!==true)return send(res,200,{status:'already_reserved',requests:0});
  for(const dimension of ['Overall','Channel','Source','URL']){
   const url=new URL('https://www.clarity.ms/export-data/api/v1/project-live-insights');
   url.searchParams.set('numOfDays','1');if(dimension!=='Overall')url.searchParams.set('dimension1',dimension);
   ++calls;
   const response=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('Clarity HTTP '+response.status);
   const data=await response.json();if(!Array.isArray(data))throw Error('Unexpected response');
   await query('/rest/v1/rpc/store_clarity_snapshot','POST',{p_secret:secret,p_dimension:dimension,p_payload:data});
  }
  return send(res,200,{status:'stored',requests:calls});
 }catch(e){return send(res,502,{status:'failed',requests:calls,error:String(e.message).slice(0,100)});}
};