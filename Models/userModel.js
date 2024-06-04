//Schema for user info.
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required : true,
        unique: true,
    },
    username: {
        type: String,
        required : true,
        unique: true,
    },
    password: {
        type: String,
        required : true,
    },
});

//Now we have to convert this schema into models so that we can write mongoose queries.
// const userModel = mongoose.model('user', userSchema);
// module.exports = userModel;

//or we can write in this way.
module.exports = mongoose.model('user', userSchema); //In this case there is no constant (in above case it is  "userModel") to export so the file-name will act as a constant.And we can use that anywhere.