import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import OwnerDashboard from './pages/OwnerDashboard';
import CaregiverLogin from './pages/CaregiverLogin';
import CaregiverSignup from './pages/CaregiverSignup';
import CaregiverDashboard from './pages/CaregiverDashboard';
import AnimalDetails from './pages/AnimalDetails';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="owner" element={<OwnerDashboard />} />
          <Route path="caregiver/login" element={<CaregiverLogin />} />
          <Route path="caregiver/signup" element={<CaregiverSignup />} />
          <Route element={<ProtectedRoute />}>
            <Route path="caregiver/dashboard" element={<CaregiverDashboard />} />
            <Route path="caregiver/animal/:id" element={<AnimalDetails />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
