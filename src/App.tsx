import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Earn from './pages/Earn';
import Withdraw from './pages/Withdraw';
import Referrals from './pages/Referrals';
import Account from './pages/Account';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="earn" element={<Earn />} />
          <Route path="withdraw" element={<Withdraw />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;