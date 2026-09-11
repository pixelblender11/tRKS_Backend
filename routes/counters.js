var express = require('express');
var router = express.Router();

const Counter = require('../models/counter.model');

/* GET counter listing. */
router.get('/count/:count', function(req, res, next) {
  var counterResponse=new Counter({count:req.params.count});
  res.setHeader('Content-Type','application/json');
  res.send(JSON.stringify(counterResponse));
});

/* GET counter listing. */
router.get('/add/:count', function(req, res, next) {
  var counterResponse=new Counter({count:req.params.count});
  counterResponse.count+=1;
  res.setHeader('Content-Type','application/json');
  res.send(JSON.stringify(counterResponse));
});

router.post('/counter', (req, res) => {
  console.log(req.body);
  var counterResponse=new Counter()
  res.send('Got a POST request at /gps')
});

router.put('/counter', (req, res) => {
  res.send('Got a PUT request at /gps')
});

router.delete('/counter', (req, res) => {
  res.send('Got a DELETE request at /gps')
});

module.exports = router;
