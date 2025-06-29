import React, { useState, useEffect } from 'react';
import { insightsAPI, supplierAPI } from '../services/api';
import { LoadingSpinner, ErrorMessage, Card } from '../components/UIComponents';
import { TrendingUp, AlertTriangle, CheckCircle, Target, Users, BarChart3 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const InsightsDashboard = () => {
  const [insights, setInsights] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timePeriod, setTimePeriod] = useState(90);

  useEffect(() => {
    fetchInsights();
  }, [timePeriod]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [insightsData, summaryData] = await Promise.all([
        insightsAPI.getInsights(null, timePeriod),
        insightsAPI.getComplianceSummary()
      ]);
      
      setInsights(insightsData);
      setSummary(summaryData);
    } catch (err) {
      setError(`Failed to fetch insights: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceChartData = () => {
    if (!summary) return null;

    return {
      labels: ['Compliant (≥80)', 'Good (60-79)', 'Needs Attention (<60)'],
      datasets: [
        {
          data: [
            summary.compliant_suppliers,
            summary.total_suppliers - summary.compliant_suppliers - summary.high_risk_suppliers,
            summary.high_risk_suppliers
          ],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderWidth: 0,
        },
      ],
    };
  };

  const getTrendChartData = () => {
    if (!insights?.compliance_trends) return null;

    return {
      labels: ['Compliant Records', 'Non-Compliant Records'],
      datasets: [
        {
          label: 'Records',
          data: [
            insights.compliance_trends.compliant_records || 0,
            insights.compliance_trends.non_compliant_records || 0
          ],
          backgroundColor: ['#10B981', '#EF4444'],
          borderWidth: 1,
          borderColor: ['#059669', '#DC2626'],
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Loading insights..." />
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Compliance Insights Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            AI-generated suggestions for improving supplier compliance and contract terms
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(parseInt(e.target.value))}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Suppliers
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{summary.total_suppliers}</dd>
          </Card>
          
          <Card className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Compliant Suppliers
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">{summary.compliant_suppliers}</dd>
          </Card>
          
          <Card className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              High Risk Suppliers
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">{summary.high_risk_suppliers}</dd>
          </Card>
          
          <Card className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Average Score
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600">{summary.average_compliance_score}</dd>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        {/* Compliance Distribution Chart */}
        {summary && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Supplier Compliance Distribution</h3>
            </div>
            <div className="px-6 py-4">
              <div className="w-full h-64 flex items-center justify-center">
                <Doughnut 
                  data={getComplianceChartData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Compliance Trends Chart */}
        {insights?.compliance_trends && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Compliance Records Analysis</h3>
              <p className="text-sm text-gray-500">Last {timePeriod} days</p>
            </div>
            <div className="px-6 py-4">
              <div className="w-full h-64">
                <Bar 
                  data={getTrendChartData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Overall Compliance Rate: {insights.compliance_trends.overall_compliance_rate}%
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* AI Recommendations */}
      {insights && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* General Recommendations */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                AI Recommendations
              </h3>
            </div>
            <div className="px-6 py-4">
              {insights.recommendations && insights.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {insights.recommendations.slice(0, 8).map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 h-2 w-2 bg-blue-400 rounded-full mt-2 mr-3"></span>
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No recommendations available. Upload more compliance data to get insights.</p>
              )}
            </div>
          </Card>

          {/* Detailed Insights */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
                Detailed Analysis
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Overall Insights */}
              {insights.insights?.overall_insights && (
                <>
                  {insights.insights.overall_insights.compliance_trends && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Compliance Trends</h4>
                      <p className="text-sm text-gray-600">{insights.insights.overall_insights.compliance_trends}</p>
                    </div>
                  )}

                  {insights.insights.overall_insights.common_issues && insights.insights.overall_insights.common_issues.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Common Issues</h4>
                      <ul className="space-y-1">
                        {insights.insights.overall_insights.common_issues.slice(0, 3).map((issue, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <AlertTriangle className="flex-shrink-0 h-3 w-3 text-orange-400 mt-0.5 mr-2" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insights.insights.overall_insights.best_performers && insights.insights.overall_insights.best_performers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Best Performers</h4>
                      <ul className="space-y-1">
                        {insights.insights.overall_insights.best_performers.slice(0, 3).map((performer, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <CheckCircle className="flex-shrink-0 h-3 w-3 text-green-400 mt-0.5 mr-2" />
                            {performer}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insights.insights.overall_insights.at_risk_suppliers && insights.insights.overall_insights.at_risk_suppliers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">At-Risk Suppliers</h4>
                      <ul className="space-y-1">
                        {insights.insights.overall_insights.at_risk_suppliers.slice(0, 3).map((supplier, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <AlertTriangle className="flex-shrink-0 h-3 w-3 text-red-400 mt-0.5 mr-2" />
                            {supplier}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {/* Contract Adjustments */}
              {insights.insights?.contract_adjustments && insights.insights.contract_adjustments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Contract Adjustments</h4>
                  <ul className="space-y-2">
                    {insights.insights.contract_adjustments.slice(0, 2).map((adjustment, index) => (
                      <li key={index} className="text-sm bg-blue-50 p-2 rounded">
                        <span className="font-medium text-blue-900">{adjustment.term}:</span>
                        <span className="text-blue-800 ml-1">{adjustment.suggested_change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Data Summary */}
      {insights?.compliance_trends && (
        <Card className="mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Analysis Summary</h3>
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Analysis Period</dt>
                <dd className="mt-1 text-sm text-gray-900">{insights.compliance_trends.analysis_period_days} days</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Records Analyzed</dt>
                <dd className="mt-1 text-sm text-gray-900">{insights.compliance_trends.total_records_analyzed}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Suppliers Analyzed</dt>
                <dd className="mt-1 text-sm text-gray-900">{insights.compliance_trends.suppliers_analyzed}</dd>
              </div>
            </dl>
          </div>
        </Card>
      )}
    </div>
  );
};

export default InsightsDashboard;
