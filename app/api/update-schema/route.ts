import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// SECURITY: This endpoint should only be used once to update database schema
// DELETE THIS FILE after running it once!

export async function GET(request: NextRequest) {
  try {
    // Check if a secret key is provided for security
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== "update-schema-2024") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting database schema update...");

    // Execute raw SQL to add missing columns to doctors table
    await prisma.$executeRawUnsafe(`
      -- Add missing columns to doctors table if they don't exist
      DO $$
      BEGIN
        -- Add clinic_name
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='doctors' AND column_name='clinic_name') THEN
          ALTER TABLE doctors ADD COLUMN clinic_name TEXT;
        END IF;

        -- Add phone
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='doctors' AND column_name='phone') THEN
          ALTER TABLE doctors ADD COLUMN phone TEXT;
        END IF;

        -- Add city
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='doctors' AND column_name='city') THEN
          ALTER TABLE doctors ADD COLUMN city TEXT;
        END IF;

        -- Add notes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='doctors' AND column_name='notes') THEN
          ALTER TABLE doctors ADD COLUMN notes TEXT;
        END IF;

        -- Add created_at
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='doctors' AND column_name='created_at') THEN
          ALTER TABLE doctors ADD COLUMN created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Add updated_at
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='doctors' AND column_name='updated_at') THEN
          ALTER TABLE doctors ADD COLUMN updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Update commission_rate default if needed
        ALTER TABLE doctors ALTER COLUMN commission_rate SET DEFAULT 0;

      END $$;
    `);

    // Update equipment table
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Add manufacturer
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='equipment' AND column_name='manufacturer') THEN
          ALTER TABLE equipment ADD COLUMN manufacturer TEXT;
        END IF;

        -- Add purchase_cost
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='equipment' AND column_name='purchase_cost') THEN
          ALTER TABLE equipment ADD COLUMN purchase_cost DOUBLE PRECISION;
        END IF;

        -- Add notes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='equipment' AND column_name='notes') THEN
          ALTER TABLE equipment ADD COLUMN notes TEXT;
        END IF;

        -- Set default for equipment_type
        ALTER TABLE equipment ALTER COLUMN equipment_type SET DEFAULT 'RETURNABLE';

      END $$;
    `);

    // Update payout table structure
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Rename columns if old structure exists
        IF EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='payouts' AND column_name='payout_period_start') THEN
          ALTER TABLE payouts RENAME COLUMN payout_period_start TO period_start;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='payouts' AND column_name='payout_period_end') THEN
          ALTER TABLE payouts RENAME COLUMN payout_period_end TO period_end;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='payouts' AND column_name='total_amount') THEN
          ALTER TABLE payouts RENAME COLUMN total_amount TO amount;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='payouts' AND column_name='receipt_file_path') THEN
          ALTER TABLE payouts RENAME COLUMN receipt_file_path TO receipt_url;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='payouts' AND column_name='processed_by') THEN
          ALTER TABLE payouts RENAME COLUMN processed_by TO processed_by_id;
        END IF;

        -- Add new columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='payouts' AND column_name='transaction_id') THEN
          ALTER TABLE payouts ADD COLUMN transaction_id TEXT;
        END IF;

        -- Drop included_leads column if exists (we simplified this)
        IF EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='payouts' AND column_name='included_leads') THEN
          ALTER TABLE payouts DROP COLUMN included_leads;
        END IF;

        -- Update payment_method to TEXT if it's an enum
        ALTER TABLE payouts ALTER COLUMN payment_method TYPE TEXT;

      END $$;
    `);

    // Update commission_history table
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Check if old structure exists and update
        IF EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_history' AND column_name='commission_rate') THEN

          -- Rename old columns
          ALTER TABLE commission_history RENAME COLUMN commission_rate TO old_rate;

          -- Add new columns
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_name='commission_history' AND column_name='new_rate') THEN
            ALTER TABLE commission_history ADD COLUMN new_rate DOUBLE PRECISION DEFAULT 0;
          END IF;

          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_name='commission_history' AND column_name='effective_date') THEN
            ALTER TABLE commission_history ADD COLUMN effective_date TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
          END IF;

          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_name='commission_history' AND column_name='reason') THEN
            ALTER TABLE commission_history ADD COLUMN reason TEXT;
          END IF;

          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_name='commission_history' AND column_name='created_at') THEN
            ALTER TABLE commission_history ADD COLUMN created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
          END IF;

          -- Drop old columns
          IF EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name='commission_history' AND column_name='effective_from') THEN
            ALTER TABLE commission_history DROP COLUMN effective_from;
          END IF;

          IF EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name='commission_history' AND column_name='effective_to') THEN
            ALTER TABLE commission_history DROP COLUMN effective_to;
          END IF;

          IF EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name='commission_history' AND column_name='changed_at') THEN
            ALTER TABLE commission_history DROP COLUMN changed_at;
          END IF;
        END IF;
      END $$;
    `);

    console.log("Database schema updated successfully!");

    return NextResponse.json({
      success: true,
      message: "Database schema updated successfully! You can now delete this API endpoint.",
      updated: [
        "doctors table - added clinic_name, phone, city, notes, created_at, updated_at",
        "equipment table - added manufacturer, purchase_cost, notes",
        "payouts table - restructured columns",
        "commission_history table - restructured columns"
      ]
    });

  } catch (error: any) {
    console.error("Error updating schema:", error);
    return NextResponse.json(
      {
        error: "Failed to update schema",
        details: error.message,
        hint: "Check Vercel logs for more details"
      },
      { status: 500 }
    );
  }
}
