from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from app.database import get_db
from app.models import Supplier as SupplierModel, ComplianceRecord as ComplianceRecordModel
from app.schemas import (
    Supplier, SupplierCreate, SupplierUpdate, SupplierWithRecords,
    WeatherImpactRequest, WeatherImpactResponse
)
from app.weather_service import weather_service

router = APIRouter()

@router.get("/", response_model=List[Supplier])
async def get_suppliers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieve a list of all suppliers
    
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    """
    suppliers = db.query(SupplierModel).offset(skip).limit(limit).all()
    return suppliers

@router.post("/", response_model=Supplier, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db)
):
    """
    Add a new supplier with attributes like name, country, contract_terms, compliance_score, and last_audit
    
    - **name**: Supplier name (must be unique)
    - **country**: Supplier country
    - **contract_terms**: JSON object containing key contract terms
    - **compliance_score**: Integer score from 0-100 (default: 100)
    - **last_audit**: Date of last audit (optional)
    """
    # Check if supplier with same name already exists
    existing_supplier = db.query(SupplierModel).filter(SupplierModel.name == supplier.name).first()
    if existing_supplier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Supplier with name '{supplier.name}' already exists"
        )
    
    # Create new supplier
    db_supplier = SupplierModel(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    
    return db_supplier

@router.get("/{supplier_id}", response_model=SupplierWithRecords)
async def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve a single supplier's compliance details by ID
    
    - **supplier_id**: The ID of the supplier to retrieve
    
    Returns the supplier with all associated compliance records
    """
    supplier = db.query(SupplierModel).filter(SupplierModel.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {supplier_id} not found"
        )
    
    return supplier

@router.put("/{supplier_id}", response_model=Supplier)
async def update_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing supplier
    
    - **supplier_id**: The ID of the supplier to update
    - **supplier_update**: Fields to update (all optional)
    """
    supplier = db.query(SupplierModel).filter(SupplierModel.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {supplier_id} not found"
        )
    
    # Update only provided fields
    update_data = supplier_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)
    
    db.commit()
    db.refresh(supplier)
    
    return supplier

@router.delete("/{supplier_id}")
async def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a supplier and all associated compliance records
    
    - **supplier_id**: The ID of the supplier to delete
    """
    supplier = db.query(SupplierModel).filter(SupplierModel.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {supplier_id} not found"
        )
    
    db.delete(supplier)
    db.commit()
    
    return {"message": f"Supplier {supplier.name} deleted successfully"}

@router.post("/check-weather-impact", response_model=WeatherImpactResponse)
async def check_weather_impact(
    request: WeatherImpactRequest,
    db: Session = Depends(get_db)
):
    """
    Check weather impact on supplier delivery and update compliance records if adverse weather is found
    
    - **supplier_id**: ID of the supplier
    - **compliance_record_id**: Specific compliance record to check (optional)
    - **lat**: Latitude for weather check (optional, will use supplier country if not provided)
    - **lon**: Longitude for weather check (optional, will use supplier country if not provided)
    - **delivery_date**: Date of delivery in YYYY-MM-DD format
    """
    # Verify supplier exists
    supplier = db.query(SupplierModel).filter(SupplierModel.id == request.supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {request.supplier_id} not found"
        )
    
    # Get coordinates
    lat, lon = request.lat, request.lon
    if lat is None or lon is None:
        coordinates = weather_service.get_coordinates_from_country(supplier.country)
        if coordinates:
            lat, lon = coordinates
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not determine coordinates for supplier country '{supplier.country}'. Please provide lat/lon."
            )
    
    # Validate delivery date
    try:
        delivery_date = datetime.strptime(request.delivery_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid delivery_date format. Use YYYY-MM-DD."
        )
    
    # Get weather data for the delivery date
    weather_data = weather_service.get_historical_weather(lat, lon, request.delivery_date)
    if not weather_data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve weather data. Please try again later."
        )
    
    # Analyze weather for adverse conditions
    weather_analysis = weather_service.analyze_adverse_weather(weather_data)
    
    # Find compliance records to potentially update
    updated_records = []
    
    if request.compliance_record_id:
        # Check specific compliance record
        record = db.query(ComplianceRecordModel).filter(
            ComplianceRecordModel.id == request.compliance_record_id,
            ComplianceRecordModel.supplier_id == request.supplier_id
        ).first()
        
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compliance record with ID {request.compliance_record_id} not found for supplier {request.supplier_id}"
            )
        
        if weather_analysis["has_adverse_weather"] and record.status == "non-compliant":
            record.status = "excused-weather"
            record.weather_data = weather_analysis
            record.weather_justification = weather_analysis["justification"]
            updated_records.append(record)
    else:
        # Check all non-compliant records for the delivery date
        records = db.query(ComplianceRecordModel).filter(
            ComplianceRecordModel.supplier_id == request.supplier_id,
            ComplianceRecordModel.date_recorded == delivery_date,
            ComplianceRecordModel.status == "non-compliant"
        ).all()
        
        if weather_analysis["has_adverse_weather"]:
            for record in records:
                record.status = "excused-weather"
                record.weather_data = weather_analysis
                record.weather_justification = weather_analysis["justification"]
                updated_records.append(record)
    
    # Commit changes
    if updated_records:
        db.commit()
        for record in updated_records:
            db.refresh(record)
    
    return WeatherImpactResponse(
        supplier_id=request.supplier_id,
        compliance_record_id=request.compliance_record_id,
        weather_analysis=weather_analysis,
        justification=weather_analysis["justification"],
        status_updated=len(updated_records) > 0,
        updated_records=updated_records
    )
