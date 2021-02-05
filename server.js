const PORT = process.env.PORT || 5000;
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const http = require('http');
const path = require('path');
const authrouter = require("./routes/auth")
var jwt = require('jsonwebtoken');
var socketIO = require('socket.io');
var app = express();
var server = http.createServer(app);
var { SERVER_SECRET } = require('./core/index');

var { userModel, tweetModel } = require('./dbrepo/dbmodel');
app.use(bodyParser.json());
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(morgan('dev'));

app.use('/', express.static(path.resolve(path.join(__dirname, "public"))));

app.use('/', authrouter);

var io = socketIO(server);
io.on("connection", (user) => {
    console.log("User is Connected");
});



app.use(function (req, res, next) {
    console.log("req.cookies: ", req.cookies);
    



});



server.listen(PORT, () => {
    console.log("Server is Runnig :", PORT);
});