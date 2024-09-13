const mongoose = require("mongoose");
const Schema=mongoose.Schema;
const userSchema=Schema({
    username:String,
    name:String,
    password:String
});

const User=mongoose.model("user",userSchema);
module.exports = { User };