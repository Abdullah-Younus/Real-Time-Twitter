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
// const admin = require("firebase-admin");

// console.log("module: ", userModel);
var { SERVER_SECRET } = require("./core/index");


var { userModel, tweetModel } = require("./dbrepo/dbmodel");
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
//     databaseURL:process.env.databaseURL
// });
// const bucket = admin.storage().bucket(process.env.bucket);
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





server.listen(PORT, () => {
    console.log("Server is Running :", PORT);
});