import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FarmerShell } from './app/FarmerShell';
import { ExtensionShell } from './app/ExtensionShell';
import { Home } from './pages/Home';
import { Field } from './pages/Field';
import { ExtensionDashboard } from './features/escalation-dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FarmerShell />}>
          <Route index element={<Home />} />
          <Route path="fields/:fieldId" element={<Field />} />
        </Route>
        
        <Route path="/extension" element={<ExtensionShell />}>
          <Route index element={<ExtensionDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
