# AgriMesh Client — Regenerative Agricultural Intelligence

The frontend client for the **AgriN & Regenerative Agricultural Intelligence** platform. This application provides a unified dashboard for farmers to monitor field health, receive AI-driven agro-advisory, and manage regenerative farming practices.

## 🚀 Tech Stack

- **Core**: React 19 + Vite 6
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS v4 + Lucide React Icons
- **Mapping & Telemetry**: Google Earth Engine API + Google Maps API
- **Tooling**: Oxlint + Vitest

## 📦 Project Structure

The client application follows a feature-based architecture for maximum scalability:

```text
client/
├── public/                 # Static assets
└── src/
    ├── app/                # Global app shells (FarmerShell, ExtensionShell), Auth Providers, Routes
    ├── components/ui/      # Reusable generic UI components (Buttons, Modals, ErrorBoundaries, Tooltips)
    ├── features/           # Feature-based domain modules
    │   ├── agro-advisory/  # AI recommendations and insights
    │   ├── auth/           # Login flows and Google OAuth integration
    │   ├── climate-risk/   # Climate modeling and widget displays
    │   ├── crop-context/   # Crop planning and growth stage visualization
    │   ├── cross-border/   # Global market trends and insights
    │   ├── disease/        # Crop disease diagnosis (Computer Vision)
    │   ├── escalation-dashboard/ # Extension worker layer
    │   ├── field-management/ # Creating and mapping fields
    │   ├── field-memory/   # Historical field timelines
    │   ├── regen-ag/       # Regenerative agriculture planning
    │   ├── soil-intelligence/ # Soil sampling and telemetry
    │   ├── voice/          # Text-to-speech and voice input
    │   └── weather-intelligence/ # Hyper-local weather forecasting
    ├── pages/              # High-level page components routing features together
    ├── services/           # Global services (Unified apiClient.js, etc.)
    └── types/              # Enums and data mappers (e.g., status.js)
```

## ⚙️ Environment Configuration

Copy the `.env.example` file to `.env` and configure your API keys:

```env
# Base URL of the Node/Express API gateway
VITE_API_URL=http://localhost:8000/api

# Google Maps JavaScript API key (Field boundary map, satellite tiles)
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Google OAuth client ID (Primary Auth: Login with Google)
VITE_GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id

# Google Earth Engine OAuth client ID (Satellite imagery layer fallback)
VITE_EE_CLIENT_ID=your_ee_client_id
```

## 🛠️ Scripts

- `npm run dev` - Starts the Vite development server
- `npm run build` - Builds the application for production
- `npm run preview` - Previews the production build locally
- `npm run lint` - Runs Oxlint for aggressive linting checks
- `npm test` - Executes the Vitest testing suite

## 🛡️ Architecture & Data Flow

This application is strictly designed to interact with the backend API gateway using a unified, authenticated fetch wrapper (`services/apiClient.js`). 
- **Telemetry Parsing**: Component layers lazily load features using the `FeatureErrorBoundary` to prevent localized microservice failures (e.g. Earth Engine outages) from crashing the entire Farmer Dashboard.
- **State Management**: Uses native React context and hooks tailored closely around localized REST queries.
- **Security**: Access tokens are automatically refreshed in the background. If a token irreversibly expires, the client proactively purges state and redirects to `/login`.

## 🤝 Contribution

Ensure all components are strictly written as functional React elements (`.jsx`) and adhere to the established Tailwind design system. Run `npm run lint` and `npm test` before pushing modifications.
