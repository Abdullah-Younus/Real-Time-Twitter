var mongoose = require('mongoose');

let dbURI = "mongodb+srv://root:root@cluster0.s5oku.mongodb.net/twitter?retryWrites=true&w=majority"


mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });


mongoose.connection.on("connected", function () {
    console.log("Mongoose Is Connected");
});
mongoose.connection.on("disconnected", function () {
    console.log("Mongoose Is Disconnected");
    process.exit(1);
});
mongoose.connection.on("error", function (err) {
    console.log("Mongoose connection error ", err);
    process.exit(1);
});

process.on('SIGINT', function () {
    console.log("App is terminated");
    mongoose.connection.close(function () {
        console.log("Mongoose default connection closed");
        process.exit(0);
    });
});

var userSchema = mongoose.Schema({
    "name": String,
    "email": String,
    "password": String,
    "phone": String,
    "gender": String,
    "profilePic": String,
    "createdOn": { "type": Date, "default": Date.now },
    "activeSince": Date
});

var userModel = mongoose.model('users', userSchema);

var otpSchema = mongoose.Schema({
    "email": String,
    "otpCode": String,
    "createdOn": { "type": Date, "default": Date.now },
});

var otpModel = mongoose.model('otp', otpSchema);

var twitterSchema = mongoose.Schema({
    "username": String,
    "tweets": String,
    "profilePic": String,
    "tweetImg": String,
    "createdOn": { "type": Date, "default": Date.now }
})

var tweetModel = mongoose.model('tweets', twitterSchema);


module.exports = ({
    userModel: userModel,
    otpModel: otpModel,
    tweetModel: tweetModel
});





