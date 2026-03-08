import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding.jsx';
import Planner from './pages/Planner.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Onboarding />} />
      <Route path="/planner" element={<Planner />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
