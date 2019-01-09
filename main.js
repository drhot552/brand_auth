//express 객체생성
var express = require('express');
var app = express();
var bodyParser = require('body-parser'); //post를위한 body-parser설정

//session
var session = require('express-session'); //session을 사용하기 위한 모듈
var MySQLStore = require('express-mysql-session')(session); //session연결

//module
var database = require('./module/database.js');
var auth = require('./module/authMail.js');

var conn = database.conn();

//router
var login = require('./routers/login')(app,conn);
var mainpage = require('./routers/mainpage')(app,conn);
var register = require('./routers/register')(app,conn);
var forgetpassword = require('./routers/forgetpassword')(app,conn);
var authmail = require('./routers/authmail')(app,conn,auth);
var profile  = require('./routers/profile')(app,conn,auth);
var productlist = require('./routers/productlist')(app,conn);


/* brand fucntion */
var brandregister = require('./routers/brandregister')(app,conn);
var brandlist = require('./routers/brandlist')(app,conn);
var brandsearch = require('./routers/brandsearch')(app,conn);
var brandremove = require('./routers/brandremove')(app,conn);
var brandauth = require('./routers/brandauth')(app,conn);

var chart = require('./routers/chart')(app,conn);

app.set('views', './public/views/pages');
app.set('view engine', 'ejs'); //ejs

//메인홈페이지
app.get('/main', function(req,res){
  res.render('main');
});

//CSS 관련
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/public', express.static(__dirname + '/public'));  //부트스트랩 관련
app.use('/module', express.static(__dirname + '/module'));  //차트 모듈 관련
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret : '1234DSFs@adf1234!@#$a11123#$%%sd',
  resave : false,
  saveUninitialized : true
}));  //세션 세팅

/* 앱 라우터 */
app.use('/login', login);
app.use('/mainpage', mainpage);
app.use('/register', register);
app.use('/forgetpassword', forgetpassword);
app.use('/authmail', authmail);
app.use('/profile',profile);

app.use('/brandregister', brandregister);
app.use('/brandlist', brandlist);
app.use('/brandsearch', brandsearch);
app.use('/brandremove', brandremove);
app.use('/brandauth', brandauth);
app.use('/chart', chart);

//User list
app.use('/productlist', productlist);

//app을 listen
app.listen(3000, function(){
  console.log('Connected memo, 3000 port!');
});
