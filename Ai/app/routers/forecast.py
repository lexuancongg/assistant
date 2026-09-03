from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import traceback

router = APIRouter(prefix="/api/v1/ml", tags=["ml"])

try:
    from prophet import Prophet
    HAS_PROPHET = True
except Exception:
    HAS_PROPHET = False


class SeriesPoint(BaseModel):
    ds: str
    y: float


class ForecastRequest(BaseModel):
    series: List[SeriesPoint]
    horizon_months: int = 6


class ForecastPoint(BaseModel):
    ds: str
    y: float
    lower: Optional[float] = None
    upper: Optional[float] = None


class ForecastResponse(BaseModel):
    history: List[ForecastPoint]
    forecast: List[ForecastPoint]


@router.post('/forecast', response_model=ForecastResponse)
def forecast(req: ForecastRequest):
    try:
        if not req.series:
            raise HTTPException(status_code=400, detail='Empty series')

        series_sorted = sorted(req.series, key=lambda s: s.ds)
        ds_list = [s.ds for s in series_sorted]
        y_list = [s.y for s in series_sorted]
        history = [ForecastPoint(ds=s.ds, y=s.y) for s in series_sorted]

        if HAS_PROPHET:
            try:
                import pandas as pd
                df = pd.DataFrame({'ds': ds_list, 'y': y_list})
                df['ds'] = pd.to_datetime(df['ds'])
                m = Prophet()
                m.fit(df)
                future = m.make_future_dataframe(periods=req.horizon_months, freq='MS')
                fc = m.predict(future)
                forecast_rows = fc.tail(req.horizon_months)
                result = []
                for _, row in forecast_rows.iterrows():
                    ds = row['ds'].strftime('%Y-%m-%d')
                    y = float(row['yhat'])
                    lower = float(row.get('yhat_lower', y * 0.9))
                    upper = float(row.get('yhat_upper', y * 1.1))
                    result.append(ForecastPoint(ds=ds, y=y, lower=lower, upper=upper))
                return ForecastResponse(history=history, forecast=result)
            except Exception:
                traceback.print_exc()

        # fallback OLS
        n = len(y_list)
        x = list(range(n))
        x_mean = sum(x) / n
        y_mean = sum(y_list) / n
        num = sum((xi - x_mean) * (yi - y_mean) for xi, yi in zip(x, y_list))
        den = sum((xi - x_mean) ** 2 for xi in x)
        slope = (num / den) if den != 0 else 0.0
        intercept = y_mean - slope * x_mean

        last_ds = ds_list[-1]
        last_dt = datetime.fromisoformat(last_ds)
        result = []
        for h in range(1, req.horizon_months + 1):
            t = n - 1 + h
            pred = intercept + slope * t
            year = last_dt.year + (last_dt.month - 1 + h) // 12
            month = ((last_dt.month - 1 + h) % 12) + 1
            ds = f"{year:04d}-{month:02d}-01"
            lower = pred * 0.9
            upper = pred * 1.1
            result.append(ForecastPoint(ds=ds, y=pred, lower=lower, upper=upper))

        return ForecastResponse(history=history, forecast=result)

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
