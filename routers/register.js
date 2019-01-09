//로그인 모듈
module.exports = function(app,conn){
  var express = require('express');
  var router = express.Router();    //라우팅하는 능력이 있는 객체를 추출한다.

  //EOS Smart Conract
  const Eos = require('eosjs');
  const ecc = Eos.modules.ecc;

  const fs = require('fs');
  const wasm = fs.readFileSync("./contracts/Brands/Brands.wasm");
  const abi  = JSON.parse(fs.readFileSync("./contracts/Brands/Brands.abi"));

  //비밀번호
  var bkfd2Password = require('pbkdf2-password'); //비밀번호 암호화
  var hasher = bkfd2Password(); //비밀번호 해쉬

  //라우터
  router.get('/', function(req,res){
    res.render('register', {errorcode:0, authnum:0, error:''});
  });

  //인증했을 때
  router.post('/confirm', function(req,res){
    var email_id = req.session.email_id;
    var brand_name = req.session.brands_name;
    var confirm_number  = req.body.confirm_number;
    console.log('confirm',email_id,req.session.authNum, confirm_number);
    if(confirm_number  == req.session.authNum){
      //인증번호가 맞다면
      console.log('인증번호가 맞음', brand_name, email_id);
      res.render('register_confirm', {email_id:email_id, brands_name:brand_name, errorcode:0, error:''});
    }
    else{
      //인증번호가 틀리다는 메시지 전송.
      res.render('register', {email_id:email_id, brands_name:brand_name, errorcode:100, authnum:0, error:'Authentication number is different. Please re-enter.'});
    }

  });

  //post 방식 등록
  router.post('/', function(req,res){
    var email_id = req.body.email_id;
    var brand_name = req.body.brand_name;
    var accounts = req.body.account; //이더리움 계좌정보를 등록해야한다.
    var privateKey = req.body.privatekey; //private Key
    var password_confirm = req.body.password_confirm;

    //password_confirm check
    if(password_confirm != req.body.password){
      res.render('register_confirm', {email_id:email_id, brands_name:brand_name, errorcode:100, error:'It is different from password check and password. ID : ' + email_id});
    }
    else{
      hasher({password:req.body.password}, function(err, pass, salt, hash){
        var password = hash;
        var salt = salt;

        console.log('(register.js) Register Data Confirm : ', email_id, brand_name, accounts, privateKey);
        if(req.body.password){
          //세션정보
          //같은 Id 등록인지 확인한다.
          var sql = 'SELECT count(*) cnt FROM bm_brands WHERE email = ?';
          conn.query(sql, [email_id], function(err, check){
            if(err){
              console.log('(register.js) SQL SELECT error bm_brands')
              res.render('register_confirm', {email_id:email_id, brands_name:brand_name, errorcode:100, error:'An error occurred in the Database. ID : ' + email_id});
            }
            if(check[0].cnt > 0){
              console.log('(register.js) 이미 회원가입을 하셨습니다.')
              res.render('register_confirm', {email_id:email_id, brands_name:brand_name, errorcode:100, error:'You already signed up. ID : ' + email_id});
            }
            //회원가입을 안했으면
            else {
              //invalid Privatekey
              if(ecc.isValidPrivate(privateKey) == true){
                const config = {
                  httpEndpoint: 'http://api-kylin.eoshenzhen.io:8890',
                  chainId : '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191', //jungle Net
                  keyProvider : [privateKey]
                };

                //SmartContract Deploy
                Eos(config).setcode(accounts, 0, 0, wasm, (codeerror, codeinfo) => {
                  if(codeerror){
                    console.error(codeerror);
                    res.render('register_confirm', {email_id:email_id, brands_name:brand_name, errorcode:100, error:'An error occurred during SmartContract Deploy.'});
                  }
                  else{
                    console.log('(register.js)setCode : ',codeinfo);
                    Eos(config).setabi(accounts, abi, (abierror, abiinfo) => {
                      if(abierror){
                        console.error(abierror);
                        res.render('register_confirm', {email_id:email_id, brands_name:brand_name, errorcode:100, error:'An error occurred during SmartContract Deploy.'});
                      }
                      else{

                        console.log('(register.js)setAbi : ' ,abiinfo);

                        //commit
                        var sql = 'INSERT INTO bm_brands(email, accounts, brands_name, password, salt) VALUES (?,?,?,?,?)';
                        conn.query(sql, [email_id,accounts,brand_name,password,salt], function(err, results, fields){
                          if(err){
                            console.log("(Regsiter.js) SQL Insert error bm_brands");
                          }
                          conn.commit(function(err) {
                            if (err) {
                              conn.rollback(function() {
                                throw err;
                              });
                            }
                            console.log('(register.js) Transaction Complete.');
                            res.render('login',{errorcode:0, error:''}); //login confirm
                          });
                        });

                      } //smartcontract Setcode if

                    }); //smartcontract Setabi end
                  } //smartcontract Setabi if
                }); //smartcontract Setcode End

              }//If invalid Private key
              else{
                res.render('register_confirm', {email_id:email_id, brands_name:brand_name, errorcode:100, error:'It does not fit the private Key type. Please re-enter.'});
              }

            }
          });
        }//req.body.password check
      }); //password hash check
    }//password confirm check
  }); //post End

  return router;
};
