/* Session shared by the two administrators on the test origin only.
   Stored in sessionStorage (cleared when the browser tab session ends).
   Every private API request still verifies the Supabase token and admin role. */
(function(){
 'use strict';
 const KEY='jakgastudio-temp.admin-auth.v1';
 const headroom=45*1000;
 function clear(){try{sessionStorage.removeItem(KEY);}catch{}}
 function read(){
   try{
     const raw=sessionStorage.getItem(KEY);
     if(!raw)return null;
     const data=JSON.parse(raw);
     if(!data||typeof data.token!=='string'||!data.token||
       !Number.isFinite(data.expiresAt)||data.expiresAt<=Date.now()+headroom){
       clear();return null;
     }
     return data.token;
   }catch{clear();return null;}
 }
 function save(token,seconds){
   if(typeof token!=='string'||!token)return false;
   const ttl=Number(seconds);
   if(!Number.isFinite(ttl)||ttl<=0)return false;
   try{sessionStorage.setItem(KEY,JSON.stringify({token,expiresAt:Date.now()+ttl*1000}));return true;}
   catch{return false;}
 }
 window.JAKAdminSession=Object.freeze({read,save,clear});
})();
