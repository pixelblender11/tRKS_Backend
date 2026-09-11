var express = require('express');
var router = express.Router();

const ShopItem = require('../models/shopitem.model');

/* GET counter listing. */
router.get('/shopItem/:key', function(req, res, next) {
  var shopItemResponse=new Counter({count:req.params.count});
  res.setHeader('Content-Type','application/json');
  res.send(JSON.stringify(counterResponse));
});

/* GET  listing. */
router.get('/page/:index', function(req, res, next) {
  const items=Array.from({length: 12}, (_,i)=>ShopItem.generateItem(i));
  res.setHeader('Content-Type','application/json');
  res.send(JSON.stringify(items));
});

module.exports = router;
