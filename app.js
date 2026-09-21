require('dotenv').config();

const express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const { requireSession } = require('./middleware/auth');

var indexRouter = require('./routes/index');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Route Registration
app.use('/', indexRouter);

//Session tokens (public)
const authRoute = require('./routes/auth');
app.use('/auth', authRoute);

//ShopItems registration (JWT protected)
const shopItemsRoute = require('./routes/shopItems');
app.use('/shopitems', requireSession, shopItemsRoute);

//Cart registration (JWT protected)
const cartRoute = require('./routes/cart');
app.use('/cart', requireSession, cartRoute);

// 404
app.use(function (req, res) {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(function (err, req, res, next) {
    console.error(err);
    res.status(err.status || 500).json({ error: 'Internal server error' });
});

module.exports = app;
