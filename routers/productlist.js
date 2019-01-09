//로그인 모듈
module.exports = function(app,conn){
  var express = require('express');
  var router = express.Router();    //라우팅하는 능력이 있는 객체를 추출한다.
  //EOS Contract
  //chain id , private Key
  var Eos = require('eosjs');
  const config = {
    httpEndpoint: 'http://api-kylin.eoshenzhen.io:8890',
    chainId : '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191'
  };
  router.get(['/:account'], function(req,res){
      //all Product
      //
      var sql = 'SELECT accounts FROM bm_brands';
      conn.query(sql, function(err, brands, fields){
        if(brands.length == 0){
          res.render('productlist');
        }
        else{
          for(var i = 0; i< brands.length; i++){
            Eos(config).getTableRows({
              json:true,
              code:brands[0].accounts,
              scope:brands[0].accounts,
              table:'brands',
              limit: 100000
            }, (error, tableInfo) =>{
              if(error){
                console.log(error);
                res.render('productlist', {authId:email_id, brands_name:brands_name, errorcode:100, error:'An error occurred when calling SmartContract.'});
              }
              var tableArray = new Array();
              var object = new Object();

              //Check Account
              var account_id = '';
              if(tableInfo){
                console.log('(productlist.js)Brands blockchain views');
                while(tableInfo.rows[i]){
                  if(tableInfo.rows[i].from == account_id ){
                    object = tableInfo.rows[i];
                    tableArray.push(object);
                  }
                  i++;
                }
                res.render('productlist', {authId:email_id, brands_name:brands_name, errorcode:0, error:''});
               }
               else {
                console.log('(productlist.js)Node Blockchain Views');
                res.render('productlist', {authId:email_id, brands_name:brands_name, errorcode:0, error:''});
              }
           });
          }
        }
      });
      res.render('productlist');
  });
  return router;
};
