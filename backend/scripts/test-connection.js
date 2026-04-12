/**
 * Test Supabase Connection
 * 
 * Run this to verify your Supabase setup is working
 * 
 * Usage: node scripts/test-connection.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please set:');
  console.error('  EXPO_PUBLIC_SUPABASE_URL');
  console.error('  EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Check if we can connect
    console.log('1. Testing connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('   ⚠️  Table "profiles" not found. Did you run schema.sql?');
    } else if (error) {
      console.log('   ❌ Error:', error.message);
      return false;
    } else {
      console.log('   ✅ Connection successful!');
    }

    // Test 2: Check tables
    console.log('\n2. Checking database tables...');
    const tables = ['profiles', 'questionnaire_answers', 'skin_analyses', 'cycle_data', 'product_recommendations', 'dermatologists'];
    
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('*').limit(1);
      if (tableError) {
        console.log(`   ❌ Table "${table}": ${tableError.message}`);
      } else {
        console.log(`   ✅ Table "${table}" exists`);
      }
    }

    // Test 3: Check storage bucket
    console.log('\n3. Checking storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('   ❌ Storage error:', bucketError.message);
    } else {
      const skinScansBucket = buckets.find(b => b.name === 'skin-scans');
      if (skinScansBucket) {
        console.log('   ✅ Storage bucket "skin-scans" exists');
      } else {
        console.log('   ⚠️  Storage bucket "skin-scans" not found. Create it in Supabase Dashboard → Storage');
      }
    }

    console.log('\n✅ All tests completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. If tables are missing, run database/schema.sql in Supabase SQL Editor');
    console.log('   2. Create storage bucket "skin-scans" in Supabase Dashboard');
    console.log('   3. Set up environment variables in Frontend/.env');
    console.log('   4. Install @supabase/supabase-js in Frontend: npm install @supabase/supabase-js');
    
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

testConnection();



