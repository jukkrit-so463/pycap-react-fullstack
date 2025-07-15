import React, { useState } from 'react';
import axios from 'axios';
import xml2js from 'xml2js';
import { Buffer } from 'buffer';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import './index.css';


window.Buffer = Buffer; // Global Buffer definition

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

    const soapRequest = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="uri:checkauthentication">
        <soapenv:Header/>
        <soapenv:Body>
          <urn:checkauthentication>
            <modid>${modid}</modid>
            <password>${password}</password>
          </urn:checkauthentication>
        </soapenv:Body>
      </soapenv:Envelope>
    `;

    try {
      // First API call for authentication
      const response = await axios.post('/webservice/checkauthentication.php', soapRequest, {
        headers: {
          'Content-Type': 'text/xml',
          'SOAPAction': 'uri:checkauthentication',
        },
        timeout: 10000, // 10 second timeout
      });

      // Parse the SOAP response
      const result = await parseSoapResponse(response.data);

      // Validate if the result is a valid 13-digit ID
      if (/^\d{13}$/.test(result)) {
        setMessage(`Login successful, citizen ID: ${result}`);

        // Store the citizenId in localStorage
        localStorage.setItem('citizenId', result);

        // Second API call to retrieve user info using the citizenId
        const userInfoResponse = await axios.post('/webservice/getinfobycitizenid.php', null, {
          params: { citizenid: result, check: 'check' },
          timeout: 10000, // 10 second timeout
        });

        // Assuming the response is structured as an array of user info
        const userInfo = await userInfoResponse.data;

        // Now, send the data to your backend API to store it in the database
        await axios.post('${process.env.REACT_APP_API_BASE_URL}/saveOrUpdateUser', {
          username: modid,
          password: password,
          citizenId: result,
          rank: userInfo.Rank,
          firstName: userInfo.FirstName,
          lastName: userInfo.LastName,
          roster: userInfo.Roster,
          level1Department: userInfo.Level1Department,
          username: userInfo.UserName
        });

        // Redirect to StartScreen and pass the citizenId and user info as state
        navigate('/startscreen', { state: { citizenId: result, userInfo } });

      } else {
        setError('Login ไม่สำเร็จ กรุณาตรวจสอบ username หรือ password');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // More specific error messages
      if (error.code === 'ECONNABORTED') {
        setError('การเชื่อมต่อกับเซิร์ฟเวอร์ใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
      } else if (error.response) {
        // Server responded with error status
        if (error.response.status === 404) {
          setError('ไม่พบ SOAP service กรุณาตรวจสอบการตั้งค่าเซิร์ฟเวอร์');
        } else if (error.response.status === 500) {
          setError('เกิดข้อผิดพลาดในเซิร์ฟเวอร์ SOAP กรุณาลองใหม่อีกครั้ง');
        } else {
          setError(`เกิดข้อผิดพลาดในการเชื่อมต่อ (${error.response.status})`);
        }
      } else if (error.request) {
        // Network error
        setError('ไม่สามารถเชื่อมต่อกับ SOAP service ได้ กรุณาตรวจสอบการเชื่อมต่อเครือข่าย');
      } else {
        setError('Login failed, please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to parse the SOAP response
  const parseSoapResponse = async (xml) => {
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(xml);

    console.log(result);

    const soapBody = result['SOAP-ENV:Envelope']['SOAP-ENV:Body'];
    const soapResponse = soapBody['ns1:checkauthenticationResponse'];
    const returnData = soapResponse['return'];

    return returnData;
  };

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
                  src="/nmd.png" // Ensure this path is correct
                  width="245" // Keep width only, remove height
                  alt="BootstrapBrain Logo"
                />
                <hr className="border-primary-subtle mb-4" />
                <h2 className="info h1 mb-4">
                  การประเมินและวิเคราะห์สมรรถภาพทางจิต กำลังพล ทร. ประจำปีงบประมาณ ๖๖
                </h2>
                <p className="info lead mb-5">
                  กำลังพลกองทัพเรือ
                  มีสุขภาพดีเหมาะสมกับการปฏิบัติหน้าที่
                </p>
              </div>
            </div>
          </Col>

          {/* ส่วนของฟอร์มล็อกอินด้านขวา */}
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

                {/* ลิงก์เพิ่มเติม
                <div className="row">
                  <div className="col-12">
                    <div className="d-flex gap-2 gap-md-4 flex-column flex-md-row justify-content-md-end mt-4">
                      <a href="#!">Forgot password</a>
                    </div>
                  </div>
                </div> */}



                {/* ข้อความเพิ่มเติม */}
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
