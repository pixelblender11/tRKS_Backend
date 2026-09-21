// Standalone seeder: `npm run seed`
// Run with the server STOPPED when using the local (no DATABASE_URL) database,
// since both processes would otherwise contend for the same data directory.
require('dotenv').config();

const db = require('../config/db');
const { seedIfEmpty } = require('../config/seed');

(async function () {
    try {
        await db.connect();
        await seedIfEmpty();
        await db.disconnect();
        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
})();
