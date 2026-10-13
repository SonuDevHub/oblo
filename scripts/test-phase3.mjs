// scripts/test-phase3.mjs
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
}

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const anonKey = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const serviceRoleKey = env["SUPABASE_SERVICE_ROLE_KEY"];

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function runPhase3Tests() {
  console.log("═════════════════════════════════════════════════════════");
  console.log("PHASE 3 — VERIFICATION + VEHICLES + OFFER RIDE TEST SUITE");
  console.log("═════════════════════════════════════════════════════════\n");

  const results = [];

  // Helper to get client for a signed-in user
  async function getUserClient(email, password = "Test@1234") {
    const client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Sign in failed for ${email}: ${error.message}`);
    return { client, user: data.user, session: data.session };
  }

  // Fetch Route 1 stops for testing
  const { data: route1Stops } = await adminClient
    .from("stops")
    .select("id, name, stop_order, route_id, km_from_start")
    .order("stop_order", { ascending: true });
  
  const startStop = route1Stops?.find(s => s.name.includes("Sector 62"));
  const endStop = route1Stops?.find(s => s.name.includes("College"));

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split("T")[0];

  // --- Test 1: File Validation (Size and MIME types) ---
  console.log("[TEST 1: File Validation — 5 MB / .exe rejected, ≤2 MB jpg/png/pdf accepted]");
  const { validateDocumentFile } = await import("../src/lib/validation/verification-schema.ts");

  const fake5MBFile = {
    name: "large.jpg",
    size: 5 * 1024 * 1024 + 1,
    type: "image/jpeg",
  };
  const t1a = validateDocumentFile(fake5MBFile);
  const t1a_pass = !t1a.valid && t1a.error?.includes("2 MB");

  const fakeExeFile = {
    name: "trojan.exe",
    size: 50 * 1024,
    type: "application/x-msdownload",
  };
  const t1b = validateDocumentFile(fakeExeFile);
  const t1b_pass = !t1b.valid && t1b.error?.includes("2 MB");

  const fakeValidFile = {
    name: "id.png",
    size: 500 * 1024,
    type: "image/png",
  };
  const t1c = validateDocumentFile(fakeValidFile);
  const t1c_pass = t1c.valid;

  const t1_pass = t1a_pass && t1b_pass && t1c_pass;
  console.log(`1. File validation logic: ${t1_pass ? "PASS ✅" : "FAIL ❌"}`);
  results.push({ name: "File validation (5 MB & .exe rejected, 500 KB png accepted)", pass: t1_pass });

  // --- Test 2: New Student Experience & Verification Gate ---
  console.log("\n[TEST 2: New student unverified, search still works, direct create_ride blocked]");
  const newStudentEmail = `p3_student_${Date.now()}@test.com`;
  const { data: newAuth, error: newAuthErr } = await anonClient.auth.signUp({
    email: newStudentEmail,
    password: "Password@1234",
    options: { data: { full_name: "Rohan Student", phone: "9876543111" } },
  });
  if (newAuthErr) throw newAuthErr;
  const newUserId = newAuth.user.id;

  const { client: rohanClient } = await getUserClient(newStudentEmail, "Password@1234");

  // Search still works for unverified user
  const { data: searchResults, error: searchErr } = await rohanClient.rpc("search_rides", {
    p_from_stop_id: startStop.id,
    p_to_stop_id: endStop.id,
    p_date: tomorrowDateStr,
  });
  const t2_search_pass = !searchErr && Array.isArray(searchResults);

  // Direct create_ride RPC blocked because unverified
  const { error: unverifiedCreateErr } = await rohanClient.rpc("create_ride", {
    p_vehicle_id: "00000000-0000-0000-0000-000000000000",
    p_route_id: startStop.route_id,
    p_start_stop_id: startStop.id,
    p_end_stop_id: endStop.id,
    p_ride_date: tomorrowDateStr,
    p_ride_time: "09:00:00",
    p_total_seats: 1,
    p_rate_per_km: 8,
  });
  console.log("Debug Test 2 unverifiedCreateErr:", unverifiedCreateErr);
  const t2_create_pass = unverifiedCreateErr !== null && (
    unverifiedCreateErr.message.includes("verification") ||
    unverifiedCreateErr.message.includes("verified driver")
  );
  const t2_pass = t2_search_pass && t2_create_pass;
  console.log(`2. Unverified student can search (${t2_search_pass}), direct create_ride blocked (${t2_create_pass}): ${t2_pass ? "PASS ✅" : "FAIL ❌"}`);
  results.push({ name: "Unverified student can search; create_ride blocked", pass: t2_pass });

  // --- Test 3: Verification Lifecycle: Submit -> Pending -> Reject -> Resubmit -> Approve ---
  console.log("\n[TEST 3: Verification Lifecycle: Submit -> Pending -> Reject (reason) -> Resubmit -> Approve]");
  const { client: adminUserClient } = await getUserClient("admin@test.com");

  // Submit
  const { data: verifRow1, error: submitErr } = await rohanClient.rpc("submit_driver_verification", {
    p_college_name: "Engineering College",
    p_roll_no: "COLLEGE999",
    p_course: "B.Tech",
    p_year: "3rd Year",
    p_id_card_path: `${newUserId}/id-card.jpg`,
    p_dl_number: "DL99999",
    p_dl_path: `${newUserId}/dl.jpg`,
  });
  const verifId = verifRow1?.id;
  const t3a_pass = !submitErr && !!verifId;

  // Check pending status
  const { data: checkPending } = await adminClient
    .from("driver_verifications")
    .select("status")
    .eq("id", verifId)
    .single();
  const t3b_pass = checkPending?.status === "pending";

  // Admin rejects with reason
  const { error: rejectErr } = await adminUserClient.rpc("admin_review_verification", {
    p_verification_id: verifId,
    p_approve: false,
    p_reason: "Document blurry hai",
  });
  const { data: verifRowRejected } = await adminClient
    .from("driver_verifications")
    .select("status, rejection_reason")
    .eq("id", verifId)
    .single();
  const t3c_pass = !rejectErr && verifRowRejected?.status === "rejected" && verifRowRejected?.rejection_reason === "Document blurry hai";

  // Resubmit
  const { data: verifRow2, error: resubmitErr } = await rohanClient.rpc("submit_driver_verification", {
    p_college_name: "Engineering College",
    p_roll_no: "COLLEGE999",
    p_course: "B.Tech",
    p_year: "3rd Year",
    p_id_card_path: `${newUserId}/id-card.jpg`,
    p_dl_number: "DL99999",
    p_dl_path: `${newUserId}/dl.jpg`,
  });
  const verifId2 = verifRow2?.id;
  const t3d_pass = !resubmitErr && !!verifId2;

  // Admin approves
  const { error: approveErr } = await adminUserClient.rpc("admin_review_verification", {
    p_verification_id: verifId2,
    p_approve: true,
  });
  const { data: isVerifiedCheck } = await rohanClient.rpc("is_verified_driver", {
    p_user_id: newUserId,
  });
  const t3e_pass = !approveErr && isVerifiedCheck === true;

  const t3_pass = t3a_pass && t3b_pass && t3c_pass && t3d_pass && t3e_pass;
  console.log(`3. Verification lifecycle (submit: ${t3a_pass}, pending: ${t3b_pass}, reject: ${t3c_pass}, resubmit: ${t3d_pass}, approve: ${t3e_pass}): ${t3_pass ? "PASS ✅" : "FAIL ❌"}`);
  results.push({ name: "Verification lifecycle (pending -> reject -> resubmit -> approve)", pass: t3_pass });

  // Clean Rohan test user
  await adminClient.auth.admin.deleteUser(newUserId);

  // --- Test 4: Vehicles Registration (Rahul Car + Aman Bike) ---
  console.log("\n[TEST 4: Vehicles — Rahul adds car, Aman adds bike, seat constraints enforced]");
  const { client: rahulClient } = await getUserClient("rahul@test.com");
  const { client: amanClient } = await getUserClient("aman@test.com");

  // Check Rahul's car
  const { data: rahulCars } = await rahulClient.from("vehicles").select("*").eq("vehicle_type", "car").eq("is_active", true);
  let rahulCarId = rahulCars?.[0]?.id;
  if (!rahulCarId) {
    const { data: newCar } = await rahulClient.rpc("add_vehicle", {
      p_vehicle_type: "car",
      p_brand_model: "Maruti Swift",
      p_color: "White",
      p_plate_number: "RJ14AB1234",
    });
    rahulCarId = newCar?.id;
  }
  const t4a_pass = !!rahulCarId;

  // Check Aman's bike
  const { data: amanBikes } = await amanClient.from("vehicles").select("*").eq("vehicle_type", "bike").eq("is_active", true);
  let amanBikeId = amanBikes?.[0]?.id;
  if (!amanBikeId) {
    const { data: newBike } = await amanClient.rpc("add_vehicle", {
      p_vehicle_type: "bike",
      p_brand_model: "Royal Enfield Classic",
      p_color: "Black",
      p_plate_number: "DL01BK1111",
    });
    amanBikeId = newBike?.id;
  }
  const t4b_pass = !!amanBikeId;

  // Constraint check: Invalid vehicle type rejected
  const { error: invalidTypeErr } = await rahulClient.rpc("add_vehicle", {
    p_vehicle_type: "truck",
    p_brand_model: "Tata 407",
    p_color: "Yellow",
    p_plate_number: "DL01TR9999",
  });
  const t4c_pass = invalidTypeErr !== null;

  // Constraint check: Invalid plate regex rejected
  const { error: invalidPlateErr } = await amanClient.rpc("add_vehicle", {
    p_vehicle_type: "bike",
    p_brand_model: "Pulsar",
    p_color: "Blue",
    p_plate_number: "INVALID-PLATE",
  });
  const t4d_pass = invalidPlateErr !== null;

  const t4_pass = t4a_pass && t4b_pass && t4c_pass && t4d_pass;
  console.log(`4. Vehicles setup & constraints (car added: ${t4a_pass}, bike added: ${t4b_pass}, truck rejected: ${t4c_pass}, bad plate rejected: ${t4d_pass}): ${t4_pass ? "PASS ✅" : "FAIL ❌"}`);
  results.push({ name: "Vehicles registration & plate regex enforcement", pass: t4_pass });

  // --- Test 5: Offer Ride Creation (Car 2 seats & Bike 1 seat) ---
  console.log("\n[TEST 5: Offer Ride — Car 2 seats & Bike 1 seat created]");

  // Rahul Car 2-seat ride
  const { data: carRide, error: carRideErr } = await rahulClient.rpc("create_ride", {
    p_vehicle_id: rahulCarId,
    p_route_id: startStop.route_id,
    p_start_stop_id: startStop.id,
    p_end_stop_id: endStop.id,
    p_ride_date: tomorrowDateStr,
    p_ride_time: "09:30:00",
    p_total_seats: 2,
    p_rate_per_km: 8,
  });
  const carRideId = carRide?.id;
  const t5a_pass = !carRideErr && !!carRideId;

  // Aman Bike 1-seat ride
  const { data: bikeRide, error: bikeRideErr } = await amanClient.rpc("create_ride", {
    p_vehicle_id: amanBikeId,
    p_route_id: startStop.route_id,
    p_start_stop_id: startStop.id,
    p_end_stop_id: endStop.id,
    p_ride_date: tomorrowDateStr,
    p_ride_time: "10:00:00",
    p_total_seats: 1,
    p_rate_per_km: 3,
  });
  const bikeRideId = bikeRide?.id;
  const t5b_pass = !bikeRideErr && !!bikeRideId;

  const t5_pass = t5a_pass && t5b_pass;
  console.log(`5. Rides created (Car 2 seats: ${t5a_pass}, Bike 1 seat: ${t5b_pass}): ${t5_pass ? "PASS ✅" : "FAIL ❌"}`);
  results.push({ name: "Car 2-seat ride and bike 1-seat ride created successfully", pass: t5_pass });

  // --- Test 6: API Bypass / Edge Case Rejections ---
  console.log("\n[TEST 6: API Bypass tests — Car 4 seats, Bike 2 seats, Other's vehicle, Past date, Same stop]");
  // 6a. Car 4 seats (max 3 allowed)
  const { error: car4Err } = await rahulClient.rpc("create_ride", {
    p_vehicle_id: rahulCarId,
    p_route_id: startStop.route_id,
    p_start_stop_id: startStop.id,
    p_end_stop_id: endStop.id,
    p_ride_date: tomorrowDateStr,
    p_ride_time: "11:00:00",
    p_total_seats: 4,
    p_rate_per_km: 8,
  });
  const t6a_pass = car4Err !== null && car4Err.message.includes("max 3 seats");

  // 6b. Bike 2 seats (only 1 seat allowed)
  const { error: bike2Err } = await amanClient.rpc("create_ride", {
    p_vehicle_id: amanBikeId,
    p_route_id: startStop.route_id,
    p_start_stop_id: startStop.id,
    p_end_stop_id: endStop.id,
    p_ride_date: tomorrowDateStr,
    p_ride_time: "11:30:00",
    p_total_seats: 2,
    p_rate_per_km: 3,
  });
  const t6b_pass = bike2Err !== null && bike2Err.message.includes("Bike pe sirf 1 seat");

  // 6c. Someone else's vehicle (Aman using Rahul's car)
  const { error: otherVehErr } = await amanClient.rpc("create_ride", {
    p_vehicle_id: rahulCarId,
    p_route_id: startStop.route_id,
    p_start_stop_id: startStop.id,
    p_end_stop_id: endStop.id,
    p_ride_date: tomorrowDateStr,
    p_ride_time: "12:00:00",
    p_total_seats: 2,
    p_rate_per_km: 8,
  });
  const t6c_pass = otherVehErr !== null && otherVehErr.message.includes("aapki nahi hai");

  // 6d. Past date
  const pastDateStr = "2020-01-01";
  const { error: pastDateErr } = await rahulClient.rpc("create_ride", {
    p_vehicle_id: rahulCarId,
    p_route_id: startStop.route_id,
    p_start_stop_id: startStop.id,
    p_end_stop_id: endStop.id,
    p_ride_date: pastDateStr,
    p_ride_time: "08:00:00",
    p_total_seats: 2,
    p_rate_per_km: 8,
  });
  const t6d_pass = pastDateErr !== null && pastDateErr.message.includes("nikal chuki hai");

  // 6e. Same start & end stop
  const { error: sameStopErr } = await rahulClient.rpc("create_ride", {
    p_vehicle_id: rahulCarId,
    p_route_id: startStop.route_id,
    p_start_stop_id: startStop.id,
    p_end_stop_id: startStop.id,
    p_ride_date: tomorrowDateStr,
    p_ride_time: "14:00:00",
    p_total_seats: 2,
    p_rate_per_km: 8,
  });
  const t6e_pass = sameStopErr !== null && sameStopErr.message.includes("Start stop must come before end stop");

  const t6_pass = t6a_pass && t6b_pass && t6c_pass && t6d_pass && t6e_pass;
  console.log(`6. Edge case rejections (car 4 seats: ${t6a_pass}, bike 2 seats: ${t6b_pass}, other's veh: ${t6c_pass}, past date: ${t6d_pass}, same stop: ${t6e_pass}): ${t6_pass ? "PASS ✅" : "FAIL ❌"}`);
  results.push({ name: "API bypass tests (car 4, bike 2, stolen vehicle, past, same stop)", pass: t6_pass });

  // Clean up created test rides
  if (carRideId) await adminClient.rpc("cancel_ride", { p_ride_id: carRideId });
  if (bikeRideId) await adminClient.rpc("cancel_ride", { p_ride_id: bikeRideId });

  console.log("\n═════════════════════════════════════════════════════════");
  const allPassed = results.every(r => r.pass);
  console.log(`PHASE 3 TEST RESULTS: ${allPassed ? "ALL PASSED ✅" : "SOME FAILED ❌"}`);
  console.log("═════════════════════════════════════════════════════════");

  return { allPassed, results };
}

runPhase3Tests().then(({ allPassed }) => {
  process.exit(allPassed ? 0 : 1);
}).catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
