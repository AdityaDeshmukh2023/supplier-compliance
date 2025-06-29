import React, { useState, useEffect } from 'react';
import { supplierAPI } from '../services/api';
import { Card, Button, Input, Select, LoadingSpinner, Alert } from '../components/UIComponents';

const WeatherImpact = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    supplier_id: '',
    compliance_record_id: '',
    lat: '',
    lon: '',
    delivery_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await supplierAPI.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError('Failed to fetch suppliers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Prepare data, removing empty optional fields
      const requestData = {
        supplier_id: parseInt(formData.supplier_id),
        delivery_date: formData.delivery_date
      };

      if (formData.compliance_record_id) {
        requestData.compliance_record_id = parseInt(formData.compliance_record_id);
      }

      if (formData.lat && formData.lon) {
        requestData.lat = parseFloat(formData.lat);
        requestData.lon = parseFloat(formData.lon);
      }

      const response = await supplierAPI.checkWeatherImpact(requestData);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Failed to check weather impact');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getWeatherSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Weather Impact Analysis</h1>
        <p className="text-gray-600 mb-6">
          Check if adverse weather conditions justify delivery delays and automatically update compliance records.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <Select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                required
                className="w-full"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.country})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                name="delivery_date"
                value={formData.delivery_date}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compliance Record ID (Optional)
              </label>
              <Input
                type="number"
                name="compliance_record_id"
                value={formData.compliance_record_id}
                onChange={handleChange}
                placeholder="Leave empty to check all records for the date"
                className="w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Location (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="any"
                  name="lat"
                  value={formData.lat}
                  onChange={handleChange}
                  placeholder="Latitude"
                  className="w-full"
                />
                <Input
                  type="number"
                  step="any"
                  name="lon"
                  value={formData.lon}
                  onChange={handleChange}
                  placeholder="Longitude"
                  className="w-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use supplier's country location
              </p>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !formData.supplier_id || !formData.delivery_date}
            className="w-full md:w-auto"
          >
            {loading ? <LoadingSpinner className="mr-2" /> : null}
            Check Weather Impact
          </Button>
        </form>
      </div>

      {error && (
        <Alert type="error" message={error} />
      )}

      {result && (
        <div className="space-y-4">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Weather Analysis Results</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Weather Status</h3>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    result.weather_analysis.has_adverse_weather 
                      ? getWeatherSeverityColor(result.weather_analysis.severity)
                      : 'text-green-600 bg-green-50'
                  }`}>
                    {result.weather_analysis.has_adverse_weather ? (
                      <>
                        ⚠️ Adverse Weather Detected ({result.weather_analysis.severity} severity)
                      </>
                    ) : (
                      <>✅ No Adverse Weather</>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700">Records Updated</h3>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    result.status_updated ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-50'
                  }`}>
                    {result.status_updated ? (
                      `✅ ${result.updated_records.length} record(s) updated`
                    ) : (
                      '❌ No records updated'
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Weather Description</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">
                  {result.weather_analysis.weather_description || 'N/A'}
                  {result.weather_analysis.temperature && (
                    <span className="ml-2">
                      (Temperature: {result.weather_analysis.temperature}°C)
                    </span>
                  )}
                  {result.weather_analysis.wind_speed && (
                    <span className="ml-2">
                      (Wind: {result.weather_analysis.wind_speed} m/s)
                    </span>
                  )}
                </p>
              </div>

              {result.weather_analysis.conditions && result.weather_analysis.conditions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Adverse Conditions Found</h3>
                  <div className="space-y-2">
                    {result.weather_analysis.conditions.map((condition, index) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                        <div className="font-medium text-yellow-800">
                          {condition.type.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-yellow-700">{condition.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Justification</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">
                  {result.justification}
                </p>
              </div>

              {result.weather_analysis.mock_data && (
                <Alert 
                  type="warning" 
                  message="Weather data is simulated (API key not configured). Results are for demonstration purposes only."
                />
              )}

              {result.updated_records && result.updated_records.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Updated Compliance Records</h3>
                  <div className="space-y-2">
                    {result.updated_records.map((record) => (
                      <div key={record.id} className="bg-blue-50 border border-blue-200 p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-blue-800">
                              Record #{record.id} - {record.metric}
                            </div>
                            <div className="text-sm text-blue-700">
                              Date: {record.date_recorded} | Status: {record.status}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Status Updated
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WeatherImpact;
