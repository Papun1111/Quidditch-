const mongoose = require("mongoose");
const userSchema=Schema.mongoose({
    username:String,
    name:String,
    password:String
});

const User=mongoose.model("user",userSchema);
export default User;