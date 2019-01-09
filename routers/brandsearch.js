//로그인 모듈
module.exports = function(app,conn){
  var express = require('express');
  var router = express.Router();    //라우팅하는 능력이 있는 객체를 추출한다.
  //EOS Contract
  //chain id , private Key
  const Eos = require('eosjs');
  const config = {
    httpEndpoint: 'http://api-kylin.eoshenzhen.io:8890',
    chainId : '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191'
  };

  router.post(['/'], function(req,res){
    var email_id = req.session.email_id;
    var brands_name = req.session.brands_name;
    var brands_num = req.body.num;

    if(email_id){
      //Smartcontract Check
      var sql = `SELECT a.accounts accounts, b.type type
                  FROM bm_brands a LEFT OUTER JOIN bm_product b
                  ON a.email = b.email
                  WHERE a.email = ?
                  GROUP BY a.accounts, b.type`;
      conn.query(sql, [email_id], function(err, db_accounts){
          //req session에 저장
          if(err){
            console.log(err);
            res.status(500).send('(login.js) bm_prouct DB Internal Server Error');
          }
          else{
            if(db_accounts.length == 0){
              res.render('mainpage', {authId:'',brands_name:'',type:db_accounts, errorcode:300, error:'email_id가 존재하지 않습니다.'});
            }
            //EOS 명품컨트랙이 있을 경우 조회
            else{
                console.log('(login.js)' ,db_accounts.length);
                //eos Contract -> My Contract Info
                Eos(config).getTableRows({
                  json:true,
                  code:db_accounts[0].accounts,
                  scope:db_accounts[0].accounts,
                  table:'brands',
                  limit: 1000000
                }, (error, tableInfo) =>{
                  if(error){
                    console.log(error);
                    res.render('mainpage', {authId:email_id, brands_name:brands_name, type:db_accounts,errorcode:100, error:'An error occurred when calling SmartContract.'});
                  }
                  var tableArray = new Array();
                  var object = new Object();
                  var i = 0;
                  var same_check = false;
                  if(tableInfo){
                    console.log('(productlist.js)Brands blockchain views');
                    while(tableInfo.rows[i]){
                      if(tableInfo.rows[i].brands_num == brands_num ){
                        object = tableInfo.rows[i];
                        tableArray.push(object);
                        same_check = true;
                      }
                      i++;
                    }
                    var totalProduct = tableArray.length,
                  		pageSize = 20,
                  		pageCount = tableArray.length/pageSize, //count
                  		currentPage = 1,
                      startData = 0,
                  		product = [];


                  	//set current page if specifed as get variable (eg: /?page=2)
                  	// if (typeof req.params.currentpage !== 'undefined') {
                  	// 	currentPage = +req.params.currentpage;
                    //
                  	// }
                    startData = (currentPage - 1) * pageSize;
                    for(var j = startData; j < startData + pageSize; j++){
                      if(j > tableArray.length - 1){
                        break;
                      }
                      product.push(tableArray[j]);
                    }

                    if(same_check == true){
                      res.render('mainpage', {authId:email_id, brands_name:brands_name,type:db_accounts,pageSize,pageCount: pageCount,currentPage: currentPage,
                                              brand_contract:product, errorcode:0, error:''});
                    }
                    else{
                      console.log('No Search');
                      res.render('mainpage', {authId:email_id, brands_name:brands_name,type:db_accounts, errorcode:100, error:'No results found for ProductNumber : ' + brands_num});
                    }
                  }
                   else {
                    console.log('(mainpage.js)Node Blockchain Views');
                    res.render('mainpage', {authId:email_id, brands_name:brands_name,type:db_accounts, errorcode:100, error:'No results found for ProductNumber : ' + brands_num});
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
