'use strict';
const {createSign}=require('node:crypto');
const {admin,send}=require('./core');

const TEST_HOST='jakgastudio-temp.vercel.app';
const endpoint='https://oauth2.googleapis.com/token';
const labels={
 directions_click:'지도·길찾기 클릭',phone_click:'전화 클릭',contact_click:'이메일 클릭',
 sms_signup_open:'문자 신청 열기',sms_signup_complete:'문자 신청 완료',
 calendar_day_select:'캘린더 날짜 선택',event_detail_open:'행사 상세 클릭',
 program_detail_open:'프로그램 상세 클릭',book_detail_open:'도서 상세 클릭'
};
const dateRanges=[{startDate:'7daysAgo',endDate:'yesterday'}];
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

async function summary(property,accessToken){
 const dimensionFilter={filter:{fieldName:'hostName',stringFilter:{matchType:'EXACT',value:TEST_HOST}}};
 const report=(extra)=>({dateRanges,dimensionFilter,...extra});
 const top=(name)=>report({dimensions:dimensions(name),metrics:metrics('sessions'),limit:3,
  orderBys:[{metric:{metricName:'sessions'},desc:true}]});
 const response=await fetch('https://analyticsdata.googleapis.com/v1beta/properties/'+property+':batchRunReports',{
  method:'POST',headers:{Authorization:'Bearer '+accessToken,'Content-Type':'application/json'},
  body:JSON.stringify({requests:[
   report({metrics:metrics('sessions','screenPageViews','userEngagementDuration')}),
   top('sessionSource'),top('landingPage'),
   report({dimensions:dimensions('eventName'),metrics:metrics('eventCount'),
    dimensionFilter:{andGroup:{expressions:[dimensionFilter,{filter:{fieldName:'eventName',inListFilter:{values:Object.keys(labels)}}}]}}})
  ]}),signal:AbortSignal.timeout(10000)
 });
 const data=await response.json();
 if(!response.ok||data.reports?.length!==4)throw Error('GA4 report failed');
 const [totals,sources,landings,events]=data.reports;
 const [sessions=0,views=0,seconds=0]=(totals.rows?.[0]?.metricValues||[]).map(item=>Number(item.value));
 const rows=report=>(report.rows||[]).map(row=>({label:row.dimensionValues[0].value,count:Number(row.metricValues[0].value)}));
 const counts=Object.fromEntries(rows(events).map(row=>[row.label,row.count]));
 return {status:'ready',sessions,views,averageSeconds:sessions?Math.round(seconds/sessions):0,
  sources:rows(sources),landings:rows(landings),actions:Object.entries(labels).map(([name,label])=>({label,count:counts[name]||0}))};
}

module.exports=async(req,res)=>{
 if(req.headers.host!==TEST_HOST)return send(res,404,{error:'찾을 수 없습니다.'});
 if(req.method!=='GET')return send(res,405,{error:'지원하지 않는 요청입니다.'});
 const id=process.env.GA4_TEST_MEASUREMENT_ID||'';
 const measurementId=/^G-[A-Z0-9]+$/.test(id)?id:null;
 if(req.query?.report!=='1')return send(res,200,{measurementId});
 try{await admin(req);}catch(error){
  return send(res,error.status||503,{error:'관리자 권한을 확인할 수 없습니다.'});
 }
 if(!measurementId)return send(res,200,{status:'unconfigured'});
 const {GA4_TEST_PROPERTY_ID:property,GA4_TEST_CLIENT_EMAIL:email,GA4_TEST_PRIVATE_KEY:key}=process.env;
 if(!/^\d+$/.test(property||'')||!email||!key)return send(res,200,{status:'report_unconfigured'});
 try{return send(res,200,await summary(property,await getAccessToken(email,key)));}
 catch{return send(res,502,{error:'GA4 보고서를 불러오지 못했습니다.'});}
};
