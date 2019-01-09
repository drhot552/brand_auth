//로그인 모듈
module.exports = function(app,conn){
  var express = require('express');
  var router = express.Router();    //라우팅하는 능력이 있는 객체를 추출한다.
  //EOS Contract
  //chain id , private Key
  const Eos = require('eosjs');
  const ecc = Eos.modules.ecc;
  var datetime = require('node-datetime');
  var dt = datetime.create();
  var formatted = dt.format('Y-m-d H:M:S');

  //Edit
  router.post(['/'], function(req,res){

    var email_id = req.session.email_id;
    var privatekey = req.body.privatekey;
    var id = req.body.editid;
    var first = req.body.firstaccount;
    var to= req.body.cert_account;
    var from = req.body.from_account;
    var owner = req.body.to_account;

    var brands_name = req.session.brands_name;
    var product_name = req.body.productname;
    var type = req.body.type;
    var reg_date = req.body.reg_date;
    var mf_date = req.body.mf_date;
    var tx_date = req.body.tx_date;
    var object = req.body;

    var serialnum = '';
    console.log('(brandedit.js)datacheck',object, product_name,  tx_date);
    if(email_id){
      //Smartcontract Delete -> Check
      const config = {
        httpEndpoint: 'http://api-kylin.eoshenzhen.io:8890',
        chainId : '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
        keyProvider : [privatekey]
      };
      //EOS SmartContract Select
      var sql = `SELECT a.accounts accounts, b.type type
                  FROM bm_brands a LEFT OUTER JOIN bm_product b
                  ON a.email = b.email
                  WHERE a.email = ?
                  GROUP BY a.accounts, b.type`;
      conn.query(sql, [email_id], function(err, db_accounts){
          //req session에 저장
          if(err){
            console.log(err);
            res.status(500).send('(brandedit.js) bm_prouct DB Internal Server Error');
          }
          else{
            if(db_accounts.length == 0){
              res.render('mainpage', {errorcode:300, error:'Database email_id가 존재하지 않습니다.'});
            }

            //Contract Edit
            if(ecc.isValidPrivate(privatekey) == true)
            {
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
                  console.log('(mainpage.js)Brands blockchain views');
                  var i = 0;
                  while(tableInfo.rows[i]){
                    if(tableInfo.rows[i].id == id){
                      serialnum = tableInfo.rows[i].brands_num;
                      break;
                    }
                    i++;
                  }
  
                   Eos(config).contract(db_accounts[0].accounts).then((contract) => {
                     contract.auth(parseInt(id),first,to,owner,brands_name ,product_name, serialnum, type, reg_date, mf_date,tx_date, {authorization: [owner] }).then((result) => {
                       console.log(result.transaction_id);
                       // database insert
                       var sql  = 'INSERT INTO public_user.bm_usertxid VALUES (?,?,?,?)';
                       conn.query(sql, [result.transaction_id, to, formatted, 'y'], function(err, result){
                          if(err){
                            console.log(err);
                          }else{
                            res.redirect('mainpage');
                          }
                       });
                    }).catch(function(e){
                       console.log('(brandedit.js) contract del function error',e)
                       res.render('mainpage', {authId:email_id, brands_name:brands_name,type:db_accounts, errorcode:100, error:'Private Key does not match. Please re-enter.'});
                     });
                   });
                }
             });

            }
            else{
              res.render('mainpage', {authId:email_id, brands_name:brands_name,type:db_accounts, errorcode:100, error:'It does not match the private key type. Please re-enter.'});
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
