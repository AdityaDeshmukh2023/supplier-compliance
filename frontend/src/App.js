import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SupplierList from './pages/SupplierList';
import SupplierDetail from './pages/SupplierDetail';
import ComplianceUpload from './pages/ComplianceUpload';
import InsightsDashboard from './pages/InsightsDashboard';
import AddSupplier from './pages/AddSupplier';
import WeatherImpact from './pages/WeatherImpact';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/suppliers" element={<SupplierList />} />
            <Route path="/suppliers/:id" element={<SupplierDetail />} />
            <Route path="/add-supplier" element={<AddSupplier />} />
            <Route path="/compliance-upload" element={<ComplianceUpload />} />
            <Route path="/insights" element={<InsightsDashboard />} />
            <Route path="/weather-impact" element={<WeatherImpact />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
