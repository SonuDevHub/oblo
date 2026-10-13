// scripts/test-phase4.mjs
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceKey);

function getAuthCookie(session) {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64");
  return `${cookieName}=${cookieValue}`;
}

async function testPhase4() {
  console.log("=== PHASE 4 TEST SUITE ===");
  const results = [];

  // Stop IDs for Route 1 (Sector 62 to College)
  const SEC_62_ID = "077cb7c3-91e8-492b-8ae5-3567fd1feeb0";
  const COLLEGE_ID = "993a28bb-a454-42c6-8262-54d234664b4c";
  const RIDE_DATE = "2026-10-14";

  // 1. Aman searches 62 -> College, 08:15 -> Rahul's ride on top as Best match, 2/2
  console.log("\n1. Testing search_rides RPC for Aman (62 -> College, 08:15)...");
  const { data: amanResults, error: amanSearchErr } = await adminClient.rpc("search_rides", {
    p_from_stop_id: SEC_62_ID,
    p_to_stop_id: COLLEGE_ID,
    p_date: RIDE_DATE,
    p_pref_time: "08:15:00",
    p_vehicle_type: null,
    p_page: 1,
    p_limit: 20,
  });

  if (amanSearchErr) {
    results.push({ test: "Search RPC Execution", pass: false, error: amanSearchErr.message });
  } else if (!amanResults || amanResults.length === 0) {
    results.push({ test: "Search RPC Results Non-empty", pass: false, error: "No rides found" });
  } else {
    const topRide = amanResults[0];
    const isRahul = topRide.owner_name === "Rahul Sharma";
    const isBest = topRide.is_exact_route && topRide.time_diff_minutes <= 30;
    const seatsCheck = topRide.seats_left === 2 && topRide.total_seats === 2;

    results.push({
      test: "Aman searches 62 -> College, 08:15: Rahul's ride on top as Best match (2/2 seats)",
      pass: isRahul && isBest && seatsCheck,
      details: `Top ride owner: ${topRide.owner_name}, time_diff: ${topRide.time_diff_minutes}m, seats: ${topRide.seats_left}/${topRide.total_seats}`,
    });
  }

  // 2. Fetch page HTML as Aman via localhost:3000
  console.log("\n2. Testing rendered /rides/search page for privacy and UI states...");
  // Login as Aman to get session
  const amanAuth = await createClient(supabaseUrl, anonKey).auth.signInWithPassword({
    email: "aman@test.com",
    password: "Test@1234",
  });
  const amanSession = amanAuth.data.session;

  // Login as Rahul to get session
  const rahulAuth = await createClient(supabaseUrl, anonKey).auth.signInWithPassword({
    email: "rahul@test.com",
    password: "Test@1234",
  });
  const rahulSession = rahulAuth.data.session;

  const searchUrl = `http://localhost:3000/rides/search?from=${SEC_62_ID}&to=${COLLEGE_ID}&date=${RIDE_DATE}&time=08:15`;

  try {
    const amanRes = await fetch(searchUrl, {
      headers: {
        Cookie: getAuthCookie(amanSession),
      },
    });
    const amanHtml = await amanRes.text();

    // Check No Plate in DOM
    const plateRegex = /[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}/g;
    const foundPlates = amanHtml.match(plateRegex);
    const noPlateExposed = !foundPlates || foundPlates.length === 0;

    results.push({
      test: "Privacy: Number plate is NEVER rendered in DOM on search page",
      pass: noPlateExposed,
      details: noPlateExposed ? "No plate patterns found in search DOM" : `Exposed: ${foundPlates?.join(", ")}`,
    });

    // Check vehicle info present (Maruti Swift, White, Car)
    const hasVehicleInfo = amanHtml.includes("Maruti Swift") && amanHtml.includes("White");
    results.push({
      test: "Vehicle details visible: Model and Color displayed on card",
      pass: hasVehicleInfo,
      details: hasVehicleInfo ? "Maruti Swift and White rendered" : "Vehicle details missing",
    });

    // Check Best match label
    const hasBestMatch = amanHtml.includes("Best match");
    results.push({
      test: "Best match chip rendered in card",
      pass: hasBestMatch,
      details: hasBestMatch ? "'Best match' present in HTML" : "Best match chip missing",
    });

    // Check Request seat button for Aman
    const hasRequestSeat = amanHtml.includes("Request seat");
    results.push({
      test: "Available ride has 'Request seat' button for rider",
      pass: hasRequestSeat,
      details: hasRequestSeat ? "'Request seat' button found" : "'Request seat' button missing",
    });

    // 3. Test Rahul viewing the same page: own ride check
    const rahulRes = await fetch(searchUrl, {
      headers: {
        Cookie: getAuthCookie(rahulSession),
      },
    });
    const rahulHtml = await rahulRes.text();
    const hasOwnRideBadge = rahulHtml.includes("Yeh aapki ride hai");

    results.push({
      test: "Own ride shows 'Yeh aapki ride hai' badge",
      pass: hasOwnRideBadge,
      details: hasOwnRideBadge ? "'Yeh aapki ride hai' found for owner" : "Own ride badge missing",
    });

    // 4. Test Vehicle filter (Bike vs Car)
    console.log("\n3. Testing vehicle type filtering...");
    const { data: bikeResults } = await adminClient.rpc("search_rides", {
      p_from_stop_id: SEC_62_ID,
      p_to_stop_id: COLLEGE_ID,
      p_date: RIDE_DATE,
      p_vehicle_type: "bike",
    });
    const onlyBikes = bikeResults && bikeResults.every((r) => r.vehicle_type === "bike");

    const { data: carResults } = await adminClient.rpc("search_rides", {
      p_from_stop_id: SEC_62_ID,
      p_to_stop_id: COLLEGE_ID,
      p_date: RIDE_DATE,
      p_vehicle_type: "car",
    });
    const onlyCars = carResults && carResults.every((r) => r.vehicle_type === "car");

    results.push({
      test: "Vehicle filter isolates Car and Bike correctly",
      pass: Boolean(onlyBikes && onlyCars),
      details: `Bikes count: ${bikeResults?.length || 0}, Cars count: ${carResults?.length || 0}`,
    });

    // 5. Test empty search state
    console.log("\n4. Testing empty search state...");
    const emptyRes = await fetch(
      `http://localhost:3000/rides/search?from=${SEC_62_ID}&to=${COLLEGE_ID}&date=2028-12-31`,
      {
        headers: {
          Cookie: getAuthCookie(amanSession),
        },
      }
    );
    const emptyHtml = await emptyRes.text();
    const hasEmptyState = emptyHtml.includes("Koi ride nahi mili") && emptyHtml.includes("Offer a ride");

    results.push({
      test: "Empty search shows 'Koi ride nahi mili' and CTA",
      pass: hasEmptyState,
      details: hasEmptyState ? "Empty state with CTA found" : "Empty state missing",
    });
  } catch (err) {
    results.push({ test: "Fetch /rides/search from localhost:3000", pass: false, error: err.message });
  }

  console.log("\n=== SUMMARY OF PHASE 4 TESTS ===");
  let allPassed = true;
  for (const r of results) {
    const symbol = r.pass ? "✅" : "❌";
    if (!r.pass) allPassed = false;
    console.log(`${symbol} ${r.test} - ${r.details || r.error}`);
  }

  if (allPassed) {
    console.log("\n🎉 ALL PHASE 4 TESTS PASSED!");
  } else {
    console.error("\n❌ SOME PHASE 4 TESTS FAILED!");
    process.exit(1);
  }
}

testPhase4().catch(console.error);
