const mongoose = require("mongoose");

var User = new mongoose.Schema({
    uName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        dropDups: true
    },

    password: {
        type: String,
        required: true
    },
    location: {
        lng:
        {
            type: Number,
            default: 0,
            required : false
        },
        lat:
        {
            type: Number,
            default: 0,
            required : false
        },
        
    },
    end: {
        lng:
        {
            type: Number,
            default: 0,
            required : false
        },
        lat:
        {
            type: Number,
            default: 0,
            required : false
        }
    },
    degree:
        {
            type:Number,
            default: 0,
            required : false
        }
});


module.exports = mongoose.model("Users", User, 'bikers');