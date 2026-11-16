# Kitchen Inventory

Internal stock, delivery and vendor tracking for a restaurant. Built for phones.

- **Stock**: every item with what is on hand, by weight (lb, oz, kg, g) or by count (each, case, ...), with low-stock warnings.
- **Receive**: log a delivery from a vendor: items, weight or count, cost.
- **Use**: weigh or count what was taken and deduct it. Waste is logged separately.
- **Count correction**: set an item to what is really on the shelf.
- **Vendors**: contacts (tap to call or text), delivery history, prices and price changes.
- **Dashboard** (admins): what needs ordering, spending by vendor, stock value, waste, latest activity.
- **Team** (admins): who can sign in, as staff or admin.

Stock is never stored as a number that gets overwritten. Every delivery, use, waste entry and
correction is a row in `movements`, and stock on hand is the sum of those rows, so there is a
full history of who changed what and when.

## Stack

Next.js (App Router, server actions), Postgres via `postgres`, Tailwind CSS. Sign-in is a
username and passcode stored as a bcrypt hash, with a signed session cookie.

## Run it locally

Needs Node 20+ and a Postgres database.

```bash
cp .env.example .env.local   # then fill in DATABASE_URL and SESSION_SECRET
npm install
npm run db:migrate           # creates the tables
npm run dev
```

Open http://localhost:3000. The first visit asks you to create the first admin account.

## Deploying

Set `DATABASE_URL` and `SESSION_SECRET` in the host's environment settings, run
`npm run db:migrate` once against the production database, then build and start
(`npm run build`, `npm start`). Create the first admin account straight after the first
deploy: until one exists, anyone who opens the site can create it.

## Database changes

Add a new numbered `.sql` file in `db/migrations` and run `npm run db:migrate`. Files that
have already been applied are skipped.
