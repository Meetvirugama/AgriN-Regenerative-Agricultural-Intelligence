import { pool } from "./connection.js";
import bcrypt from "bcryptjs";

const STUB_FARMER_ID = "11111111-1111-1111-1111-111111111111";

async function seed() {
  const client = await pool.connect();

  try {
    console.log("[Seed] Starting database seed...");

    // 0. Clean up conflicting unique constraints if a dev messed around locally
    await client.query(`DELETE FROM farmers WHERE phone_number = '+1234567890' AND id != $1`, [STUB_FARMER_ID]);
    await client.query(`DELETE FROM farmers WHERE email = 'meena@agrimesh.io' AND id != $1`, [STUB_FARMER_ID]);

    // 1. Create stub farmer (with email and password for local login testing)
    const passwordHash = await bcrypt.hash("password123", 10);
    await client.query(
      `INSERT INTO farmers (id, phone_number, name, preferred_language, email, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET 
         phone_number = EXCLUDED.phone_number, 
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash`,
      [STUB_FARMER_ID, "+1234567890", "Meena", "en", "meena@agrimesh.io", passwordHash]
    );

    // 2. Clear existing fields for this farmer just in case (cascades to states)
    await client.query(`DELETE FROM fields WHERE farmer_id = $1`, [STUB_FARMER_ID]);

    // 3. Insert 3 fields with realistic lat/lng coordinates for map rendering
    const date1 = new Date(); date1.setDate(date1.getDate() - 46);
    const date2 = new Date(); date2.setDate(date2.getDate() - 31);
    const date3 = new Date(); date3.setDate(date3.getDate() - 60);

    const { rows: insertedFields } = await client.query(
      `INSERT INTO fields (farmer_id, name, crop_type, crop_variety, sowing_date, lat, lng) VALUES 
       ($1, $2, $3, $4, $5, $6, $7),
       ($8, $9, $10, $11, $12, $13, $14),
       ($15, $16, $17, $18, $19, $20, $21)
       RETURNING id, crop_type, crop_variety`,
      [
        STUB_FARMER_ID, "Wheat Field 01", "wheat", "Variety X", date1.toISOString().split("T")[0], 30.900965, 75.857277,
        STUB_FARMER_ID, "Rice Field 02", "rice", "Variety J", date2.toISOString().split("T")[0], 31.01123, 75.92231,
        STUB_FARMER_ID, "Moong Field 03", "moong", "Local", date3.toISOString().split("T")[0], 30.82231, 75.71123,
      ]
    );

    // 4. Seed mandatory crop states for these fields to satisfy JOIN constraints in UI layers
    for (const field of insertedFields) {
      await client.query(
        `INSERT INTO field_crop_states 
         (field_id, confirmed_crop, confirmed_variety, current_stage, stage_description, stage_confidence, last_updated_from)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          field.id,
          field.crop_type,
          field.crop_variety,
          "vegetative", 
          "Crop is in active growth phase.",
          "moderate",
          "calendar_estimate"
        ]
      );
    }

    console.log(`[Seed] Seeded ${insertedFields.length} fields successfully.`);
    console.log("[Seed] ✅ Login available at meena@agrimesh.io / password123");

  } catch (err) {
    console.error("[Seed] ❌ Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
