// src/AssessmentPage.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, ProgressBar, Table } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import resultText from './result';

// Function to get interpretation based on average
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

const commonOptions = [
  "ระดับคะแนน 5 หมายถึง เห็นด้วยอย่างยิ่ง",
  "ระดับคะแนน 4 หมายถึง เห็นด้วย",
  "ระดับคะแนน 3 หมายถึง เห็นด้วยและ/หรือไม่เห็นด้วยในบางครั้ง",
  "ระดับคะแนน 2 หมายถึง ไม่เห็นด้วย",
  "ระดับคะแนน 1 หมายถึง ไม่เห็นด้วยอย่างยิ่ง"
];

const questions = [
  {
    questionText: "ส่วนที่1 (Hope) 1 ฉันจะกำหนดเป้าหมายที่ต้องการก่อนที่จะวางแผนทำสิ่งต่างๆ",
    options: commonOptions
  },
  {
    questionText: "2 ฉันมีเป้าหมายในชีวิตที่ชัดเจน",
    options: commonOptions
  },
  {
    questionText: "3 ฉันสามารถสร้างหรือค้นหาหนทางที่จะนำไปสู่เป้าหมายที่ตั้งไว้แม้จะพบกับอุปสรรค",
    options: commonOptions
  },
  {
    questionText: "4 ฉันสามารถหาวิธีที่จะหลีกเลี่ยงอุปสรรคที่ทำให้เกิดความรู้สึกเครียดได้",
    options: commonOptions
  },
  {
    questionText: "5 ฉันสามารถหาทางที่จะทำให้ตนเองรู้สึกสบายใจได้",
    options: commonOptions
  },
  {
    questionText: "6 ฉันมุ่งมั่นที่จะทำสิ่งต่างๆ ให้บรรลุเป้าหมาย",
    options: commonOptions
  },
  {
    questionText: "7 เมื่อมีปัญหาเกิดขึ้น ฉันก็ยังคงมุ่งมั่นที่จะไปให้ถึงเป้าหมายที่ได้ตั้งไว้",
    options: commonOptions
  },
  {
    questionText: "8 จากประสบการณ์ที่ผ่านมา ทำให้ฉันมีแรงจูงใจที่จะพบกับอนาคตที่ดี",
    options: commonOptions
  },
  {
    questionText: "9 เมื่อเหตุการณ์ไม่เป็นไปตามที่หวังไว้ ฉันยังคงสามารถให้กำลังใจกับตัวเองได้",
    options: commonOptions
  },
  {
    questionText: "10 ในสถานการณ์ที่มีข้อจำกัดมากมาย ยิ่งทำให้ฉันเกิดพลังที่จะมุ่งไปให้ถึงเป้าหมาย",
    options: commonOptions
  },
  {
    questionText: "ส่วนที่2 (Self-efficacy) 11 ฉันสามารถบอกได้ว่าตัวเองเก่งหรือโดดเด่นด้านใด",
    options: commonOptions
  },
  {
    questionText: "12 ฉันเชื่อมั่นว่าการประสบความสำเร็จในครั้งก่อนจะทำให้ฉันประสบความสำเร็จในครั้งต่อๆไปได้อีก",
    options: commonOptions
  },
  {
    questionText: "13 ฉันมั่นใจว่าจะสามารถรับมือกับเหตุการณ์ต่างๆ ในชีวิตของฉันได้",
    options: commonOptions
  },
  {
    questionText: "14 เมื่อเกิดอุปสรรคขึ้น ฉันจะไม่ละทิ้งเป้าหมายที่ตั้งไว้เพราะฉันเชื่อมั่นในความสามารถของตนเอง",
    options: commonOptions
  },
  {
    questionText: "15 ความเชื่อมั่นในความสามารถของตนเองทำให้ฉันประสบความสำเร็จ",
    options: commonOptions
  },
  {
    questionText: "16 ฉันเชื่อมั่นว่าได้ใช้ความสามารถของตัวเองในการทำสิ่งต่างๆอย่างเต็มศักยภาพ",
    options: commonOptions
  },
  {
    questionText: "17 ฉันยังคงมั่นใจในความสามารถของตัวเอง แม้จะอยู่ในสถานการณ์ที่ยากลำบาก",
    options: commonOptions
  },
  {
    questionText: "18 ฉันเชื่อมั่นว่าตนเองสามารถฝึกฝนและเรียนรู้สิ่งต่างๆได้",
    options: commonOptions
  },
  {
    questionText: "19 ถ้าคนอื่นสามารถทำสิ่งนั้นได้ ฉันก็สามารถทำได้เช่นกัน",
    options: commonOptions
  },
  {
    questionText: "20 ฉันมั่นใจในการแสดงความคิดเห็นของตนเองในกลุ่มบุคคลอื่น",
    options: commonOptions
  },
  {
    questionText: "21 ฉันมั่นใจในการแสดงความคิดเห็นของตนเองที่แตกต่างจากกลุ่มได้",
    options: commonOptions
  },
  {
    questionText: "22 ฉันมั่นใจว่าสามารถทำงานร่วมกับผู้อื่นๆได้",
    options: commonOptions
  },
  {
    questionText: "ส่วนที่ 3 (Resilience) 23 แม้จะดูเหมือนสิ้นหวังแต่ฉันก็จะไม่ยอมแพ้",
    options: commonOptions
  },
  {
    questionText: "24 อุปสรรคทำให้ฉันได้เรียนรู้เพื่อฝึกฝนตนเอง",
    options: commonOptions
  },
  {
    questionText: "25 ความลำบากทำให้ฉันเข้มแข็ง",
    options: commonOptions
  },
  {
    questionText: "26 แม้ว่าจะเกิดความล้มเหลว แต่ฉันก็จะลุกขึ้นมาสู้ใหม่",
    options: commonOptions
  },
  {
    questionText: "27 ในเวลาที่ต้องการความช่วยเหลือ ฉันรู้ว่าผู้ใดจะช่วยฉันได้",
    options: commonOptions
  },
  {
    questionText: "28 เมื่อฉันทุกข์ใจฉันมีคนคอยเป็นกำลังใจให้",
    options: commonOptions
  },
  {
    questionText: "29 เมื่อฉันทำผิดพลาด ฉันสามารถยอมรับผลที่ตามมาได้",
    options: commonOptions
  },
  {
    questionText: "30 ฉันยอมรับได้ ถ้ามีคนไม่ชอบฉันบ้าง",
    options: commonOptions
  },
  {
    questionText: "31 ฉันยอมรับในความแตกต่างของแต่ละบุคคล",
    options: commonOptions
  },
  {
    questionText: "32 ฉันเชื่อว่าทุกข์และสุขเป็นเรื่องธรรมดาของชีวิต",
    options: commonOptions
  },
  {
    questionText: "33 ฉันเชื่อว่าทุกคนย่อมมีเหตุผลของตนเอง",
    options: commonOptions
  },
  {
    questionText: "34 ฉันเชื่อว่าทุกเหตุการณ์ที่เกิดขึ้นย่อมมีเหตุผล",
    options: commonOptions
  },
  {
    questionText: "ส่วนที่ 4 (Optimism) 35 ฉันคาดว่าจะมีสิ่งดีๆ เกิดขึ้นกับตัวเองเสมอ",
    options: commonOptions
  },
  {
    questionText: "36 ฉันสามารถชื่นชมผู้อื่นที่ประสบความสำเร็จ",
    options: commonOptions
  },
  {
    questionText: "37 ฉันชื่นชมและนึกถึงสิ่งดีๆที่เข้ามาในชีวิตอยู่เสมอ",
    options: commonOptions
  },
  {
    questionText: "38 ฉันเห็นมุมมองทางด้านบวก เพื่อให้กำลังใจตัวเอง เมื่อต้องประสบกับปัญหา ",
    options: commonOptions
  },
  {
    questionText: "39 ฉันเชื่อว่าอนาคตจะมีสิ่งที่ดีรออยู่",
    options: commonOptions
  },
  {
    questionText: "40 ข้อดีของความผิดพลาดคือการทำให้ฉันได้เรียนรู้",
    options: commonOptions
  },
  {
    questionText: "41 ฉันคาดหวังว่าจะประสบความสำเร็จในสิ่งที่ทำอยู่",
    options: commonOptions
  },
  {
    questionText: "42 ฉันพอใจในความเป็นตัวของฉันเอง",
    options: commonOptions
  },
  {
    questionText: "43 ฉันเชื่อว่าทุกคนล้วนมีข้อดี",
    options: commonOptions
  },
  {
    questionText: "44 ฉันเชื่อว่าคนในสังคมส่วนใหญ่เป็นคนดี",
    options: commonOptions
  },
];

