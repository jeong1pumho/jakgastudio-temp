'use strict';
const {send}=require('./core');
module.exports=(req,res)=>send(res,410,{status:'disabled'});
