import React, { useState } from 'react';
import axios from 'axios';
// import xml2js from 'xml2js'; // ไม่ต้องใช้ xml2js ใน Frontend แล้ว เพราะ Backend จัดการ SOAP แล้ว
// import { Buffer } from 'buffer'; // ไม่ต้องใช้แล้ว
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import './index.css';

// ไม่ต้องมี window.Buffer = Buffer; แล้ว

const Login = () => {
  const [modid, setModid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!modid || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      setLoading(false);
      return;
    }

    try {
      // เรียก Login Endpoint ของ Backend Server ของคุณ
      // Backend จะเป็นผู้เรียก SOAP Web Service และสร้าง JWT
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/login`, { // **สำคัญ: เปลี่ยน API_BASE_URL ให้ชี้ไปที่ Backend ของคุณ**
        modid: modid,
        password: password,
      }, {
        // Axios จะส่ง HttpOnly Cookie ไปให้อัตโนมัติ หากเป็นโดเมนเดียวกัน หรือมีการตั้งค่า CORS + credentials: true
        withCredentials: true // **สำคัญ: ทำให้ Axios ส่ง Cookie ไปด้วย**
      });

      // ถ้า Login สำเร็จ Backend จะตั้งค่า HttpOnly Cookie ให้แล้ว
      // เราจะไม่ได้รับ JWT ตรงๆ ใน Response Body อีกต่อไป
      // response.data จะมีแค่ message และ userInfo
      setMessage(response.data.message);

      // ไม่ต้องเก็บ citizenId ใน localStorage อีกต่อไป
      // localStorage.removeItem('citizenId'); // หากมีอยู่ก่อนหน้า ให้ลบออก

      // อาจจะเก็บข้อมูล userInfo บางส่วนใน state หรือ context เพื่อใช้แสดงผล
      // แต่ไม่ควรเก็บข้อมูลที่ละเอียดอ่อน เช่น citizenId หรือ token
      const userInfo = response.data.userInfo;

      // Redirect ไปหน้า StartScreen
      // ไม่ต้องส่ง citizenId ใน state แล้ว เพราะจะดึงจาก JWT ใน Backend
      // userInfo อาจจะส่งไปเพื่อใช้แสดงผลใน Frontend
      navigate('/startscreen', { state: { userInfo: userInfo } });

    } catch (error) {
      console.error('Login error:', error);

      if (axios.isCancel(error)) {
        setError('การเชื่อมต่อถูกยกเลิก');
      } else if (error.response) {
        // Backend จะส่ง message ที่เหมาะสมกลับมา
        setError(error.response.data.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง ');
      } else if (error.request) {
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อเครือข่าย');
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  // ไม่ต้องมี parseSoapResponse ใน Frontend แล้ว

  return (
    <section className="bg-primary py-3 py-md-5 py-xl-8">
      <div className="container">
        <div className="row gy-4 align-items-center">
          <Col xs={12} md={6} xl={7}>
            <div className="d-flex justify-content-center text-bg-primary">
              <div className="col-12 col-xl-9">
                <img
                  className="img-fluid rounded mb-4"
                  loading="lazy"
                  src="/nmd.png"
                  width="245"
                  alt="BootstrapBrain Logo"
                />
                <hr className="border-primary-subtle mb-4" />
                <h2 className="info h1 mb-4">
                  การประเมินและวิเคราะห์สมรรถภาพทางจิต กำลังพล ทร. ประจำปีงบประมาณ ๖๘
                </h2>
                <p className="info lead mb-5">
                  กำลังพลกองทัพเรือ
                  มีสุขภาพดีเหมาะสมกับการปฏิบัติหน้าที่
                </p>
              </div>
            </div>
          </Col>

          <Col xs={12} md={6} xl={5}>
            <div className="card border-0 rounded-4">
              <div className="card-body p-3 p-md-4 p-xl-5">
                <div className="row">
                  <div className="col-12">
                    <div className-info="mb-4">
                      <h3>กรุณาลงชื่อเข้าใช้งาน</h3>
                      {error && <Alert variant="danger">{error}</Alert>}
                      {message && <Alert variant="success">{message}</Alert>}
                    </div>
                  </div>
                </div>
                <Form onSubmit={handleLogin}>
                  <div className="row gy-3 overflow-hidden">
                    <div className="col-12">
                      <div className="form-floating mb-3">
                        <Form.Control
                          type="text"
                          className="form-control"
                          name="ชื่อผู้ใช้"
                          id="username"
                          placeholder="name@example.com"
                          required
                          value={modid}
                          onChange={(e) => setModid(e.target.value)}
                        />
                        <Form.Label htmlFor="username">ชื่อผู้ใช้</Form.Label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-floating mb-3">
                        <Form.Control
                          type="password"
                          className="form-control"
                          name="password"
                          id="password"
                          placeholder="Password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <Form.Label htmlFor="password">รหัสผ่าน</Form.Label>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="d-grid">
                        <Button
                          variant="primary"
                          type="submit"
                          className="btn btn-primary btn-lg"
                          disabled={loading}
                        >
                          {loading ? 'กำลัง เข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Form>

                <div className="row">
                  <div className="col-12">
                    <div className="additional-info">
                      <p style={{ color: 'red' }}>*ชื่อผู้ใช้ ใส่ E-mail ทร. ตัวอย่าง : jukkrit.s</p>
                      <p style={{ color: 'red' }}>*รหัสผ่าน ใช้รหัสเดียวกับระบบกำลังพลกองทัพเรือ Hrmiss</p>
                      <p>
                        หมายเหตุ : หากลืมรหัสผ่านติดต่อประสาน กพ.ทร. โทร. 54645, 55768
                      </p>
                      <p>
                        คำแนะนำ : พบปัญหาข้อขัดข้องการใช้งานโปรแกรมติดต่อประสานที่
                        น.ท.ชัยยา จารุภาค หน.ปฏิบัติการเทคโนโลยีสารสนเทศ กวส.พร.
                        โทร. 52964
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </Col>
        </div>
      </div>
    </section>
  );
};

export default Login;