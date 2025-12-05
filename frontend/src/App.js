import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import CreateRFP from './components/CreateRFP';
import VendorManagement from './components/VendorManagement';
import RFPDetail from './components/RFPDetail';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">RFP Management System</h1>
            <div className="nav-links">
              <Link to="/">Dashboard</Link>
              <Link to="/create-rfp">Create RFP</Link>
              <Link to="/vendors">Vendors</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-rfp" element={<CreateRFP />} />
            <Route path="/vendors" element={<VendorManagement />} />
            <Route path="/rfp/:id" element={<RFPDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

