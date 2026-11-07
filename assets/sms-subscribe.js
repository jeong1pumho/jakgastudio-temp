(()=>{
 'use strict';
 const ENDPOINT="https://qrbavxempotptnmflqoq.supabase.co/functions/v1/studio-sms-news";
 const $=id=>document.getElementById(id);
 const dlg=$("sms-subscribe-dialog");if(!dlg)return;
 let mode="subscribe",challengeId=null,expiry=0,lastRequest=0;
 const steps=[$("sms-step-one"),$("sms-step-two"),$("sms-step-done")];
 const buttons=[$("sms-request-btn"),$("sms-verify-btn")];
 const feedback=(t)=>{$("sms-feedback").textContent=t||"";$("sms-feedback").hidden=!t;};
 function show(n){steps.forEach((el,i)=>el.hidden=i!==n);feedback("");}
 function busy(button,on){button.disabled=on;button.setAttribute("aria-busy",on?"true":"false");}
 function open(nextMode){
  mode=nextMode;challengeId=null;expiry=0;
  $("sms-subscribe-form").reset();$("sms-verify-form").reset();
  const unsub=nextMode==="unsubscribe";
  $("sms-dialog-title").textContent=unsub?"문자 알림 해지":"빠르게 소식 받기";
  $("sms-dialog-desc").textContent=unsub?"문자 알림을 해지하려면 등록한 휴대폰 번호를 인증해 주세요.":"회원가입은 필요하지 않습니다.\n새로운 독서모임, 글쓰기 클래스와 특별행사 소식을 무료로 알려드립니다.";
  $("sms-name-field").hidden=unsub;$("sms-user-name").required=!unsub;
  $("sms-consent-block").hidden=unsub;$("sms-privacy-accept").required=!unsub;$("sms-marketing-accept").required=!unsub;
  $("sms-verify-btn").textContent=unsub?"인증 확인 및 알림 해지":"인증 확인 및 신청 완료";
  $("sms-request-btn").textContent="인증번호 받기";
  show(0);dlg.showModal();$(unsub?"sms-user-phone":"sms-user-name").focus();
 }
 async function post(body){
  let result;try{result=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});}
  catch{throw Error("문자 알림 서버에 연결할 수 없습니다.");}
  let data={};try{data=await result.json();}catch{}
  if(!result.ok)throw Error(data.error||"요청을 처리하지 못했습니다.");
  return data;
 }
 $("sms-subscribe-open")?.addEventListener("click",()=>open("subscribe"));
 $("sms-unsubscribe-open")?.addEventListener("click",()=>open("unsubscribe"));
 $("sms-dialog-close").addEventListener("click",()=>dlg.close());
 $("sms-done-close").addEventListener("click",()=>dlg.close());
 dlg.addEventListener("close",()=>{challengeId=null;feedback("");});
 $("sms-privacy-toggle").addEventListener("click",()=>{
  const details=$("sms-privacy-detail");details.hidden=!details.hidden;
  $("sms-privacy-toggle").setAttribute("aria-expanded",String(!details.hidden));
  $("sms-privacy-toggle").textContent=details.hidden?"개인정보 수집·이용 안내 보기 ▾":"개인정보 수집·이용 안내 접기 ▴";
 });
 $("sms-subscribe-form").addEventListener("submit",async event=>{
  event.preventDefault();if(Date.now()-lastRequest<1000)return;
  const name=$("sms-user-name").value.trim(),phone=$("sms-user-phone").value.replace(/\D/g,"");
  if(!/^01[016789]\d{7,8}$/.test(phone))return feedback("국내 휴대폰 번호를 확인해 주세요.");
  if(mode==="subscribe"&&(!$("sms-privacy-accept").checked||!$("sms-marketing-accept").checked))return feedback("두 가지 필수 동의를 확인해 주세요.");
  busy(buttons[0],true);feedback("");lastRequest=Date.now();
  try{
   const r=await post({action:"request_otp",name,phone,purpose:mode,privacyAgree:$("sms-privacy-accept").checked,marketingAgree:$("sms-marketing-accept").checked});
   if(!r.challengeId)return feedback("등록된 번호라면 인증 문자가 발송됩니다. 문제가 계속되면 작가작업실에 문의해 주세요.");
   challengeId=r.challengeId;expiry=Date.now()+180000;
   $("sms-phone-preview").textContent=phone.slice(0,3)+"-"+phone.slice(3,7)+"-"+phone.slice(7);
   show(1);$("sms-otp-input").focus();
  }catch(e){feedback(e.message);}
  finally{busy(buttons[0],false);}
 });
 $("sms-verify-form").addEventListener("submit",async event=>{
  event.preventDefault();
  if(!challengeId)return feedback("먼저 인증번호를 받아 주세요.");
  if(Date.now()>expiry)return feedback("인증번호 유효기간이 지났습니다. 번호를 다시 입력해 주세요.");
  const code=$("sms-otp-input").value.trim();
  if(!/^\d{6}$/.test(code))return feedback("인증번호는 숫자 6자리입니다.");
  busy(buttons[1],true);feedback("");
  try{
   const r=await post({action:"verify_otp",challengeId,code});
   $("sms-done-title").textContent=r.purpose==="unsubscribe"?"문자 알림 해지 완료":"소식 받기 신청 완료!";
   $("sms-done-copy").textContent=r.message;
   challengeId=null;show(2);
  }catch(e){feedback(e.message);}
  finally{busy(buttons[1],false);}
 });
 $("sms-back").addEventListener("click",()=>{challengeId=null;show(0);});
})();