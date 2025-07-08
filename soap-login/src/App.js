// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';
import StartScreen from './StartScreen';
import './App.css';
import AssessmentPage from './AssessmentPage';
import Report from './report';
import ReportUser from './ReportUser'; // Ensure the import is correct

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/startscreen" element={<StartScreen />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/report" element={<Report />} />
          <Route path="/reportuser" element={<ReportUser />} /> {/* Removed :citizenId */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
