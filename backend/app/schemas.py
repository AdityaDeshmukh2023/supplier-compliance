from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, Dict, Any, List

# Supplier schemas
class SupplierBase(BaseModel):
    """Base supplier schema"""
    name: str = Field(..., description="Supplier name")
    country: str = Field(..., description="Supplier country")
    contract_terms: Optional[Dict[str, Any]] = Field(None, description="Contract terms as JSON")
    compliance_score: Optional[int] = Field(100, description="Compliance score (0-100)")
    last_audit: Optional[date] = Field(None, description="Last audit date")

class SupplierCreate(SupplierBase):
    """Schema for creating a supplier"""
    pass

class SupplierUpdate(BaseModel):
    """Schema for updating a supplier"""
    name: Optional[str] = None
    country: Optional[str] = None
    contract_terms: Optional[Dict[str, Any]] = None
    compliance_score: Optional[int] = None
    last_audit: Optional[date] = None

class Supplier(SupplierBase):
    """Schema for supplier response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Compliance Record schemas
class ComplianceRecordBase(BaseModel):
    """Base compliance record schema"""
    metric: str = Field(..., description="Compliance metric (e.g., delivery_time, quality)")
    date_recorded: date = Field(..., description="Date when metric was recorded")
    result: float = Field(..., description="Actual result value")
    expected_value: Optional[float] = Field(None, description="Expected/contracted value")
    status: str = Field(..., description="Compliance status (compliant/non-compliant/excused-weather)")

class ComplianceRecordCreate(ComplianceRecordBase):
    """Schema for creating a compliance record"""
    supplier_id: int = Field(..., description="ID of the supplier")

class ComplianceRecord(ComplianceRecordBase):
    """Schema for compliance record response"""
    id: int
    supplier_id: int
    ai_analysis: Optional[Dict[str, Any]] = None
    weather_data: Optional[Dict[str, Any]] = None
    weather_justification: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Compliance Check schemas
class ComplianceCheckRequest(BaseModel):
    """Schema for compliance check request"""
    supplier_id: int = Field(..., description="ID of the supplier")
    compliance_data: List[ComplianceRecordBase] = Field(..., description="List of compliance records to check")

class ComplianceCheckResponse(BaseModel):
    """Schema for compliance check response"""
    supplier_id: int
    compliance_records: List[ComplianceRecord]
    ai_analysis: Dict[str, Any]
    updated_compliance_score: int

# Insights schemas
class InsightRequest(BaseModel):
    """Schema for insight request"""
    supplier_id: Optional[int] = Field(None, description="Specific supplier ID (optional)")
    time_period_days: Optional[int] = Field(90, description="Time period for analysis in days")

class InsightResponse(BaseModel):
    """Schema for insight response"""
    insights: Dict[str, Any]
    recommendations: List[str]
    compliance_trends: Dict[str, Any]

# Supplier with compliance records
class SupplierWithRecords(Supplier):
    """Schema for supplier with compliance records"""
    compliance_records: List[ComplianceRecord] = []

# Error response schema
class ErrorResponse(BaseModel):
    """Schema for error responses"""
    detail: str
    error_code: Optional[str] = None

# Weather impact schemas
class WeatherImpactRequest(BaseModel):
    """Schema for weather impact check request"""
    supplier_id: int = Field(..., description="ID of the supplier")
    compliance_record_id: Optional[int] = Field(None, description="Specific compliance record ID to check (optional)")
    lat: Optional[float] = Field(None, description="Latitude for weather check")
    lon: Optional[float] = Field(None, description="Longitude for weather check")
    delivery_date: str = Field(..., description="Delivery date in YYYY-MM-DD format")

class WeatherImpactResponse(BaseModel):
    """Schema for weather impact check response"""
    supplier_id: int
    compliance_record_id: Optional[int] = None
    weather_analysis: Dict[str, Any]
    justification: str
    status_updated: bool
    updated_records: List[ComplianceRecord] = []
