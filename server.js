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
var serviceAccount = {
    "type": "service_account",
    "project_id": "tweetapp-23ff3",
    "private_key_id": "9c4e62c141bad664c2d64aae090eaa53d941c7ef",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQCkMXWPsirsKVId\nZO1o1zm5lymSIlEf6FD8Yf9pDJxlN21LE5TwxRdyPJkvBTSva9immF7PZw6go7/y\njkogFlIW0jgLXYwD0c0viwtT8Ob1VnsBuo/9LjQgEtCucN+CW24QDsxip1hPtqWg\nzkg22jXZ83cU+9hUqHDF0McpM7Bc2eIeyoSJ6LWVvrCuvTaJ2uPaCeKTwcJ2U5eW\nw3hct1a9PgUtvC3aBoVymXDhaeGqTvOt0wjpYdKGJNzuXiV2vG/LGFiwCPVSwalu\nWDinNkAqNJfQio+acrcJrImsi518hBSdZ8i1Mz3fSjgA38FJXgU/bjG4gLKm+b1v\nkpDP2/vzAgMBAAECgf830qvsoLmFWGEqWto2pOL7UrVBRavwXJn8wuLj3cSQyvIR\nw8X8AvNLEvBqAp11LJ2+ZQX85gNodEPXwbgcmPVizOaf2iS22+ADU3uP8fim7BVq\nzOaZQHGB3l8BrXFslJ+6dxSnM4BhFOdgzimsMKoeZjZPN+hU4AwiBbzzAsXD555J\n06rbhHjCU3paNUouPWSCaKUpCsc6jVIYplByTlryKkleRapsSyxa1LC8zV/I5znG\nq8uEhB21x6owJqUgZOBBqYPlaLyfE9Ulfzna98+85q6vyNR0zOZiyCslmzCi+IKh\nqXOL5JUTUDeoXhaqpYtMc5IL7/NL/VZJBZoEAcECgYEA3OA+rhCYEyOCObgVDdxi\n1X2pulqV6eVRd0d7J0NLL0dENZnu3xOUciUSettJL4TGHh/YI89x/m5CeAafXrzI\nrUfQ6gXpG5sjh7j6d3M8NPsqTLczu8WwnkoQD+4ZX/2bgUxhYkT4iD22XYnnS0u4\nP3VTIU95vTy0Aha4Gh6Y77ECgYEAvk2vsuimDXrIg1j4FMwMKENAOE5abvkpCNVc\ndfazAEPcCnfLyqknAe03Mh5/JFP/N49fgaHYgRKGjDdf8q7Vr5r4JQQAW7J/0b6H\nJO7Gu/sNMmJ6dJD/eCxk0ANNhK3ukhcADlmJ2qdUyhm+Yby85qGYLlGjLpJRz6wd\nP1n1EuMCgYEAtncZ0Losp0LiRcRowDab/zn8iNJkngCvOBZ5CopxBfGdy5oK14ZZ\nT6KIja2x2+uXrzMnXw30Yfe8OWNfLOhP77YwQ+P2GrQiufB6GUu9JReIbi+6MRiz\nO1B7zG0p0T60xC/RE1le503z5XoS9QTshJ/ruMzrCQWov0D9fbZhKUECgYA9BP/v\nZ/XGoLYml6KEWKEVT+sJouYQa0gjEvbgxEfFL/0gRiVMSEy/q2ZlZa3y4hQVpp1D\nHbgkOuJ1l1PmpvTRp+klRVEwFd4yTNtclkuW/vrOSxFkyxF/YQy6PjTe9D5pDYLx\nFvjC6aCgZPzMrg4MDYiUYYznY/djlZaTN68DbQKBgEGtApLgXYoNxWxK7ol/ezqE\nQ9oFZbGL2ZtWSJxf/ZC9bUz1n46rpqg/3dN2Ac67/ZQZn9rg00FlqioDnsAl5j4l\nuc5/z8+roUJfqtgQDlFD6F2zRnHexci2a4oBJOYK9a4SDU/Gn6HUdqicxea2NvRC\nI9/l6Gb5bJwVhQce5lwC\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-t7ycv@tweetapp-23ff3.iam.gserviceaccount.com",
    "client_id": "110481195485338439268",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-t7ycv%40tweetapp-23ff3.iam.gserviceaccount.com"
}


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://tweetapp-23ff3-default-rtdb.firebaseio.com"
});
const bucket = admin.storage().bucket("gs://tweetapp-23ff3.appspot.com");
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
                req.headers.jToken = decodedData

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
                profile: doc,
                status: 200
            });
            console.log("huma check karyn profile ka doc", doc)
        } else {
            res.send({
                message: "Server error",
                status: 500
            });
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
                            console.log("Yaha check karna han kia a arha han",user)
                            if (!err) {
                                tweetModel.updateMany({ username: req.headers.jToken.name }, { profilePic: urlData[0] }, (err, tweetModel) => {
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

                console.log("Mujha is data ma check karna han kia a raha ha ");
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
app.get("/tweet-get", (req, res, next) => {
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

server.listen(PORT, () => {
    console.log("Server is Running :", PORT);
});