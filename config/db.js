const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

// Local dev cluster settings (used when DATABASE_URL is not set). The URL is
// deterministic, so the Sequelize instance can be created eagerly and models
// can register against it at require time.
const LOCAL_PG = {
    port: parseInt(process.env.LOCAL_PG_PORT || '5433', 10),
    user: 'postgres',
    password: 'postgres',
    database: 'trks',
    dataDir: path.join(__dirname, '..', 'data', 'pg'),
};

const databaseUrl = process.env.DATABASE_URL
    || `postgres://${LOCAL_PG.user}:${LOCAL_PG.password}@127.0.0.1:${LOCAL_PG.port}/${LOCAL_PG.database}`;

// OVH managed PostgreSQL requires TLS - set DB_SSL=true in production.
const sequelize = new Sequelize(databaseUrl, {
    logging: false,
    dialectOptions: process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } }
        : {},
});

let embedded = null;

/**
 * Connects Sequelize to PostgreSQL.
 *
 * - If DATABASE_URL is set (e.g. OVH managed PostgreSQL) it is used directly.
 * - Otherwise a local postgres cluster is spawned via embedded-postgres,
 *   persisting its data under ./data/pg so dev data survives restarts.
 *   No system-wide PostgreSQL install is required.
 */
async function connect() {
    if (!process.env.DATABASE_URL) {
        // embedded-postgres is ESM-only, hence the dynamic import
        const { default: EmbeddedPostgres } = await import('embedded-postgres');
        embedded = new EmbeddedPostgres({
            databaseDir: LOCAL_PG.dataDir,
            user: LOCAL_PG.user,
            password: LOCAL_PG.password,
            port: LOCAL_PG.port,
            persistent: true,
        });
        // initdb only on first run - the cluster marker file tells us
        if (!fs.existsSync(path.join(LOCAL_PG.dataDir, 'PG_VERSION'))) {
            await embedded.initialise();
        }
        await embedded.start();
        try {
            await embedded.createDatabase(LOCAL_PG.database);
        } catch (err) {
            if (!/already exists/.test(String(err))) throw err;
        }
        console.log(`No DATABASE_URL set - started local PostgreSQL on port ${LOCAL_PG.port} (data dir: ${LOCAL_PG.dataDir})`);
    }

    await sequelize.authenticate();
    await sequelize.sync(); // create/update tables from the model definitions
    console.log('PostgreSQL connected');
    return sequelize;
}

async function disconnect() {
    await sequelize.close();
    if (embedded) {
        await embedded.stop();
        embedded = null;
    }
}

module.exports = { sequelize, connect, disconnect };
