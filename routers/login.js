module.exports = function(app,conn, abi){
  var express = require('express');
  var router = express.Router();    //라우팅하는 능력이 있는 객체를 추출한다.

  //EOS Smart Conract
  const Eos = require('eosjs');
  //chain id , private Key
  const config = {
    httpEndpoint: 'http://api-kylin.eoshenzhen.io:8890',
    chainId : '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191' //jungle Net

  };

  //비밀번호
  var bkfd2Password = require('pbkdf2-password'); //비밀번호 암호화
  var hasher = bkfd2Password(); //비밀번호 해쉬

  //로그인 화면 호출
  router.get('/', function(req,res){
    res.render('login',{errorcode:0, error:''});
  });
  //로그인 할때 -> Post
  router.post('/', function(req,res){
    //account기반 체크
    var email = req.body.email_id;
    var password = req.body.password;
    var sql = 'SELECT email, accounts, brands_name, password, salt FROM bm_brands WHERE email = ?';
    conn.query(sql, [email], function(err, db_accounts){
      //id하고 password가 맞을경우 account 계좌를 탐색한다. 그렇지 않으면 탐색하지 않는다.
      if(err){
        console.log(err);
        res.status(500).send('(login.js) bm_brands DB Internal Server Error');
      }
      if(db_accounts.length == 0){
        console.log('(login.js)email_id가 존재하지 않습니다.');
        res.render('login', {errorcode:300, error:'email_id가 존재하지 않습니다.'});
     }
      // hash를 이용하여 비밀번호를 암호화 한다.
      else {
        return hasher({password:password, salt:db_accounts[0].salt}, function(err,pass,salt,hash){
            if(hash == db_accounts[0].password){
              //로그인시 내가 등록한 블록체인 리스트를 볼수 있다. Get Contract List 없다면 그냥 안보여준다. 트랜잭션 확인
              req.session.email_id = db_accounts[0].email;
              req.session.brands_name = db_accounts[0].brands_name;
              console.log('Login Success', db_accounts[0].accounts);

              res.redirect('mainpage');
            
            }
            else{
              res.render('login', {errorcode:300, error:'Password Wrong'});
            }
            //비밀번호가 틀린경우
        });
      } // 로그인 관련 내용이 없을경우
    });
  });

  return router;
};
