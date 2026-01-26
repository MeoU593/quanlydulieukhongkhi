# Air Quality Backend

## Setup

1. Activate conda environment:
```bash
conda activate kk
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Create `.env` file (copy from `.env.example` and modify if needed)

4. Initialize database:
```bash
python scripts/init_db.py
```

5. Run server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## Endpoints

- `GET /v1/regions` - List all regions
- `GET /v1/pollutants` - List all pollutants
- `GET /v1/layers` - List layers (with filters: region_id, pollutant_code, year, period_type)
