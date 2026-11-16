'use strict';
// Public ownership key; not a credential for user accounts.
// IndexNow is used only on the live domain after authenticated CMS updates.
const {isProduction}=require('./seo');
const KEY='65642d34b176c5ec2dca3f500044a9ee';
const HOST='www.jakgastudio.com';
const ROOT='https://'+HOST;
const ENDPOINT='https://api.indexnow.org/indexnow';
async function notify(req,paths){
 if(!isProduction(req))return {skipped:'non-production'};
 const urls=[...new Set((paths||[]).filter(path=>
  typeof path==='string'&&path.startsWith('/')&&!path.startsWith('//')&&path.length<=2048
 ).map(path=>ROOT+path))];
 if(!urls.length)return {skipped:'no-urls'};
 try{
  const response=await fetch(ENDPOINT,{
   method:'POST',
   headers:{'Content-Type':'application/json; charset=utf-8'},
   body:JSON.stringify({host:HOST,key:KEY,keyLocation:ROOT+'/'+KEY+'.txt',urlList:urls}),
   signal:AbortSignal.timeout(2500)
  });
  if(response.status!==200&&response.status!==202){
   console.warn('IndexNow submission was not accepted:',response.status);
   return {accepted:false,status:response.status};
  }
  return {accepted:true,status:response.status};
 }catch(error){
  console.warn('IndexNow notification unavailable:',error.name||'network');
  return {accepted:false};
 }
}
module.exports={notify};
