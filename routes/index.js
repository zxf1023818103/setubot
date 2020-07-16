const express = require('express');
const router = new express.Router();
const passport = require('passport');

const apiRouter = require('./api/index');

router.use('/api', apiRouter);

router.use(passport.authenticate())

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
