const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const TOKEN_TTL = process.env.JWT_TTL || '24h';

function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not set - add it to .env');
    }
    return secret;
}

/** Issues a JWT identifying an anonymous shopping session. */
function issueSessionToken() {
    const sessionId = crypto.randomUUID();
    const token = jwt.sign({ sid: sessionId }, getSecret(), { expiresIn: TOKEN_TTL });
    return { token, sessionId, expiresIn: TOKEN_TTL };
}

/** Verifies the Bearer token and attaches req.sessionId. */
function requireSession(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Missing bearer token. POST /auth/session to get one.' });
    }
    try {
        const payload = jwt.verify(token, getSecret());
        req.sessionId = payload.sid;
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired session token.' });
    }
}

module.exports = { issueSessionToken, requireSession };
