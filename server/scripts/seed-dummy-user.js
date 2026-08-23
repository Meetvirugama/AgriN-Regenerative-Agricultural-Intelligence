import bcrypt from "bcryptjs";
import crypto from "crypto";
import { queryOne } from "../src/db/connection.js";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  const email = "meet56963@gmail.com";
  const password = "1234";
  const phone_number = "+919999999999"; // Dummy phone number required by schema

  console.log(`Seeding dummy user...`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    const row = await queryOne(
      `INSERT INTO farmers (id, phone_number, name, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash
       RETURNING id, email`,
      [id, phone_number, "Test Farmer", email, password_hash]
    );

    console.log(`✅ User seeded successfully. ID: ${row.id}`);
  } catch (err) {
    if (err.message.includes("farmers_phone_number_key")) {
      // Phone number exists, let's just update the existing one
      const row = await queryOne(
        `UPDATE farmers SET email = $1, password_hash = $2 WHERE phone_number = $3 RETURNING id, email`,
        [email, password_hash, phone_number]
      );
      if (row) {
        console.log(`✅ User updated successfully. ID: ${row.id}`);
      } else {
        console.error("Failed to seed user.");
      }
    } else {
      console.error("Error seeding user:", err);
    }
  }
  process.exit(0);
}

seed();
