import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Search,
  MapPin,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sprout,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { marketApi } from "../features/market-prices/api/marketApi";
import { PriceChart } from "../features/market-prices/components/PriceChart";
import { Combobox } from "../features/market-prices/components/Combobox";
import "./MarketPrices.css";

/**
 * MarketPrices Page
 *
 * Personalized mandi price dashboard:
 * 1. "Your Crops" quick summary (if farmer has fields)
 * 2. Search form — crop, state, district
 * 3. Price summary cards (min / modal / max)
 * 4. Price trend chart (SVG)
 * 5. Nearby markets table
 */
export function MarketPrices() {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [commodities, setCommodities] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const [myCrops, setMyCrops] = useState([]);
  const [myCropsLoading, setMyCropsLoading] = useState(true);

  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [priceHistory, setPriceHistory] = useState([]);
  const [historyDays, setHistoryDays] = useState(30);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [nearbyMarkets, setNearbyMarkets] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // ─── Load dropdowns + "Your Crops" on mount ─────────────────────────────────
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [commodityData, stateData, myCropData] = await Promise.allSettled([
          marketApi.getCommodities(),
          marketApi.getStates(""),
          marketApi.getMyCropPrices(),
        ]);

        if (commodityData.status === "fulfilled") {
          setCommodities(commodityData.value || []);
        }
        if (stateData.status === "fulfilled") {
          setStates((stateData.value || []).map((s) => s.state));
        }
        if (myCropData.status === "fulfilled") {
          setMyCrops(myCropData.value || []);
        }
      } catch (err) {
        console.error("Failed to load initial market data:", err);
      } finally {
        setMyCropsLoading(false);
      }
    };
    loadInitial();
  }, []);

  // ─── Reload states when commodity changes ───────────────────────────────────
  useEffect(() => {
    const loadStates = async () => {
      try {
        const stateData = await marketApi.getStates(selectedCommodity);
        setStates((stateData || []).map((s) => s.state));
      } catch {
        // keep old states if error
      }
    };
    // If it's empty, we still want to load all states
    loadStates();
  }, [selectedCommodity]);

  // ─── Load districts when state or commodity changes ─────────────────────────
  useEffect(() => {
    if (!selectedState) {
      setDistricts([]);
      return;
    }
    const loadDistricts = async () => {
      try {
        const data = await marketApi.getDistricts(selectedState, selectedCommodity);
        setDistricts((data || []).map((d) => d.district));
      } catch {
        setDistricts([]);
      }
    };
    loadDistricts();
  }, [selectedState, selectedCommodity]);

  // ─── Search handler ─────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    async (commodity, state, district) => {
      const crop = commodity || selectedCommodity;
      const st = state || selectedState;
      const dist = district || selectedDistrict;

      if (!crop) return;

      setSearchLoading(true);
      setSearchError(null);
      setSearchResult(null);
      setPriceHistory([]);
      setNearbyMarkets([]);

      try {
        const result = await marketApi.searchPrices(crop, st, dist);
        setSearchResult({ ...result, commodity: crop, state: st, district: dist });

        // Load history + nearby in parallel
        const marketName =
          result.prices?.[0]?.market || dist || st || "";

        const [historyResult, nearbyResult] = await Promise.allSettled([
          marketName
            ? marketApi.getPriceHistory(crop, marketName, historyDays)
            : Promise.resolve({ prices: [] }),
          st
            ? marketApi.getNearbyMarkets(crop, st, dist)
            : Promise.resolve([]),
        ]);

        if (historyResult.status === "fulfilled") {
          setPriceHistory(historyResult.value?.prices || []);
        }
        if (nearbyResult.status === "fulfilled") {
          setNearbyMarkets(nearbyResult.value || []);
        }
      } catch (err) {
        setSearchError(err.message || "Failed to fetch prices");
      } finally {
        setSearchLoading(false);
      }
    },
    [selectedCommodity, selectedState, selectedDistrict, historyDays]
  );

  // ─── History range change handler ───────────────────────────────────────────
  const handleRangeChange = useCallback(
    async (days) => {
      setHistoryDays(days);
      if (!searchResult) return;

      const marketName =
        searchResult.prices?.[0]?.market || searchResult.district || "";
      if (!marketName) return;

      setHistoryLoading(true);
      try {
        const data = await marketApi.getPriceHistory(
          searchResult.commodity,
          marketName,
          days
        );
        setPriceHistory(data?.prices || []);
      } catch {
        // Keep existing data
      } finally {
        setHistoryLoading(false);
      }
    },
    [searchResult]
  );

  // ─── Click a "Your Crop" card ────────────────────────────────────────────────
  const handleCropClick = (crop) => {
    setSelectedCommodity(crop.commodity);
    if (crop.state) setSelectedState(crop.state);
    handleSearch(crop.commodity, crop.state, "");
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const formatPrice = (price) => {
    const p = parseFloat(price);
    if (isNaN(p)) return "—";
    return `₹${p.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const ChangeIndicator = ({ change }) => {
    if (change === null || change === undefined)
      return <span className="market-crop-card-change neutral">—</span>;
    const isUp = change > 0;
    const Icon = isUp ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
    return (
      <span className={`market-crop-card-change ${isUp ? "up" : change < 0 ? "down" : "neutral"}`}>
        <Icon size={13} />
        {Math.abs(change)}%
      </span>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="market-prices-page">
      {/* Page Header */}
      <div className="market-prices-header">
        <h1>
          <TrendingUp size={24} /> Market Prices
        </h1>
        <p className="market-prices-subtitle">
          Check current mandi prices, trends, and nearby market comparisons
        </p>
      </div>

      {/* ─── Your Crops ────────────────────────────────────────────────────── */}
      {!myCropsLoading && myCrops.length > 0 && (
        <div className="market-your-crops">
          <h3 className="market-your-crops-title">
            <Sprout size={16} /> Your Crops
          </h3>
          <div className="market-your-crops-grid">
            {myCrops.map((crop, i) => (
              <div
                key={i}
                className="market-crop-card"
                onClick={() => handleCropClick(crop)}
              >
                <span className="market-crop-card-name">{crop.commodity}</span>
                <span className="market-crop-card-price">
                  {formatPrice(crop.modalPrice)}
                  <span style={{ fontSize: "0.7rem", color: "#6b7280", fontWeight: 500 }}>
                    /q
                  </span>
                </span>
                <ChangeIndicator change={crop.change} />
                <span className="market-crop-card-market">{crop.market}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Search Form ──────────────────────────────────────────────────── */}
      <div className="market-search-card">
        <h3 className="market-search-card-title">Search Market Prices</h3>
        <div className="market-search-form">
          <Combobox
            label="Crop"
            placeholder="Search or select crop..."
            value={selectedCommodity}
            onChange={(val) => setSelectedCommodity(val)}
            options={commodities.map((c) => c.name)}
          />

          <Combobox
            label="State"
            placeholder="All states"
            value={selectedState}
            onChange={(val) => {
              setSelectedState(val);
              setSelectedDistrict("");
            }}
            options={states}
          />

          <Combobox
            label="District"
            placeholder="All districts"
            value={selectedDistrict}
            onChange={(val) => setSelectedDistrict(val)}
            options={districts}
            disabled={!selectedState}
          />

          <button
            className="market-search-btn"
            onClick={() => handleSearch()}
            disabled={!selectedCommodity || searchLoading}
          >
            <Search size={16} />
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* ─── Error State ──────────────────────────────────────────────────── */}
      {searchError && (
        <div className="market-error">
          <AlertCircle size={16} />
          {searchError}
        </div>
      )}

      {/* ─── Loading State ────────────────────────────────────────────────── */}
      {searchLoading && (
        <div className="market-loading">
          <div className="market-loading-spinner" />
          <span>Fetching prices...</span>
        </div>
      )}

      {/* ─── Search Results ──────────────────────────────────────────────── */}
      {searchResult && !searchLoading && (
        <div className="market-results">
          {/* Results Header */}
          <div className="market-results-header">
            <div>
              <h2 className="market-results-title">
                {searchResult.commodity}
                {searchResult.prices?.[0]?.market && ` — ${searchResult.prices[0].market}`}
              </h2>
              <p className="market-results-subtitle">
                {searchResult.prices?.[0]?.state &&
                  `${searchResult.prices[0].district || ""} ${searchResult.prices[0].state}`.trim()}
              </p>
            </div>
            {searchResult.latestDate && (
              <span className="market-results-updated">
                <Clock size={13} /> Last updated: {formatDate(searchResult.latestDate)}
              </span>
            )}
          </div>

          {/* Price Summary Cards */}
          {searchResult.prices?.length > 0 ? (
            <div className="market-price-cards">
              <div className="market-price-card">
                <div className="market-price-card-label">Minimum Price</div>
                <div className="market-price-card-value">
                  {formatPrice(searchResult.prices[0].min_price)}
                </div>
                <div className="market-price-card-unit">per quintal</div>
              </div>

              <div className="market-price-card modal">
                <div className="market-price-card-label">Modal Price</div>
                <div className="market-price-card-value">
                  {formatPrice(searchResult.prices[0].modal_price)}
                </div>
                <div className="market-price-card-unit">per quintal</div>
                {searchResult.change !== null && (
                  <div
                    className={`market-price-card-change ${
                      searchResult.change > 0 ? "up" : searchResult.change < 0 ? "down" : ""
                    }`}
                  >
                    {searchResult.change > 0 ? (
                      <ArrowUpRight size={14} />
                    ) : searchResult.change < 0 ? (
                      <ArrowDownRight size={14} />
                    ) : null}
                    {searchResult.change > 0 ? "+" : ""}
                    {searchResult.change}% from previous
                  </div>
                )}
              </div>

              <div className="market-price-card">
                <div className="market-price-card-label">Maximum Price</div>
                <div className="market-price-card-value">
                  {formatPrice(searchResult.prices[0].max_price)}
                </div>
                <div className="market-price-card-unit">per quintal</div>
              </div>
            </div>
          ) : (
            <div className="market-empty-state">
              <BarChart3 size={40} />
              <h3>No price data found</h3>
              <p>Try a different crop, state, or district combination</p>
            </div>
          )}

          {/* Price Trend Chart */}
          <PriceChart
            data={priceHistory}
            activeDays={historyDays}
            onRangeChange={handleRangeChange}
          />

          {/* Nearby Markets */}
          {nearbyMarkets.length > 0 && (
            <div className="market-nearby">
              <h3 className="market-nearby-title">
                <MapPin size={16} /> Nearby Markets
              </h3>
              <div className="market-nearby-list">
                {nearbyMarkets.slice(0, 8).map((m, i) => (
                  <div key={i} className="market-nearby-item">
                    <div>
                      <div className="market-nearby-name">{m.market}</div>
                      {m.district && (
                        <div className="market-nearby-district">{m.district}</div>
                      )}
                    </div>
                    <div className="market-nearby-price">
                      {formatPrice(m.modalPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Initial Empty State ──────────────────────────────────────────── */}
      {!searchResult && !searchLoading && !searchError && myCrops.length === 0 && !myCropsLoading && (
        <div className="market-empty-state">
          <TrendingUp size={48} />
          <h3>Search for crop prices</h3>
          <p>
            Select a crop from the dropdown above to see current mandi prices,
            historical trends, and nearby market comparisons.
          </p>
        </div>
      )}
    </div>
  );
}
