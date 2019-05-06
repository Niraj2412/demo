var express  = require('express'),
    path     = require('path'),
    bodyParser = require('body-parser'),
    app = express(),
    expressValidator = require('express-validator');
    multer  = require('multer'),
    upload = multer({ dest: 'uploads/' }),
    fs = require('fs');
    
   // concheck = require('express-validator/check'),
    session = require('express-session');
    jwt = require('jsonwebtoken');
    var passwordValidator = require('password-validator');
    var engine = require('ejs-locals');
    
  
    
var schema = new passwordValidator();
    app.engine('ejs', engine);
   
schema
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits()                                 // Must have digits
.has().not().spaces()                           // Should not have spaces
.is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values
 
/*Set EJS template Engine*/
app.set('views','./views');
app.set('view engine','ejs');
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 100000 }}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true })); //support x-www-form-urlencoded
// app.use(bodyParser.text({type:"*/*"}));
app.use(bodyParser.json());
app.use(expressValidator());


/*MySql connection*/
var connection  = require('express-myconnection'),
    mysql = require('mysql');

app.use(

    connection(mysql,{
        host     : 'localhost',
        user     : 'root',
        password : 'admin@1234',
        database : 'test',
        debug    : true //set true if you wanna see debug logger
    },'request')

);

app.get('/audio',function(req,res,next){
   
    res.render('audio')
});

app.post('/upload', upload.single('soundBlob'), function (req, res, next) {

    var users={
        "audiofile":req.body.filename
     }

    req.getConnection(function (err, conn){
    // console.log(req.file); // see what got uploaded

    if (err) return next("Cannot Connect"+err);

    conn.query('INSERT INTO audio_data SET ?',users, function (error, results, fields) {

  
    let uploadLocation = __dirname + '/public/uploads/' + req.file.originalname // where to save the file to. make sure the incoming name has a .wav extension
  
    fs.writeFileSync(uploadLocation, Buffer.from(new Uint8Array(req.file.buffer))); // write the blob to the server as a file
    res.sendStatus(200); //send back that everything went ok
  
  })

})

})

app.post('/api/check',function(req,res,next){

    
    req.assert('name','Name is required').notEmpty();
    req.assert('password','Enter valid password').notEmpty();
   
    var errors = req.validationErrors();
    if(errors){
        res.status(422).json(errors);
        return;
    }
    var uname = req.body.name;
    var password = req.body.password;
    const user = { id: 3 };
    const token = jwt.sign({user}, uname);
    req.session.token = token ;
    req.getConnection(function(err,conn){

    if (err) return next("Cannot Connect"+err);

    var query = conn.query('SELECT * FROM t_user where name = ? and password = ? ',[uname,password],function(err,rows){

        if(err)
        {
            res.json({text:'norows'});
        }
        if(rows.length>0){

            res.json({text:'rows'});
        }
        else
        {
            res.json({text:'norows'});
        }
      });

    });
});

app.get('/sensor_data',function(req,res,next){
   
    res.render('sensor_data')
});

app.post('/api/sensor_data',bodyParser.text({type: '*/*'}),(req, res,next) => {

    req.assert('humidity','It is required').notEmpty();

    // var users={
        
    //     temperature:req.body.temperature,
    //     humidity:req.body.humidity,
    //     pressure:req.body.pressure,
    //     airquality_index: req.body.airquality_index
        
    // }

   var temperature=req.body.temperature;
   var humidity=req.body.humidity;
   var pressure=req.body.pressure;
   var airquality_index= req.body.airquality_index;
   

    req.getConnection(function (err, conn){

        if (err) return next("Cannot Connect");
         conn.query('INSERT INTO sensor_data(temperature,humidity,pressure,airquality_index)VALUES("'+temperature+'","'+humidity+'","'+pressure+'","'+airquality_index+'")', function (error, results, fields) {
          //  conn.query('INSERT INTO sensor_data SET ?',users, function (error, results, fields) {   
        if (error) {
              res.json({
                  status:false,
                  message:'there are some error with query'
              })
            }else{
                res.json({
                  status:true,
                 
                  message:'data has been created in database'
              })
            }
          });
        });
    })

app.get('/showiotdata',function(req,res,next){
   
    res.render('showiotdata');
});


