import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  MoreVertical,
  Bug,
  Droplet,
  Leaf,
  CloudRain,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { cropApi } from "../features/crop-context/api/cropApi";

import TriangleAlertIcon from "../components/hover-ui/triangle-alert-icon";
import InfoCircleIcon from "../components/hover-ui/info-circle-icon";
import CheckedIcon from "../components/hover-ui/checked-icon";
import DownChevron from "../components/hover-ui/down-chevron";
import ArrowNarrowRightIcon from "../components/hover-ui/arrow-narrow-right-icon";
import ArrowNarrowLeftIcon from "../components/hover-ui/arrow-narrow-left-icon";

import "./Alerts.css";

const PAGE_SIZE = 5;

const ALERT_TABS = [
  { key: "all", label: "All Alerts" },
  { key: "unread", label: "Unread" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "resolved", label: "Resolved" },
];

const normalizeAlert = (alert) => {
  if (!alert) return null;
  
  let prioStr = "Low";
  if (typeof alert.priority === "string" && alert.priority.trim() !== "") {
    prioStr = alert.priority;
  }
  
  return {
    id: alert.id || `alert-${Math.random().toString(36).substr(2, 9)}`,
    title: alert.title || "Field Alert",
    description: alert.description || "",
    field: alert.field || alert.fieldName || "Unknown Field",
    fieldId: alert.fieldId || alert.field_id || null,
    priority: prioStr.charAt(0).toUpperCase() + prioStr.slice(1).toLowerCase(),
    type: alert.type || "general",
    resolved: Boolean(alert.resolved),
    read: Boolean(alert.read),
    time: alert.time || alert.createdAt || alert.created_at || new Date().toISOString(),
    createdAt: alert.createdAt || alert.created_at || new Date().toISOString(),
  };
};

const formatAlertTime = (timestamp) => {
  if (!timestamp) return "Unknown time";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return String(timestamp);
  }

  const now = Date.now();
  const diff = now - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "Just now";
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)}m ago`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)}h ago`;
  }

  if (diff < 7 * day) {
    return `${Math.floor(diff / day)}d ago`;
  }

  return date.toLocaleDateString();
};

const getAlertIcon = (type) => {
  switch (type?.toLowerCase()) {
    case "pest":
      return Bug;

    case "irrigation":
      return Droplet;

    case "weather":
      return CloudRain;

    case "disease":
      return Leaf;

    default:
      return Leaf;
  }
};

