module.exports = function(app,conn){
  var express = require('express');
  var nodemailer = require('nodemailer');

  var router = express.Router();    //라우팅하는 능력이 있는 객체를 추출한다.
  router.get(['/'], function(req,res){
    res.render('forgetpassword');
  });
  router.post('/', function(req,res){
      var confirm_number = req.body.confirm_number;
      console.log('Session Number 확인 ' , req.session.authNum);
      if(confirm_number  == req.session.authNum){
        //인증번호가 맞다면
        console.log('인증번호가 맞음');
        res.render('updatepassword', {email_id:email_id});
      }
      else{
      }
  });
  return router;
}
