var express = require('express');
var router = express.Router();

const { Op } = require('sequelize');
const ShopItem = require('../models/shopitem.model');
const ShopItemCategory = require('../models/shopItemCategory.model');
const continuationStore = require('../services/continuationStore');

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

// Maps the front end's SortBy enum (lib/Models/SortByEnum.dart) to SQL orders.
// pKey is always the tiebreaker so paging order is stable.
const SORTS = {
    None: [['pKey', 'ASC']],
    HighToLow: [['price', 'DESC'], ['pKey', 'ASC']],
    LowToHigh: [['price', 'ASC'], ['pKey', 'ASC']],
    Newest: [['dateAdded', 'DESC'], ['pKey', 'ASC']],
    Oldest: [['dateAdded', 'ASC'], ['pKey', 'ASC']],
};

function buildWhere(params) {
    const where = {};
    if (params.q) {
        const like = `%${String(params.q)}%`;
        where[Op.or] = [
            { title: { [Op.iLike]: like } },
            { description: { [Op.iLike]: like } },
            { tags: { [Op.iLike]: like } },
        ];
    }
    if (params.categories) {
        const keys = String(params.categories).split(',').map(Number).filter(Number.isFinite);
        if (keys.length) where.categoryKey = { [Op.overlap]: keys };
    }
    const minPrice = parseFloat(params.minPrice);
    const maxPrice = parseFloat(params.maxPrice);
    if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
        where.price = {};
        if (!Number.isNaN(minPrice)) where.price[Op.gte] = minPrice;
        if (!Number.isNaN(maxPrice)) where.price[Op.lte] = maxPrice;
    }
    if (params.onSale === 'true') {
        where.discount = { [Op.gt]: 0 };
    }
    if (params.inStock === 'true') {
        where.availableQty = { [Op.gt]: 0 };
    }
    return where;
}

/*
 * GET /shopitems/search
 *
 * First page:  ?q=&categories=2,3&minPrice=&maxPrice=&onSale=&inStock=
 *              &sortBy=HighToLow|LowToHigh|Newest|Oldest|None&limit=12
 * Next pages:  ?continuationToken=<token from previous response>
 *              (filter/sort are replayed from the stored token, other params ignored)
 *
 * Response: { items, total, continuationToken } - continuationToken is null
 * when there are no further pages.
 */
router.get('/search', async function (req, res, next) {
    try {
        let state;
        if (req.query.continuationToken) {
            state = continuationStore.get(req.sessionId, req.query.continuationToken);
            if (!state) {
                return res.status(410).json({ error: 'Continuation token is expired or invalid. Restart the search.' });
            }
        } else {
            const sortBy = req.query.sortBy && SORTS[req.query.sortBy] ? req.query.sortBy : 'None';
            let limit = parseInt(req.query.limit, 10);
            if (Number.isNaN(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
            limit = Math.min(limit, MAX_PAGE_SIZE);
            state = { where: buildWhere(req.query), sortBy, limit, offset: 0 };
        }

        const { rows: items, count: total } = await ShopItem.findAndCountAll({
            where: state.where,
            order: SORTS[state.sortBy],
            offset: state.offset,
            limit: state.limit,
            attributes: { exclude: ['id'] },
            raw: true,
        });

        const nextOffset = state.offset + items.length;
        const continuationToken = nextOffset < total
            ? continuationStore.create(req.sessionId, { ...state, offset: nextOffset })
            : null;

        res.json({ items, total, continuationToken });
    } catch (err) {
        next(err);
    }
});

/* GET /shopitems/categories - list all categories. */
router.get('/categories', async function (req, res, next) {
    try {
        const categories = await ShopItemCategory.findAll({
            order: [['key', 'ASC']],
            attributes: ['key', 'description'],
            raw: true,
        });
        res.json(categories);
    } catch (err) {
        next(err);
    }
});

/* GET /shopitems/:pKey - single item detail. */
router.get('/:pKey', async function (req, res, next) {
    try {
        const pKey = parseInt(req.params.pKey, 10);
        if (Number.isNaN(pKey)) {
            return res.status(400).json({ error: 'pKey must be a number.' });
        }
        const item = await ShopItem.findOne({
            where: { pKey },
            attributes: { exclude: ['id'] },
            raw: true,
        });
        if (!item) {
            return res.status(404).json({ error: 'Item not found.' });
        }
        res.json(item);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
