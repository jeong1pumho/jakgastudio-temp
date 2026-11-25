'use strict';
const {createSign}=require('node:crypto');
const {admin,send}=require('./core');

const SITE_HOST=process.env.SUPABASE_URL?.includes('qrbavxempotptnmflqoq.supabase.co')?'jakgastudio-temp.vercel.app':'www.jakgastudio.com';
const endpoint='https://oauth2.googleapis.com/token';

const metrics=(...names)=>names.map(name=>({name}));
const dimensions=(...names)=>names.map(name=>({name}));
let cachedToken;

async function getAccessToken(email,key){
 if(cachedToken?.expiresAt>Date.now()+60000)return cachedToken.token;
 const now=Math.floor(Date.now()/1000);
 const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const claim=encode({alg:'RS256',typ:'JWT'})+'.'+encode({
  iss:email,scope:'https://www.googleapis.com/auth/analytics.readonly',aud:endpoint,iat:now,exp:now+3600
 });
 const jwt=claim+'.'+createSign('RSA-SHA256').update(claim).sign(key.replace(/\\n/g,'\n'),'base64url');
 const response=await fetch(endpoint,{method:'POST',body:new URLSearchParams({
  grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt
 }),signal:AbortSignal.timeout(8000)});
 const result=await response.json();
 if(!response.ok||!result.access_token)throw Error('GA4 authorization failed');
 cachedToken={token:result.access_token,expiresAt:Date.now()+Number(result.expires_in)*1000};
 return cachedToken.token;
}

async function summary(property,accessToken,period){
 const kstDay=offset=>new Date(Date.now()+(9-offset*24)*3600000).toISOString().slice(0,10);
 const range=period==='yesterday'?[1,1]:period==='today'?[0,0]:period==='30'?[29,0]:[6,0];
 const dateRanges=[{startDate:kstDay(range[0]),endDate:kstDay(range[1])}];
 const dimensionFilter={filter:{fieldName:'hostName',stringFilter:{matchType:'EXACT',value:SITE_HOST}}};
 const report=(extra)=>({dateRanges,dimensionFilter,...extra});
 const top=(name)=>report({dimensions:dimensions(name),metrics:metrics('sessions'),limit:100,
  orderBys:[{metric:{metricName:'sessions'},desc:true}]});
 const response=await fetch('https://analyticsdata.googleapis.com/v1beta/properties/'+property+':batchRunReports',{
  method:'POST',headers:{Authorization:'Bearer '+accessToken,'Content-Type':'application/json'},
  body:JSON.stringify({requests:[
   report({metrics:metrics('sessions')}),
   top('country'),top('region'),top('deviceCategory'),report({metrics:metrics('totalUsers')})
  ]}),signal:AbortSignal.timeout(10000)
 });
 const data=await response.json();
 if(!response.ok||data.reports?.length!==5)throw Error('GA4 report failed');
 const [totals,countries,regions,devices,users]=data.reports;
 const scalar=report=>{
  const raw=report.rows?.[0]?.metricValues?.[0]?.value;
  return raw!=null&&raw!==''&&Number.isFinite(Number(raw))?Number(raw):null;
 };
 const limited=data.reports.some(report=>report.metadata?.subjectToThresholding||report.metadata?.dataLossFromOtherRow||report.metadata?.samplingMetadatas?.length);
 const hasRows=data.reports.some(report=>report.rows?.length);
 const rows=report=>(report.rows||[]).map(row=>({label:row.dimensionValues[0].value,count:Number(row.metricValues[0].value)}));
 return {status:'ready',hasRows,limited,sessions:scalar(totals),visitors:scalar(users),countries:rows(countries),regions:rows(regions),devices:rows(devices)};
}

module.exports=async(req,res)=>{
 if(req.headers.host!==SITE_HOST)return send(res,404,{error:'찾을 수 없습니다.'});
 if(req.method!=='GET')return send(res,405,{error:'지원하지 않는 요청입니다.'});
 const id=process.env.GA4_MEASUREMENT_ID||'';
 const measurementId=/^G-[A-Z0-9]+$/.test(id)?id:null;
 if(req.query?.report!=='1')return send(res,200,{measurementId:null});
 try{await admin(req);}catch(error){
  return send(res,error.status||503,{error:'관리자 권한을 확인할 수 없습니다.'});
 }
 if(!measurementId)return send(res,200,{status:'unconfigured'});
 const {GA4_PROPERTY_ID:property,GA4_CLIENT_EMAIL:email,GA4_PRIVATE_KEY:key}=process.env;
 if(!/^\d+$/.test(property||'')||!email||!key)return send(res,200,{status:'report_unconfigured'});
 try{return send(res,200,await summary(property,await getAccessToken(email,key),req.query.period));}
 catch{return send(res,502,{error:'GA4 보고서를 불러오지 못했습니다.'});}
};
