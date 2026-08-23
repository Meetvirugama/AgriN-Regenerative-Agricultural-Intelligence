import bcrypt from "bcryptjs";
import { pool } from "./src/db/connection.js";

async function createAdmin() {
  try {
    const passwordHash = await bcrypt.hash("password123", 10);
    const email = "test@agrimesh.com";
    const phone = "+19999999999";
    const name = "Demo User";
    
    await pool.query(
      `INSERT INTO farmers (id, phone_number, name, email, password_hash)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       ON CONFLICT (phone_number) DO UPDATE SET email = $3, password_hash = $4`,
      [phone, name, email, passwordHash]
    );
    
    console.log("Success! Demo user created.");
    console.log("Email: " + email);
    console.log("Password: password123");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

createAdmin();
