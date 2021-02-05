var express = require('express');
var bcrypt = require('bcrypt-inzi');
var jwt = require('jsonwebtoken');// https://github.com/auth0/node-jsonwebtoken
var { userModel, otpModel } = require('../dbrepo/dbmodel');
var { SERVER_SECRET } = require("../core/index");
var postmark = require("postmark");
var emailApi = process.env.EMAIL_API;
var client = new postmark.ServerClient(emailApi);
var api = express.Router();



api.post('/signup', (req, res, next) => {

    if (!req.body.name || !req.body.email || !req.body.password || !req.body.phone || !req.body.gender) {
        res.send(`Please Fill Name Email Password Gender
        e.g:{
            "name":"Sameer",
            "email":"sameer@gmail.com",
            "password":"123",
            "gender":"Male",

        }
        `)
        return;
    }
    userModel.findOne({ email: req.body.email }, function (err, doc) {
        if (!err && !doc) {
            bcrypt.stringToHash(req.body.password).then(function (ishashPassword) {
                var newUser = new userModel({
                    "name": req.body.name,
                    "email": req.body.email,
                    "password": ishashPassword,
                    "phone": req.body.phone,
                    "gender": req.body.gender
                })
                newUser.save((err, data) => {
                    if (err) {
                        res.send({
                            message: "User Create Error " + JSON.stringify(err),
                            status: 500
                        });
                    }
                    else if (data) {
                        res.send({
                            message: "User is Create",
                            status: 200
                        });
                    }
                });
            })
        } else if (err) {
            res.send({
                message: "DB ERROR",
                status: 500
            });
        } else {
            res.send({
                message: "User is Already Exit",
                status: 404
            });
        }
    });
});

api.post("/login", (req, res, next) => {
    if (!req.body.email || !req.body.password) {
        res.send({
            message: `please send email and passwod in json body.
            e.g:
            {
                "email": "kb337137@gmail.com",
                "password": "abc",
            }`,
            status: 403
        });
        return
    }
    userModel.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            res.send({
                message: "An error occur" + JSON.stringify(err),
                status: 500
            });
        }
        else if (user) {
            bcrypt.varifyHash(req.body.password, user.password).then(isMatched => {
                if (isMatched) {
                    console.log("Matched");
                    var token = jwt.sign({
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        gender: user.gender
                    }, SERVER_SECRET);

                    res.cookie('jToken', token, {
                        maxAge: 86_400_000,
                        httpOnly: true
                    });

                    // when making request from frontend:
                    // var xhr = new XMLHttpRequest();
                    // xhr.open('GET', 'http://example.com/', true);
                    // xhr.withCredentials = true;
                    // xhr.send(null);

                    res.send({
                        message: "Login Success",
                        status: 200,
                        user: {
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            gender: user.gender
                        }
                    });
                } else {
                    console.log("Password Not Match");
                    res.send({
                        message: "Password Incorrect",
                        status: 500
                    });
                }
            }).catch(e => {
                console.log("error :", e);
            });
        } else {
            res.send({
                message: "User Not Found",
                status: 403
            });
        }
    });
});

api.post('/logout', (req, res, next) => {
    res.cookie('jToken', "", {
        maxAge: 86_400_000,
        httpOnly: true
    });
    res.send("logout success");
});

api.post('/forgetpassword', (req, res, next) => {
    if (!req.body.email) {
        res.send({
            message: "Email Required",
            status: 404
        });
        return;
    }
    userModel.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            res.send({
                message: "An Error Occure " + JSON.stringify(err),
                status: 500
            });
        }
        else if (user) {
            console.log("forget password user :", user);
            const otp = Math.floor(getRandomArbitrary(111111, 999999));
            bcrypt.stringToHash(otp).then(isFoundotp => {
                console.log("OTP HASH:", otp);
                otpModel.create({
                    email: req.body.email,
                    otpCode: isFoundotp
                }).then((doc) => {
                    console.log("Before Email");
                    client.sendEmail({
                        "From": "abdullah_student@sysborg.com",
                        "To": req.body.email,
                        "Subject": "Reset your password",
                        "TextBody": `Here is your pasword reset code: ${isFoundotp}`
                    }).then((status) => {
                        console.log("Status:", status);
                        res.send({
                            message: "Email Send With Otp Check Your Email",
                            status: 200
                        });
                    }).catch((err) => {
                        console.log("Error in sending email otp :", err);
                        res.send({
                            message: "Unexpected Error",
                            status: 500
                        });
                    });

                }).catch((err) => {
                    console.log("Error is creating otp", err);
                    res.send({
                        message: "Unexpected Error",
                        status: 500
                    });
                });
            });

        } else {
            res.send({
                message: "User Not Found",
                status: 403
            });
        }
    });
});
api.post('/forgetpassword2', (req, res, next) => {
    if (!req.body.email || !req.body.otp || !req.body.newPassword) {
        res.send({
            message: "Please Required Email otp newPassword",
            status: 403
        });
        return;
    }
    userModel.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            res.send({
                message: "An Error Occure " + JSON.stringify(err),
                status: 500
            });
            return;
        }
        else if (user) {
            otpModel.find({ email: req.body.email }, function (err, otpData) {
                if (err) {
                    res.send({
                        message: "An Error Occure" + JSON.stringify(err),
                        status: 404
                    });
                }
                else if (otpData) {
                    otpData = otpData[otpData.length - 1]

                    console.log("Otp Else iF ", otpData);


                    const now = new Date().getTime();
                    const otpIat = new Date(otpData.createdOn).getTime(); // 2021-01-06T13:08:33.657+0000
                    const diff = now - otpIat; // 300000 5 minute

                    console.log(diff)

                    if (otpData.otpCode === req.body.otp && diff < 30000000) { // correct otp code
                        console.log("this point check otp :", otpData);
                        otpData.remove();

                        bcrypt.stringToHash(req.body.newPassword).then(function (newPassHash) {
                            user.update({ password: newPassHash }, {}, function (err, data) {
                                res.send({
                                    message: "Password Change",
                                    status: 200
                                });
                            });
                        });
                    } else {
                        res.send({
                            message: "Incorrect Otp",
                            status: 401
                        });
                    }

                } else {
                    res.send({
                        message: "Incorrect Otp",
                        status: 401
                    });
                }
            });
        } else {
            res.send({
                message: "User Not Found",
                status: 409
            });
        }
    });
});




function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
module.exports = api;