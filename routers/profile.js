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

  //비밀번호
  var bkfd2Password = require('pbkdf2-password'); //비밀번호 암호화
  var hasher = bkfd2Password(); //비밀번호 해쉬

  //로그인 화면 호출
  router.get('/', function(req,res){
    var email_id = req.session.email_id;
    var brands_name = req.session.brands_name;
    if(email_id){
      //Smartcontract Check
      var sql = `SELECT a.accounts accounts, b.type type
                  FROM bm_brands a LEFT OUTER JOIN bm_product b
                  ON a.email = b.email
                  WHERE a.email = ?
                  GROUP BY a.accounts, b.type`;
      conn.query(sql, [email_id], function(err, db_accounts){
        if(err){
          console.log(err);
          res.status(500).send('(profile.js) bm_prouct DB Internal Server Error');
        }
        else{
          if(db_accounts.length == 0){
            res.render('profile', {authId:email_id, brands_name:brands_name,type:db_accounts,errorcode:100, error:'Database email_id가 존재하지 않습니다.'});
          }
          else{
            Eos(config).getAccount(db_accounts[0].accounts, (error, account) =>{
              if(error){
                res.render('profile', {authId:email_id, brands_name:brands_name,type:db_accounts,account:db_accounts[0].accounts, ramtotal:'', ram:'',balance:'', create:'',
                                      errorcode:100, error:'There was an error retrieving the EOS account information.'});
              }
              else{
                console.log('(profile.js)', account, account.ram_usage, account.total_resources.ram_bytes);
                res.render('profile', {authId:email_id, brands_name:brands_name,type:db_accounts,account:db_accounts[0].accounts,
                                      ramtotal:account.total_resources.ram_bytes, ram:account.ram_usage,
                                      balance:account.core_liquid_balance, create:account.created,errorcode:0, error:''});
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
  //Update
  router.post('/', function(req,res){

  });

  return router;
};
