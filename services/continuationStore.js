const crypto = require('crypto');

/**
 * In-memory store for search continuation tokens.
 *
 * Each token captures a search's filter, sort, and read position so the next
 * page can be fetched with the token alone. Tokens are scoped to the JWT
 * session that created them - one session can never replay another's token.
 *
 * Per session, tokens live in an insertion-ordered Map used as a FIFO queue:
 * once MAX_TOKENS_PER_SESSION is reached the oldest token is evicted. Tokens
 * also expire after TTL_MS, and expired sessions are swept periodically.
 */
const MAX_TOKENS_PER_SESSION = 20;
const TTL_MS = 30 * 60 * 1000; // 30 minutes
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const sessions = new Map(); // sessionId -> Map(token -> { state, expiresAt })

function create(sessionId, state) {
    let queue = sessions.get(sessionId);
    if (!queue) {
        queue = new Map();
        sessions.set(sessionId, queue);
    }
    while (queue.size >= MAX_TOKENS_PER_SESSION) {
        queue.delete(queue.keys().next().value); // evict oldest
    }
    const token = crypto.randomUUID();
    queue.set(token, { state, expiresAt: Date.now() + TTL_MS });
    return token;
}

function get(sessionId, token) {
    const queue = sessions.get(sessionId);
    if (!queue) return null;
    const entry = queue.get(token);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
        queue.delete(token);
        return null;
    }
    return entry.state;
}

function sweep() {
    const now = Date.now();
    for (const [sessionId, queue] of sessions) {
        for (const [token, entry] of queue) {
            if (entry.expiresAt < now) queue.delete(token);
        }
        if (queue.size === 0) sessions.delete(sessionId);
    }
}

const sweeper = setInterval(sweep, SWEEP_INTERVAL_MS);
sweeper.unref(); // don't keep the process alive just for cleanup

module.exports = { create, get };
