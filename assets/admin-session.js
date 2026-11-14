/* Admin credentials are scoped to this browser tab session. */
(function(){
 'use strict';
 const KEY='jakgastudio-temp.admin-auth.v1';
 const headroom=45000;
 let pending=null;

 function stored(){
  try{
   const data=JSON.parse(sessionStorage.getItem(KEY));
   return data?.token&&Number.isFinite(data.expiresAt)?data:null;
  }catch{return null;}
 }
 function clear(){try{sessionStorage.removeItem(KEY);}catch{}}
 function read(){
  const data=stored();
  return data&&(data.refreshToken||data.expiresAt>Date.now())?data.token:null;
 }
 function save(token,seconds,refreshToken){
  const ttl=Number(seconds);
  if(typeof token!=='string'||!token||!Number.isFinite(ttl)||ttl<=0)return false;
  try{
   sessionStorage.setItem(KEY,JSON.stringify({token,expiresAt:Date.now()+ttl*1000,refreshToken}));
   return true;
  }catch{return false;}
 }
 function error(message,status){return Object.assign(Error(message),{status});}
 async function refresh(data){
  const response=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({action:'refresh',refresh_token:data.refreshToken})});
  const result=await response.json().catch(()=>({}));
  if(stored()?.refreshToken!==data.refreshToken)throw error('다시 로그인해 주세요.',401);
  if(!response.ok){
   if(response.status===401||response.status===403)clear();
   throw error(result.error||'로그인 세션을 갱신하지 못했습니다.',response.status);
  }
  if(!result.refresh_token||!save(result.token,result.expires_in,result.refresh_token))
   throw error('갱신한 로그인 세션을 저장하지 못했습니다.',503);
  return result.token;
 }
 async function token(){
  const data=stored();
  if(data&&(data.expiresAt>Date.now()+headroom||(!data.refreshToken&&data.expiresAt>Date.now())))return data.token;
  if(!data?.refreshToken)throw error('다시 로그인해 주세요.',401);
  if(pending?.refreshToken!==data.refreshToken){
   const attempt={refreshToken:data.refreshToken};
   pending=attempt;
   attempt.promise=refresh(data).finally(()=>{if(pending===attempt)pending=null;});
  }
  return pending.promise;
 }
 window.JAKAdminSession=Object.freeze({read,save,clear,token});
})();
