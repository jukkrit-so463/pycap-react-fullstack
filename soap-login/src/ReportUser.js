import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Button, Alert, Table } from 'react-bootstrap';
import resultText from './result';  // Import result text data


const ReportUser = () => {
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  // ฟังก์ชันสำหรับการออกจากระบบ
  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/logout`);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const fetchAssessmentResults = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/getAssessmentResults/self`);
        if (response.data) {
          setAssessmentResults(response.data);
        } else {
          setError('ไม่พบผลการประเมินสำหรับผู้ใช้งานนี้');
        }
      } catch (error) {
        console.error('Error fetching assessment results:', error);
        setError('การดึงข้อมูลผลการประเมินล้มเหลว');
      }
    };

    fetchAssessmentResults();
  }, []);

  const handleRetakeAssessment = () => {
    navigate('/assessment'); // Redirect to the assessment page
  };

  const getInterpretation = (average) => {
    if (average >= 1.00 && average <= 1.80) {
      return { interpretation: 'ต่ำ', color: 'red', resultKey: 'low' };
    } else if (average >= 1.81 && average <= 2.60) {
      return { interpretation: 'ค่อนข้างต่ำ', color: 'orange', resultKey: 'quiteLow' };
    } else if (average >= 2.61 && average <= 3.40) {
      return { interpretation: 'ปานกลาง', color: '#FFD700', resultKey: 'medium' };
    } else if (average >= 3.41 && average <= 4.20) {
      return { interpretation: 'ค่อนข้างสูง', color: 'lightgreen', resultKey: 'quiteHigh' };
    } else if (average >= 4.21 && average <= 5.00) {
      return { interpretation: 'สูง', color: 'green', resultKey: 'high' };
    }
  };

  return (
    <Container className="mt-5">
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h1 className="text-center">ท่านได้ทำการประเมินเรียบร้อยแล้ว</h1>
        </div>
        <div className="card-body">
          {error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            assessmentResults && (
              <div className="text-center">
                <h2 className="text-center mb-4">ผลลัพธ์การประเมิน</h2>
                <Table striped bordered hover>
                  <thead>
                    <tr class="table-primary">
                      <th><h5>คุณลักษณะ</h5></th>
                      <th><h5>คะแนน</h5></th>
                      <th><h5>คะแนนเฉลี่ย</h5></th>
                      <th><h5>ผลลัพธ์</h5></th>
                      <th><h5>คำอธิบาย</h5></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><h6>ความหวัง</h6></td>
                      <td><h5> {assessmentResults.hopeScore} </h5></td>
                      <td><h5> {assessmentResults.hopeAverage} </h5></td>
                      <td style={{ color: getInterpretation(assessmentResults.hopeAverage).color }}>
                        <h5> {resultText.hope[getInterpretation(assessmentResults.hopeAverage).resultKey]}</h5>
                      </td>
                      <td><h5>{getInterpretation(assessmentResults.hopeAverage).interpretation}</h5></td>
                    </tr>
                    <tr>
                      <td><h6>ความเชื่อมั่นในตนเอง</h6></td>
                      <td><h5> {assessmentResults.selfEfficacyScore} </h5></td>
                      <td><h5> {assessmentResults.selfEfficacyAverage} </h5></td>
                      <td style={{ color: getInterpretation(assessmentResults.selfEfficacyAverage).color }}>
                        <h5> {resultText.selfEfficacy[getInterpretation(assessmentResults.selfEfficacyAverage).resultKey]}</h5>
                      </td>
                      <td><h5>{getInterpretation(assessmentResults.selfEfficacyAverage).interpretation}</h5></td>
                    </tr>
                    <tr>
                      <td><h6>ฟื้นฟูจิตใจ</h6></td>
                      <td><h5> {assessmentResults.resilienceScore} </h5></td>
                      <td><h5> {assessmentResults.resilienceAverage} </h5></td>
                      <td style={{ color: getInterpretation(assessmentResults.resilienceAverage).color }}>
                        <h5>{resultText.resilience[getInterpretation(assessmentResults.resilienceAverage).resultKey]}</h5>
                      </td>
                      <td><h5>{getInterpretation(assessmentResults.resilienceAverage).interpretation}</h5></td>
                    </tr>
                    <tr>
                      <td><h6>มองโลกในแง่ดี</h6></td>
                      <td><h5> {assessmentResults.optimismScore} </h5></td>
                      <td><h5> {assessmentResults.optimismAverage} </h5></td>
                      <td style={{ color: getInterpretation(assessmentResults.optimismAverage).color }}>
                        <h5>{resultText.optimism[getInterpretation(assessmentResults.optimismAverage).resultKey]}</h5>
                      </td>
                      <td><h5>{getInterpretation(assessmentResults.optimismAverage).interpretation}</h5></td>
                    </tr>
                    <tr class="table-primary">
                      <td><h5>ต้นทุนทางจิตวิทยาโดยภาพรวม</h5></td>
                      <td colSpan="3" className="text-center" style={{ verticalAlign: "middle" }}><h5> {assessmentResults.overallAverage} </h5></td>
                      <td><h5>{getInterpretation(assessmentResults.overallAverage).interpretation}</h5></td>
                    </tr>
                  </tbody>
                </Table>
                <Button variant="danger" size="lg" onClick={handleLogout}>
                  <h5>ออกจากระบบ</h5>
                </Button>
                {/* <Button variant="success" onClick={handleRetakeAssessment}>
                  ทำแบบประเมินอีกครั้ง
                </Button> */}
              </div>
            )
          )}
        </div>
      </div>
    </Container>
  );
};

export default ReportUser;
