import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com"
const adminPassword = process.env.ADMIN_PASSWORD || "admin1234"
const fullName = process.env.ADMIN_NAME || "Administrator"

if (!url || !serviceRole) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

async function findUserByEmail(client, email) {
  // Fallback approach: list users and find by email
  // Note: This paginates up to a reasonable number to find the user.
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found
    if (data.users.length < perPage) return null
    page++
  }
}

async function ensureAdmin() {
  const admin = createClient(url, serviceRole)

  console.log(`Ensuring admin user exists for: ${adminEmail}`)

  // First try to create the user
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { role: "admin" },
  })

  if (!createError) {
    console.log("Admin user created:", created.user?.id)
    return
  }

  const msg = String(createError.message || "").toLowerCase()
  if (msg.includes("already registered") || msg.includes("duplicate") || msg.includes("exists")) {
    console.log("Admin user already exists. Updating role to admin and confirming email if needed...")
    // Find the user by email
    const existing = await findUserByEmail(admin, adminEmail)
    if (!existing) {
      console.error("User exists but could not be found via listUsers(). Check Supabase auth users.")
      process.exit(1)
    }

    const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      app_metadata: { ...(existing.app_metadata || {}), role: "admin" },
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata || {}), full_name: fullName },
      password: adminPassword, // ensure password is set/updated
    })

    if (updateError) {
      console.error("Failed to update existing admin user:", updateError)
      process.exit(1)
    }

    console.log("Admin user updated:", updated.user?.id)
    return
  }

  console.error("Failed to create admin:", createError)
  process.exit(1)
}

ensureAdmin().catch((e) => {
  console.error("Unexpected error:", e)
  process.exit(1)
})
