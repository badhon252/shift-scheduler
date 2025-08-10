import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRole) {
  console.error("Missing environment variables")
  process.exit(1)
}

const supabase = createClient(url, serviceRole)

async function debugDay31() {
  console.log("=== DEBUGGING DAY 31 ISSUE ===")

  // Test 1: Check current date and month
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed

  console.log("Current date info:")
  console.log("- Year:", currentYear)
  console.log("- Month (0-indexed):", currentMonth)
  console.log("- Month (1-indexed):", currentMonth + 1)
  console.log("- Days in current month:", new Date(currentYear, currentMonth + 1, 0).getDate())

  // Test 2: Test January 2024 (has 31 days)
  const testYear = 2024
  const testMonth = 0 // January (0-indexed)
  const daysInJan = new Date(testYear, testMonth + 1, 0).getDate()

  console.log("\nJanuary 2024 test:")
  console.log("- Days in January 2024:", daysInJan)
  console.log("- Should have day 31:", daysInJan >= 31)

  // Test 3: Generate date strings for day 31
  const day31DateStr = `${testYear}-${String(testMonth + 1).padStart(2, "0")}-31`
  console.log("- Generated date string:", day31DateStr)

  // Test 4: Validate the date
  const testDate = new Date(day31DateStr + "T00:00:00.000Z")
  console.log("- Test date object:", testDate)
  console.log("- UTC Year:", testDate.getUTCFullYear())
  console.log("- UTC Month:", testDate.getUTCMonth() + 1)
  console.log("- UTC Date:", testDate.getUTCDate())

  const isValidDate =
    testDate.getUTCFullYear() === testYear &&
    testDate.getUTCMonth() + 1 === testMonth + 1 &&
    testDate.getUTCDate() === 31
  console.log("- Is valid date:", isValidDate)

  // Test 5: Get a test member
  console.log("\n=== TESTING DATABASE OPERATIONS ===")

  const { data: members, error: membersError } = await supabase.from("members").select("*").limit(1)

  if (membersError) {
    console.error("Error fetching members:", membersError)
    return
  }

  if (!members || members.length === 0) {
    console.log("No members found in database")
    return
  }

  const testMember = members[0]
  console.log("Test member:", testMember)

  // Test 6: Try to fetch existing shift for day 31
  console.log("\n=== TESTING SHIFT FETCH ===")

  const { data: existingShift, error: fetchError } = await supabase
    .from("shifts")
    .select("*")
    .eq("member_id", testMember.id)
    .eq("date", day31DateStr)
    .maybeSingle()

  console.log("Existing shift fetch result:")
  console.log("- Data:", existingShift)
  console.log("- Error:", fetchError)

  // Test 7: Try to create a shift for day 31
  console.log("\n=== TESTING SHIFT CREATION ===")

  const testShiftData = {
    member_id: testMember.id,
    date: day31DateStr,
    shift_type: "Morning Shift (07:00 - 03:00 PM)",
  }

  console.log("Attempting to create shift with data:", testShiftData)

  // First delete any existing shift
  await supabase.from("shifts").delete().eq("member_id", testMember.id).eq("date", day31DateStr)

  const { data: createdShift, error: createError } = await supabase
    .from("shifts")
    .insert(testShiftData)
    .select()
    .single()

  console.log("Create shift result:")
  console.log("- Data:", createdShift)
  console.log("- Error:", createError)

  if (createError) {
    console.log("- Error code:", createError.code)
    console.log("- Error message:", createError.message)
    console.log("- Error details:", createError.details)
    console.log("- Error hint:", createError.hint)
  }

  // Test 8: Try upsert instead
  console.log("\n=== TESTING UPSERT ===")

  const { data: upsertedShift, error: upsertError } = await supabase
    .from("shifts")
    .upsert(testShiftData, {
      onConflict: "member_id,date",
      ignoreDuplicates: false,
    })
    .select()
    .single()

  console.log("Upsert shift result:")
  console.log("- Data:", upsertedShift)
  console.log("- Error:", upsertError)

  // Test 9: Check if shift was actually created
  console.log("\n=== VERIFYING CREATION ===")

  const { data: verifyShift, error: verifyError } = await supabase
    .from("shifts")
    .select("*")
    .eq("member_id", testMember.id)
    .eq("date", day31DateStr)
    .maybeSingle()

  console.log("Verification result:")
  console.log("- Data:", verifyShift)
  console.log("- Error:", verifyError)

  // Test 10: Test with different date formats
  console.log("\n=== TESTING DATE FORMATS ===")

  const dateFormats = [
    day31DateStr,
    `${testYear}-01-31`,
    "2024-01-31",
    new Date(2024, 0, 31).toISOString().split("T")[0],
  ]

  for (const dateFormat of dateFormats) {
    console.log(`Testing date format: ${dateFormat}`)

    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("member_id", testMember.id)
      .eq("date", dateFormat)
      .maybeSingle()

    console.log(`- Result: data=${!!data}, error=${!!error}`)
    if (error) console.log(`- Error: ${error.message}`)
  }

  console.log("\n=== DEBUG COMPLETE ===")
}

debugDay31().catch(console.error)
