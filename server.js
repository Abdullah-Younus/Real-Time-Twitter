const PORT = process.env.PORT || 5000;
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const authrouter = require("./routes/auth")

var app = express();
var server = http.createServer(app);


app.use(bodyParser.json());
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(morgan('dev'));

app.use('/', express.static(path.resolve(path.join(__dirname, "public"))));

app.use('/', authrouter);


server.listen(PORT, () => {
    console.log("Server is Runnig :", PORT);
});