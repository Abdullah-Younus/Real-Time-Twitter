const PORT = process.env.PORT || 5000;
var express = require("express");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cors = require("cors");
var morgan = require("morgan");
var jwt = require('jsonwebtoken');
var http = require("http");
var socketIO = require('socket.io');
const multer = require('multer')
var path = require("path");
const fs = require('fs');
const admin = require("firebase-admin");

// console.log("module: ", userModel);
var { SERVER_SECRET } = require("./core/index");


var { userModel, tweetModel } = require("./dbrepo/dbmodel");
var authRoutes = require("./routes/auth");

var app = express();

var server = http.createServer(app);

const storage = multer.diskStorage({ // https://www.npmjs.com/package/multer#diskstorage
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, `${new Date().getTime()}-${file.filename}.${file.mimetype.split("/")[1]}`)
    }
})
var upload = multer({ storage: storage })



// // // https://firebase.google.com/docs/storage/admin/start
var serviceAccount = JSON.parse(process.env.SERVICEACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASEURL
});
const bucket = admin.storage().bucket(process.env.BUCKET);
app.use(bodyParser.json());
app.use(cookieParser());

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(morgan('dev'));

app.use('/', express.static(path.resolve(path.join(__dirname, "public"))));

app.use('/auth', authRoutes);

var io = socketIO(server);
io.on("connection", (user) => {
    console.log("User is Connected");
});



app.use(function (req, res, next) {
    console.log("req.cookies: ", req.cookies);
    if (!req.cookies.jToken) {
        res.send({
            message: "Include http-only credentials with every request",
            status: 401
        });
    }
    jwt.verify(req.cookies.jToken, SERVER_SECRET, function (err, decodedData) {
        if (!err) {
            console.log("Check Decoded Data :", decodedData)
            const issueDate = decodedData.iat * 1000;
            const nowDate = new Date().getTime();
            const diff = nowDate - issueDate;

            if (diff > 300000) {
                res.send({
                    message: "Token Expire",
                    status: 401
                });
            } else {
                var token = jwt.sign({
                    id: decodedData.id,
                    name: decodedData.name,
                    email: decodedData.email,
                    phone: decodedData.phone,
                    gender: decodedData.gender
                }, SERVER_SECRET)

                res.cookie('jToken', token, {
                    maxAge: 86_400_000,
                    httpOnly: true
                });
                req.body.jToken = decodedData
                next();
            }

        }
        else {
            res.send({
                message: "Invalid Token",
                status: 401
            });
        };
    });

});


app.get("/profile", (req, res, next) => {
    console.log(req.body);

    userModel.findById(req.body.jToken.id, 'name email phone gender createdOn profilePic', function (err, doc) {
        if (!err) {
            res.send({
                message: doc,
                status: 200
            });
        } else {
            res.send({
                message: "Server error",
                status: 500
            });
        }

    });

});

app.post("/tweet", upload.any(), (req, res, next) => {
    console.log("req.body: ", req.body);
    bucket.upload(
        req.files[0].path,
        function (err, file, apiResponse) {
            if (!err) {
                file.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491'
                }).then((urlData, err) => {
                    if (!err) {
                        console.log("public downloadable url: ", urlData[0]) // this is public downloadable url 
                        userModel.findById(req.body.jToken.id, 'name profilePic', (err, user) => {
                            if (!err) {
                                tweetModel.create({
                                    "username": user.name,
                                    "tweets": req.body.tweet,
                                    "profilePic": user.profilePic,
                                    "tweetImg": urlData[0]
                                }).then((data) => {
                                    console.log(data);
                                    res.send({
                                        status: 200,
                                        message: "Post Created",
                                        data: data
                                    })
                                    console.log(data);
                                    io.emit("NEW_POST", data);
                                }).catch(() => {
                                    console.log(err);
                                    res.send({
                                        message: "User is create Error" + err,
                                        status: 500
                                    });
                                });
                            } else {
                                res.send("err")
                            }
                        })
                        try {
                            fs.unlinkSync(req.files[0].path)
                            //file removed
                        } catch (err) {
                            console.error(err)
                        }
                    }
                })
            } else {
                console.log("err: ", err)
                res.status(500).send();
            }
        });
});
app.post('/textTweet', (req, res, next) => {
    if (!req.body.tweet) {
        res.send({
            message: "Provide tweet",
            status: 403
        });
    }
    userModel.findOne({ email: req.body.jToken.email }, (err, user) => {
        if (!err) {
            tweetModel.create({
                "username": user.name,
                "tweets": req.body.tweet,
                "profilePic": user.profilePic
            }).then((data) => {
                console.log(data);
                res.send({
                    status: 200,
                    message: "Post Create",
                    data: data
                })
                io.emit("NEW_POST", data)
            }).catch(() => {
                console.log(err);
                res.status(500).send({
                    message: "user create error, " + err
                })
            })
        } else {
            res.send({
                message: "Error" + err,
                status: 500
            });
        }
    });

})
app.get("/getTweet", (req, res, next) => {
    tweetModel.find({}, (err, data) => {
        if (err) {
            console.log(err)
        }
        else {
            res.send({ data: data });
        }
    })
})
app.get("/myTweet", (req, res, next) => {
    userModel.findOne({ email: req.body.jToken.email }, (err, user) => {
        if (!err) {
            tweetModel.find({ username: req.body.jToken.name }, (err, data) => {
                if (err) {
                    res.send({
                        message: "Error" + err,
                        status: 404
                    })
                }
                else {
                    res.send({
                        data: data
                    })
                }
            });
        } else {
            res.send({
                message: "Error" + err,
                status: 404
            })
        }
    });
});
app.post("/upload", upload.any(), (req, res, next) => {

    console.log("req.body: ", req.body);
    bucket.upload(
        req.files[0].path,
        function (err, file, apiResponse) {
            if (!err) {
                file.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491'
                }).then((urlData, err) => {
                    if (!err) {
                        console.log("public downloadable url: ", urlData[0])
                        userModel.findOne({ email: req.body.email }, (err, user) => {
                            console.log(user)
                            if (!err) {
                                tweetModel.updateMany({ name: req.headers.jToken.name }, { profilePic: urlData[0] }, (err, tweetModel) => {
                                    console.log(tweetModel)
                                    if (!err) {
                                        console.log("update");
                                    }
                                });
                                user.update({ profilePic: urlData[0] }, (err, updatedProfile) => {
                                    if (!err) {
                                        res.status(200).send({
                                            message: "succesfully uploaded",
                                            url: urlData[0],
                                        })
                                    }
                                    else {
                                        res.status(500).send({
                                            message: "an error occured" + err,
                                        })
                                    }

                                })
                            }
                            else {
                                res.send({
                                    message: "error"
                                });
                            }
                        })
                        try {
                            fs.unlinkSync(req.files[0].path)
                        } catch (err) {
                            console.error(err)
                        }
                    }
                })
            } else {
                console.log("err: ", err)
                res.status(500).send();
            }
        });
})

server.listen(PORT, () => {
    console.log("Server is Running :", PORT);
});