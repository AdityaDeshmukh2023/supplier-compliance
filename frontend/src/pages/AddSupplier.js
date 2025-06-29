import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supplierAPI } from '../services/api';
import { ErrorMessage, SuccessMessage, Card } from '../components/UIComponents';
import { Save, X } from 'lucide-react';

const AddSupplier = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contractTerms, setContractTerms] = useState([{ key: '', value: '' }]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const handleContractTermChange = (index, field, value) => {
    const newTerms = [...contractTerms];
    newTerms[index][field] = value;
    setContractTerms(newTerms);
  };

  const addContractTerm = () => {
    setContractTerms([...contractTerms, { key: '', value: '' }]);
  };

  const removeContractTerm = (index) => {
    if (contractTerms.length > 1) {
      const newTerms = contractTerms.filter((_, i) => i !== index);
      setContractTerms(newTerms);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Process contract terms
      const terms = {};
      contractTerms.forEach(term => {
        if (term.key && term.value) {
          terms[term.key] = term.value;
        }
      });

      // Prepare supplier data
      const supplierData = {
        name: data.name,
        country: data.country,
        contract_terms: Object.keys(terms).length > 0 ? terms : null,
        compliance_score: data.compliance_score ? parseInt(data.compliance_score) : 100,
        last_audit: data.last_audit || null
      };

      const result = await supplierAPI.createSupplier(supplierData);
      
      setSuccess(`Supplier "${result.name}" created successfully!`);
      reset();
      setContractTerms([{ key: '', value: '' }]);
      
      // Redirect to supplier detail page after a short delay
      setTimeout(() => {
        navigate(`/suppliers/${result.id}`);
      }, 1500);

    } catch (err) {
      setError(`Failed to create supplier: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Add New Supplier
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create a new supplier profile with contract terms and compliance information
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <ErrorMessage message={error} onDismiss={() => setError('')} />
          <SuccessMessage message={success} onDismiss={() => setSuccess('')} />

          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Supplier Name *
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { 
                  required: 'Supplier name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter supplier name"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country *
              </label>
              <input
                type="text"
                id="country"
                {...register('country', { 
                  required: 'Country is required',
                  minLength: { value: 2, message: 'Country must be at least 2 characters' }
                })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter country"
              />
              {errors.country && (
                <p className="mt-2 text-sm text-red-600">{errors.country.message}</p>
              )}
            </div>
          </div>

          {/* Compliance Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="compliance_score" className="block text-sm font-medium text-gray-700">
                Initial Compliance Score (0-100)
              </label>
              <input
                type="number"
                id="compliance_score"
                min="0"
                max="100"
                {...register('compliance_score', {
                  min: { value: 0, message: 'Score must be between 0 and 100' },
                  max: { value: 100, message: 'Score must be between 0 and 100' }
                })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="100"
              />
              {errors.compliance_score && (
                <p className="mt-2 text-sm text-red-600">{errors.compliance_score.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="last_audit" className="block text-sm font-medium text-gray-700">
                Last Audit Date
              </label>
              <input
                type="date"
                id="last_audit"
                {...register('last_audit')}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Contract Terms */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Contract Terms
              </label>
              <button
                type="button"
                onClick={addContractTerm}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Term
              </button>
            </div>
            
            <div className="space-y-3">
              {contractTerms.map((term, index) => (
                <div key={index} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Term name (e.g., delivery_time)"
                    value={term.key}
                    onChange={(e) => handleContractTermChange(index, 'key', e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Term value (e.g., 5 days)"
                      value={term.value}
                      onChange={(e) => handleContractTermChange(index, 'value', e.target.value)}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                    {contractTerms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContractTerm(index)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Add key contract terms such as delivery time, quality standards, discount rates, etc.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/suppliers')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Supplier
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddSupplier;
