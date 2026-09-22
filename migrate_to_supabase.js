#!/usr/bin/env node
/**
 * Supabase PostgreSQL Data Migration Tool
 * Source of Truth: srs.md
 * 
 * Migrates all records from the Travel Management System to Supabase PostgreSQL
 * without losing any existing records.
 */

import { getSupabase, isSupabaseConfigured, migrateAllDataToSupabase } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

async function runMigration() {
  console.log('=====================================================');
  console.log('🚀 Travel Management System - Supabase Data Migration');
  console.log('=====================================================');

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.log('⚠️  SUPABASE_URL or SUPABASE_KEY not set in environment.');
    console.log('👉 To connect to your Supabase project:');
    console.log('   1. Create your tables using /supabase_schema.sql in Supabase SQL Editor.');
    console.log('   2. Set SUPABASE_URL and SUPABASE_KEY in your environment.');
    console.log('   3. Run this script again: node migrate_to_supabase.js');
    console.log('\nCurrently operating in zero-data-loss Memory Store Fallback mode.');
    process.exit(0);
  }

  console.log(`Connecting to: ${url}`);
  const client = getSupabase();
  if (!client) {
    console.error('❌ Failed to create Supabase client.');
    process.exit(1);
  }

  console.log('📦 Starting data migration into Supabase PostgreSQL...');
  const result = await migrateAllDataToSupabase(client);

  console.log('\n--- Migration Results ---');
  console.log(`Total Records Processed: ${result.totalMigrated}`);
  console.table(result.tables);

  if (result.success) {
    console.log('✅ Supabase database migration completed successfully with ZERO data loss!');
  } else {
    console.log('⚠️  Migration completed with some warnings. Check table reports above.');
  }
}

runMigration().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
