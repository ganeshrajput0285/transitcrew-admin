import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { EmployeeProvider } from "./context/EmployeeContext";
import AdminDashboard from "./panels/AdminDashboard";
import AdminPanel from "./panels/WelcomePage";
import LoginPage from './panels/LoginPage';
import ProtectedRoute from "./components/ProtectedRoute";
import WelcomePage from './panels/WelcomePage';
import UserManagement from "./panels/UserManagement";
import RequestsSection from "./panels/RequestsSection";
import EmployeesSection from "./panels/EmployeesSection";
import RosterManagement from "./panels/RosterManagement";
import EmployeeDetails from "./panels/EmployeeDetails";
import SingleEmployee from "./panels/SingleEmployee";
import OvertimeTracking from "./panels/OvertimeTracking";
import LiveData from "./panels/LiveData";
import NewSOP from "./panels/NewSOP";
import NightData from "./panels/NightData";
import NightDataPage from "./panels/NightDataPage";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import "./styles/global.css";
import SopDetails from "./panels/SopDetails";
import EmployeeOvertimeDetail from './panels/EmployeeOvertimeDetail';

function AppWrapper() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login" || location.pathname === "/";

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

 <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        
         <Route path="/admin/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><><AdminDashboard /><HeroSection /></></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/users/requests" element={<ProtectedRoute><RequestsSection /></ProtectedRoute>} />
        <Route path="/admin/users/employees" element={<ProtectedRoute><EmployeesSection /></ProtectedRoute>} />
        <Route path="/admin/roster" element={<ProtectedRoute><RosterManagement /></ProtectedRoute>} />
        <Route path="/admin/employees" element={<ProtectedRoute><EmployeeDetails /></ProtectedRoute>} />
        <Route path="/employee/:id" element={<SingleEmployee />} />
        <Route path="/admin/overtime" element={<ProtectedRoute><OvertimeTracking /></ProtectedRoute>} />
        <Route path="/employee/:id/overtime" element={<EmployeeOvertimeDetail />} />
        <Route path="/admin/live-data" element={<ProtectedRoute><LiveData /></ProtectedRoute>} />
        <Route path="/admin/new-sop" element={<ProtectedRoute><NewSOP /></ProtectedRoute>} />
        <Route path="/sop-details/:sopId/:sopName" element={<SopDetails />} />
        <Route path="/admin/night-data" element={<ProtectedRoute><NightData /></ProtectedRoute>} />
        <Route path="/night-data/:employeeId" element={<NightDataPage />} />
         <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <EmployeeProvider>
      <Router>
        <AppWrapper />
      </Router>
    </EmployeeProvider>
  );
}

export default App;
