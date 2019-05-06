var mysql = require('mysql');
 
console.log('Get connection ...');
 
var conn = mysql.createConnection({
  database: 'test',
  host: "localhost",
  user: "root",
  password: "admin@1234"
});
 
conn.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});