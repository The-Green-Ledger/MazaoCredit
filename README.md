# 🌱 Sprout-Sell — AI-Powered Credit For Every Farmer

Bold, inclusive, and data-driven. Sprout-Sell brings AI credit assessments to smallholder farmers using simple inputs (name, location, land size), and enriches the analysis with climate, weather, and yield signals — no financial history required.

• Frontend (Netlify): https://mazao-credit.netlify.app  
• Backend (Render): https://mazao-credit-backend.onrender.com

---

## 🧠 How the AI Works
Our AI computes a creditworthiness assessment by blending farmer-provided inputs with external and modelled datasets:

- Land and production context: land size, crop type, years of experience
- Location awareness: county/region, country, regional yield baselines
- Climate and weather: risk of drought, flood, and hail by crop and county
- Optional mobile money aggregates: inflows, outflows, transaction counts

The pipeline can run entirely without sensitive bank statements. Financial data, if provided, simply refines the baseline. The AI returns:

- Credit score (0–100)
- Recommended loan amount
- Interest rate
- Strengths, weaknesses, and risk level
- Financial readiness and analysis timestamp

---

## 📦 Project Structure

```
Sprout-Sell/
  Sprout-Sell/
    ai/
      data/                    # CSV inputs (e.g., weather_forecast.csv)
      scripts/                 # Python AI entrypoint
        credit_predictor.py
      models/                  # Optional model artifacts (.pkl)
      venv/                    # Python virtual environment
    backend/
      src/
        app.js                 # Express server
        routes/
          auth.js              # Registration + credit analysis API
          financial.js
          products.js
          users.js
        services/
          AICreditScoring.js   # JS/OpenAI fallback + parsing
          PythonCreditScoring.js# Spawns ai/scripts/credit_predictor.py
        config/
          supabase.js          # Supabase client (service key on server)
    frontend/
      src/
        components/
          FinancialTools.tsx   # Minimal input → AI analysis + raw JSON view
        pages/
          Auth.tsx             # Signup (with gender) + role-aware
          FinancialPage.tsx
          Dashboard.tsx
      index.html
      vite.config.ts
    netlify.toml                # SPA build + redirects
    render.yaml                 # Backend deploy config
    README.md
```

---

## 🔗 Key Endpoints

- POST `/api/auth/register` — Create/update user profile (includes role, gender, data)  
- POST `/api/auth/credit-analysis/:userId` — Run AI; persists score and logs to server  
- GET `/api/auth/credit-analysis/:userId` — Fetch latest persisted analysis  

The backend first tries Python AI (ai/scripts/credit_predictor.py); if unavailable, it falls back to a JS/OpenAI model, then persists the result to Supabase (when configured).

---

## 🚀 Run Locally

### 1) AI Service (Python)
```bash
cd Sprout-Sell/ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # if present; otherwise install numpy, pandas, etc.

# Optional: seed weather data
echo "county,crop,drought_risk,flood_risk,hail_risk\nnakuru,maize,0.2,0.1,0.05\nnairobi,beans,0.1,0.1,0.02\nmachakos,tomatoes,0.3,0.05,0.03" > data/weather_forecast.csv

# Smoke test
echo '{
  "farmData":{"farmSize":3,"farmType":"maize"},
  "locationData":{"county":"Nakuru"},
  "financialData":{"annualRevenue":120000},
  "mpesaData":{"total_inflows":80000,"total_outflows":40000,"inflow_count":120}
}' | python scripts/credit_predictor.py
```

### 2) Backend (Node/Express)
```bash
cd Sprout-Sell/backend
npm install

# Optional persistence (recommended)
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_KEY=your_service_role_key

# Start API
node src/app.js
# → http://localhost:5000
```

### 3) Frontend (Vite + React)
```bash
cd Sprout-Sell/frontend
npm install

# Create .env.local
cat > .env.local <<EOF
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF

npm run dev
# → http://localhost:5173
```

---

## 🧪 Quick API Test
```bash
# Replace with a real Supabase user id once signed up via frontend
USER_ID="test-user-123"

curl -s -X POST "http://localhost:5000/api/auth/credit-analysis/$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
        "farmData": {"farmSize": 2.5, "farmType": "beans", "yearsExperience": 2},
        "locationData": {"region": "Nairobi", "country": "Kenya"},
        "financialData": {"annualRevenue": 20000},
        "mpesaData": {"total_inflows": 15000, "total_outflows": 12000, "inflow_count": 40}
      }'
```
The server logs a line like: `[AI CREDIT] user=... score=... rate=... loan=...` and persists to Supabase if configured.

---

## 🌍 Deployments

Frontend (Netlify): https://mazao-credit.netlify.app  
Backend (Render): https://mazao-credit-backend.onrender.com

Netlify build (configured in `netlify.toml`):
- Base: `frontend`
- Build: `npm run build`
- Publish: `dist`
- Env: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## ✨ Why This Matters

Millions of farmers lack formal financial records. Sprout-Sell flips the script by leveraging agronomic signals — yield baselines, climate risk, location, land size, and experience — to open fair credit access. Finance should follow good farming, not just bank statements.

