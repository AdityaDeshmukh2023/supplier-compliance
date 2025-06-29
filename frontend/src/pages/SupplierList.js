import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplierAPI } from '../services/api';
import { LoadingSpinner, ComplianceScoreBadge, ErrorMessage, Card } from '../components/UIComponents';
import { Eye, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await supplierAPI.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError(`Failed to fetch suppliers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceStatus = (score) => {
    if (score >= 80) return { text: 'Excellent', color: 'text-green-600' };
    if (score >= 60) return { text: 'Good', color: 'text-yellow-600' };
    return { text: 'Needs Attention', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Loading suppliers..." />
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Supplier List
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor compliance scores and recent compliance issues for all suppliers
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/add-supplier"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add New Supplier
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {suppliers.length === 0 ? (
        <Card className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No suppliers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first supplier.
          </p>
          <div className="mt-6">
            <Link
              to="/add-supplier"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Supplier
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => {
            const complianceStatus = getComplianceStatus(supplier.compliance_score);
            return (
              <Card key={supplier.id} hover className="relative">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {supplier.name}
                    </h3>
                    <ComplianceScoreBadge score={supplier.compliance_score} />
                  </div>
                  
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {supplier.country}
                  </div>

                  <div className="mt-2">
                    <span className={`text-sm font-medium ${complianceStatus.color}`}>
                      {complianceStatus.text}
                    </span>
                  </div>

                  {supplier.last_audit && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                      Last audit: {format(new Date(supplier.last_audit), 'MMM dd, yyyy')}
                    </div>
                  )}

                  <div className="mt-4">
                    <Link
                      to={`/suppliers/${supplier.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </div>

                  {/* Contract terms preview */}
                  {supplier.contract_terms && Object.keys(supplier.contract_terms).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium">Key Contract Terms:</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.keys(supplier.contract_terms).slice(0, 3).map((key) => (
                          <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {key}
                          </span>
                        ))}
                        {Object.keys(supplier.contract_terms).length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{Object.keys(supplier.contract_terms).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary statistics */}
      {suppliers.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Suppliers</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{suppliers.length}</dd>
          </Card>
          
          <Card className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">High Compliance</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">
              {suppliers.filter(s => s.compliance_score >= 80).length}
            </dd>
          </Card>
          
          <Card className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Needs Attention</dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">
              {suppliers.filter(s => s.compliance_score < 60).length}
            </dd>
          </Card>
          
          <Card className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {suppliers.length > 0 
                ? Math.round(suppliers.reduce((sum, s) => sum + s.compliance_score, 0) / suppliers.length)
                : 0
              }
            </dd>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SupplierList;
