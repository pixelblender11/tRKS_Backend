var express = require('express');
var router = express.Router();

const { issueSessionToken } = require('../middleware/auth');

/* POST /auth/session - start an anonymous shopping session, returns a JWT. */
router.post('/session', function (req, res) {
    res.json(issueSessionToken());
});

module.exports = router;
