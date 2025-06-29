from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Optional
from datetime import datetime, date, timedelta
from app.database import get_db
from app.models import Supplier as SupplierModel, ComplianceRecord as ComplianceRecordModel
from app.schemas import InsightRequest, InsightResponse
from app.ai_service import gemini_service

router = APIRouter()

@router.get("/insights", response_model=InsightResponse)
async def get_insights(
    supplier_id: Optional[int] = None,
    time_period_days: int = 90,
    db: Session = Depends(get_db)
):
    """
    Get AI-generated suggestions on improving compliance and adjusting contract terms
    based on compliance history.
    
    - **supplier_id**: Specific supplier ID for targeted insights (optional)
    - **time_period_days**: Time period for analysis in days (default: 90)
    
    Gemini generates recommendations for:
    - Improving supplier compliance
    - Adjusting contract terms
    - Adding penalties for non-compliance
    - Recommending alternative suppliers if issues persist
    """
    try:
        # Calculate date range for analysis
        end_date = date.today()
        start_date = end_date - timedelta(days=time_period_days)
        
        # Prepare data for AI analysis
        suppliers_data = []
        
        if supplier_id:
            # Analysis for specific supplier
            supplier = db.query(SupplierModel).filter(SupplierModel.id == supplier_id).first()
            if not supplier:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Supplier with ID {supplier_id} not found"
                )
            
            # Get compliance records for the supplier
            compliance_records = db.query(ComplianceRecordModel).filter(
                and_(
                    ComplianceRecordModel.supplier_id == supplier_id,
                    ComplianceRecordModel.date_recorded >= start_date
                )
            ).order_by(desc(ComplianceRecordModel.date_recorded)).all()
            
            suppliers_data.append({
                "supplier_id": supplier.id,
                "name": supplier.name,
                "country": supplier.country,
                "contract_terms": supplier.contract_terms,
                "compliance_score": supplier.compliance_score,
                "last_audit": supplier.last_audit.isoformat() if supplier.last_audit else None,
                "compliance_records": [
                    {
                        "metric": record.metric,
                        "date_recorded": record.date_recorded.isoformat(),
                        "result": record.result,
                        "expected_value": record.expected_value,
                        "status": record.status,
                        "ai_analysis": record.ai_analysis
                    }
                    for record in compliance_records
                ]
            })
        else:
            # Analysis for all suppliers
            suppliers = db.query(SupplierModel).all()
            
            for supplier in suppliers:
                # Get recent compliance records for each supplier
                compliance_records = db.query(ComplianceRecordModel).filter(
                    and_(
                        ComplianceRecordModel.supplier_id == supplier.id,
                        ComplianceRecordModel.date_recorded >= start_date
                    )
                ).order_by(desc(ComplianceRecordModel.date_recorded)).limit(20).all()
                
                suppliers_data.append({
                    "supplier_id": supplier.id,
                    "name": supplier.name,
                    "country": supplier.country,
                    "contract_terms": supplier.contract_terms,
                    "compliance_score": supplier.compliance_score,
                    "last_audit": supplier.last_audit.isoformat() if supplier.last_audit else None,
                    "compliance_records": [
                        {
                            "metric": record.metric,
                            "date_recorded": record.date_recorded.isoformat(),
                            "result": record.result,
                            "expected_value": record.expected_value,
                            "status": record.status,
                            "ai_analysis": record.ai_analysis
                        }
                        for record in compliance_records
                    ]
                })
        
        # Get AI-generated insights
        ai_insights = await gemini_service.generate_improvement_insights(suppliers_data)
        
        # Extract recommendations from AI response
        recommendations = []
        if "recommendations" in ai_insights:
            for rec in ai_insights["recommendations"]:
                recommendations.append(f"{rec.get('category', 'General')}: {rec.get('suggestion', 'No suggestion')}")
        
        # Add contract adjustment recommendations
        if "contract_adjustments" in ai_insights:
            for adj in ai_insights["contract_adjustments"]:
                recommendations.append(f"Contract Adjustment - {adj.get('term', 'Unknown')}: {adj.get('suggested_change', 'No change suggested')}")
        
        # Add supplier-specific action recommendations
        if "supplier_specific_actions" in ai_insights:
            for action in ai_insights["supplier_specific_actions"]:
                supplier_name = action.get('supplier_name', 'Unknown')
                actions = action.get('actions', [])
                timeline = action.get('timeline', 'No timeline specified')
                recommendations.append(f"{supplier_name} Actions: {'; '.join(actions)} (Timeline: {timeline})")
        
        # Calculate compliance trends
        compliance_trends = {}
        if suppliers_data:
            # Calculate overall compliance trend
            total_records = sum(len(s["compliance_records"]) for s in suppliers_data)
            compliant_records = sum(
                sum(1 for r in s["compliance_records"] if r["status"] == "compliant")
                for s in suppliers_data
            )
            
            compliance_rate = (compliant_records / total_records * 100) if total_records > 0 else 0
            
            compliance_trends = {
                "overall_compliance_rate": round(compliance_rate, 2),
                "total_records_analyzed": total_records,
                "compliant_records": compliant_records,
                "non_compliant_records": total_records - compliant_records,
                "analysis_period_days": time_period_days,
                "suppliers_analyzed": len(suppliers_data)
            }
            
            # Add trend analysis from AI
            if "overall_insights" in ai_insights:
                compliance_trends.update(ai_insights["overall_insights"])
        
        return InsightResponse(
            insights=ai_insights,
            recommendations=recommendations,
            compliance_trends=compliance_trends
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating insights: {str(e)}"
        )

@router.get("/compliance-summary")
async def get_compliance_summary(
    db: Session = Depends(get_db)
):
    """
    Get a summary of overall compliance metrics across all suppliers
    """
    try:
        # Get all suppliers
        suppliers = db.query(SupplierModel).all()
        
        # Calculate summary metrics
        total_suppliers = len(suppliers)
        if total_suppliers == 0:
            return {
                "total_suppliers": 0,
                "average_compliance_score": 0,
                "high_risk_suppliers": 0,
                "compliant_suppliers": 0,
                "summary": "No suppliers found"
            }
        
        # Calculate compliance metrics
        compliance_scores = [s.compliance_score for s in suppliers if s.compliance_score is not None]
        average_score = sum(compliance_scores) / len(compliance_scores) if compliance_scores else 0
        
        high_risk_suppliers = len([s for s in suppliers if s.compliance_score < 60])
        compliant_suppliers = len([s for s in suppliers if s.compliance_score >= 80])
        
        # Get recent compliance records (last 30 days)
        thirty_days_ago = date.today() - timedelta(days=30)
        recent_records = db.query(ComplianceRecordModel).filter(
            ComplianceRecordModel.date_recorded >= thirty_days_ago
        ).all()
        
        recent_compliant = len([r for r in recent_records if r.status == "compliant"])
        recent_total = len(recent_records)
        recent_compliance_rate = (recent_compliant / recent_total * 100) if recent_total > 0 else 0
        
        return {
            "total_suppliers": total_suppliers,
            "average_compliance_score": round(average_score, 2),
            "high_risk_suppliers": high_risk_suppliers,
            "compliant_suppliers": compliant_suppliers,
            "recent_compliance_rate": round(recent_compliance_rate, 2),
            "recent_records_count": recent_total,
            "summary": f"{compliant_suppliers} out of {total_suppliers} suppliers are compliant (≥80 score)"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating compliance summary: {str(e)}"
        )
