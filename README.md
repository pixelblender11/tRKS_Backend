# tRKS Backend

Node.js/Express API for the tRKS online store (Flutter front end lives in `../tRKS`).
Data layer is Sequelize on PostgreSQL. Connections are secured with JWT session tokens.

## Quick start

```
npm install
copy .env.example .env   # then set JWT_SECRET to a strong random value
npm start                # http://localhost:3001
```

With no `DATABASE_URL` in `.env`, a local PostgreSQL cluster is started
automatically via `embedded-postgres` (first run downloads the binaries and
runs initdb). Data persists under `./data/pg` across restarts. Tables are
created/updated from the model definitions at startup (`sequelize.sync()`),
and the database is auto-seeded with categories and 60 demo items when empty
(`npm run seed` also works standalone — run it with the server stopped when
using the local database).

## Production on OVH

Provision an **OVH Public Cloud managed PostgreSQL** instance, then set:

```
DATABASE_URL=postgres://<user>:<pass>@<host>.database.cloud.ovh.net:<port>/defaultdb
DB_SSL=true
```

OVH managed PostgreSQL enforces TLS; `DB_SSL=true` enables it. If certificate
verification fails, download OVH's CA or (less secure) set
`DB_SSL_REJECT_UNAUTHORIZED=false`. Remember to allow your app server's IP in
the database's "Authorised IPs" list in the OVH control panel.

## Auth

Every `/shopitems` and `/cart` route requires a session JWT:

```
POST /auth/session            -> { token, sessionId, expiresIn }
Authorization: Bearer <token> on subsequent requests
```

The session identifies the caller's cart and scopes their search continuation
tokens. Tokens expire after `JWT_TTL` (default 24h).

## Endpoints

### Products

`GET /shopitems/search` — filterable, sortable, paginated product listing.

First page — filter/sort via query params:

| Param   | Example | Meaning |
|---------|---------|---------|
| `q` | `q=hoodie` | case-insensitive search over title/description/tags |
| `categories` | `categories=2,3` | items in any of these category keys |
| `minPrice` / `maxPrice` | `maxPrice=150` | price range |
| `onSale` | `onSale=true` | only items with `discount > 0` |
| `inStock` | `inStock=true` | only items with `availableQty > 0` |
| `sortBy` | `sortBy=HighToLow` | `None`, `HighToLow`, `LowToHigh`, `Newest`, `Oldest` (matches the Flutter `SortBy` enum) |
| `limit` | `limit=12` | page size (default 12, max 50) |

Response: `{ items, total, continuationToken }`.

Next pages — pass only the token; the original filter/sort is replayed
server-side (tokens live in an in-memory FIFO store, max 20 per session,
30-minute TTL, scoped to the requesting session):

```
GET /shopitems/search?continuationToken=<token>
```

`continuationToken` is `null` on the last page. An expired/foreign token
returns `410 Gone` — restart the search.

Also:

- `GET /shopitems/categories` — all categories
- `GET /shopitems/:pKey` — single item detail

### Cart (per session)

- `GET /cart` — cart with joined item details
- `PUT /cart` — replace cart, body `{ items: [{ pKey, qty }] }`
- `POST /cart/items` — add/increment, body `{ pKey, qty? }`
- `DELETE /cart/items/:pKey` — remove a line
- `DELETE /cart` — empty the cart

## Notes

- The former MongoDB/Mongoose implementation was replaced because OVH
  discontinued its managed MongoDB Production plan (31/08/2026). OVH managed
  PostgreSQL is fully supported.
- `models/counter.model.js`, `routes/counters.js`, and `utilities/generator.js`
  are leftover Mongoose-era scaffolding, no longer registered in `app.js`;
  safe to delete along with the old `./data/db` directory.
