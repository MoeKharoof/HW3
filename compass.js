const bodyParser = require("body-parser");
const express = require("express");
const {
    get
} = require("http");
var path = require('path');
const app = express();
var mqtt = require('mqtt')
var topic = 'coords';
var data;

app.set('port', 5000);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'))
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({
    extended: true
}));


var sub = mqtt.connect('mqtt://localhost:1883')
sub.on('connect', async () => {
    sub.subscribe(topic)
    console.log("!!!SUB IS CONNECTED!!!");

})
sub.on('message', async (topic,message)=>
{
    data = JSON.parse(message);
    console.log(JSON.stringify(data));
})


app.get('/', (req, res) => {
    res.render('compass',
    {
        distance:parseInt(data.distance),
        angle:data.degree,
    })
})

//Listen to the server.
app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`));