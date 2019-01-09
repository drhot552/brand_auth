var nodemailer = require('nodemailer');

module.exports.transport = function(){
  var transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
      user:'drhot552@gmail.com',
      pass:'password'
    }
  }); //보내는 송신자 일단은 내걸로
  return transporter;
}

module.exports.authInfo = function(email_id){

  //email 주소를 어떻게?
  var max = 100000;
  var min = 0;
  var authNumber= Math.floor(Math.random() * (max - min)) + min;


  var mailOption= {
    from:'drhot552@gmail.com',
    to: email_id,
    subject : '[명품블록체인]비밀번호 인증번호',
    text : '안녕하세요. 명품블록체인 운영자입니다. 인증번호를 입력하세요. 인증번호 : ' + authNumber.toString(),
    number : authNumber
  };

  return mailOption;
}