const AssessmentPage = ({ citizenId }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState(Array(questions.length).fill(0));
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkCitizenIdAndResults = async () => {
      const storedCitizenId = localStorage.getItem('citizenId');
      if (!storedCitizenId) {
        // Navigate to the home page if citizenId is not found
        navigate('/');
      } else {
        try {
          const response = await axios.get(`http://10.10.19.50:5000/getAssessmentResults/${storedCitizenId}`);
          if (response.data) {
            // If assessment results exist, navigate to the report page
            navigate('/reportuser');
          }
        } catch (error) {
          console.error('Error fetching assessment results:', error);
          // You might want to handle errors here, like navigating to an error page
        }
      }
    };

    checkCitizenIdAndResults();
  }, [navigate]);

  const handleOptionClick = (index) => {
    const newScores = [...scores];
    newScores[currentQuestionIndex] = 5 - index;
    setScores(newScores);
    handleNextQuestion();
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateCategoryScore = (start, end) => {
    return scores.slice(start, end).reduce((total, score) => total + score, 0);
  };

  const hopeScore = calculateCategoryScore(0, 10);
  const selfEfficacyScore = calculateCategoryScore(10, 22);
  const resilienceScore = calculateCategoryScore(22, 34);
  const optimismScore = calculateCategoryScore(34, 44);

  const hopeAverage = (hopeScore / 10).toFixed(2);
  const selfEfficacyAverage = (selfEfficacyScore / 12).toFixed(2);
  const resilienceAverage = (resilienceScore / 12).toFixed(2);
  const optimismAverage = (optimismScore / 10).toFixed(2);

  const overallAverage = (
    (parseFloat(hopeAverage) +
      parseFloat(selfEfficacyAverage) +
      parseFloat(resilienceAverage) +
      parseFloat(optimismAverage)) / 4
  ).toFixed(2);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsCompleted(true);
    }
  };
  const handleBackQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Function to handle the save button click
  const handleSaveClick = async () => {
    const citizenIdFromStorage = localStorage.getItem('citizenId') || citizenId;
    if (!citizenIdFromStorage) {
      console.error('Citizen ID is not available');
      return;
    }
  
    try {
      await axios.post('http://10.10.19.50:5000/saveAssessmentResults', {
        citizenId: citizenIdFromStorage,
        hopeScore,
        selfEfficacyScore,
        resilienceScore,
        optimismScore,
        hopeAverage,
        selfEfficacyAverage,
        resilienceAverage,
        optimismAverage,
        overallAverage,
      });
      setIsSaved(true); // Set the isSaved state to true
      console.log('Assessment results saved successfully');
    } catch (error) {
      console.error('Error saving assessment results:', error);
    }
  };
  

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setScores(Array(questions.length).fill(0));
    setIsCompleted(false);
    setIsSaved(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('citizenId');
    navigate('/');
  };


  return (
    <Container className="mt-4">
      {isCompleted ? (
        <Container className="text-center">
          <h2>การประเมินเสร็จสิ้น</h2>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>ประเภทการประเมิน</th>
                <th>คะแนน</th>
                <th>ค่าเฉลี่ย</th>
                <th>ผลลัพธ์</th>
                <th>สรุป</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>คุณลักษณะของการมีความหวัง</td>
                <td>{hopeScore}</td>
                <td>{hopeAverage}</td>
                <td style={{ color: getInterpretation(hopeAverage).color }}>
                  {resultText.hope[getInterpretation(hopeAverage).resultKey]}
                </td>
                <td>{getInterpretation(hopeAverage).interpretation}</td>
              </tr>
              <tr>
                <td>คุณลักษณะของความเชื่อมั่นในศักยภาพของตนเอง</td>
                <td>{selfEfficacyScore}</td>
                <td>{selfEfficacyAverage}</td>
                <td style={{ color: getInterpretation(selfEfficacyAverage).color }}>
                  {resultText.selfEfficacy[getInterpretation(selfEfficacyAverage).resultKey]}
                </td>
                <td>{getInterpretation(selfEfficacyAverage).interpretation}</td>
              </tr>
              <tr>
                <td>คุณลักษณะของการมีความยืดหยุ่นเมื่อเผชิญสิ่งที่ยากลำบาก</td>
                <td>{resilienceScore}</td>
                <td>{resilienceAverage}</td>
                <td style={{ color: getInterpretation(resilienceAverage).color }}>
                  {resultText.resilience[getInterpretation(resilienceAverage).resultKey]}
                </td>
                <td>{getInterpretation(resilienceAverage).interpretation}</td>
              </tr>
              <tr>
                <td>คุณลักษณะของการมองโลกในแง่ดี</td>
                <td>{optimismScore}</td>
                <td>{optimismAverage}</td>
                <td style={{ color: getInterpretation(optimismAverage).color }}>
                  {resultText.optimism[getInterpretation(optimismAverage).resultKey]}
                </td>
                <td>{getInterpretation(optimismAverage).interpretation}</td>
              </tr>
              <tr>
                <td><strong>ต้นทุนทางจิตวิทยาโดยภาพรวม</strong></td>
                <td colSpan="3"><strong>{overallAverage}</strong></td>
                <td>{getInterpretation(overallAverage).interpretation}</td>
              </tr>
            </tbody>
          </Table>
          <Button variant="primary" onClick={handleRestart}>ทำแบบประเมินอีกครั้ง</Button>{' '}
          <Button variant="danger" onClick={handleLogout}>ออกจากระบบ</Button>{' '}
          <Button variant="success" onClick={handleSaveClick}>ส่งผลการประเมิน</Button>
          {isSaved && <p>ผลการประเมินถูกบันทึกแล้ว</p>}

        </Container>
      ) : (
        <div>
          <Container className="p-4">
            <Row>
              <Col
                md={6}
                className="d-flex flex-column align-items-center"
                style={{ borderRadius: '15px', overflow: 'hidden' }}
              >
                <img
                  src="https://naluri-static.naluri.net/web-onboarding/DASS-Question-Intro.png"
                  alt="Illustration"
                  className="img-fluid"
                  style={{ borderRadius: '15px' }}
                />
                {/* ProgressBar อยู่ใต้รูปภาพ */}
                <ProgressBar
                  now={(currentQuestionIndex + 1) / questions.length * 100}
                  className="mt-3 w-100"
                />
              </Col>
              <Col
                md={6}
                className="p-4"
                style={{ backgroundColor: '#1B837C', borderRadius: '15px' }}
              >
                <h3 className="mb-4 text-white">{questions[currentQuestionIndex].questionText}</h3>
                {questions[currentQuestionIndex].options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline-light"
                    className="mb-3 w-100 text-start"
                    style={{ borderRadius: '15px' }}
                    onClick={() => handleOptionClick(index)}
                  >
                    {scores[currentQuestionIndex] === 5 - index && '✔️ '} {/* Show checkmark if selected */}
                    {option}
                  </Button>
                ))}

                {currentQuestionIndex > 0 && (
                  <Button
                    variant="light"
                    className="mt-3 w-100 text-start"
                    style={{ borderRadius: '15px' }}
                    onClick={handleBackQuestion}
                  >
                    กลับ
                  </Button>
                )}
              </Col>
            </Row>
          </Container>

        </div>

      )}
    </Container>
  );
};

export default AssessmentPage;
