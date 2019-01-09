//database mysql
var mysql = require('mysql');   //db

module.exports.conn = function(){

  var conn = mysql.createConnection({
    host     : '52.197.227.56',
    user     : 'root',
    password : 'password',
    database : 'brand'
  });
  conn.connect();
  return conn;
}
