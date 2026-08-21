export const mapSeverityToStatus = (severity) => {
  // Guard against undefined/null/non-string severity (e.g. a field the
  // backend hasn't populated yet). Without this, `.toLowerCase()` throws
  // and crashes any card that calls this helper before its data has loaded.
  if (typeof severity !== "string" || severity.trim().length === 0) return "neutral";

  const normalized = severity.trim().toLowerCase();
  if (
    normalized === "green" ||
    normalized === "low" ||
    normalized === "healthy" ||
    normalized === "good"
  )
    return "healthy";
  if (
    normalized === "amber" ||
    normalized === "moderate" ||
    normalized === "medium" ||
    normalized === "attention"
  )
    return "attention";
  if (
    normalized === "red" ||
    normalized === "high" ||
    normalized === "urgent" ||
    normalized === "critical" // climate-risk service can return "critical"
  )
    return "urgent";
  if (normalized === "info") return "info";
  if (normalized === "none" || normalized === "unknown") return "neutral";
  
  return "neutral";
};
