const bodyParser = require("body-parser");
const express = require("express")
var cookieParser = require('cookie-parser')
var session = require('express-session')
var cookieSession = require('cookie-session')
var path = require('path');
const mongoose = require('mongoose');
const User = require('./models/user');
var mqtt = require('mqtt')
var topic = 'coords';
const app = express();
var data;


var publisher = mqtt.connect('mqtt://localhost:1883')
    publisher.on('connect',async ()=>
    {
        console.log("!!!PUBLISHER IS CONNECTED!!!");
        setInterval(()=>
        {   
            if(data)
            {
                publisher.publish(topic,JSON.stringify(data));
                console.log(JSON.stringify(data));
            }
            else
            {
                publisher.publish(topic,"Found nothing waiting for input!");
            }
        }, 100)
        
    })

app.set('port', 4000);
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'))
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({
    extended: true
}));



app.use(session({
    name: 'emailCookie',
    secret: 'nav',
    resave: true, // have to do with saving session under various conditions
    saveUninitialized: true, // just leave them as is
    cookie: {
        maxAge: (2592000000) //30 days lol
    }
}));

//connection to bikers db
mongoose.connect('mongodb://127.0.0.1:27017/bikers', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


//Routes
app.get('/login', (req,res)=>
{
    console.log("!!!NOW AT LOGIN!!!");
    res.render('login');
})


app.get('/returnUser',(req,res)=>
{
    console.log("!!!RETURNING USER IS BEING PROCESSED!!!");
    var email = req.query.email;
    User.findOne({
        email: email
    },(err, user)=>
    {
        if(err)
        {
            console.log(err);
        }
        if(user && user.password == req.query.password)
        {
            req.session.name = user.uName;
            if (req.session.viewCount != null && req.session.viewCount != 0) {
                console.log(req.session.viewCount);
            } else {
                req.session.viewCount = 0;
                console.log(user.uName + " has logged in for the first time. Redirecting to map.\nView count: " + req.session.viewCount);
            }
            req.session.isLoggedIn = true;
            res.redirect('map');
        }
        else
        {
            console.log("Invalid Email or Password!!!");
            res.redirect('/login');
        }
    } 
    )
})


app.get('/registration', (req,res)=>
{
    console.log("!!!NOW AT SIGNUP!!!");
    res.render('registration');

})


app.get('/newUser', (req,res)=>
{
    console.log('!!!NEW USER IS BEING PROCESSED!!!');
    var user = new User({
        uName:req.query.uname,
        email:req.query.email,
        password:req.query.password
    })
    user.save().then(user => {
        console.log(user.uName + " was added successfully");
        req.session.name = user.uName;
            if (req.session.viewCount != null && req.session.viewCount != 0) {
                console.log(req.session.viewCount);
            } else {
                req.session.viewCount = 0;
                console.log(user.uName + " has logged in for the first time. Redirecting to map.\nView count: " + req.session.viewCount);
            }
            req.session.isLoggedIn = true;
            res.redirect('/map');
    });
})


app.get('/map',(req,res)=>
{
    if(req.session.isLoggedIn)
    {
    req.session.last = new Date().toString();
    console.log(req.session.last)
    req.session.viewCount = req.session.viewCount+1;
    console.log("!!!NOW AT MAP!!!")
    res.render('map',
    {
        name:req.session.name,
        flag:req.session.viewCount,
        date:req.session.last.toString()
    });
}
else{
    res.redirect('/');
}
    
})

app.get('/logout',(req,res)=>
{
    req.session.isLoggedIn = false;
    req.session.destroy();
    res.redirect('/login');
})

app.get('/mapadd',(req,res)=>
{
    data = {
        current:
        {
            lat:req.query.lat1,
            lng:req.query.lng1
        },
        endpoint:
        {
            lat:req.query.lat2,
            lng:req.query.lng2
        },
        degree:req.query.degree,
        distance:req.query.distance
    }
    User.findOne({
        uName: req.session.name
    },(err, user)=>
    {
        if(user)
        {
            user.location.lat = req.query.lat1;
            user.location.lng=req.query.lng1;
            user.end.lat=req.query.lat2;
            user.end.lng=req.query.lng2;
            user.degree=req.query.degree;
            user.save().then(user=>{
                console.log(user.uName+" has updated their coords!");
            })
            
        }
    })
    console.log("!!!RECIEVED DATA FROM MAPADD!!!"+JSON.stringify(data));
    
    console.log("!!!"+topic+" WAS SENT VIA MAPADD.\nDATA SENT:" + JSON.stringify(data));
})


app.use(function (req, res) {
    res.render('my500');
    });


//Listen to the server.
app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`)); 