import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom'; // useLocation ไม่ได้ใช้ในโค้ดนี้ แต่ถ้าจำเป็นก็เก็บไว้
import { Container, Row, Col, Button } from 'react-bootstrap';

// ตั้งค่า axios default for credentials ที่นี่ (หรือที่ไฟล์หลักอย่าง index.js)
// เพื่อให้ทุก request ส่ง cookie ไปด้วย
axios.defaults.withCredentials = true;

const StartScreen = () => {
  const navigate = useNavigate();
  // const location = useLocation(); // ไม่ได้ใช้ในโค้ดนี้, สามารถลบได้ถ้าไม่จำเป็น
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  // เราจะไม่ดึง citizenId จาก localStorage อีกต่อไป
  // ข้อมูลผู้ใช้จะถูกส่งมาจาก backend หลังจากตรวจสอบ JWT แล้ว

  const handleStart = async () => {
    try {
      // เรียก API ของ Backend เพื่อตรวจสอบผลการประเมิน
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/getAssessmentResults/self`);
      if (response.data) {
        navigate('/reportuser');
      } else {
        navigate('/assessment');
      }
    } catch (error) {
      console.error('Error fetching assessment results:', error);
      if (error.response && error.response.status === 404) {
        navigate('/assessment');
      } else {
        setError('Failed to fetch assessment results. Please try again.');
        navigate('/assessment');
      }
    }
  };

  // ฟังก์ชันสำหรับการออกจากระบบ
  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/logout`);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out. Please try again.');
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // เรียก Endpoint ใหม่ใน Backend เพื่อดึงข้อมูลผู้ใช้
        // Backend จะดึง citizenId จาก JWT และใช้มันเพื่อดึงข้อมูลจาก SOAP service
        // (หรือจาก DB ของเราเอง ถ้าเราเก็บข้อมูลเต็มไว้แล้ว)
        // ตั้งค่า proxy ใน Nginx ให้ /api ชี้ไปที่ Backend
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/user-profile`);
        setUserInfo(response.data.userInfo); // Backend ควรส่ง userInfo กลับมาใน response.data.userInfo
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        setError('Failed to load user information.');
        // หากเกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ (เช่น JWT หมดอายุหรือไม่ถูกต้อง)
        // อาจจะต้อง Redirect ไปหน้า Login
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          navigate('/login'); // หรือ '/' ถ้าหน้า login เป็น root
        }
      }
    };

    fetchUserInfo();
  }, [navigate]); // เพิ่ม navigate เป็น dependency เพื่อหลีกเลี่ยง warning

  return (
    <Container className="mt-5">
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h1 className="text-center">ระบบประเมิน สมรรถภาพทางจิต ทร.</h1>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {userInfo ? (
            <div className="text-center">
              <h2 className="mb-4">ยินดีต้อนรับ</h2>
              <p className="lead">
                <strong>{userInfo.Rank}{userInfo.FirstName} {userInfo.LastName}</strong>
              </p>
              <p>แผนก: <strong>{userInfo.Department}</strong></p>
              <p>ระดับแผนก: <strong>{userInfo.Level1Department}</strong></p>
            </div>
          ) : (
            <div className="text-center">
              <div className="spinner-grow text-primary" role="status">
                <span className="sr-only">โปรดรอ...</span>
              </div>
              <p>โปรดรอ...</p>
            </div>
          )}
        </div>
      </div>

      <Container className="text-center p-5">
        <h2 className="mb-4">แบบประเมินสุขภาพจิต</h2>
        <p>
          การประเมินสมรรถภาพทางจิตมีวัตถุประสงค์ เพื่อให้ท่านทราบถึงระดับสมรรถภาพทางจิตใจของตนเอง...
        </p>
        <Row className="justify-content-center my-4">
          <Col md={4} className="p-3 border rounded bg-light-green w-15 mx-auto">
            <div className="bg-light p-3 rounded">
              <h3>44</h3>
              <p>คำถาม</p>
            </div>
          </Col>
          <Col md={4} className="p-3 border rounded bg-light-green w-15 mx-auto">
            <div className="bg-light p-3 rounded">
              <i className="bi bi-check-circle" style={{ fontSize: '2rem' }}></i>
              <h3 style={{ color: 'red' }}>ให้เลือกคลิ๊กเพื่อตอบคำถาม</h3>
            </div>
          </Col>
          <Col md={4} className="p-3 border rounded bg-light-green w-15 mx-auto">
            <div className="bg-light p-3 rounded">
              <h3>ประเมินให้ครบ</h3>
              <p>4 ส่วน</p>
            </div>
          </Col>
        </Row>

        <Button variant="success" size="lg" onClick={handleStart}>
          <h5>เข้าสู่การทำแบบประเมิน</h5>
        </Button>
        {' '}
        <Button variant="danger" size="lg" onClick={handleLogout}>
          <h5>ออกจากระบบ</h5>
        </Button>

        <p className="mt-3" style={{ color: 'red' }}>
          เมื่อคุณ เข้าสู่การทำแบบประเมิน หมายถึงคุณตกลงตาม{' '}
          <a href="#">นโยบายความเป็นส่วนตัว</a>,{' '}
          <a href="#">ข้อกำหนดและเงื่อนไข</a>
        </p>
      </Container>
    </Container>
  );
};

export default StartScreen;