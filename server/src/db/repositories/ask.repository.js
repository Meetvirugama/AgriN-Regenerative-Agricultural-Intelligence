import { query, queryOne } from "../connection.js";

/**
 * Get the active field for a farmer.
 */
export async function getActiveField(farmerId) {
  const row = await queryOne(
    `SELECT
       f.id, f.name, f.area_hectares as "areaHectares", f.lat as latitude, f.lng as longitude,
       f.crop_type as "cropName", f.crop_variety as "cropVariety", f.sowing_date as "sowingDate", 
       fs.current_stage as "growthStage",
       fa.preferred_language as "farmerLanguage"
     FROM fields f
     JOIN farmers fa ON fa.id = f.farmer_id
     LEFT JOIN field_crop_states fs ON fs.field_id = f.id
     WHERE f.farmer_id = $1
     ORDER BY f.created_at DESC LIMIT 1`,
    [farmerId]
  );
  return row || null;
}

/**
 * Get recent field history (chat messages).
 */
export async function getFieldHistory(farmerId, limit = 50, cursor = null) {
  const values = [farmerId];
  let cursorSql = "";
  if (cursor) {
    values.push(cursor);
    cursorSql = `AND created_at < $2`;
    // If limit is provided, it will be the third param if cursor exists, or second if not.
  }
  
  const limitIdx = cursor ? 3 : 2;
  values.push(limit);

  const rows = await query(
    `SELECT
       id,
       role,
       content,
       created_at as timestamp,
       advisory,
       sources
     FROM chat_messages
     WHERE farmer_id = $1 ${cursorSql}
     ORDER BY created_at DESC
     LIMIT $${limitIdx}`,
    values
  );
  
  return rows.reverse();
}

/**
 * Save user message
 */
export async function saveUserMessage({ farmerId, fieldId, clientMessageId, content }) {
  return await queryOne(
    `INSERT INTO chat_messages (farmer_id, field_id, client_message_id, role, content)
     VALUES ($1, $2, $3, 'user', $4)
     RETURNING id, created_at as timestamp`,
    [farmerId, fieldId, clientMessageId, content]
  );
}

/**
 * Save AI message
 */
export async function saveAiMessage({ farmerId, fieldId, parentMessageId, content, advisory, sources }) {
  return await queryOne(
    `INSERT INTO chat_messages (farmer_id, field_id, parent_message_id, role, content, advisory, sources)
     VALUES ($1, $2, $3, 'assistant', $4, $5, $6)
     RETURNING id, created_at`,
    [farmerId, fieldId, parentMessageId, content, JSON.stringify(advisory), JSON.stringify(sources)]
  );
}

/**
 * Find existing user message by idempotency key
 */
export async function findExistingMessage(farmerId, clientMessageId) {
  if (!clientMessageId) return null;
  const row = await queryOne(
    `SELECT id, role, content, created_at as timestamp
     FROM chat_messages
     WHERE farmer_id = $1 AND client_message_id = $2 AND role = 'user'`,
    [farmerId, clientMessageId]
  );
  if (!row) return null;
  
  // Also return the AI response if it exists
  const aiRow = await queryOne(
    `SELECT id, role, content, created_at as timestamp, advisory, sources
     FROM chat_messages
     WHERE parent_message_id = $1 AND role = 'assistant'`,
    [row.id]
  );
  
  if (aiRow) return aiRow;
  return row;
}

/**
 * Clear chat history for a farmer
 */
export async function clearFarmerChat(farmerId) {
  await query(
    `DELETE FROM chat_messages WHERE farmer_id = $1`,
    [farmerId]
  );
}
