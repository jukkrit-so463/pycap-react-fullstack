import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';


const StartScreen = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  // ดึง citizenId จาก localStorage
  const citizenId = localStorage.getItem('citizenId');

  const handleStart = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/getAssessmentResults/${citizenId}`);
      if (response.data) {
        // If assessment results exist, navigate to the report page
        navigate('/reportuser');
      } else {
        // If no results, navigate to the assessment page
        navigate('/assessment');
      }
    } catch (error) {
      console.error('Error fetching assessment results:', error);
      setError('Failed to fetch assessment results.');
      // In case of error, redirect to assessment page
      navigate('/assessment');
    }
  };

  // ฟังก์ชันสำหรับการออกจากระบบ
  const handleLogout = () => {
    // ลบ citizenId ออกจาก localStorage
    localStorage.removeItem('citizenId');
    // นำทางผู้ใช้กลับไปยังหน้าเริ่มต้นหรือหน้าล็อกอิน
    navigate('/');
  };


  useEffect(() => {
    const fetchData = async () => {
      if (!citizenId) {
        setError('No citizen ID provided.');
        return;
      }

      try {
        const response = await axios.post('/webservice/testgetinfobycitizenid.php', null, {
          params: { citizenid: citizenId, check: 'check' },
          headers: { Accept: '*/*' },
        });

        const arrayDataMatch = response.data.match(/Array\s*\(([^)]+)\)/);
        if (arrayDataMatch) {
          const arrayData = arrayDataMatch[1]
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.includes('=>'))
            .reduce((acc, line) => {
              const [key, value] = line.split('=>').map(item => item.trim());
              acc[key.replace(/[\[\]]/g, '')] = value;
              return acc;
            }, {});

          const filteredData = {
            Rank: arrayData['Rank'],
            FirstName: arrayData['FirstName'],
            LastName: arrayData['LastName'],
            PersonType: arrayData['PersonType'],
            Roster: arrayData['Roster'],
            Department: arrayData['Department'],
            RosterName: arrayData['RosterName'],
            Level1Department: arrayData['Level1Department'],
          };

          setUserInfo(filteredData);

          await axios.post('${process.env.REACT_APP_API_BASE_URL}/saveOrUpdateUser', {
            citizenId: citizenId,
            rank: filteredData.Rank,
            firstName: filteredData.FirstName,
            lastName: filteredData.LastName,
            personType: filteredData.PersonType,
            roster: filteredData.Roster,
            department: filteredData.Department,
            rosterName: filteredData.RosterName,
            level1Department: filteredData.Level1Department,
          });
        } else {
          setError('Unable to parse array data.');
        }
      } catch (error) {
        console.error('Data fetch error:', error);
        setError('Failed to fetch data.');
      }
    };

    fetchData();
  }, [citizenId]);



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

        {/* Existing content */}
        <Button variant="success" size="lg" onClick={handleStart}>
          <h5>เข้าสู่การทำแบบประเมิน</h5>
        </Button>
        {/* Existing content */}
        {' '}
        {/* Existing content */}
        <Button variant="danger" size="lg" onClick={handleLogout }>
          <h5>ออกจากระบบ</h5>
        </Button>
        {/* Existing content */}


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
