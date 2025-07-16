import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Report = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Initialize navigate

  // ฟังก์ชันสำหรับการออกจากระบบ
  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/logout`);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [navigate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/report`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>ตารางสรุปรายงาน แยกตามหน่วย</h2>
      <button className="btn btn-primary mb-3" onClick={fetchReport}>
        Refresh Report
      </button>{' '}
      <button className="btn btn-danger mb-3" onClick={handleLogout}>
      ออกจากระบบ
      </button>
      {loading && <p>Loading report...</p>}
      {reportData.length > 0 ? (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>หน่วยที่ประเมิน</th>
              <th>ผู้ประเมินทั้งหมด</th>
              <th>คุณลักษณะของการมีความหวัง (Hope)</th>
              <th>คุณลักษณะของความเชื่อมั่นในศักยภาพของตนเอง (Self-efficacy)</th>
              <th>คุณลักษณะของการมีความยืดหยุ่นเมื่อเผชิญสิ่งที่ยากลำบาก (Resilience)</th>
              <th>คุณลักษณะของการมองโลกในแง่ดี (Optimism)</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, index) => (
              <tr key={index}>
                <td>{row.level1Department}</td>
                <td>{row.totalAssessors}</td>
                <td>{row.hopePassPercentage.toFixed(2)}%</td>
                <td>{row.selfEfficacyPassPercentage.toFixed(2)}%</td>
                <td>{row.resiliencePassPercentage.toFixed(2)}%</td>
                <td>{row.optimismPassPercentage.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No data available</p>
      )}
      
    </div>
  );
};

export default Report;