app.get('/api/showiotdata', function(req,res,next){

    //var obj = {};

    console.log("data Method")
    req.getConnection(function (err, conn){

        if (err) return next("Cannot Connect");
      //  connection.query('SELECT * FROM users WHERE email = ?',[email], function (error, results, fields) {
    

    conn.query('SELECT * FROM sensor_data', function (error, data) {
        if (error) {
         throw error;
         console.log(error)
        }
        if(data.length > 0){
           // console.log("Iot Data:::",data[0].RowDataPacket);
           // res.json(data);
         //  res.render('showiotdata',{data:data});
           res.send(data);
          
        }
      });
   

    });
});



 app.delete('/api/deletedata',function(req,res,next){

    
    var user_id = req.params.user_id;
    console.log("DElete Id:",user_id);
     req.getConnection(function (err, conn) {

        if (err) return next("Cannot Connect");

             var query = conn.query("DELETE FROM sensor_data  WHERE user_id = ? ",[user_id], function(err, rows){

          if(err){
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.sendStatus(200);

        }   );
    //console.log(query.sql);

    });


});




app.get('/dashbord',function(req,res,next){
   
        res.render('dashboard');
});
app.get('/register',function(req,res,next){
   
    res.render('register');

});
app.get('/users',function(req,res){
   
    res.render('user');

});


app.get('/comregister',function(req,res){

    res.render('comregister');

});
app.get('/typography',function(req,res){
   
    res.render('typography');

});
app.get('/icons',function(req,res){
   
    res.render('icons');

});
app.get('/maps',function(req,res){
   
    res.render('maps');

});
app.get('/concatcompany',function(req,res){
   
    res.render('concatcompany');

});
app.get('/notifications',function(req,res){
   
    res.render('notifications');

});
app.get('/upgrade',function(req,res){
   
    res.render('upgrade');

});
app.get('/api/fpassword',function(req,res){
    res.render('fpassuser');
});
app.get('/',function(req,res){
 
    res.render('user_login');

});
app.get('/passchange',function(req,res){
 
    res.render('passchange');

});

app.get('/fpassuser/:email',function(req,res){
 
    const email_id = req.params.email;
     res.render('newpassuser',{email_id:email_id});

});
app.get('/login',function(req,res){
       res.render('login');
  });
//   app.get('/user',function(req,res){
//           res.render('user')
//   });
app.get('/logout',function(req,res){

    req.session.destroy(function(err) {
        // cannot access session here
      })
}) ; 
app.post('/api/fpassset',function(req,res){
   
       const email_id = req.body.emailid;
       const password = req.body.password;
       req.assert('password','Enter a password having char 8 - 20').len(8,20);
   
       var errors = req.validationErrors();
       if(errors){
           res.status(422).json(errors);
           return;
       }
       if(!schema.validate(req.body.password))
       {
        res.status(422).json([{'msg':'Please enter password having a digit,a uppaercase and a lowercase'}]);
        return;
       }
       req.getConnection(function (err, conn){

        if (err) return next("Cannot Connect");

        var query = conn.query("UPDATE t_user set password = ? WHERE email = ? ",[password,email_id], function(err, rows){

           if(err){
                console.log(err);
                return next("Mysql error, check your query");
           }

         //  res.render('passchange',{msg:'your password changed successfully'});
  
        });

     });
   
    
  });


  

//RESTful route
var router = express.Router();


/*------------------------------------------------------
*  This is router middleware,invoked everytime
*  we hit url /api and anything after /api
*  like /api/user , /api/user/7
*  we can use this for doing validation,authetication
*  for every route started with /api
--------------------------------------------------------*/
router.use(function(req, res, next) {
    console.log(req.method, req.url);
    next();
});

router.route('/sendMail').post(function(req, res, next)
{
    
const email_id = req.body.email;
req.assert('email','A valid email is required').isEmail();
var errors = req.validationErrors();
if(errors){
    res.status(422).json(errors);
    return;
}  
const nodemailer = require('nodemailer');

// Generate test SMTP service account from ethereal.email
// Only needed if you don't have a real mail account for testing
nodemailer.createTestAccount((err, account) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        auth: {
            user: "pinki.gajjar@gmail.com", // generated ethereal user
            pass: "pinklove2002" // generated ethereal password
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: 'node@crudapi.com', // sender address
        to: email_id, // list of receivers
        subject: req.body.subject, // Subject line
        text: '', // plain text body
        html: req.body.text // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        res.render('fpassuser');
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
});
});

var curut5 = router.route('/recom');

//post data to DB | POST
curut5.post(function(req,res,next){

    
    //get data
    var data = {
        cname : req.body.cname,
        caddress:req.body.streetaddress,
        country:req.body.country,
        region:req.body.region,
        cnum: req.body.pnum,
        personname:req.body.fname + req.body.lname,
        email:req.body.etext,
        nominalconcat:req.body.ncon,
        industry:req.body.ins,
        website:req.body.site
         };
  
     
    //inserting into mysql
    req.getConnection(function (err, conn){

        if (err) return next("Cannot Connect");

        var query = conn.query("INSERT INTO register_company set ? ",data, function(err, rows){
            res.render('comregister');
           if(err){
                console.log(err);
                return next("Mysql error, check your query");
           }
          
        });

     });
 
});



var curut4 = router.route('/reuser');

//post data to DB | POST
curut4.post(function(req,res,next){

    //validation
    req.assert('name','Name is required').notEmpty();
    req.assert('email','A valid email is required').isEmail();
    req.assert('password','Enter a password 8 - 20').len(8,20);
   
    
    var errors = req.validationErrors();
    if(errors ){
        res.status(422).json(errors);
        return;
    }
    if(!schema.validate(req.body.password))
    {
        res.status(422).json([{'msg':'Please enter password having a digit,a uppaercase and a lowercase'}]);
        return;
    }
    
    //get data
    var data = {
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        access:'1'
     };
     const user =data;
  
     
    //inserting into mysql
    req.getConnection(function (err, conn){

        if (err) return next("Cannot Connect");

        var query = conn.query("INSERT INTO t_user set ? ",data, function(err, rows){
            res.render('register');
           if(err){
                console.log(err);
                return next("Mysql error, check your query");
           }
          
        });

     });
 
});



var curut3 = router.route('/user');

//post data to DB | POST
curut3.post(function(req,res,next){

if(req.session.token)
{
    //validation
    req.assert('name','Name is required').notEmpty();
    req.assert('email','A valid email is required').isEmail();
    req.assert('password','Enter a password 8 - 20').len(8,20);
    req.assert('access','Select a for read,2 for write and 3 for read and write both').notEmpty();
   
    
    var errors = req.validationErrors();
    if(errors ){
        res.status(422).json(errors);
        return;
    }
    if(!schema.validate(req.body.password))
    {
        res.status(422).json([{'msg':'Please enter password having a digit,a uppaercase and a lowercase'}]);
        return;
    }
    
    //get data
    var data = {
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        access:req.body.access
     };
     const user =data;
  
     
    //inserting into mysql
    req.getConnection(function (err, conn){

        if (err) return next("Cannot Connect");

        var query = conn.query("INSERT INTO t_user set ? ",data, function(err, rows){
            res.render('table',{title:"RESTful Crud Example",data:rows});
           if(err){
                console.log(err);
                return next("Mysql error, check your query");
           }
          
        });

     });
 }
 else
 {
     res.sendStatus(403);
 }
});



//show the CRUD interface | GET
curut3.get(function(req,res,next){

    if(req.session.token)
    {
                req.getConnection(function(err,conn){

                if (err) return next("Cannot Connect"+err);
                    
                 var query = conn.query('SELECT * FROM t_user',function(err,rows){
    
                if(err){
                    console.log(err);
                    return next("Mysql error, check your query");
                }
    
                res.render('user',{title:"RESTful Crud Example",data:rows});
    
             });
    
        });
    }
    else
    {
        res.sendStatus(403);
    }
   
		
});


var curut = router.route('/table');


//post data to DB | POST
curut.post(function(req,res,next){

if(req.session.token)
{
    //validation
    req.assert('name','Name is required').notEmpty();
    req.assert('email','A valid email is required').isEmail();
    req.assert('password','Enter a password 8 - 20').len(8,20);
    req.assert('access','Select a for read,2 for write and 3 for read and write both').notEmpty();
  
    var errors = req.validationErrors();
    if(errors){
        res.status(422).json(errors);
        return;
    }
    if(!schema.validate(req.body.password))
    {
        res.status(422).json([{'msg':'Please enter password having a digit,a uppaercase and a lowercase'}]);
        return;
    }
    //get data
    var data = {
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        access:req.body.access
     };
     const user =data;
  
     
    //inserting into mysql
    req.getConnection(function (err, conn){

        if (err) return next("Cannot Connect");

        var query = conn.query("INSERT INTO t_user set ? ",data, function(err, rows){
            res.render('user',{title:"RESTful Crud Example",data:rows});
           if(err){
                console.log(err);
                return next("Mysql error, check your query");
           }
          
        });

     });
 }
 else
 {
     res.sendStatus(403);
 }
});



//show the CRUD interface | GET
curut.get(function(req,res,next){

    if(req.session.token)
    {
                req.getConnection(function(err,conn){

                if (err) return next("Cannot Connect"+err);
                    
                 var query = conn.query('SELECT * FROM t_user',function(err,rows){
    
                if(err){
                    console.log(err);
                    return next("Mysql error, check your query");
                }
    
                res.render('table',{title:"RESTful Crud Example",data:rows});
    
             });
    
        });
    }
    else
    {
        res.sendStatus(403);
    }
   
		
});

//now for Single route (GET,DELETE,PUT)
var curut2 = router.route('/user/:user_id');

/*------------------------------------------------------
route.all is extremely useful. you can use it to do
stuffs for specific routes. for example you need to do
a validation everytime route /api/user/:user_id it hit.

remove curut2.all() if you dont want it
------------------------------------------------------*/
curut2.all(function(req,res,next){
    console.log("You need to smth about curut2 Route ? Do it here");
    console.log(req.params);
    next();
});

//get data to update
curut2.get(function(req,res,next){

  if(req.session.token)
  {  
   var user_id = req.params.user_id;

   req.getConnection(function(err,conn){

        if (err) return next("Cannot Connect");

        var query = conn.query("SELECT * FROM t_user WHERE user_id = ? ",[user_id],function(err,rows){

            if(err){
                console.log(err);
                return next("Mysql error, check your query");
            }

            //if user not found
            if(rows.length < 1)
                return res.send("User Not found");
               // res.send(rows);
                res.render('edit',{title:"Edit user",data:rows});
            });
        });
    }
    else
    {
        res.sendStatus(403);
    }
      
});
//update data
curut2.put(function(req,res,next){


    if(req.session.token)
    {
        var user_id = req.params.user_id;

  
        req.assert('name','Name is required').notEmpty();
        req.assert('email','A valid email is required').isEmail();
        req.assert('password','Enter a password 8 - 20').len(8,20);
        req.assert('access','Select a for read,2 for write and 3 for read and write both').notEmpty();
     
        var errors = req.validationErrors();
        if(errors){
            res.status(422).json(errors);
            return;
        }
        if(!schema.validate(req.body.password))
        {
            res.status(422).json([{'msg':'Please enter password having a digit,a uppaercase and a lowercase'}]);
            return;
        }
        //get data
        var data = {
            name:req.body.name,
            email:req.body.email,
            password:req.body.password,
            access:req.body.access
        };

        //inserting into mysql
        req.getConnection(function (err, conn){

            if (err) return next("Cannot Connect");

            var query = conn.query("UPDATE t_user set ? WHERE user_id = ? ",[data,user_id], function(err, rows){

            if(err){
                    console.log(err);
                    return next("Mysql error, check your query");
            }

            res.sendStatus(200);
        });
        

        });
    }
    else
    {
        res.sendStatus(403);
    }

});

//delete data
curut2.delete(function(req,res,next){

    
        var user_id = req.params.user_id;

         req.getConnection(function (err, conn) {

            if (err) return next("Cannot Connect");

                 var query = conn.query("DELETE FROM t_user  WHERE user_id = ? ",[user_id], function(err, rows){

              if(err){
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.sendStatus(200);

            }   );
        //console.log(query.sql);

        });
   
   
});

//now we need to apply our router here
app.use('/api', router);

//start Server
var server = app.listen(3000,function(){

   console.log("Listening to port %s",server.address().port);

});
