import mongoose, { Schema } from "mongoose";
const userSchema=new Schema({
    username:String,
    name:String,
    password:String
});

const User=mongoose.model("user",userSchema);
export default User;