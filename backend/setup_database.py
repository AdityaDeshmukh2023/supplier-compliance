#!/usr/bin/env python3
"""
Setup script to initialize the database with sample data
"""

import asyncio
import os
from datetime import date, timedelta
from app.database import engine, SessionLocal
from app.models import Base, Supplier, ComplianceRecord
import random

# Sample suppliers data
SAMPLE_SUPPLIERS = [
    {
        "name": "TechCorp Solutions",
        "country": "United States",
        "contract_terms": {
            "delivery_time": "5 days",
            "quality_standard": "99.5%",
            "discount_rate": "2%",
            "payment_terms": "Net 30",
            "coordinates": {"lat": 40.7128, "lon": -74.0060}  # New York
        },
        "compliance_score": 85,
        "last_audit": date(2024, 11, 15)
    },
    {
        "name": "Global Manufacturing Ltd",
        "country": "Germany",
        "contract_terms": {
            "delivery_time": "7 days",
            "quality_standard": "98%",
            "discount_rate": "3%",
            "payment_terms": "Net 45",
            "coordinates": {"lat": 52.5200, "lon": 13.4050}  # Berlin
        },
        "compliance_score": 72,
        "last_audit": date(2024, 10, 20)
    },
    {
        "name": "Asia Pacific Suppliers",
        "country": "Singapore",
        "contract_terms": {
            "delivery_time": "10 days",
            "quality_standard": "97%",
            "discount_rate": "4%",
            "payment_terms": "Net 60",
            "coordinates": {"lat": 1.3521, "lon": 103.8198}  # Singapore
        },
        "compliance_score": 55,
        "last_audit": date(2024, 9, 5)
    },
    {
        "name": "European Electronics",
        "country": "Netherlands",
        "contract_terms": {
            "delivery_time": "3 days",
            "quality_standard": "99.8%",
            "discount_rate": "1.5%",
            "payment_terms": "Net 15",
            "coordinates": {"lat": 52.3676, "lon": 4.9041}  # Amsterdam
        },
        "compliance_score": 92,
        "last_audit": date(2024, 12, 1)
    },
    {
        "name": "South American Textiles",
        "country": "Brazil",
        "contract_terms": {
            "delivery_time": "14 days",
            "quality_standard": "95%",
            "discount_rate": "5%",
            "payment_terms": "Net 90",
            "coordinates": {"lat": -23.5505, "lon": -46.6333}  # São Paulo
        },
        "compliance_score": 45,
        "last_audit": date(2024, 8, 12)
    }
]

def create_sample_compliance_records(supplier_id, db):
    """Create sample compliance records for a supplier"""
    metrics = ["delivery_time", "quality_score", "on_time_delivery", "defect_rate"]
    
    records = []
    for i in range(10):  # Create 10 records per supplier
        metric = random.choice(metrics)
        date_recorded = date.today() - timedelta(days=random.randint(1, 90))
        
        if metric == "delivery_time":
            result = random.uniform(3, 15)
            expected_value = random.uniform(5, 10)
            status = "compliant" if result <= expected_value else "non-compliant"
        elif metric == "quality_score":
            result = random.uniform(85, 100)
            expected_value = random.uniform(95, 99)
            status = "compliant" if result >= expected_value else "non-compliant"
        elif metric == "on_time_delivery":
            result = random.uniform(70, 100)
            expected_value = 95
            status = "compliant" if result >= expected_value else "non-compliant"
        else:  # defect_rate
            result = random.uniform(0, 10)
            expected_value = random.uniform(1, 5)
            status = "compliant" if result <= expected_value else "non-compliant"
        
        record = ComplianceRecord(
            supplier_id=supplier_id,
            metric=metric,
            date_recorded=date_recorded,
            result=result,
            expected_value=expected_value,
            status=status
        )
        records.append(record)
    
    return records

def setup_database():
    """Initialize database with sample data"""
    print("Setting up database...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_suppliers = db.query(Supplier).count()
        if existing_suppliers > 0:
            print(f"Database already has {existing_suppliers} suppliers. Skipping sample data creation.")
            return
        
        # Create sample suppliers
        created_suppliers = []
        for supplier_data in SAMPLE_SUPPLIERS:
            supplier = Supplier(**supplier_data)
            db.add(supplier)
            db.flush()  # Get the ID without committing
            created_suppliers.append(supplier)
            print(f"✓ Created supplier: {supplier.name}")
        
        # Create sample compliance records
        for supplier in created_suppliers:
            records = create_sample_compliance_records(supplier.id, db)
            db.add_all(records)
            print(f"✓ Created {len(records)} compliance records for {supplier.name}")
        
        # Commit all changes
        db.commit()
        print("✓ Sample data created successfully")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error creating sample data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    setup_database()
    print("\nDatabase setup complete! You can now start the application.")
    print("Run: uvicorn app.main:app --reload")
