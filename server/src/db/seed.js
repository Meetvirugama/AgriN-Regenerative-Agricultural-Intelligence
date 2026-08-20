import { pool } from "./connection.js";

const STUB_FARMER_ID = "11111111-1111-1111-1111-111111111111";

async function seed() {
  const client = await pool.connect();

  try {
    // 1. Create stub farmer
    await client.query(
      `INSERT INTO farmers (id, phone_number, name, preferred_language)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (phone_number) DO NOTHING`,
      [STUB_FARMER_ID, "+1234567890", "Meena", "en"]
    );

    // 2. Clear existing fields for this farmer just in case
    await client.query(`DELETE FROM fields WHERE farmer_id = $1`, [STUB_FARMER_ID]);

    // 3. Insert 3 fields
    const date1 = new Date(); date1.setDate(date1.getDate() - 46);
    const date2 = new Date(); date2.setDate(date2.getDate() - 31);
    const date3 = new Date(); date3.setDate(date3.getDate() - 60);

    await client.query(
      `INSERT INTO fields (farmer_id, name, crop_type, crop_variety, sowing_date) VALUES 
       ($1, $2, $3, $4, $5),
       ($6, $7, $8, $9, $10),
       ($11, $12, $13, $14, $15)`,
      [
        STUB_FARMER_ID, "Wheat Field 01", "wheat", "Variety X", date1.toISOString().split("T")[0],
        STUB_FARMER_ID, "Rice Field 02", "rice", "Variety J", date2.toISOString().split("T")[0],
        STUB_FARMER_ID, "Moong Field 03", "moong", "Local", date3.toISOString().split("T")[0],
      ]
    );

  } catch (err) {
    console.error("[Seed] Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
