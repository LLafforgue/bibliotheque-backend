require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { checkToken } = require('./middlewares/auth');
var indexRouter = require('./routes/index');
var liensRouter = require('./routes/liens')
var usersRouter = require('./routes/users');
var rubriquesRouter = require('./routes/rubriques');
const cors = require('cors');
var app = express();


app.use(cors());
app.use(logger('dev'));
app.use(express.json()); // équivalent à bodyParser.json()
app.use(express.urlencoded({ extended: false })); // équivalent à bodyParser.urlencoded()
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/liens', checkToken, liensRouter);
app.use('/rubriques', checkToken, rubriquesRouter);


module.exports = app;
