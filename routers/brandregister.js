//로그인 모듈
module.exports = function(app,conn){
  var express = require('express');
  var datetime = require('node-datetime');
  var dt = datetime.create();
  var formatted = dt.format('Y-m-d H:M:S');
  var router = express.Router();    //라우팅하는 능력이 있는 객체를 추출한다.
  const Eos = require('eosjs');
  const multiparty = require('multiparty');
  const xlsx = require('xlsx');

  router.get(['/'], function(req,res){
    var email_id = req.session.email_id;
    var brands_name = req.session.brands_name;
    if(email_id)
    {
      //brandType
      var sql = 'SELECT type FROM bm_product WHERE email  = ? GROUP BY type';
      conn.query(sql, [email_id],function(err, brands){
        res.render('brandregister', {authId:email_id, brands_name:brands_name,type:brands, errorcode:0, error:''});
      });
    }
    else{
      res.render('nologin');
    }
  });

  // xlsx -> json -> upload
  router.post('/xlsx', function(req,res){

    var email_id = req.session.email_id;
    var brands_name = req.session.brands_name;
    const resData = {};
    const returnData = {};

    const form = new multiparty.Form({
        autoFiles: true,
    });

    form.on('file', function (name, file) {
        const workbook = xlsx.readFile(file.path,{cellDates: true});
        const sheetnames = Object.keys(workbook.Sheets);

          let i = sheetnames.length;

        while (i--) {
            const sheetname = sheetnames[i];
            resData[sheetname] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname],{dateNF:"YYYY-MM-DD"});
        }
    });

    form.on('close', () => {
      //Date Format
      for(var j=0; j<resData.Sheet1.length; j++){
         resData.Sheet1[j].ProductDate = dateToYYYYMMDD(resData.Sheet1[j].ProductDate);
      }
      console.log(resData.Sheet1);

      var sql = 'SELECT type FROM bm_prodcut WHERE email_id  = ? GROUP BY type';
      conn.query(sql, [email_id],function(err, brands){
        res.render('brandregister', {authId:email_id, brands_name:brands_name, type:brands ,errorcode:0, error:'', brands_product:resData.Sheet1, table_count:resData.Sheet1.length});
      });
      //table_count set
    });
    form.parse(req);
  });

  //DateType Function
  function dateToYYYYMMDD(date){
    function pad(num) {
        num = num + '';
        return num.length < 2 ? '0' + num : num;
    }
    return date.getFullYear() + '-' + pad(date.getMonth()+1) + '-' + pad(date.getDate());
  }

  //명품페이지등록 -> 스마트 컨트랙트등록
  router.post('/', function(req,res){
    var email_id = req.session.email_id;
    var brands_name = req.session.brands_name;
    var object = req.body;
    var count = req.body.table_count;
    var product_date = req.body.product_date;
    var product_name = req.body.product_name;
    var brand_type = req.body.brand_type;
    var private_key = req.body.privatekey;
    var owner_account = req.body.owner_account;
    var product_num = req.body.product_num;
    var first = req.body.first_account;

    //EOS Contract
    //chain id , private Key
    //how to EOS Private key
    console.log(private_key);
    const config = {
      httpEndpoint: 'http://api-kylin.eoshenzhen.io:8890',
      chainId : '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
      keyProvider : [private_key]
    };

    var sql  = `SELECT a.accounts accounts, b.type type
                FROM bm_brands a LEFT OUTER JOIN bm_product b
                ON a.email = b.email
                WHERE a.email = ?
                GROUP BY a.accounts, b.type`;
    var same_check = false; //smartcontract Same check

    console.log("SmartContract Insert", email_id);
    conn.query(sql, [email_id], function(err, brands){
      //스마트계약할 계좌번호
      //가스량 gas 가스가격 gasprisce
      //같은 고유번호라면 등록이 안되어야 한다.
      if(err){
        console.log(err);
        res.status(500).send('(brandRegister.js) DB bm_brands Internal Server Error');
      }
      else if(brands.length == 0){
        console.log('로그인 정보가 없습니다.');
        res.render('nologin');
      }
      else {
        //상품등록시 해당 상품에대해 같은 smartContract Check
        console.log('tables Check', brands[0].accounts);
        Eos(config).getTableRows({
          json:true,
          code:brands[0].accounts,
          scope:brands[0].accounts,
          table:'brands',
          limit: 100000
        }, (error, tableInfo) =>{
        if(error){
            console.log(error);
        }
        var i = 0;
        var last_data = 0;
        //Contract Same Check
        console.log('tables Check', tableInfo, product_num,tableInfo.rows.length);

        for(var i = 0; i<tableInfo.rows.length; i++){
          //Count = 1 one blockchain register
          console.log('count Check', count, i);

          if(count == 1){
            if(tableInfo.rows[i].brands_num == product_num) {
               console.log('(brandRegister.js) One Product_num Contract is Same ');
               res.json('The same Product_num exists in SmartContract. Please Check on Product Num : ' + product_num);
               same_check = true;
               break;
            }
          }
          else{
            for (var j = 0; j < count; j++ ){
                console.log(tableInfo.rows[i].brands_num, product_num[j]);
                if(tableInfo.rows[i].brands_num == product_num[j]) {
                   console.log('(brandRegister.js) Many Product_num Contract is Same ');
                   res.json('The same Product_num exists in SmartContract. Please Check on Product Num : ' + product_num[j]);
                   same_check =true;
                   break;
                }
            }
          }
          last_data = tableInfo.rows[i].id;
        }
        last_data = parseInt(last_data) + 1;

        //Date
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();
        var today_date = yyyy+'-'+mm+'-'+dd;

        console.log('brandRegister.js dataCheck',last_data, brands[0].accounts, owner_account, brands[0].accounts, brands_name, product_name, product_num,
                        brand_type,formatted,product_date,formatted);

        //last_date -> same Check , table count == 1
        if(same_check == false){
          if(count == 1){

            Eos(config).contract(brands[0].accounts).then((contract) => {
              contract.create(last_data, first, owner_account, brands[0].accounts, brands_name, product_name, product_num,
                              brand_type,formatted,product_date,formatted,{ authorization: [brands[0].accounts] }).then((block) => {

                var sql = 'INSERT INTO bm_product VALUES (?,?,?)';
                conn.query(sql, [last_data,email_id,brand_type], function(err, brands){
                  if(err){
                    console.log('(brandregister.js) Database Insert error', err);
                    res.json('Database Insert error. Please re-enter. Serial Num : ' + product_num);
                  }
                  else{
                    res.json('Success! Product registration is completed.');
                  }
                });

              }).catch(function(e){
                console.log('(brandregister.js) contract function call error',e)
                res.json('EOS Smart Contract Registration error. Please re-enter.');
              });
            }).catch(function(e){
              console.log('(brandregister.js) contract function call error',e)
              res.json('EOS Smart Contract Registration Function Call error. Please re-enter.');
            });
          }
          // table count > 1
          else if (count > 1){
            Eos(config).contract(brands[0].accounts).then((contract) => {
              for(var k = 0; k < count; k++ ){
                var brands_num = product_num[k].toString();
                var block_key = 0;
                contract.create(last_data+k, first[k], owner_account[k], brands[0].accounts, brands_name, product_name[k], product_num[k],
                                brand_type[k],formatted,product_date[k],formatted,{ authorization: [brands[0].accounts] }).then((block) => {
                    console.log('data check', last_data+k+block_key, block_key);

                    //SQL Insert
                    var sql = 'INSERT INTO bm_product VALUES (?,?,?)';
                    conn.query(sql, [last_data+block_key, email_id, brand_type[block_key] ], function(err, brands){
                      if(err){
                        console.log('(brandregister.js) Database Insert error', err);
                        res.json('Database Insert error. Please re-enter. Serial Num : ' + product_num[block_key]);
                      }
                      else{
                        if(block_key == count){
                          res.json('Success! Product registration is completed.');
                        }
                      }
                    });
                    block_key++;

                  }).catch(function(e){
                    console.log('(brandregister.js) contract function call error',e);
                    res.json('EOS Smart Contract Registration error. Please re-enter.Serial Num : ' + product_num[k]);
                  });
                }
              });
            }
            else{
              res.json('EOS Smart Contract Registration error. Please register at least one.');
            }
        }

        //samecheck = true
      });

      }
    });
  });

  return router;
};
