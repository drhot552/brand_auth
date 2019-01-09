module.exports = function(app,conn){
  var express = require('express');
  var router = express.Router();    //라우팅하는 능력이 있는 객체를 추출한다.

  //EOS Smart Conract
  const Eos = require('eosjs');
  //chain id , private Key
  const config = {
    httpEndpoint: 'http://api-kylin.eoshenzhen.io:8890',
    chainId : '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191' //jungle Net
  };

  router.get(['/'], function(req,res){
    var email_id = req.session.email_id;
    var brands_name = req.session.brands_name;

    //account select
    if(email_id){
      //Smartcontract Check
      var sql = `SELECT a.accounts accounts, b.type type
                  FROM bm_brands a LEFT OUTER JOIN bm_product b
                  ON a.email = b.email
                  WHERE a.email = ?
                  GROUP BY a.accounts, b.type`;
      conn.query(sql, [email_id], function(err,db_accounts){
        if(err){
          console.log(err);
          res.status(500).send('(chart.js) bm_prouct DB Internal Server Error');
        }
        else{
          //JSON ARRAY
          Eos(config).getTableRows({
            json:true,
            code:db_accounts[0].accounts,
            scope:db_accounts[0].accounts,
            table:'brands',
            limit: 100000
          }, (error, tableInfo) =>{
            if(error){
              console.log(error);
              res.render('chart', {authId:email_id, brands_name:brands_name, type:db_accounts,  errorcode:100, error:'An error occurred when calling SmartContract.'});
            }
            if(tableInfo){

              console.log('(chart.js)Brands blockchain views');
              var tableArray = [];
              var count;
              //console.log(db_accounts.length, tableInfo);
              for(var j = 0; j<db_accounts.length; j++){
                count = 0;
                var object = new Object();
                for(var i=0; i<tableInfo.rows.length; i++){
                  if(tableInfo.rows[i].type == db_accounts[j].type){
                      object.type = db_accounts[j].type;
                      object.count = ++count;
                  }
                }
                tableArray.push(object);
              }//count
              console.log(tableArray);

              //Monthly Check
              var mothlyArray = [];
              var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              var monthcount;
              for(var j =1; j<13; j++){
                var objectMonth = new Object();
                monthcount = 0;

                for(var i = 0; i<tableInfo.rows.length; i++){
                  var temp = tableInfo.rows[i].reg_dttm.toString();
                  if(temp.substring(5,7) == j.toString()){
                     monthcount++;
                  }
                }
                objectMonth.month = month[j-1];
                objectMonth.monthcount = monthcount;
                mothlyArray.push(objectMonth);
              }
              console.log('check',mothlyArray);


              res.render('chart', {authId:email_id, brands_name:brands_name, type:db_accounts, brand_contract:tableArray,month_contract:mothlyArray, errorcode:0, error:''});
             }
         });

        }
      });
    }
    else{
      res.render('nologin');

    }
    //브랜드별 쿼리 조회
  });

  return router;
};
