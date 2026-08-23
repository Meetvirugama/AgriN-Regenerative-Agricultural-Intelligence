import fetch from "node-fetch";
import * as marketRepo from "../db/repositories/market.repository.js";

/**
 * Mandi Price Ingestion Job
 *
 * Fetches daily commodity prices from the data.gov.in Open Government Data API,
 * normalizes the data, and upserts into PostgreSQL.
 *
 * API: https://api.data.gov.in/resource/{RESOURCE_ID}
 *
 * Designed to be idempotent — safe to run multiple times for the same date.
 */

const API_KEY = process.env.DATA_GOV_API_KEY;
const RESOURCE_ID = process.env.DATA_GOV_RESOURCE_ID || "9ef84268-d588-465a-a308-a864a43d0070";
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;
const PAGE_SIZE = 100;

/**
 * Fetch a single page of records from the API.
 */
async function fetchPage(offset = 0) {
  const url = new URL(BASE_URL);
  url.searchParams.set("api-key", API_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    timeout: 30_000,
  });

  if (!response.ok) {
    throw new Error(`data.gov.in API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Parse and normalize a single API record into our schema.
 */
function parseRecord(record) {
  return {
    commodity: record.commodity?.trim() || null,
    state: record.state?.trim() || null,
    district: record.district?.trim() || null,
    market: record.market?.trim() || null,
    variety: record.variety?.trim() || "Other",
    grade: record.grade?.trim() || "FAQ",
    arrivalDate: record.arrival_date || null,
    minPrice: parseFloat(record.min_price) || null,
    maxPrice: parseFloat(record.max_price) || null,
    modalPrice: parseFloat(record.modal_price) || null,
  };
}

/**
 * Convert the API's date format (dd/MM/yyyy) to ISO date (yyyy-MM-dd).
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  // Handle dd/MM/yyyy format
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Handle yyyy-MM-dd format (already ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  return null;
}

/**
 * Ingest a single record into the database.
 */
async function ingestRecord(record) {
  const parsed = parseRecord(record);

  // Skip invalid records
  if (!parsed.commodity || !parsed.market || !parsed.state) {
    return false;
  }

  const priceDate = parseDate(parsed.arrivalDate);
  if (!priceDate) return false;

  // Upsert commodity
  const commodityId = await marketRepo.upsertCommodity(parsed.commodity);

  // Upsert market
  const marketId = await marketRepo.upsertMarket(parsed.market, parsed.district, parsed.state);

  // Upsert price
  await marketRepo.upsertPrice({
    commodityId,
    marketId,
    priceDate,
    variety: parsed.variety,
    grade: parsed.grade,
    minPrice: parsed.minPrice,
    maxPrice: parsed.maxPrice,
    modalPrice: parsed.modalPrice,
    arrivalQuantity: null,
  });

  return true;
}

/**
 * Run the full ingestion — paginate through all available records.
 *
 * @param {number} maxPages - Safety limit on pages to fetch (default: 20 = 10,000 records)
 */
export async function runMandiPriceIngestion(maxPages = 20) {
  const label = "[Job:MandiPrices]";

  if (!API_KEY) {
    console.warn(`${label} DATA_GOV_API_KEY not set — skipping ingestion.`);
    return { success: false, reason: "No API key configured" };
  }

  console.log(`${label} Starting mandi price ingestion...`);

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let page = 0;

  try {
    while (page < maxPages) {
      const offset = page * PAGE_SIZE;
      console.log(`${label} Fetching page ${page + 1} (offset: ${offset})...`);

      const data = await fetchPage(offset);
      const records = data.records || [];

      if (records.length === 0) {
        console.log(`${label} No more records at offset ${offset}. Done.`);
        break;
      }

      for (const record of records) {
        try {
          const ingested = await ingestRecord(record);
          if (ingested) {
            totalProcessed++;
          } else {
            totalSkipped++;
          }
        } catch (err) {
          totalErrors++;
          if (totalErrors <= 5) {
            console.error(`${label} Record error:`, err.message);
          }
        }
      }

      // If fewer records than page size, we've reached the last page
      if (records.length < PAGE_SIZE) {
        break;
      }

      page++;

      // Small delay between pages to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const summary = {
      success: true,
      totalProcessed,
      totalSkipped,
      totalErrors,
      pagesProcessed: page + 1,
    };

    console.log(`${label} Ingestion complete:`, summary);
    return summary;
  } catch (err) {
    console.error(`${label} Ingestion failed:`, err.message);
    return { success: false, reason: err.message, totalProcessed, totalErrors };
  }
}
