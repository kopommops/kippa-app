# Database schema migrations — explained without jargon

## What is a schema?

A database schema is the structure that describes how data is organised: tables, columns, indexes, constraints and relationships. For example, `ledger_transactions` is a table and `amount_minor` is one of its columns.

## What is a migration?

A migration is a small, versioned instruction for changing that structure safely. Think of it as a numbered upgrade step for the database. Pelo's current migrations are:

| Revision | Change |
|---|---|
| `20261025_0001` | Baseline schema for the existing Pelo MVP tables: demo personas/transactions, users/business profiles, ledger records and Peloyame usage. |
| `20261025_0002` | Adds the `source` field to account ledger records and creates simulated bank connections and account notifications. On PostgreSQL it also enables RLS and removes direct Data API table access for Supabase `anon` and `authenticated` roles, because this app uses FastAPI's own JWT authentication. |

The migrations are located in `backend/migrations/versions/`. Keep them in Git. For later database changes, create a new migration rather than silently editing an already-used migration or changing tables manually in the Supabase dashboard.

## Why not just use `create_all()`?

SQLAlchemy's `Base.metadata.create_all()` can create missing tables, but it does not reliably update an existing table when a new column is added. The earlier app used it on startup. The focused update makes normal development/production startup require an Alembic migration version first. Automated tests still create isolated schemas in the test environment.

## Case A — brand-new, empty database

Use this if you created a fresh local SQLite database or a brand-new Supabase project, and Pelo's application tables have not been created there yet.

1. Set `DATABASE_URL` to the empty database.
2. In PowerShell, enter the backend folder.
3. Run:

```powershell
python -m alembic upgrade head
python -m alembic current
```

`upgrade head` applies each migration in order. It creates the original tables, then adds the simulation fields/tables. `current` should report `20261025_0002`.

4. Start the API only after the migration succeeds.

**Do not run the baseline migration against tables that already exist.** It tries to create those tables.

## Case B — existing local or Supabase database created by the previous Pelo app

Use this if the database already contains tables created by the earlier `Base.metadata.create_all()` startup but has no `alembic_version` table. This procedure preserves existing rows; it does not drop or recreate all tables.

1. **Back up first.** For SQLite, stop the server and copy the database file to a safe location outside the repository. For Supabase, use a verified backup/export appropriate to your project before changing schema.
2. Make a note of the `DATABASE_URL` target and verify you are not pointing at the wrong database.
3. Inspect the schema. The expected pre-migration state has the legacy tables (`personas`, `transactions`, `users`, `business_profiles`, `ledger_transactions`, `peloyame_usage`) and the original columns. The `ledger_transactions` table should not yet have the focused update's `source` column, and there should be no `bank_connections`, `account_notifications` or `alembic_version` table.
4. If those conditions match, stamp the existing schema as the baseline. **Stamping records that migration 0001 already exists; it does not modify tables.** Run from the backend folder:

```powershell
python -m alembic stamp 20261025_0001
python -m alembic upgrade head
python -m alembic current
```

5. `current` should report `20261025_0002`. Start the application and test log-in, account records, bank simulation and notifications.

### Stop instead of guessing if the schema differs

Do not stamp the baseline if any of these applies:

- `alembic_version` already exists;
- the expected legacy tables are missing;
- `ledger_transactions.source`, `bank_connections` or `account_notifications` already exist without matching migration history;
- a column type/name differs from the documented baseline;
- you are unsure which database the application was previously using.

In that case, inspect migration state (`python -m alembic current`, `python -m alembic heads`) and the actual table/column list. Save the output and resolve the discrepancy before upgrading. Do not drop the database or create a new blank database just to silence a migration error.

## If an existing database was partially upgraded manually

Do not stamp it as the baseline automatically. Determine exactly which changes are already present and reconcile the migration history after a backup. This package is not a generic repair script for arbitrary database states.

## New changes in the future

Once a migration history exists, generate a migration from the backend folder, inspect it carefully, test it on a copy of the database, then commit the migration file alongside the model/schema changes:

```powershell
python -m alembic revision --autogenerate -m "describe the change"
python -m alembic upgrade head
```

Autogenerate is a draft, not a guarantee. Review the generated upgrade and downgrade, especially for renames, deleted columns, default values and data transformations. Back up production data before applying a migration. Do not edit an old migration after other environments have applied it; add a new revision instead.

## Supabase security note

In this architecture, React calls FastAPI; FastAPI verifies its own JWT and accesses Supabase Postgres from the server using the private `DATABASE_URL`. The migrations enable RLS on app tables and revoke direct table privileges from Supabase's `anon` and `authenticated` Data API roles. That reduces accidental direct exposure, but RLS does **not** replace FastAPI's user-ownership checks. The server's database owner/privileged connection can bypass RLS, so every private query must still be filtered by the authenticated user ID. Never expose database credentials or a service-role/secret key to React.
