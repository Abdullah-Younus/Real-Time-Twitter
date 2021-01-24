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


var { userModel, tweetModel } = require("./dbrepo/models");
var authRoutes = require("./routes/auth");

var app = express();

var server = http.createServer(app);

// const storage = multer.diskStorage({ // https://www.npmjs.com/package/multer#diskstorage
//     destination: './uploads/',
//     filename: function (req, file, cb) {
//         cb(null, `${new Date().getTime()}-${file.filename}.${file.mimetype.split("/")[1]}`)
//     }
// })
// var upload = multer({ storage: storage })



// // // https://firebase.google.com/docs/storage/admin/start
// var serviceAccount = JSON.parse(process.env.serviceAccount);


// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: process.env.databaseURL
// });
// const bucket = admin.storage().bucket(process.env.bucket);

// //==============================================



app.use(bodyParser.json());
app.use(cookieParser());

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(morgan('dev'));

// example how to send file any requrest

// app.get("/", (req, res, next) => {
//     console.log(__dir);
//     res.sendFile(path.resolve(path.join(__dirname, "public")))
// })

app.use("/", express.static(path.resolve(path.join(__dirname, "public"))))

app.use('/', authRoutes);


var io = socketIO(server);
io.on("connection", (user) => {
    console.log("user connected");
})


app.use(function (req, res, next) {

    console.log("req.cookies: ", req.cookies);

    if (!req.cookies.jToken) {
        res.status(401).send("include http-only credentials with every request")
        return;
    }
    jwt.verify(req.cookies.jToken, SERVER_SECRET, function (err, decodedData) {
        if (!err) {

            const issueDate = decodedData.iat * 1000;
            const nowDate = new Date().getTime();
            const diff = nowDate - issueDate; // 84600,000

            if (diff > 300000) { // expire after 5 min (in milis)
                res.send({
                    message: "TOKEN EXPIRED",
                    status: 401
                });
            } else { // issue new Token
                var token = jwt.sign({
                    id: decodedData.id,
                    name: decodedData.name,
                    email: decodedData.email,
                    phone: decodedData.phone,
                    gender: decodedData.gender,
                    profilePic: decodedData.profilePic
                }, SERVER_SECRET)

                res.cookie('jToken', token, {
                    maxAge: 86_400_000,
                    httpOnly: true
                });
                req.body.jToken = decodedData
                next();
            }
        } else {
            res.send({
                message: "Invalid Token",
                status: 401
            });
        }


    });

});


app.get("/profile", (req, res, next) => {
    console.log(req.body);

    userModel.findById(req.body.jToken.id, 'name email phone gender createdOn profilePic', function (err, doc) {
        if (!err) {
            res.send({
                profile: doc
            })

        } else {
            res.send({
                message: "Server Error",
                status: 500
            });
        }
    });
})

app.post("/tweet",upload.any(), (req, res, next) => {
    console.log("is body ma check karna han kia han", req.body);
    if (!req.body.jToken.id || !req.body.tweet) {
        res.send({
            status: 401,
            message: "Please write tweet"
        })
    }
    userModel.findById(req.body.jToken.id, 'name', function (err, user) {
        if (!err) {
            tweetModel.create({
                "username": user.name,
                "tweet": req.body.tweet
            }, function (err, data) {
                if (err) {
                    res.send({
                        message: "Tweet DB ERROR",
                        status: 404
                    });
                } 
                else if (data) {
                    res.send({
                        status: 200,
                        message: "Your Tweet Send",
                        data: data + user.profilePic,
                    });
                    io.emit("NEW_POST", data);
                    // console.log("ya be check karna han kesay ae han acha yaha concatenate kara han:", data)
                } else {
                    res.send({
                        message: "Tweets posting error try again later",
                        status: 500
                    });
                }
            });
            // tweetModel.findOne({ id: req.body.jToken.id }, {}, { sort: { 'created_at': -1 } }, function (err, post) {
            //     console.log("this check latest post :", post);
            // })
        } else {
            res.send({
                message: "User Not Found",
                status: 404
            });
        }
    });


});
app.get("/tweet-get", (req, res, next) => {
    tweetModel.find({}, function (err, data) {
        if (err) {
            console.log(err)
        }
        else {
            console.log(data)
            req.body.data = data
            // data = data[data.length -1]
            res.send(data)
        }
    })
});


// app.post("/upload", upload.any(), (req, res, next) => {  // never use upload.single. see https://github.com/expressjs/multer/issues/799#issuecomment-586526877

//     console.log("req.body: ", req.body);
//     console.log("req.body: ", JSON.parse(req.body.myDetails));
//     console.log("req.files: ", req.files);

//     console.log("uploaded file name: ", req.files[0].originalname);
//     console.log("file type: ", req.files[0].mimetype);
//     console.log("file name in server folders: ", req.files[0].filename);
//     console.log("file path in server folders: ", req.files[0].path);

//     // upload file to storage bucket 
//     // you must need to upload file in a storage bucket or somewhere safe
//     // server folder is not safe, since most of the time when you deploy your server
//     // on cloud it makes more t2han one instances, if you use server folder to save files
//     // two things will happen, 
//     // 1) your server will no more stateless
//     // 2) providers like heroku delete all files when dyno restarts (their could be lots of reasons for your dyno to restart, or it could restart for no reason so be careful) 


//     // https://googleapis.dev/nodejs/storage/latest/Bucket.html#upload-examples
//     bucket.upload(
//         req.files[0].path,
//         // {
//         //     destination: `${new Date().getTime()}-new-image.png`, // give destination name if you want to give a certain name to file in bucket, include date to make name unique otherwise it will replace previous file with the same name
//         // },
//         function (err, file, apiResponse) {
//             if (!err) {
//                 // console.log("api  sameer khan resp: ", apiResponse);

//                 // https://googleapis.dev/nodejs/storage/latest/Bucket.html#getSignedUrl
//                 file.getSignedUrl({
//                     action: 'read',
//                     expires: '03-09-2491'
//                 }).then((urlData, err) => {
//                     if (!err) {
//                         console.log("public downloadable url: ", urlData[0]) // this is public downloadable url 
//                         // res.send(urlData[0]);
//                         userModel.findOne({ email: req.body.email }, (err, user) => {
//                             if (!err) {
//                                 user.update({ profilePic: urlData[0] }, {}, function (err, data) {
//                                     res.send({
//                                         pic: user.profilePic
//                                     });
//                                 })
//                             }
//                             else {
//                                 res.send({
//                                     message: "error"
//                                 });
//                             }
//                         })


//                         // // delete file from folder before sending response back to client (optional but recommended)
//                         // // optional because it is gonna delete automatically sooner or later
//                         // // recommended because you may run out of space if you dont do so, and if your files are sensitive it is simply not safe in server folder
//                         try {
//                             fs.unlinkSync(req.files[0].path)
//                             //file removed
//                             return;
//                         } catch (err) {
//                             console.error(err)
//                         }
//                         // res.send("Ok");/
//                     }
//                 })
//             } else {
//                 console.log("err: ", err)
//                 res.status(500).send();
//             }
//         });
// })
server.listen(PORT, () => {
    console.log("Server is Running:", PORT);
});