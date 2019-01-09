module.exports = function(app,conn,auth){
  var express = require('express');
  var router = express.Router();    //라우팅하는 능력이 있는 객체를 추출한다.

  //비밀번호 잊어버렸을때
  router.post(['/forgetpassword'], function(req,res){

    var email_id = req.body.email_id;
    var confirm = req.params.confirm;
    var transporter = auth.transport();
    var authMail = auth.authInfo(email_id);

    req.session.authNum = authMail.number.toString();

    //이메일 인증 번호
    transporter.sendMail(authMail, function(err,info){
      if(err){
        console.error('(authmail.js) Send Mail Error : ', err);
      }
      else{
        console.log('(authmail.js)Message sent : ', info);
        res.render('forgetpassword' , {email_id:email_id});
      }
    });
  });

  //등록시
  router.post(['/register'], function(req,res){

    var email_id = req.body.email_id;
    var brands_name = req.body.brand_name;
    var confirm = req.params.confirm;

    var transporter = auth.transport();
    var authMail = auth.authInfo(email_id);

    req.session.authNum = authMail.number.toString();

    //email과 브랜드 네임은 세션에 저장
    req.session.email_id = email_id;
    req.session.brands_name = brands_name;
    //이메일 인증 번호
    transporter.sendMail(authMail, function(err,info){
      if(err){
        console.error('(authmail.js) Send Mail Error : ', err);
        res.render('register' , {email_id:email_id, brands_name:brands_name, errorcode:100, authnum:0, error:'(authmail.js) Send Mail Error'});
      }
      else{
        console.log('(authmail.js)Message sent : ', info);
        console.log('(authmail.js)Brands Name : ', brands_name);
        res.render('register' , {email_id:email_id, brands_name:brands_name, errorcode:0, authnum:req.session.authNum, error:'success'});
      }
    });
  });
  return router;
}
