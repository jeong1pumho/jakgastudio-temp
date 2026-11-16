'use strict';
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync(__dirname+'/assets/site-analytics.js','utf8');
const KEY='jakgastudio.analytics-excluded.v1';
function setup(value,hostname='jakgastudio-temp.vercel.app',pathname='/'){
 const state={value,requests:0,tags:[],reloads:0},listeners={};
 const window={addEventListener:(name,fn)=>{listeners[name]=fn;}};
 const context={window,localStorage:{getItem:()=>state.value},location:{hostname,pathname,origin:'https://'+hostname,search:'',reload:()=>state.reloads++},URL,URLSearchParams,Element:class{},
 document:{referrer:'',addEventListener(){},head:{append:tag=>state.tags.push(tag)},createElement:()=>({})},
 fetch:()=>{state.requests++;return new Promise(resolve=>{state.resolve=()=>resolve({ok:true,json:async()=>({measurementId:'G-TEST123'})});});}};
 vm.runInNewContext(source,context);
 return {state,window,listeners,flush:async()=>{state.resolve?.();await new Promise(resolve=>setImmediate(resolve));}};
}
(async()=>{
 const excluded=setup('1');await excluded.flush();
 assert.equal(excluded.state.requests,0);assert.equal(excluded.state.tags.length,0);
 excluded.window.JakAnalytics.track('phone_click');assert.equal(excluded.window.dataLayer,undefined);
 const normal=setup(null);normal.window.JakAnalytics.track('phone_click');await normal.flush();
 assert.equal(normal.state.tags.length,1);
 assert.equal(normal.window.dataLayer.filter(x=>x[1]==='page_view').length,1);
 assert.equal(normal.window.dataLayer.filter(x=>x[1]==='phone_click').length,1);
 normal.state.value='1';normal.listeners.storage({key:KEY});
 assert.equal(normal.window['ga-disable-G-TEST123'],true);
 const count=normal.window.dataLayer.length;normal.window.JakAnalytics.track('phone_click');assert.equal(normal.window.dataLayer.length,count);
 normal.state.value='0';normal.listeners.storage({key:KEY});assert.equal(normal.state.reloads,1);
 const race=setup(null);race.window.JakAnalytics.track('phone_click');race.state.value='1';await race.flush();
 assert.equal(race.state.tags.length,0);assert.equal(race.window.dataLayer,undefined);
 assert.equal(setup(null,'www.jakgastudio.com').state.requests,0);
 assert.equal(setup(null,undefined,'/admin/').state.requests,0);
 excluded.state.value='0';excluded.listeners.storage({key:KEY});assert.equal(excluded.state.reloads,1);
 console.log('PASS: excluded startup, normal page/actions, cross-tab disable/re-enable, initialization race, production/admin isolation');
})().catch(error=>{console.error(error);process.exitCode=1;});
