from sqlalchemy import Column, Integer, String, Float, Date, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Supplier(Base):
    """Supplier model for storing supplier information"""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    country = Column(String, nullable=False)
    contract_terms = Column(JSON, nullable=True)  # Dictionary of key contract terms
    compliance_score = Column(Integer, default=100)  # Score out of 100
    last_audit = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship with compliance records
    compliance_records = relationship("ComplianceRecord", back_populates="supplier")

class ComplianceRecord(Base):
    """Compliance record model for storing compliance data"""
    __tablename__ = "compliance_records"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    metric = Column(String, nullable=False)  # e.g., 'delivery_time', 'quality'
    date_recorded = Column(Date, nullable=False)
    result = Column(Float, nullable=False)  # Actual result value
    expected_value = Column(Float, nullable=True)  # Expected/contracted value
    status = Column(String, nullable=False)  # 'compliant', 'non-compliant', 'excused-weather'
    ai_analysis = Column(JSON, nullable=True)  # AI-generated analysis
    weather_data = Column(JSON, nullable=True)  # Weather impact analysis
    weather_justification = Column(String, nullable=True)  # Weather delay justification
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship with supplier
    supplier = relationship("Supplier", back_populates="compliance_records")