const AlertsStatCard = ({
  type,
  title,
  value,
  desc,
  icon: IconComponent,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`alerts-stat-card ${type}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="alerts-stat-header">
        <div className={`alerts-stat-icon ${type}`}>
          <IconComponent
            size={16}
            strokeWidth={2.5}
            isHovered={isHovered}
          />
        </div>

        <span className={`alerts-stat-title ${type}`}>
          {title}
        </span>
      </div>

      <h3 className="alerts-stat-value">
        {value}
      </h3>

      <p className="alerts-stat-desc">
        {desc}
      </p>
    </div>
  );
};

const AlertsListItem = ({
  alert,
  navigate,
  onMarkRead,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const priority = (alert.priority || "Low").toLowerCase();

  return (
    <div
      className={`alerts-item ${
        alert.resolved ? "resolved" : ""
      } ${alert.read ? "read" : "unread"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="alerts-item-main">
        <div
          className={`alerts-item-icon ${
            alert.resolved
              ? "resolved"
              : priority === "high"
                ? "high"
                : priority === "medium"
                  ? "medium"
                  : "info"
          }`}
        >
          {alert.resolved ? (
            <CheckedIcon
              size={20}
              isHovered={isHovered}
            />
          ) : priority === "high" ||
            priority === "medium" ? (
            <TriangleAlertIcon
              size={20}
              isHovered={isHovered}
            />
          ) : (
            <InfoCircleIcon
              size={20}
              isHovered={isHovered}
            />
          )}
        </div>

        <div>
          <h4
            className={`alerts-item-title ${
              alert.resolved
                ? "resolved"
                : "active"
            }`}
          >
            {alert.title}
          </h4>

          <p className="alerts-item-desc">
            {alert.description}
          </p>

          {!alert.resolved && (
            <button
              className="alerts-item-link"
              type="button"
              onClick={() => {
                if (alert.fieldId) {
                  navigate(
                    `/fields/${alert.fieldId}?alert=${alert.id}`
                  );
                } else {
                  navigate(
                    `/alerts/${alert.id}`
                  );
                }

                if (!alert.read) {
                  onMarkRead(alert.id);
                }
              }}
            >
              View Details
              <ArrowNarrowRightIcon
                size={12}
                isHovered={isHovered}
              />
            </button>
          )}
        </div>
      </div>

      <div className="alerts-item-col">
        <span
          className={`alerts-badge ${
            alert.field === "All Fields"
              ? "all"
              : "success"
          }`}
        >
          {alert.field}
        </span>
      </div>

      <div className="alerts-item-col">
        <span
          className={`alerts-badge ${
            alert.resolved
              ? "success"
              : priority === "high"
                ? "danger"
                : priority === "medium"
                  ? "warning"
                  : "info"
          }`}
        >
          {alert.resolved
            ? "Resolved"
            : alert.priority}
        </span>
      </div>

      <div className="alerts-item-time-col">
        <span className="alerts-item-time">
          {formatAlertTime(alert.time)}
        </span>

        <button
          className="alerts-item-more"
          type="button"
          aria-label="Alert options"
          onClick={() => {
            if (!alert.read) {
              onMarkRead(alert.id);
            }
          }}
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
};

export const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("all");

  const [selectedField, setSelectedField] =
    useState("all");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [error, setError] =
    useState(null);

  const navigate = useNavigate();

  const fetchAlerts = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        setError(null);

        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const data =
          await cropApi.getAlerts();

        const normalized = Array.isArray(data)
          ? data.map(normalizeAlert).filter(Boolean)
          : [];

        setAlerts(normalized);
      } catch (err) {
        console.error(
          "Failed to fetch alerts:",
          err
        );

        setError(
          err?.message ||
            "Unable to load alerts."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const fields = useMemo(() => {
    const map = new Map();

    alerts.forEach((alert) => {
      if (
        alert.field &&
        alert.field !== "All Fields"
      ) {
        map.set(
          alert.fieldId || alert.field,
          {
            id:
              alert.fieldId ||
              alert.field,
            name: alert.field,
          }
        );
      }
    });

    return Array.from(map.values());
  }, [alerts]);

  const stats = useMemo(() => {
    const active =
      alerts.filter(
        (alert) => !alert.resolved
      );

    return {
      high: active.filter(
        (a) =>
          a.priority === "High"
      ).length,

      medium: active.filter(
        (a) =>
          a.priority === "Medium"
      ).length,

      low: active.filter(
        (a) =>
          a.priority === "Low"
      ).length,

      resolved: alerts.filter(
        (a) => a.resolved
      ).length,

      unread: alerts.filter(
        (a) => !a.read
      ).length,

      total: alerts.length,
    };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    if (selectedField !== "all") {
      result = result.filter(
        (alert) =>
          String(
            alert.fieldId ||
              alert.field
          ) ===
          String(selectedField)
      );
    }

    switch (activeTab) {
      case "unread":
        result = result.filter(
          (alert) => !alert.read
        );
        break;

      case "high":
        result = result.filter(
          (alert) =>
            !alert.resolved &&
            alert.priority === "High"
        );
        break;

      case "medium":
        result = result.filter(
          (alert) =>
            !alert.resolved &&
            alert.priority === "Medium"
        );
        break;

      case "low":
        result = result.filter(
          (alert) =>
            !alert.resolved &&
            alert.priority === "Low"
        );
        break;

      case "resolved":
        result = result.filter(
          (alert) => alert.resolved
        );
        break;

      default:
        break;
    }

    /**
     * Important ordering:
     * unresolved + high priority first,
     * then newest alerts.
     */
    return result.sort((a, b) => {
      if (
        a.resolved !== b.resolved
      ) {
        return a.resolved ? 1 : -1;
      }

      const priorityOrder = {
        High: 1,
        Medium: 2,
        Low: 3,
      };

      const priorityDifference =
        (priorityOrder[a.priority] ||
          4) -
        (priorityOrder[b.priority] ||
          4);

      if (
        priorityDifference !== 0
      ) {
        return priorityDifference;
      }

      return (
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
      );
    });
  }, [
    alerts,
    activeTab,
    selectedField,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredAlerts.length /
        PAGE_SIZE
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedAlerts =
    filteredAlerts.slice(
      (safePage - 1) *
        PAGE_SIZE,
      safePage * PAGE_SIZE
    );

  const startIndex =
    filteredAlerts.length === 0
      ? 0
      : (safePage - 1) *
          PAGE_SIZE +
        1;

  const endIndex = Math.min(
    safePage * PAGE_SIZE,
    filteredAlerts.length
  );

  const highPct =
    stats.total > 0
      ? Math.round(
          (stats.high /
            stats.total) *
            100
        )
      : 0;

  const mediumPct =
    stats.total > 0
      ? Math.round(
          (stats.medium /
            stats.total) *
            100
        )
      : 0;

  const lowPct =
    stats.total > 0
      ? Math.round(
          (stats.low /
            stats.total) *
            100
        )
      : 0;

  const resolvedPct =
    stats.total > 0
      ? Math.round(
          (stats.resolved /
            stats.total) *
            100
        )
      : 0;

  const markRead = async (alertId) => {
    /**
     * Optimistic update.
     */
    setAlerts((previous) =>
      previous.map((alert) =>
        alert.id === alertId
          ? { ...alert, read: true }
          : alert
      )
    );

    try {
      await cropApi.markAlertRead(
        alertId
      );
    } catch (err) {
      console.error(
        "Failed to mark alert as read:",
        err
      );

      /**
       * Re-sync server truth.
       */
      await fetchAlerts({
        refresh: true,
      });
    }
  };

  const markAllRead = async () => {
    const unreadIds = alerts
      .filter((alert) => !alert.read)
      .map((alert) => alert.id);

    if (!unreadIds.length) {
      return;
    }

    setAlerts((previous) =>
      previous.map((alert) => ({
        ...alert,
        read: true,
      }))
    );

    try {
      await cropApi.markAllAlertsRead();
    } catch (err) {
      console.error(
        "Failed to mark all alerts read:",
        err
      );

      await fetchAlerts({
        refresh: true,
      });
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const changeField = (fieldId) => {
    setSelectedField(fieldId);
    setCurrentPage(1);
  };

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <div>
          <h1 className="alerts-title">
            Alerts
          </h1>

          <p className="alerts-subtitle">
            Stay updated with important
            alerts for your fields
          </p>
        </div>

        <div className="alerts-header-actions">
          <div className="alerts-field-filter">
            <select
              value={selectedField}
              onChange={(event) =>
                changeField(
                  event.target.value
                )
              }
              className="alerts-btn"
              disabled={isLoading}
            >
              <option value="all">
                All Fields
              </option>

              {fields.map((field) => (
                <option
                  key={field.id}
                  value={field.id}
                >
                  {field.name}
                </option>
              ))}
            </select>

            <DownChevron size={16} />
          </div>

          <button
            className="alerts-btn"
            type="button"
            onClick={markAllRead}
            disabled={
              isLoading ||
              stats.unread === 0
            }
          >
            <CheckedIcon
              size={16}
            />

            Mark all as read
          </button>

          <button
            className="alerts-btn"
            type="button"
            onClick={() =>
              fetchAlerts({
                refresh: true,
              })
            }
            disabled={isRefreshing}
            aria-label="Refresh alerts"
          >
            <RefreshCw
              size={15}
              className={
                isRefreshing
                  ? "alerts-spin"
                  : ""
              }
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="alerts-error">
          <TriangleAlertIcon size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              fetchAlerts()
            }
          >
            Retry
          </button>
        </div>
      )}

      <div className="alerts-content">
        <div className="alerts-main">
          <div className="alerts-stats-grid">
            <AlertsStatCard
              type="danger"
              title="High Priority"
              value={
                isLoading
                  ? "-"
                  : stats.high
              }
              desc="Needs immediate action"
              icon={
                TriangleAlertIcon
              }
            />

            <AlertsStatCard
              type="warning"
              title="Medium Priority"
              value={
                isLoading
                  ? "-"
                  : stats.medium
              }
              desc="Needs attention"
              icon={
                TriangleAlertIcon
              }
            />

            <AlertsStatCard
              type="info"
              title="Low Priority"
              value={
                isLoading
                  ? "-"
                  : stats.low
              }
              desc="For your information"
              icon={
                InfoCircleIcon
              }
            />

            <AlertsStatCard
              type="success"
              title="Resolved"
              value={
                isLoading
                  ? "-"
                  : stats.resolved
              }
              desc="Resolved alerts"
              icon={CheckedIcon}
            />
          </div>

          <div className="alerts-list-card">
            <div className="alerts-tabs">
              {ALERT_TABS.map((tab) => {
                let count = stats.total;

                if (tab.key === "unread") {
                  count = stats.unread;
                }

                if (tab.key === "high") {
                  count = stats.high;
                }

                if (tab.key === "medium") {
                  count = stats.medium;
                }

                if (tab.key === "low") {
                  count = stats.low;
                }

                if (
                  tab.key === "resolved"
                ) {
                  count = stats.resolved;
                }

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() =>
                      changeTab(
                        tab.key
                      )
                    }
                    className={`alerts-tab ${
                      activeTab ===
                      tab.key
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {tab.label}{" "}
                    {isLoading
                      ? "-"
                      : `(${count})`}
                  </button>
                );
              })}
            </div>

            <div className="alerts-table-header">
              <div className="alerts-th alerts-th-main">
                Alert
              </div>

              <div className="alerts-th alerts-th-hidden">
                Field
              </div>

              <div className="alerts-th alerts-th-hidden">
                Priority
              </div>

              <div className="alerts-th alerts-th-right">
                Time
              </div>
            </div>

            <div className="alerts-list">
              {isLoading ? (
                <div className="alerts-loader">
                  <Loader2 className="alerts-spinner" />
                  <span>
                    Loading field alerts...
                  </span>
                </div>
              ) : paginatedAlerts.length ===
                0 ? (
                <div
                  style={{
                    padding: "48px",
                    textAlign: "center",
                    color: "#6B7280",
                  }}
                >
                  <TriangleAlertIcon
                    size={32}
                    style={{
                      margin:
                        "0 auto 12px auto",
                      color:
                        "#9CA3AF",
                    }}
                  />

                  <p
                    style={{
                      fontWeight: 500,
                      fontSize:
                        "14px",
                    }}
                  >
                    No alerts found
                  </p>

                  <p
                    style={{
                      fontSize:
                        "12px",
                      color:
                        "#9CA3AF",
                      marginTop:
                        "4px",
                    }}
                  >
                    No alerts match the
                    current filter.
                  </p>
                </div>
              ) : (
                paginatedAlerts.map(
                  (alert) => (
                    <AlertsListItem
                      key={alert.id}
                      alert={alert}
                      navigate={
                        navigate
                      }
                      onMarkRead={
                        markRead
                      }
                    />
                  )
                )
              )}
            </div>

            <div className="alerts-pagination">
              <span className="alerts-pagination-info">
                Showing {startIndex} to{" "}
                {endIndex} of{" "}
                {filteredAlerts.length}{" "}
                alerts
              </span>

              <div className="alerts-pagination-controls">
                <button
                  className="alerts-page-btn icon"
                  type="button"
                  disabled={
                    safePage <= 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                >
                  <ArrowNarrowLeftIcon
                    size={16}
                  />
                </button>

                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) =>
                    index + 1
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`alerts-page-btn ${
                      safePage === page
                        ? "active"
                        : "inactive"
                    }`}
                    onClick={() =>
                      setCurrentPage(
                        page
                      )
                    }
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="alerts-page-btn icon"
                  type="button"
                  disabled={
                    safePage >=
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                >
                  <ArrowNarrowRightIcon
                    size={16}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="alerts-footer-banner">
            <div className="alerts-footer-text">
              <InfoCircleIcon
                size={18}
              />

              <p className="alerts-footer-desc">
                Alerts are generated from
                available field observations,
                weather, crop and AI analysis.
                Verify important conditions
                in the field.
              </p>
            </div>

            <div className="alerts-footer-link-container">
              Need help? Contact{" "}
              <Link
                to="/ask"
                className="alerts-footer-link"
              >
                Ask AgriMesh
              </Link>
            </div>
          </div>
        </div>

        <div className="alerts-sidebar">
          <div className="alerts-summary-card">
            <h3 className="alerts-sidebar-title">
              Alerts Summary
            </h3>

            <div className="alerts-chart-container">
              <div className="alerts-chart-wrapper">
                <svg
                  viewBox="0 0 36 36"
                  className="alerts-chart-svg"
                >
                  {stats.total === 0 ? (
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="#E5E7EB"
                      strokeWidth="4"
                    />
                  ) : (
                    <>
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth="4"
                        strokeDasharray={`${highPct} ${
                          100 - highPct
                        }`}
                        strokeDashoffset="25"
                      />

                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="4"
                        strokeDasharray={`${mediumPct} ${
                          100 - mediumPct
                        }`}
                        strokeDashoffset={`${
                          25 - highPct
                        }`}
                      />

                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="4"
                        strokeDasharray={`${lowPct} ${
                          100 - lowPct
                        }`}
                        strokeDashoffset={`${
                          25 -
                          highPct -
                          mediumPct
                        }`}
                      />

                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="#22c55e"
                        strokeWidth="4"
                        strokeDasharray={`${resolvedPct} ${
                          100 -
                          resolvedPct
                        }`}
                        strokeDashoffset={`${
                          25 -
                          highPct -
                          mediumPct -
                          lowPct
                        }`}
                      />
                    </>
                  )}
                </svg>

                <div className="alerts-chart-center">
                  <span className="alerts-chart-total">
                    {isLoading
                      ? "-"
                      : stats.total}
                  </span>

                  <span className="alerts-chart-label">
                    Total
                  </span>
                </div>
              </div>

              <div className="alerts-legend">
                <div className="alerts-legend-item">
                  <div className="alerts-legend-label">
                    <div className="alerts-legend-dot danger" />
                    <span className="alerts-legend-text">
                      High
                    </span>
                  </div>

                  <span className="alerts-legend-value">
                    {stats.high} (
                    {highPct}%)
                  </span>
                </div>

                <div className="alerts-legend-item">
                  <div className="alerts-legend-label">
                    <div className="alerts-legend-dot warning" />
                    <span className="alerts-legend-text">
                      Medium
                    </span>
                  </div>

                  <span className="alerts-legend-value">
                    {stats.medium} (
                    {mediumPct}%)
                  </span>
                </div>

                <div className="alerts-legend-item">
                  <div className="alerts-legend-label">
                    <div className="alerts-legend-dot info" />
                    <span className="alerts-legend-text">
                      Low
                    </span>
                  </div>

                  <span className="alerts-legend-value">
                    {stats.low} (
                    {lowPct}%)
                  </span>
                </div>

                <div className="alerts-legend-item">
                  <div className="alerts-legend-label">
                    <div className="alerts-legend-dot success" />
                    <span className="alerts-legend-text">
                      Resolved
                    </span>
                  </div>

                  <span className="alerts-legend-value">
                    {stats.resolved} (
                    {resolvedPct}%)
                  </span>
                </div>
              </div>
            </div>

            <button
              className="alerts-sidebar-btn"
              type="button"
              onClick={() =>
                navigate(
                  "/intelligence"
                )
              }
            >
              View Alert Analytics
              <ArrowNarrowRightIcon
                size={14}
              />
            </button>
          </div>

          <div className="alerts-actions-card">
            <h3 className="alerts-actions-title">
              Recommended Actions
            </h3>

            <div className="alerts-actions-list">
              {alerts.filter(
                (alert) =>
                  !alert.resolved
              ).length === 0 ? (
                <div
                  style={{
                    padding:
                      "1.5rem 0.5rem",
                    textAlign:
                      "center",
                    color:
                      "#6B7280",
                  }}
                >
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize:
                        "0.85rem",
                    }}
                  >
                    All Actions Completed
                  </p>

                  <p
                    style={{
                      fontSize:
                        "0.75rem",
                      color:
                        "#9CA3AF",
                      marginTop:
                        "2px",
                    }}
                  >
                    No immediate
                    interventions
                    required.
                  </p>
                </div>
              ) : (
                alerts
                  .filter(
                    (alert) =>
                      !alert.resolved
                  )
                  .sort(
                    (a, b) => {
                      const priority = {
                        High: 1,
                        Medium: 2,
                        Low: 3,
                      };

                      return (
                        (priority[
                          a.priority
                        ] || 4) -
                        (priority[
                          b.priority
                        ] || 4)
                      );
                    }
                  )
                  .slice(0, 4)
                  .map(
                    (alert) => {
                      const Icon =
                        getAlertIcon(
                          alert.type
                        );

                      return (
                        <button
                          key={
                            alert.id
                          }
                          className="alerts-action-btn"
                          type="button"
                          onClick={() => {
                            if (
                              alert.fieldId
                            ) {
                              navigate(
                                `/fields/${alert.fieldId}?alert=${alert.id}`
                              );
                            } else {
                              navigate(
                                `/alerts/${alert.id}`
                              );
                            }
                          }}
                        >
                          <div className="alerts-action-content">
                            <div
                              className={`alerts-action-icon ${
                                alert.priority ===
                                "High"
                                  ? "danger"
                                  : alert.priority ===
                                      "Medium"
                                    ? "warning"
                                    : "info"
                              }`}
                            >
                              <Icon
                                size={
                                  14
                                }
                              />
                            </div>

                            <div>
                              <h4 className="alerts-action-title">
                                {
                                  alert.title
                                }
                              </h4>

                              <p className="alerts-action-desc">
                                {
                                  alert.field
                                }{" "}
                                •{" "}
                                {
                                  alert.description
                                }
                              </p>
                            </div>
                          </div>

                          <ArrowNarrowRightIcon
                            size={
                              16
                            }
                            className="alerts-action-chevron"
                          />
                        </button>
                      );
                    }
                  )
              )}
            </div>

            <button
              className="alerts-actions-view-all"
              type="button"
              onClick={() =>
                navigate(
                  "/intelligence"
                )
              }
            >
              View Intelligence Hub
              <ArrowNarrowRightIcon
                size={14}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
