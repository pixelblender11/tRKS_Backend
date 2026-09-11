const express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Route Registration
app.use('/', indexRouter);

//Counter registration
const countersRoute = require('./routes/counters');
app.use('/counters', countersRoute);


//ShopItems registration
const shopItemsRoute = require('./routes/shopItems');
app.use('/shopitems', shopItemsRoute);

//Utility Dart generator
const generatorRoute = require('./utilities/generator');
app.use('/generator', generatorRoute);

var port = process.env.PORT || 3001;
app.listen(port, function () {
    console.log('Example app listening on port ' + port + '!');
});

module.exports = app;
