var express = require('express');
var bcrypt = require('bcrypt-inzi');
var jwt = require('jsonwebtoken');// https://github.com/auth0/node-jsonwebtoken
var { userModel, otpModel } = require('../dbrepo/dbmodel');
var { SERVER_SECRET } = require("../core/index");
var emailApi = process.env.EMAIL_API;
// var client = new postmark.ServerClient(emailApi);
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
                    res.send()
                }
            });
        }
    })
})





module.exports = api