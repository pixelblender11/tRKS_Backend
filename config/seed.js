const ShopItem = require('../models/shopitem.model');
const ShopItemCategory = require('../models/shopItemCategory.model');

// Keys 0 and 1 are reserved flags used by the front end
// (ShopItem.dart filters them out of the visible category strings).
const CATEGORIES = [
    { key: 0, description: 'Merch' },
    { key: 1, description: 'Music' },
    { key: 2, description: 'Apparel' },
    { key: 3, description: 'Accessories' },
    { key: 4, description: 'Vinyl' },
    { key: 5, description: 'Digital' },
    { key: 6, description: 'Collectibles' },
];

const TITLES = ['Tour Tee', 'Logo Hoodie', 'Signed Poster', 'Album (Vinyl)', 'Album (Digital)',
    'Sticker Pack', 'Enamel Pin', 'Tote Bag', 'Snapback Cap', 'Art Print'];
const DESCRIPTIONS = [
    'Limited run item straight from the studio.',
    'Fan favorite - goes fast every restock.',
    'Premium quality with original artwork.',
    'Exclusive release, only available online.',
    'Classic design that never goes out of style.',
];

/** Seeds categories and ~60 shop items if the tables are empty. */
async function seedIfEmpty() {
    if (await ShopItemCategory.count() === 0) {
        await ShopItemCategory.bulkCreate(CATEGORIES);
        console.log(`Seeded ${CATEGORIES.length} categories`);
    }

    if (await ShopItem.count() === 0) {
        const items = [];
        const now = Date.now();
        for (let i = 1; i <= 60; i++) {
            const isMerch = i % 2 === 0;
            const price = +(Math.random() * 200 + 10).toFixed(2);
            const hasDiscount = i % 3 === 0;
            items.push({
                pKey: i,
                title: `${TITLES[i % TITLES.length]} #${i}`,
                description: DESCRIPTIONS[i % DESCRIPTIONS.length],
                tags: isMerch ? 'merch,apparel' : 'music,release',
                price,
                discount: hasDiscount ? +(price * 0.2).toFixed(2) : 0,
                availableQty: Math.floor(Math.random() * 50) + 1,
                image: `https://placehold.co/300x300?text=Item+${i}`,
                dateAdded: new Date(now - i * 36e5), // staggered hourly so Newest/Oldest sort is meaningful
                categoryKey: isMerch
                    ? [0, 2 + (i % 3)]
                    : [1, 4 + (i % 3)],
            });
        }
        await ShopItem.bulkCreate(items);
        console.log(`Seeded ${items.length} shop items`);
    }
}

module.exports = { seedIfEmpty };
