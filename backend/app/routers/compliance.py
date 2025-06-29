from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime, date
from app.database import get_db
from app.models import Supplier as SupplierModel, ComplianceRecord as ComplianceRecordModel
from app.schemas import (
    ComplianceRecord, 
    ComplianceRecordCreate, 
    ComplianceCheckRequest, 
    ComplianceCheckResponse
)
from app.ai_service import gemini_service

router = APIRouter()

@router.post("/check-compliance", response_model=ComplianceCheckResponse)
async def check_compliance(
    compliance_request: ComplianceCheckRequest,
    db: Session = Depends(get_db)
):
    """
    Upload and check compliance data for a supplier.
    Gemini AI is used to assess patterns in compliance issues.
    
    - **supplier_id**: ID of the supplier
    - **compliance_data**: List of compliance records to analyze
    
    The AI analyzes patterns like frequent late deliveries, inconsistent quality, etc.
    """
    # Verify supplier exists
    supplier = db.query(SupplierModel).filter(SupplierModel.id == compliance_request.supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {compliance_request.supplier_id} not found"
        )
    
    created_records = []
    compliance_data_for_ai = []
    
    try:
        # Process each compliance record
        for record_data in compliance_request.compliance_data:
            # Determine compliance status based on expected vs actual values
            if record_data.expected_value is not None:
                if record_data.metric.lower() in ['delivery_time', 'lead_time']:
                    # For delivery time, lower is better
                    status_value = "compliant" if record_data.result <= record_data.expected_value else "non-compliant"
                elif record_data.metric.lower() in ['quality_score', 'quality_rating']:
                    # For quality, higher is better
                    status_value = "compliant" if record_data.result >= record_data.expected_value else "non-compliant"
                else:
                    # Use provided status or default logic
                    status_value = record_data.status
            else:
                status_value = record_data.status
            
            # Create compliance record
            db_record = ComplianceRecordModel(
                supplier_id=compliance_request.supplier_id,
                metric=record_data.metric,
                date_recorded=record_data.date_recorded,
                result=record_data.result,
                expected_value=record_data.expected_value,
                status=status_value
            )
            
            db.add(db_record)
            created_records.append(db_record)
            
            # Prepare data for AI analysis
            compliance_data_for_ai.append({
                "metric": record_data.metric,
                "date_recorded": record_data.date_recorded.isoformat(),
                "result": record_data.result,
                "expected_value": record_data.expected_value,
                "status": status_value
            })
        
        # Get historical compliance data for better analysis
        historical_records = db.query(ComplianceRecordModel).filter(
            ComplianceRecordModel.supplier_id == compliance_request.supplier_id
        ).order_by(desc(ComplianceRecordModel.date_recorded)).limit(50).all()
        
        # Add historical data to AI analysis
        for record in historical_records:
            compliance_data_for_ai.append({
                "metric": record.metric,
                "date_recorded": record.date_recorded.isoformat(),
                "result": record.result,
                "expected_value": record.expected_value,
                "status": record.status
            })
        
        # Get AI analysis
        ai_analysis = await gemini_service.analyze_compliance_data(
            supplier_name=supplier.name,
            compliance_records=compliance_data_for_ai
        )
        
        # Update compliance records with AI analysis
        for record in created_records:
            record.ai_analysis = ai_analysis
        
        # Calculate updated compliance score based on AI suggestion
        suggested_score = ai_analysis.get("compliance_score_suggestion", supplier.compliance_score)
        supplier.compliance_score = max(0, min(100, suggested_score))  # Ensure score is between 0-100
        
        # Commit all changes
        db.commit()
        
        # Refresh records to get IDs
        for record in created_records:
            db.refresh(record)
        
        db.refresh(supplier)
        
        return ComplianceCheckResponse(
            supplier_id=compliance_request.supplier_id,
            compliance_records=created_records,
            ai_analysis=ai_analysis,
            updated_compliance_score=supplier.compliance_score
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing compliance data: {str(e)}"
        )

@router.get("/{supplier_id}/compliance-records", response_model=List[ComplianceRecord])
async def get_supplier_compliance_records(
    supplier_id: int,
    skip: int = 0,
    limit: int = 100,
    metric: str = None,
    db: Session = Depends(get_db)
):
    """
    Get compliance records for a specific supplier
    
    - **supplier_id**: ID of the supplier
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    - **metric**: Filter by specific metric (optional)
    """
    # Verify supplier exists
    supplier = db.query(SupplierModel).filter(SupplierModel.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {supplier_id} not found"
        )
    
    query = db.query(ComplianceRecordModel).filter(ComplianceRecordModel.supplier_id == supplier_id)
    
    if metric:
        query = query.filter(ComplianceRecordModel.metric == metric)
    
    records = query.order_by(desc(ComplianceRecordModel.date_recorded)).offset(skip).limit(limit).all()
    
    return records

@router.post("/{supplier_id}/compliance-record", response_model=ComplianceRecord)
async def create_compliance_record(
    supplier_id: int,
    record: ComplianceRecordCreate,
    db: Session = Depends(get_db)
):
    """
    Create a single compliance record for a supplier
    
    - **supplier_id**: ID of the supplier
    - **record**: Compliance record data
    """
    # Verify supplier exists
    supplier = db.query(SupplierModel).filter(SupplierModel.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {supplier_id} not found"
        )
    
    # Override supplier_id from URL
    record.supplier_id = supplier_id
    
    db_record = ComplianceRecordModel(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    return db_record
