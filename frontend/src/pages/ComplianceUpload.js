import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supplierAPI, complianceAPI } from '../services/api';
import { ErrorMessage, SuccessMessage, LoadingSpinner, Card } from '../components/UIComponents';
import { Upload, Plus, X, CheckCircle } from 'lucide-react';

const ComplianceUpload = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [complianceRecords, setComplianceRecords] = useState([
    { metric: '', date_recorded: '', result: '', expected_value: '', status: 'compliant' }
  ]);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();

  const selectedSupplierId = watch('supplier_id');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await supplierAPI.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError(`Failed to fetch suppliers: ${err.message}`);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleRecordChange = (index, field, value) => {
    const newRecords = [...complianceRecords];
    newRecords[index][field] = value;
    
    // Auto-determine status based on metric and values
    if (field === 'result' || field === 'expected_value') {
      const record = newRecords[index];
      if (record.result && record.expected_value) {
        const result = parseFloat(record.result);
        const expected = parseFloat(record.expected_value);
        
        if (record.metric.toLowerCase().includes('delivery') || record.metric.toLowerCase().includes('time')) {
          // For delivery time, lower is better
          record.status = result <= expected ? 'compliant' : 'non-compliant';
        } else if (record.metric.toLowerCase().includes('quality')) {
          // For quality, higher is better
          record.status = result >= expected ? 'compliant' : 'non-compliant';
        }
      }
    }
    
    setComplianceRecords(newRecords);
  };

  const addComplianceRecord = () => {
    setComplianceRecords([
      ...complianceRecords,
      { metric: '', date_recorded: '', result: '', expected_value: '', status: 'compliant' }
    ]);
  };

  const removeComplianceRecord = (index) => {
    if (complianceRecords.length > 1) {
      const newRecords = complianceRecords.filter((_, i) => i !== index);
      setComplianceRecords(newRecords);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setAiAnalysis(null);

      // Validate compliance records
      const validRecords = complianceRecords.filter(record => 
        record.metric && record.date_recorded && record.result
      );

      if (validRecords.length === 0) {
        throw new Error('Please add at least one valid compliance record');
      }

      // Prepare compliance data
      const complianceData = {
        supplier_id: parseInt(data.supplier_id),
        compliance_data: validRecords.map(record => ({
          metric: record.metric,
          date_recorded: record.date_recorded,
          result: parseFloat(record.result),
          expected_value: record.expected_value ? parseFloat(record.expected_value) : null,
          status: record.status
        }))
      };

      // Submit compliance check
      const result = await complianceAPI.checkCompliance(complianceData);
      
      setAiAnalysis(result.ai_analysis);
      setSuccess(`Compliance data uploaded successfully! Updated compliance score: ${result.updated_compliance_score}/100`);
      
      // Reset form
      reset();
      setComplianceRecords([
        { metric: '', date_recorded: '', result: '', expected_value: '', status: 'compliant' }
      ]);

    } catch (err) {
      setError(`Failed to upload compliance data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getMetricSuggestions = () => [
    'delivery_time',
    'quality_score',
    'on_time_delivery',
    'defect_rate',
    'lead_time',
    'cost_variance',
    'service_level',
    'response_time'
  ];

  if (loadingSuppliers) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Loading suppliers..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Upload Compliance Data
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload and check compliance data for suppliers. AI will analyze patterns and provide insights.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
              <ErrorMessage message={error} onDismiss={() => setError('')} />
              <SuccessMessage message={success} onDismiss={() => setSuccess('')} />

              {/* Supplier Selection */}
              <div>
                <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700">
                  Select Supplier *
                </label>
                <select
                  id="supplier_id"
                  {...register('supplier_id', { required: 'Please select a supplier' })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Choose a supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.country})
                    </option>
                  ))}
                </select>
                {errors.supplier_id && (
                  <p className="mt-2 text-sm text-red-600">{errors.supplier_id.message}</p>
                )}
              </div>

              {/* Compliance Records */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Compliance Records *
                  </label>
                  <button
                    type="button"
                    onClick={addComplianceRecord}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Record
                  </button>
                </div>

                <div className="space-y-4">
                  {complianceRecords.map((record, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Record {index + 1}
                        </h4>
                        {complianceRecords.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeComplianceRecord(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Metric *
                          </label>
                          <input
                            type="text"
                            list={`metrics-${index}`}
                            placeholder="e.g., delivery_time"
                            value={record.metric}
                            onChange={(e) => handleRecordChange(index, 'metric', e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                          <datalist id={`metrics-${index}`}>
                            {getMetricSuggestions().map(metric => (
                              <option key={metric} value={metric} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Date Recorded *
                          </label>
                          <input
                            type="date"
                            value={record.date_recorded}
                            onChange={(e) => handleRecordChange(index, 'date_recorded', e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Result *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Actual result"
                            value={record.result}
                            onChange={(e) => handleRecordChange(index, 'result', e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Expected Value
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Expected/target"
                            value={record.expected_value}
                            onChange={(e) => handleRecordChange(index, 'expected_value', e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={record.status}
                            onChange={(e) => handleRecordChange(index, 'status', e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="compliant">Compliant</option>
                            <option value="non-compliant">Non-Compliant</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading || !selectedSupplierId}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload & Analyze
                    </>
                  )}
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* AI Analysis Section */}
        <div className="lg:col-span-1">
          {aiAnalysis ? (
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">AI Analysis Results</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                {/* Risk Assessment */}
                {aiAnalysis.risk_assessment && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Assessment</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      aiAnalysis.risk_assessment === 'low' ? 'bg-green-100 text-green-800' :
                      aiAnalysis.risk_assessment === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {aiAnalysis.risk_assessment.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Compliance Score */}
                {aiAnalysis.compliance_score_suggestion && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Score</h4>
                    <p className="text-lg font-semibold text-blue-600">
                      {aiAnalysis.compliance_score_suggestion}/100
                    </p>
                  </div>
                )}

                {/* Key Issues */}
                {aiAnalysis.key_issues && aiAnalysis.key_issues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Key Issues</h4>
                    <ul className="space-y-1">
                      {aiAnalysis.key_issues.slice(0, 3).map((issue, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="flex-shrink-0 h-1.5 w-1.5 bg-red-400 rounded-full mt-2 mr-2"></span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Summary */}
                {aiAnalysis.summary && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                    <p className="text-sm text-gray-600">{aiAnalysis.summary}</p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="px-6 py-4 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">AI Analysis</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload compliance data to get AI-powered insights and recommendations.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceUpload;
