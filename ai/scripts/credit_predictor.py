#!/usr/bin/env python3
import sys
import json
import os
from typing import Any, Dict


def load_csv(path: str):
    try:
        import pandas as pd
        return pd.read_csv(path)
    except Exception:
        return None


def load_pickle(path: str):
    try:
        import pickle
        with open(path, 'rb') as f:
            return pickle.load(f)
    except Exception:
        return None


def safe_float(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def compute_regional_yield_features(df, county: str, crop: str) -> Dict[str, Any]:
    if df is None or df.empty:
        return {
            'regional_avg_yield_per_acre': 0.0,
            'regional_samples': 0,
        }

    county = (county or '').strip().lower()
    crop = (crop or '').strip().lower()

    df_norm = df.copy()
    # Heuristic column name detection
    col_county = next((c for c in df_norm.columns if c.lower() in ['county', 'region', 'location']), None)
    col_crop = next((c for c in df_norm.columns if 'crop' in c.lower()), None)
    col_yield = next((c for c in df_norm.columns if 'yield' in c.lower() and 'per' in c.lower() or c.lower() in ['yield_kg_per_acre', 'yield_t_ha', 'yield']), None)
    col_area = next((c for c in df_norm.columns if 'area' in c.lower() and ('acre' in c.lower() or 'ha' in c.lower() or 'hectare' in c.lower())), None)
    col_bags = next((c for c in df_norm.columns if 'bag' in c.lower()), None)

    # If we have bags and area but not yield, approximate yield per acre
    if col_yield is None and col_bags and col_area:
        try:
            df_norm['__yield_per_acre'] = df_norm[col_bags] / df_norm[col_area]
            col_yield = '__yield_per_acre'
        except Exception:
            pass

    # County/crop filter
    sub = df_norm
    if col_county:
        sub = sub[sub[col_county].astype(str).str.lower() == county]
    if col_crop:
        sub = sub[sub[col_crop].astype(str).str.lower() == crop]

    samples = len(sub) if col_yield and not sub.empty else 0
    if samples == 0 and df_norm is not None and col_yield:
        # Fallback to national crop average
        sub = df_norm[df_norm[col_crop].astype(str).str.lower() == crop] if col_crop else df_norm
        samples = len(sub)

    if col_yield and samples > 0:
        import numpy as np
        avg = float(np.nanmean(sub[col_yield].astype(float)))
        return {
            'regional_avg_yield_per_acre': avg,
            'regional_samples': int(samples),
        }

    return {
        'regional_avg_yield_per_acre': 0.0,
        'regional_samples': 0,
    }


def score_from_signals(expected_yield: float, farm_size: float, mpesa: Dict[str, Any], annual_revenue: float, weather_risk: float) -> Dict[str, Any]:
    # Base score from production potential
    production_potential = expected_yield * max(farm_size, 0.1)
    # Normalize potential into 0-100 using a soft cap
    # Assume 5,000 units per acre is strong; rescale accordingly
    norm = min(production_potential / (5000.0 * max(farm_size, 0.1)) * 100.0, 100.0)

    # MPESA signals (optional)
    inflows = safe_float(mpesa.get('total_inflows'), 0.0)
    inflow_count = safe_float(mpesa.get('inflow_count'), 0.0)
    outflows = safe_float(mpesa.get('total_outflows'), 0.0)
    net_flow = inflows - outflows
    stability = min((inflow_count / 30.0) * 20.0, 20.0)  # frequent transactions add stability up to +20
    liquidity = min((inflows / 100000.0) * 20.0, 20.0)   # inflow volume adds up to +20
    prudence = 10.0 if net_flow > 0 else 0.0             # positive net flow bonus

    # Revenue influence (cap at +15)
    revenue_boost = min((annual_revenue / 100000.0) * 15.0, 15.0)

    # Weather risk (0..1) reduces score up to -15
    weather_penalty = max(0.0, min(weather_risk, 1.0)) * 15.0

    score = max(35.0, min(norm + stability + liquidity + prudence + revenue_boost - weather_penalty, 95.0))

    # Interest rate heuristic
    if score >= 85:
        rate = 6.5
        risk = 'low'
    elif score >= 65:
        rate = 8.5
        risk = 'medium'
    else:
        rate = 12.0
        risk = 'high'

    # Recommended loan proportional to potential and MPESA liquidity
    base_loan = production_potential * 0.3
    liquidity_boost = min(inflows * 0.1, 2000.0)
    revenue_boost_loan = min(annual_revenue * 0.2, 10000.0)
    recommended_loan = max(500.0, min(base_loan + liquidity_boost + revenue_boost_loan, 25000.0))

    strengths = []
    weaknesses = []
    if expected_yield > 0:
        strengths.append('Favorable regional yield baseline')
    else:
        weaknesses.append('Insufficient regional yield data')
    if inflows > 0:
        strengths.append('Mobile money inflow indicates business activity')
    else:
        weaknesses.append('No mobile money inflow data')
    if net_flow > 0:
        strengths.append('Positive cash flow trend')
    else:
        weaknesses.append('Non-positive net cash flow')

    return {
        'creditScore': round(score, 2),
        'recommendedLoanAmount': round(recommended_loan, 2),
        'interestRate': rate,
        'riskLevel': risk,
        'strengths': strengths or ['Potential for growth'],
        'weaknesses': weaknesses or ['Limited financial history'],
    }
def compute_weather_risk(weather_df, county: str, crop: str) -> float:
    """Return risk factor in [0,1] based on forecast anomalies per county/crop.
    Expected columns: county, crop, drought_risk(0..1), flood_risk(0..1), hail_risk(0..1)
    """
    if weather_df is None:
        return 0.0
    try:
        sub = weather_df.copy()
        c_county = next((c for c in sub.columns if c.lower() == 'county'), None)
        c_crop = next((c for c in sub.columns if 'crop' in c.lower()), None)
        if c_county:
            sub = sub[sub[c_county].astype(str).str.lower() == (county or '').strip().lower()]
        if c_crop:
            sub = sub[sub[c_crop].astype(str).str.lower() == (crop or '').strip().lower()]
        if len(sub) == 0:
            return 0.0
        import numpy as np
        risks = []
        for col in sub.columns:
            if col.lower().endswith('_risk'):
                risks.append(np.nanmean(sub[col].astype(float)))
        if not risks:
            return 0.0
        return float(max(0.0, min(sum(risks) / len(risks), 1.0)))
    except Exception:
        return 0.0



def main():
    try:
        payload = json.loads(sys.stdin.read())
    except Exception as e:
        print(json.dumps({ 'success': False, 'error': f'Invalid JSON input: {e}' }))
        return

    farm = payload.get('farmData', {})
    location = payload.get('locationData', {})
    mpesa = payload.get('mpesaData', {}) or payload.get('mobileMoney', {}) or {}
    financial = payload.get('financialData', {}) or {}

    farm_size = safe_float(farm.get('farmSize'), 0.0)
    crop = (farm.get('farmType') or farm.get('crop') or '').strip()
    county = (location.get('county') or location.get('region') or '').strip()

    # Load datasets and models if available
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    project_root = os.path.abspath(os.path.join(repo_root, '..'))

    csv_path = os.path.join(repo_root, 'data', 'crop_yield_data.csv')
    df = load_csv(csv_path)
    weather_path = os.path.join(repo_root, 'data', 'weather_forecast.csv')
    weather_df = load_csv(weather_path)

    # Optionally use pickle models for post-processing if available
    models_dir = os.path.join(repo_root, 'models')
    credit_model = load_pickle(os.path.join(models_dir, 'best_credit_model.pkl')) or load_pickle(os.path.join(models_dir, 'credit_scoring_system.pkl'))
    feature_names = load_pickle(os.path.join(models_dir, 'feature_names.pkl'))

    features = compute_regional_yield_features(df, county, crop)
    expected_yield_per_acre = features.get('regional_avg_yield_per_acre', 0.0)
    weather_risk = compute_weather_risk(weather_df, county, crop)

    # If a model exists and feature_names are known, try a very light inference pattern
    # This block is kept conservative to avoid breaking if model schema is unknown
    model_score = None
    try:
        if credit_model is not None:
            import numpy as np
            X = []
            cols = feature_names if isinstance(feature_names, list) else []
            # Construct a simple feature vector using agreed names if present
            base = {
                'expected_yield_per_acre': expected_yield_per_acre,
                'farm_size': farm_size,
                'mpesa_inflows': safe_float(mpesa.get('total_inflows'), 0.0),
                'mpesa_outflows': safe_float(mpesa.get('total_outflows'), 0.0),
                'mpesa_inflow_count': safe_float(mpesa.get('inflow_count'), 0.0),
            }
            if cols:
                X = [base.get(c, 0.0) for c in cols]
            else:
                X = list(base.values())
            X = np.array(X, dtype=float).reshape(1, -1)
            # Attempt predict or predict_proba
            if hasattr(credit_model, 'predict_proba'):
                proba = credit_model.predict_proba(X)
                model_score = float(proba[0][-1]) * 100.0
            elif hasattr(credit_model, 'predict'):
                pred = credit_model.predict(X)
                model_score = float(pred[0])
    except Exception:
        model_score = None

    annual_revenue = safe_float(financial.get('annualRevenue'), 0.0)
    signals = score_from_signals(expected_yield_per_acre, farm_size, mpesa, annual_revenue, weather_risk)
    if model_score is not None:
        # Blend model score with heuristic signals (70/30 if model is calibrated 0-100)
        try:
            blended = 0.7 * max(0.0, min(model_score, 100.0)) + 0.3 * signals['creditScore']
            signals['creditScore'] = round(min(100.0, max(0.0, blended)), 2)
        except Exception:
            pass

    result = {
        'success': True,
        'data': {
            'creditAnalysis': {
                **signals,
                'financialReadiness': min(100, round(signals['creditScore'])),
                'regionalAvgYieldPerAcre': expected_yield_per_acre,
                'regionalSamples': features.get('regional_samples', 0),
                'weatherRisk': weather_risk,
                'analysisDate': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
                'usedModelArtifacts': bool(credit_model is not None),
            }
        }
    }

    print(json.dumps(result))


if __name__ == '__main__':
    main()


