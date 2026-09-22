var express = require('express');
var router = express.Router();

const { Op } = require('sequelize');
const Cart = require('../models/cart.model');
const ShopItem = require('../models/shopitem.model');

async function getOrCreateCart(sessionId) {
    const [cart] = await Cart.findOrCreate({
        where: { sessionId },
        defaults: { items: [] },
    });
    return cart;
}

// Returns the cart with each line joined to its current item details.
async function renderCart(sessionId) {
    const cart = await Cart.findOne({ where: { sessionId } });
    const lines = cart ? cart.items : [];
    const items = await ShopItem.findAll({
        where: { pKey: { [Op.in]: lines.map(l => l.pKey) } },
        attributes: { exclude: ['id'] },
        raw: true,
    });
    const byKey = new Map(items.map(i => [i.pKey, i]));
    return {
        sessionId,
        items: lines
            .filter(l => byKey.has(l.pKey))
            .map(l => ({ ...byKey.get(l.pKey), qty: l.qty })),
    };
}

/* GET /cart - current session's cart. */
router.get('/', async function (req, res, next) {
    try {
        res.json(await renderCart(req.sessionId));
    } catch (err) {
        next(err);
    }
});

/* PUT /cart - replace the cart. Body: { items: [{ pKey, qty }] } */
router.put('/', async function (req, res, next) {
    try {
        const items = Array.isArray(req.body.items) ? req.body.items : null;
        if (!items || items.some(i => !Number.isFinite(i.pKey) || !Number.isFinite(i.qty) || i.qty < 1)) {
            return res.status(400).json({ error: 'Body must be { items: [{ pKey, qty >= 1 }] }.' });
        }
        const cart = await getOrCreateCart(req.sessionId);
        cart.items = items.map(i => ({ pKey: i.pKey, qty: Math.floor(i.qty) }));
        await cart.save();
        res.json(await renderCart(req.sessionId));
    } catch (err) {
        next(err);
    }
});

/* POST /cart/items - add an item (or increase its qty). Body: { pKey, qty? } */
router.post('/items', async function (req, res, next) {
    try {
        const pKey = req.body.pKey;
        const qty = Number.isFinite(req.body.qty) ? Math.floor(req.body.qty) : 1;
        if (!Number.isFinite(pKey) || qty < 1) {
            return res.status(400).json({ error: 'Body must be { pKey, qty >= 1 }.' });
        }
        const exists = await ShopItem.findOne({ where: { pKey }, attributes: ['pKey'] });
        if (!exists) {
            return res.status(404).json({ error: 'Item not found.' });
        }

        const cart = await getOrCreateCart(req.sessionId);
        const line = cart.items.find(l => l.pKey === pKey);
        cart.items = line
            ? cart.items.map(l => (l.pKey === pKey ? { ...l, qty: l.qty + qty } : l))
            : [...cart.items, { pKey, qty }];
        await cart.save();
        res.json(await renderCart(req.sessionId));
    } catch (err) {
        next(err);
    }
});

/* DELETE /cart/items/:pKey - remove one line from the cart. */
router.delete('/items/:pKey', async function (req, res, next) {
    try {
        const pKey = parseInt(req.params.pKey, 10);
        if (Number.isNaN(pKey)) {
            return res.status(400).json({ error: 'pKey must be a number.' });
        }
        const cart = await getOrCreateCart(req.sessionId);
        cart.items = cart.items.filter(l => l.pKey !== pKey);
        await cart.save();
        res.json(await renderCart(req.sessionId));
    } catch (err) {
        next(err);
    }
});

/* DELETE /cart - empty the cart. */
router.delete('/', async function (req, res, next) {
    try {
        const cart = await getOrCreateCart(req.sessionId);
        cart.items = [];
        await cart.save();
        res.json(await renderCart(req.sessionId));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
