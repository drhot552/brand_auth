//로그인 모듈
module.exports = function(app,conn){
  var express = require('express');
  var router = express.Router();    //라우팅하는 능력이 있는 객체를 추출한다.

  //EOS Contract
  const Eos = require('eosjs');
  const ecc = Eos.modules.ecc;

  router.post(['/'], function(req,res){
    var email_id = req.session.email_id;
    var brands_name = req.session.brands_name;
    var privatekey = req.body.privatekey;
    var id = req.body.id;
    var serialnum = req.body.serialnum;

    console.log(id,serialnum,email_id,brands_name);
    if(email_id){
      //Smartcontract Delete -> Check
      const config = {
        httpEndpoint: 'http://api.kylin.eosbeijing.one:8880',
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
            res.status(500).send('(productlist.js) bm_prouct DB Internal Server Error');
          }
          else{
            if(db_accounts.length == 0){
              res.render('mainpage', {errorcode:300, error:'Database email_id가 존재하지 않습니다.'});
            }

            //Contract Remove
            if(ecc.isValidPrivate(privatekey) == true)
            {
              Eos(config).contract(db_accounts[0].accounts).then((contract) => {
                console.log(contract);
                contract.del(id,serialnum,{authorization: [db_accounts[0].accounts] }).then((result) => {
                  var sql = 'DELETE FROM bm_product WHERE id = ? AND email = ?';
                  conn.query(sql, [id,email_id], function(err, brands){
                    if(err){}
                    else{
                      res.redirect('mainpage');
                    }
                  });
                }).catch(function(e){
                  console.log('(brandremove.js) contract function call error',e)
                  res.render('mainpage', {authId:email_id, brands_name:brands_name, type:db_accounts,errorcode:100, error:'EOS Smart Contract Error. Please re-enter.'});
                }); //contract function call error
              });
            }
            //isValidPrivateKey
            else{
              console.log('noMatch Priavate');
              res.render('mainpage', {authId:email_id, brands_name:brands_name, type:db_accounts,errorcode:100, error:'It does not fit the private Key type. Please re-enter.'});
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
