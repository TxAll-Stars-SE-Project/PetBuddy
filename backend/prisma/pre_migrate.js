import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DIRECT_URL,
});

async function main() {
  await client.connect();
  console.log('Connected to database');

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE service_type AS ENUM ('walking', 'sitting', 'boarding', 'grooming', 'daycare');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE booking_status AS ENUM ('pending', 'waiting_payment', 'deposit_paid', 'confirmed', 'rejected', 'cancelled', 'waiting_final_payment', 'completed');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE species AS ENUM ('dog', 'cat', 'bird', 'exotic');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE payment_plan AS ENUM ('full', 'deposit');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE payment_stage AS ENUM ('deposit', 'final', 'full');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE payment_status AS ENUM ('pending_verifying', 'verified', 'rejected');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    -- Alter services.servicetype to use the new service_type enum
    ALTER TABLE services ALTER COLUMN servicetype TYPE service_type USING servicetype::text::service_type;

    -- Drop old enum if exists
    DROP TYPE IF EXISTS service_type_enum;
  `);

  console.log('Enums created and services.servicetype converted successfully');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
