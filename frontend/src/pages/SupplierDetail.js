import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supplierAPI, complianceAPI } from '../services/api';
import { LoadingSpinner, ComplianceScoreBadge, StatusBadge, ErrorMessage, Card } from '../components/UIComponents';
import { ArrowLeft, MapPin, Calendar, FileText, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const SupplierDetail = () => {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [complianceRecords, setComplianceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchSupplierDetails();
    }
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch supplier details and compliance records in parallel
      const [supplierData, recordsData] = await Promise.all([
        supplierAPI.getSupplier(id),
        complianceAPI.getComplianceRecords(id, 0, 50) // Get recent 50 records
      ]);
      
      setSupplier(supplierData);
      setComplianceRecords(recordsData);
    } catch (err) {
      setError(`Failed to fetch supplier details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (metric) => {
    const metricLower = metric.toLowerCase();
    if (metricLower.includes('delivery') || metricLower.includes('time')) {
      return <TrendingUp className="h-4 w-4" />;
    }
    if (metricLower.includes('quality')) {
      return <TrendingDown className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const groupRecordsByMetric = (records) => {
    return records.reduce((acc, record) => {
      if (!acc[record.metric]) {
        acc[record.metric] = [];
      }
      acc[record.metric].push(record);
      return acc;
    }, {});
  };

  const getComplianceCategories = () => {
    if (!complianceRecords.length) return {};
    
    const nonCompliantRecords = complianceRecords.filter(r => r.status === 'non-compliant');
    return nonCompliantRecords.reduce((acc, record) => {
      if (!acc[record.metric]) {
        acc[record.metric] = 0;
      }
      acc[record.metric]++;
      return acc;
    }, {});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Loading supplier details..." />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">Supplier not found</h3>
        <p className="mt-1 text-sm text-gray-500">The supplier you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link
            to="/suppliers"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Suppliers
          </Link>
        </div>
      </div>
    );
  }

  const groupedRecords = groupRecordsByMetric(complianceRecords);
  const complianceCategories = getComplianceCategories();

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/suppliers"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suppliers
        </Link>
        
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {supplier.name}
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5" />
                {supplier.country}
              </div>
              {supplier.last_audit && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5" />
                  Last audit: {format(new Date(supplier.last_audit), 'MMM dd, yyyy')}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <ComplianceScoreBadge score={supplier.compliance_score} />
          </div>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - Supplier Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Information */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Supplier Information</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-sm text-gray-900">{supplier.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Country</label>
                <p className="mt-1 text-sm text-gray-900">{supplier.country}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Compliance Score</label>
                <div className="mt-1">
                  <ComplianceScoreBadge score={supplier.compliance_score} />
                </div>
              </div>
              {supplier.last_audit && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Audit Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(supplier.last_audit), 'MMMM dd, yyyy')}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Contract Terms */}
          {supplier.contract_terms && Object.keys(supplier.contract_terms).length > 0 && (
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Contract Terms</h3>
              </div>
              <div className="px-6 py-4">
                <dl className="space-y-3">
                  {Object.entries(supplier.contract_terms).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm font-medium text-gray-500 capitalize">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Card>
          )}

          {/* Non-Compliance Categories */}
          {Object.keys(complianceCategories).length > 0 && (
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Non-Compliance Issues</h3>
              </div>
              <div className="px-6 py-4">
                <dl className="space-y-3">
                  {Object.entries(complianceCategories)
                    .sort(([,a], [,b]) => b - a) // Sort by count descending
                    .map(([metric, count]) => (
                    <div key={metric} className="flex justify-between items-center">
                      <dt className="text-sm font-medium text-gray-900 capitalize">
                        {metric.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-sm text-red-600 font-semibold">
                        {count} issue{count !== 1 ? 's' : ''}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Card>
          )}
        </div>

        {/* Right column - Compliance Records */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Compliance Records ({complianceRecords.length})
              </h3>
            </div>
            
            {complianceRecords.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No compliance records</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No compliance data has been uploaded for this supplier yet.
                </p>
                <div className="mt-6">
                  <Link
                    to="/compliance-upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Upload Compliance Data
                  </Link>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4">
                {/* Records grouped by metric */}
                {Object.entries(groupedRecords).map(([metric, records]) => (
                  <div key={metric} className="mb-6 last:mb-0">
                    <div className="flex items-center mb-3">
                      {getMetricIcon(metric)}
                      <h4 className="ml-2 text-sm font-medium text-gray-900 capitalize">
                        {metric.replace(/_/g, ' ')} ({records.length} records)
                      </h4>
                    </div>
                    
                    <div className="space-y-3">
                      {records.slice(0, 5).map((record) => ( // Show only recent 5 records per metric
                        <div key={record.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">
                                  {format(new Date(record.date_recorded), 'MMM dd, yyyy')}
                                </span>
                                <StatusBadge status={record.status} />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Result:</span>
                                  <span className="ml-1 font-medium">{record.result}</span>
                                </div>
                                {record.expected_value && (
                                  <div>
                                    <span className="text-gray-500">Expected:</span>
                                    <span className="ml-1 font-medium">{record.expected_value}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* AI Analysis */}
                              {record.ai_analysis && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                                  <h5 className="text-xs font-medium text-blue-900 mb-1">AI Analysis</h5>
                                  {record.ai_analysis.key_issues && (
                                    <p className="text-xs text-blue-800">
                                      {record.ai_analysis.key_issues.slice(0, 2).join(', ')}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {records.length > 5 && (
                        <p className="text-sm text-gray-500 text-center py-2">
                          ... and {records.length - 5} more records
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetail;
