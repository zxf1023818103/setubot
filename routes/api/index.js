const express = require('express');
const router = new express.Router();

const larkRouter = require('./lark/index');

router.use('/lark', larkRouter);

module.exports = router;
