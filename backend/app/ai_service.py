import google.generativeai as genai
import os
import json
from typing import Dict, Any, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GeminiService:
    """Service for integrating with Google Gemini AI"""
    
    def __init__(self):
        """Initialize Gemini service with API key"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
    async def analyze_compliance_data(self, supplier_name: str, compliance_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze compliance data using Gemini AI
        
        Args:
            supplier_name: Name of the supplier
            compliance_records: List of compliance records
            
        Returns:
            Dictionary containing AI analysis results
        """
        try:
            # Prepare the prompt for compliance analysis
            prompt = f"""
            Analyze the following supplier compliance data for {supplier_name}:
            
            Compliance Records:
            {json.dumps(compliance_records, indent=2, default=str)}
            
            Please provide a comprehensive analysis in JSON format with the following structure:
            {{
                "compliance_patterns": [list of identified patterns],
                "non_compliance_categories": [list of categorized issues],
                "risk_assessment": "low/medium/high",
                "key_issues": [list of main compliance issues],
                "compliance_score_suggestion": numeric_score_0_to_100,
                "summary": "brief summary of overall compliance status"
            }}
            
            Focus on:
            1. Identifying patterns in non-compliance (e.g., frequent delivery delays, quality issues)
            2. Categorizing compliance issues by type
            3. Assessing overall risk level
            4. Suggesting an appropriate compliance score
            
            Return only valid JSON.
            """
            
            response = self.model.generate_content(prompt)
            
            # Parse the JSON response
            try:
                analysis = json.loads(response.text)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                analysis = {
                    "compliance_patterns": ["Unable to parse detailed patterns"],
                    "non_compliance_categories": ["Analysis error"],
                    "risk_assessment": "medium",
                    "key_issues": ["Data analysis incomplete"],
                    "compliance_score_suggestion": 70,
                    "summary": "Analysis could not be completed due to parsing error"
                }
            
            return analysis
            
        except Exception as e:
            # Return a fallback analysis if API call fails
            return {
                "compliance_patterns": ["API analysis unavailable"],
                "non_compliance_categories": ["Service error"],
                "risk_assessment": "unknown",
                "key_issues": [f"AI analysis failed: {str(e)}"],
                "compliance_score_suggestion": 70,
                "summary": "AI analysis temporarily unavailable"
            }
    
    async def generate_improvement_insights(self, suppliers_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate improvement insights for supplier compliance
        
        Args:
            suppliers_data: List of supplier data with compliance records
            
        Returns:
            Dictionary containing improvement insights and recommendations
        """
        try:
            prompt = f"""
            Based on the following supplier compliance data, generate actionable insights and recommendations:
            
            Suppliers Data:
            {json.dumps(suppliers_data, indent=2, default=str)}
            
            Please provide comprehensive insights in JSON format with the following structure:
            {{
                "overall_insights": {{
                    "compliance_trends": "description of trends",
                    "common_issues": [list of common issues across suppliers],
                    "best_performers": [list of best performing suppliers],
                    "at_risk_suppliers": [list of suppliers at risk]
                }},
                "recommendations": [
                    {{
                        "category": "contract_terms",
                        "suggestion": "specific recommendation",
                        "priority": "high/medium/low",
                        "impact": "description of expected impact"
                    }}
                ],
                "contract_adjustments": [
                    {{
                        "term": "specific contract term",
                        "current_issue": "description of issue",
                        "suggested_change": "recommended change",
                        "rationale": "reason for change"
                    }}
                ],
                "supplier_specific_actions": [
                    {{
                        "supplier_name": "name",
                        "actions": [list of specific actions],
                        "timeline": "suggested timeline"
                    }}
                ]
            }}
            
            Focus on:
            1. Identifying trends across all suppliers
            2. Recommending contract term adjustments
            3. Suggesting specific actions for underperforming suppliers
            4. Prioritizing recommendations by impact and urgency
            
            Return only valid JSON.
            """
            
            response = self.model.generate_content(prompt)
            
            try:
                insights = json.loads(response.text)
            except json.JSONDecodeError:
                # Fallback insights
                insights = {
                    "overall_insights": {
                        "compliance_trends": "Unable to analyze trends",
                        "common_issues": ["Data parsing error"],
                        "best_performers": [],
                        "at_risk_suppliers": []
                    },
                    "recommendations": [
                        {
                            "category": "system",
                            "suggestion": "Review data collection process",
                            "priority": "medium",
                            "impact": "Improved analysis accuracy"
                        }
                    ],
                    "contract_adjustments": [],
                    "supplier_specific_actions": []
                }
            
            return insights
            
        except Exception as e:
            # Return fallback insights if API call fails
            return {
                "overall_insights": {
                    "compliance_trends": "Analysis temporarily unavailable",
                    "common_issues": [f"Service error: {str(e)}"],
                    "best_performers": [],
                    "at_risk_suppliers": []
                },
                "recommendations": [
                    {
                        "category": "system",
                        "suggestion": "AI service connection issue - please try again later",
                        "priority": "high",
                        "impact": "Restore AI insights functionality"
                    }
                ],
                "contract_adjustments": [],
                "supplier_specific_actions": []
            }

# Create a global instance
gemini_service = GeminiService()
