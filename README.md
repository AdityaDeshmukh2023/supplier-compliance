# Supplier Compliance Monitor & Insights Dashboard

A comprehensive platform for tracking supplier compliance with contract terms, featuring AI-powered insights for improving supplier relationships.

## Features

### Backend (FastAPI + PostgreSQL + Gemini AI)
- **Supplier Management**: Complete CRUD operations for suppliers
- **Compliance Tracking**: Upload and analyze compliance data
- **AI Integration**: Gemini AI analyzes compliance patterns and provides insights
- **Weather Integration**: OpenWeatherMap API for delivery delay justification
- **REST API**: Auto-generated OpenAPI documentation
- **Database**: PostgreSQL with Alembic migrations

### Frontend (React.js)
- **Homepage**: Attractive landing page with user guide
- **Supplier List View**: Overview of all suppliers with compliance scores
- **Supplier Detail View**: Detailed compliance information and records
- **Compliance Upload**: Form to upload compliance data with AI analysis
- **Insights Dashboard**: AI-generated recommendations and trend visualization
- **Weather Impact**: Historical weather analysis for delivery justification
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Robust relational database
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migration tool
- **Google Gemini AI**: AI analysis and insights
- **OpenWeatherMap API**: Historical weather data
- **Pydantic**: Data validation and serialization
- **Uvicorn**: ASGI server

### Frontend
- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js**: Data visualization
- **React Hook Form**: Form handling
- **Axios**: HTTP client
- **Lucide React**: Icon library

## Project Structure

```
Assignment-fullstack/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── database.py          # Database configuration
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── ai_service.py        # Gemini AI integration
│   │   └── routers/
│   │       ├── suppliers.py     # Supplier endpoints
│   │       ├── compliance.py    # Compliance endpoints
│   │       └── insights.py      # Insights endpoints
│   ├── alembic/                 # Database migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   └── App.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Assignment-fullstack
   ```

2. **Set up environment variables:**
   ```bash
   # Backend environment variables are already configured in docker-compose.yml
   # Update the Gemini API key if needed
   ```

3. **Start all services:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Setup

#### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL database:**
   ```bash
   # Create database: supplier_compliance_db
   # Update .env file with your database credentials
   ```

5. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Start the backend:**
   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend:**
   ```bash
   npm start
   ```

## API Endpoints

### Suppliers
- `GET /suppliers` - Get all suppliers
- `POST /suppliers` - Create new supplier
- `GET /suppliers/{id}` - Get supplier by ID
- `PUT /suppliers/{id}` - Update supplier
- `DELETE /suppliers/{id}` - Delete supplier

### Compliance
- `POST /suppliers/check-compliance` - Upload and analyze compliance data
- `GET /suppliers/{id}/compliance-records` - Get compliance records
- `POST /suppliers/{id}/compliance-record` - Create single compliance record

### Insights
- `GET /suppliers/insights` - Get AI-generated insights
- `GET /suppliers/compliance-summary` - Get overall compliance summary

## Database Schema

### Suppliers Table
- `id` (Primary Key)
- `name` (Unique)
- `country`
- `contract_terms` (JSON)
- `compliance_score` (0-100)
- `last_audit` (Date)
- `created_at`, `updated_at`

### Compliance Records Table
- `id` (Primary Key)
- `supplier_id` (Foreign Key)
- `metric` (e.g., delivery_time, quality)
- `date_recorded`
- `result` (Actual value)
- `expected_value` (Target value)
- `status` (compliant/non-compliant)
- `ai_analysis` (JSON)
- `created_at`

## AI Integration

The system uses Google Gemini AI to:

1. **Analyze Compliance Patterns**: Identify trends in non-compliance
2. **Categorize Issues**: Group compliance problems by type
3. **Generate Insights**: Provide actionable recommendations
4. **Risk Assessment**: Evaluate supplier risk levels
5. **Contract Recommendations**: Suggest contract term adjustments

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@localhost:5432/supplier_compliance_db
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_secret_key
ALGORITHM=HS256
```

### Frontend
```
REACT_APP_API_URL=http://localhost:8000
```

## Features in Detail

### Supplier Management
- Add suppliers with contract terms
- View supplier compliance scores
- Track audit dates and compliance history

### Compliance Monitoring
- Upload multiple compliance records
- Automatic status determination
- Real-time AI analysis of compliance data

### AI-Powered Insights
- Pattern recognition in compliance data
- Risk assessment for suppliers
- Actionable recommendations for improvement
- Contract term optimization suggestions

### Dashboard Analytics
- Compliance score distribution
- Trend analysis over time
- Performance metrics and KPIs

## Development

### Adding New Features

1. **Backend**: Add new endpoints in `app/routers/`
2. **Frontend**: Create new pages in `src/pages/`
3. **Database**: Create Alembic migrations for schema changes

### Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality

- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript
- Add type hints for Python functions
- Document API endpoints with FastAPI docstrings

## Deployment

### Production Deployment

1. **Update environment variables** for production
2. **Set up SSL certificates** for HTTPS
3. **Configure reverse proxy** (Nginx recommended)
4. **Set up monitoring** and logging
5. **Configure database backups**

### Scaling Considerations

- Use Redis for caching
- Implement rate limiting
- Add database read replicas
- Use CDN for static assets

## Troubleshooting

### Common Issues

1. **Database Connection**: Check PostgreSQL service and credentials
2. **API Key**: Verify Gemini AI API key is valid
3. **CORS Issues**: Ensure frontend URL is in CORS origins
4. **Port Conflicts**: Change ports in docker-compose.yml if needed

### Logs

- Backend logs: Check FastAPI console output
- Frontend logs: Check browser console
- Database logs: Check PostgreSQL logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the API documentation at `/docs`
- Review the console logs
- Check database connectivity
- Verify environment variables
