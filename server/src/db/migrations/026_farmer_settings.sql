-- Migration 026: Farmer Settings
-- Adds a settings table for each farmer to configure AI and UI preferences.

CREATE TABLE IF NOT EXISTS farmer_settings (
    farmer_id UUID PRIMARY KEY REFERENCES farmers(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL DEFAULT 'English',
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    enable_sounds BOOLEAN NOT NULL DEFAULT TRUE,
    personalized_recommendations BOOLEAN NOT NULL DEFAULT TRUE,
    voice_responses BOOLEAN NOT NULL DEFAULT FALSE,
    auto_read_recommendations BOOLEAN NOT NULL DEFAULT FALSE,
    advice_level VARCHAR(20) NOT NULL DEFAULT 'Simple' CHECK (advice_level IN ('Simple', 'Detailed', 'Expert')),
    permission_crop BOOLEAN NOT NULL DEFAULT TRUE,
    permission_soil BOOLEAN NOT NULL DEFAULT TRUE,
    permission_weather BOOLEAN NOT NULL DEFAULT TRUE,
    permission_history BOOLEAN NOT NULL DEFAULT TRUE,
    permission_health BOOLEAN NOT NULL DEFAULT TRUE,
    permission_irrigation BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
