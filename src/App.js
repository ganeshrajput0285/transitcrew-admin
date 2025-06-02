import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { EmployeeProvider } from "./context/EmployeeContext";
import AdminDashboard from "./panels/AdminDashboard";
import LoginPage from './panels/LoginPage';

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
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        
         <Route path="/admin/welcome" element={<WelcomePage />} />
        <Route path="/admin/dashboard" element={<><AdminDashboard /><HeroSection /></>} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/users/requests" element={<RequestsSection />} />
        <Route path="/admin/users/employees" element={<EmployeesSection />} />
        <Route path="/admin/roster" element={<RosterManagement />} />
        <Route path="/admin/employees" element={<EmployeeDetails />} />
        <Route path="/employee/:id" element={<SingleEmployee />} />
        <Route path="/admin/overtime" element={<OvertimeTracking />} />
        <Route path="/employee/:id/overtime" element={<EmployeeOvertimeDetail />} />
        <Route path="/admin/live-data" element={<LiveData />} />
        <Route path="/admin/new-sop" element={<NewSOP />} />
        <Route path="/sop-details/:sopId/:sopName" element={<SopDetails />} />
        <Route path="/admin/night-data" element={<NightData />} />
        <Route path="/night-data/:employeeId" element={<NightDataPage />} />
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
