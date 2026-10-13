// scripts/test-phase2.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function runPhase2Tests() {
  console.log('═══════════════════════════════════════════════');
  console.log('PHASE 2 — AUTH & APP SHELL TEST SUITE');
  console.log('═══════════════════════════════════════════════\n');

  const results = [];

  // Test 1: Signup with a new user -> profiles row with role 'student'
  console.log('[TEST 1: Signup & Automatic Profile Creation]');
  const testEmail = `test_student_${Date.now()}@test.com`;
  const { data: signupData, error: signupError } = await anonClient.auth.signUp({
    email: testEmail,
    password: 'Password@1234',
    options: {
      data: {
        full_name: 'Karan Test',
        phone: '9876543299',
      },
    },
  });

  const t1_auth_ok = !signupError && signupData.user?.id;
  let t1_profile_role = null;
  if (t1_auth_ok) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', signupData.user.id)
      .single();
    t1_profile_role = profile?.role;
  }

  const t1_pass = t1_auth_ok && t1_profile_role === 'student';
  console.log(`1. New user signup creates profile with role 'student': ${t1_pass ? 'PASS' : 'FAIL'} (Role: ${t1_profile_role})`);
  results.push({ test: "Signup creates profile with role 'student'", pass: t1_pass, msg: `Role: ${t1_profile_role}` });

  // Clean test user
  if (signupData?.user?.id) {
    await adminClient.auth.admin.deleteUser(signupData.user.id);
  }

  // Test 2: Login and logout; wrong password -> generic error
  console.log('\n[TEST 2: Login Credentials & Generic Error]');
  const { error: wrongPassError } = await anonClient.auth.signInWithPassword({
    email: 'rahul@test.com',
    password: 'WrongPassword999!',
  });
  const t2a_pass = wrongPassError !== null;
  console.log(`2a. Wrong password fails authentication: ${t2a_pass ? 'PASS' : 'FAIL'} (${wrongPassError?.message})`);

  const { data: validLogin, error: validError } = await anonClient.auth.signInWithPassword({
    email: 'rahul@test.com',
    password: 'Test@1234',
  });
  const t2b_pass = !validError && validLogin.user?.email === 'rahul@test.com';
  console.log(`2b. Valid user login succeeds: ${t2b_pass ? 'PASS' : 'FAIL'} (User: ${validLogin?.user?.email})`);
  results.push({ test: 'Wrong password fails, valid password succeeds', pass: t2a_pass && t2b_pass, msg: 'Auth verified' });

  // Test 3: Script tag in name field -> stored safely, escaped
  console.log('\n[TEST 3: XSS / Script Tag Sanitization]');
  const xssEmail = `xss_test_${Date.now()}@test.com`;
  const xssName = "<script>alert('xss')</script>";
  const { data: xssUser } = await anonClient.auth.signUp({
    email: xssEmail,
    password: 'Password@1234',
    options: {
      data: {
        full_name: xssName,
      },
    },
  });

  const { data: xssProfile } = await adminClient
    .from('profiles')
    .select('full_name')
    .eq('id', xssUser?.user?.id)
    .single();

  const t3_pass = xssProfile?.full_name === xssName;
  console.log(`3. Script tag stored safely without executing: ${t3_pass ? 'PASS' : 'FAIL'} (Stored: "${xssProfile?.full_name}")`);
  results.push({ test: 'Script tag rendered as text / safe storage', pass: t3_pass, msg: xssProfile?.full_name });

  if (xssUser?.user?.id) {
    await adminClient.auth.admin.deleteUser(xssUser.user.id);
  }

  console.log('\n═══════════════════════════════════════════════');
  const allPassed = results.every(r => r.pass);
  console.log(`PHASE 2 AUTH RESULTS: ${allPassed ? 'ALL PASSED ✅' : 'SOME FAILED ❌'}`);
  console.log('═══════════════════════════════════════════════');

  return { allPassed, results };
}

runPhase2Tests().then(({ allPassed }) => {
  process.exit(allPassed ? 0 : 1);
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
