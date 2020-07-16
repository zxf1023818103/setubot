const express = require('express');
//const session = require('express-session');
const helmet = require('helmet');
//const redis = require('redis')
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');

const app = express();

//const RedisStore = require('connect-redis')(session);
//const redisClient = redis.createClient({host: '172.18.0.1'});

app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.set('trust proxy', 1);
//app.use(session({
//    store: new RedisStore({ client: redisClient }),
//    resave: false,
//    secret: 'nmsl'
//}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);

module.exports = app;
