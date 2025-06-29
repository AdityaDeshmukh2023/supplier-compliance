import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../components/UIComponents';

const HomePage = () => {
  const features = [
    {
      title: "Supplier Management",
      description: "Add, view, and manage your supplier database with detailed compliance tracking",
      icon: "🏭",
      link: "/suppliers",
      linkText: "View Suppliers"
    },
    {
      title: "Compliance Monitoring",
      description: "Upload and track compliance data with AI-powered analysis and insights",
      icon: "📊",
      link: "/compliance-upload",
      linkText: "Upload Data"
    },
    {
      title: "AI Insights Dashboard",
      description: "Get intelligent insights and recommendations powered by Gemini AI",
      icon: "🤖",
      link: "/insights",
      linkText: "View Insights"
    },
    {
      title: "Weather Impact Analysis",
      description: "Justify delivery delays due to adverse weather conditions automatically",
      icon: "🌦️",
      link: "/weather-impact",
      linkText: "Check Weather"
    }
  ];

  const quickActions = [
    { text: "Add New Supplier", link: "/add-supplier", color: "bg-blue-600 hover:bg-blue-700" },
    { text: "Upload Compliance Data", link: "/compliance-upload", color: "bg-green-600 hover:bg-green-700" },
    { text: "View Insights", link: "/insights", color: "bg-purple-600 hover:bg-purple-700" }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">
            Supplier Compliance Monitor & Insights Dashboard
          </h1>
          <p className="text-xl opacity-90 mb-6">
            Comprehensive supplier management with AI-powered compliance monitoring, 
            weather impact analysis, and actionable insights to optimize your supply chain.
          </p>
          <div className="flex flex-wrap gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className={`px-6 py-3 ${action.color} text-white rounded-lg font-medium transition-colors duration-200`}
              >
                {action.text}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-200">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
            <p className="text-gray-600 mb-4">{feature.description}</p>
            <Link to={feature.link}>
              <Button variant="outline" className="w-full">
                {feature.linkText}
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      {/* User Guide Section */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Quick Start Guide</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                <h3 className="font-semibold text-gray-900">Setup Suppliers</h3>
              </div>
              <p className="text-gray-600 mb-3">
                Start by adding your suppliers with their basic information, contract terms, and location details.
              </p>
              <Link to="/add-supplier" className="text-blue-600 hover:text-blue-800 font-medium">
                Add Supplier →
              </Link>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                <h3 className="font-semibold text-gray-900">Upload Compliance Data</h3>
              </div>
              <p className="text-gray-600 mb-3">
                Upload compliance records including delivery times, quality metrics, and other KPIs for AI analysis.
              </p>
              <Link to="/compliance-upload" className="text-green-600 hover:text-green-800 font-medium">
                Upload Data →
              </Link>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                <h3 className="font-semibold text-gray-900">Monitor & Analyze</h3>
              </div>
              <p className="text-gray-600 mb-3">
                Review AI-powered insights, track compliance trends, and get actionable recommendations.
              </p>
              <Link to="/insights" className="text-purple-600 hover:text-purple-800 font-medium">
                View Insights →
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-100 to-red-100 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🌦️ Weather Impact Feature</h3>
            <p className="text-gray-700 mb-4">
              New! Automatically justify delivery delays due to adverse weather conditions. The system analyzes historical weather data 
              and updates compliance records when severe weather (storms, heavy rain, snow, etc.) impacted deliveries.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">How it works:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Select supplier and delivery date</li>
                  <li>• System fetches historical weather data</li>
                  <li>• Analyzes for adverse conditions</li>
                  <li>• Updates non-compliant records to "excused-weather"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Adverse conditions detected:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Thunderstorms and severe weather</li>
                  <li>• Heavy rainfall (&gt;10mm/hour)</li>
                  <li>• Snow and blizzards</li>
                  <li>• Strong winds (&gt;15 m/s)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/weather-impact">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Try Weather Analysis →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* System Features */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">🤖 AI-Powered Analysis</h3>
            <p className="text-gray-600 text-sm">
              Gemini AI analyzes compliance data to provide insights, identify trends, and recommend improvements.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">📈 Real-time Monitoring</h3>
            <p className="text-gray-600 text-sm">
              Track supplier performance in real-time with automated compliance scoring and alerts.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">🌍 Weather Integration</h3>
            <p className="text-gray-600 text-sm">
              Automatically account for weather-related delivery delays using OpenWeatherMap data.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">📊 Interactive Dashboard</h3>
            <p className="text-gray-600 text-sm">
              Beautiful, responsive interface with charts, graphs, and detailed analytics.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">🔄 RESTful API</h3>
            <p className="text-gray-600 text-sm">
              FastAPI backend with comprehensive documentation and easy integration capabilities.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">🐳 Docker Ready</h3>
            <p className="text-gray-600 text-sm">
              Containerized deployment with PostgreSQL database and easy scaling options.
            </p>
          </div>
        </div>
      </Card>

      {/* Get Started CTA */}
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Begin by adding your first supplier or explore the demo data to see how the platform can 
          transform your supplier compliance monitoring and insights generation.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/add-supplier">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Add Your First Supplier
            </Button>
          </Link>
          <Link to="/suppliers">
            <Button variant="outline">
              Explore Demo Data
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
