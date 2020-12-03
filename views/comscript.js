import mqtt from 'mqtt'
var sub = mqtt.connect('mqtt://localhost:8080')


sub.on('message', (topic, message) => {
    console.log('receive message：', topic, message.toString())
})

function MQTTconnect()
{
    console.log("Connectiong to "+ host +":"+port);
    mqtt = new Paho.MQTT.Client(host,port,"compassdriver");
    var options = {
        timeout:3,
        onSuccess: onConnect,
    };
    mqtt.onMessageArrived = onMessageArrived;
    mqtt.connect(options);
}

function onMessageArrived(msg)
{
    console.log(JSON.stringify(msg));
    console.log("FML")
}