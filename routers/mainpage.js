module.exports = function(app,conn){
  var express = require('express');
  var router = express.Router();    //라우팅하는 능력이 있는 객체를 추출한다.

  //EOS Smart Conract
  const Eos = require('eosjs');
  //chain id , private Key
  const config = {
    httpEndpoint: 'http://api.kylin.eosbeijing.one:8880',
    chainId : '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191' //jungle Net
  };

  // Get account from private key.
  router.get(['/','/:currentpage'], function(req,res){
    //로그인 정보 ID만
    var email_id = req.session.email_id;
    var brands_name = req.session.brands_name;

    console.log('Id 값 확인 : ', email_id);
    if(email_id){
      //product not exist..
      var sql = `SELECT a.accounts accounts, b.type type
                  FROM bm_brands a LEFT OUTER JOIN bm_product b
                  ON a.email = b.email
                  WHERE a.email = ?
                  GROUP BY a.accounts, b.type`;
      conn.query(sql, [email_id], function(err, db_accounts){
          //req session에 저장
          if(err){
            console.log(err);
            res.status(500).send('(mainpage.js) bm_prouct DB Internal Server Error');
          }
          else{
            if(db_accounts.length == 0){
              res.render('mainpage', {authId:email_id, brands_name:brands_name,type:db_accounts,errorcode:300, error:'email_id가 존재하지 않습니다.'});
            }
            //EOS 명품컨트랙이 있을 경우 조회
            else{
                //eos Contract -> My Contract Info
                Eos(config).getTableRows({
                  json:true,
                  code:db_accounts[0].accounts,
                  scope:db_accounts[0].accounts,
                  table:'brands',
                  limit: 100000
                }, (error, tableInfo) =>{
                  if(error){
                    console.log(error);
                    res.render('mainpage', {authId:email_id, brands_name:brands_name, type:db_accounts,errorcode:100, error:'An error occurred when calling SmartContract.'});
                  }
                  if(tableInfo){
                    //paging process
                    var totalProduct = tableInfo.rows.length,
                  		pageSize = 20,
                  		pageCount = tableInfo.rows.length/pageSize, //count
                  		currentPage = 1,
                      startData = 0,
                  		product = [];

                  	//set current page if specifed as get variable (eg: /?page=2)
                  	if (typeof req.params.currentpage !== 'undefined') {
                  		currentPage = +req.params.currentpage;

                  	}
                    startData = (currentPage - 1) * pageSize;
                    for(var i = startData; i < startData + pageSize; i++){
                      if(i > tableInfo.rows.length - 1){
                        break;
                      }
                      product.push(tableInfo.rows[i]);
                    }

                    console.log(product);

                    console.log('(mainpage.js)Brands blockchain views');
                    res.render('mainpage', {authId:email_id, brands_name:brands_name, type:db_accounts,pageSize: pageSize,pageCount: pageCount,currentPage: currentPage,
                                            brand_contract:product, errorcode:0, error:''});
                   }
                   else {
                    console.log('(mainpage.js)Node Blockchain Views');
                    res.render('mainpage', {authId:email_id, brands_name:brands_name,type:db_accounts, errorcode:0, error:''});
                  }
               });
            }
          }
      });
    }
    else{
      res.render('nologin');
    }
  });
  return router;
};
