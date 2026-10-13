// supabase/seed/seed-demo-users.mjs
// Server-only Node script to create demo users via Supabase Admin Auth API

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env.local');

if (!fs.existsSync(envPath)) {
  console.error('[X] .env.local not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[X] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const demoUsers = [
  { email: 'rahul@test.com', password: 'Test@1234', full_name: 'Rahul Sharma', phone: '9876543210' },
  { email: 'priya@test.com', password: 'Test@1234', full_name: 'Priya Verma', phone: '9876543211' },
  { email: 'aman@test.com', password: 'Test@1234', full_name: 'Aman Gupta', phone: '9876543212' },
  { email: 'neha@test.com', password: 'Test@1234', full_name: 'Neha Singh', phone: '9876543213' },
  { email: 'admin@test.com', password: 'Test@1234', full_name: 'System Admin', phone: '9876543214' },
];

async function seedUsers() {
  console.log('Seeding demo auth users...');
  const userMap = {};

  for (const u of demoUsers) {
    // Check if user already exists
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = listData?.users?.find((x) => x.email === u.email);

    if (existing) {
      console.log(`User already exists: ${u.email} (${existing.id})`);
      userMap[u.email] = existing.id;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.full_name,
          phone: u.phone,
        },
      });

      if (error) {
        console.error(`Error creating ${u.email}:`, error.message);
      } else {
        console.log(`Created user: ${u.email} (${data.user.id})`);
        userMap[u.email] = data.user.id;
      }
    }
  }

  // Ensure admin role is set
  const adminId = userMap['admin@test.com'];
  if (adminId) {
    const { error: roleErr } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', adminId);

    if (roleErr) {
      console.error('Error setting admin role:', roleErr.message);
    } else {
      console.log('Admin role granted to admin@test.com');
    }
  }

  console.log('User seeding completed successfully.');
}

seedUsers().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
