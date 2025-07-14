const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const util = require('util');
require('dotenv').config() // ตรวจสอบว่า .env ถูกโหลดถูกต้อง หากใช้ Docker Compose ค่าจะมาจาก environment ใน compose.yml

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- เพิ่มส่วนนี้สำหรับ Retry Logic ของ MySQL Connection ---
const MAX_RETRIES = 15; // อาจจะเพิ่มจำนวนครั้งที่ลองใหม่
const RETRY_DELAY_MS = 5000; // 5 วินาที ระหว่างการลองแต่ละครั้ง

let db; // ประกาศตัวแปร db ไว้ที่ Global scope

function connectDB(retries = 0) {
    if (retries >= MAX_RETRIES) {
        console.error('Failed to connect to MySQL after multiple retries. Exiting Node.js process.');
        // หากเชื่อมต่อไม่ได้จริงๆ อาจต้องสั่งให้ process จบการทำงาน หรือแจ้งเตือน
        process.exit(1); 
    }

    db = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    db.connect(err => {
        if (err) {
            console.log(`Database connection error (attempt ${retries + 1}/${MAX_RETRIES}):`, err.code);
            console.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
            setTimeout(() => connectDB(retries + 1), RETRY_DELAY_MS);
        } else {
            console.log('Connected to MySQL');
            // กำหนดค่า query หลังจากเชื่อมต่อสำเร็จแล้ว
            exports.query = util.promisify(db.query).bind(db); 
            // ตอนนี้ db.query() สามารถใช้งานแบบ await ได้แล้ว
        }
    });
}

// เรียกใช้ฟังก์ชันเชื่อมต่อ DB เมื่อแอปพลิเคชันเริ่มต้น
connectDB();
// --- สิ้นสุดส่วนที่เพิ่มสำหรับ Retry Logic ---


const query = util.promisify(db.query).bind(db); // ***ย้ายบรรทัดนี้ไปใน connectDB เมื่อเชื่อมต่อสำเร็จ***
// เนื่องจาก db จะเป็น undefined ในตอนแรก ถ้าเชื่อมต่อยังไม่สำเร็จ
// ตัวอย่างการย้ายอยู่ในฟังก์ชัน connectDB ด้านบน

const secretKey = process.env.JWT_SECRET || 'your_secret_key';

// ... (Routes และ Logic ส่วนที่เหลือเหมือนเดิม) ...
// Route to save or update user data
app.post('/saveOrUpdateUser', async (req, res) => {
  const { citizenId, rank, firstName, lastName, personType, roster, department, rosterName, level1Department } = req.body;

  try {
    // แก้ไข: ใส่ Backticks (`) ครอบ 'rank' ทั้งในส่วน INSERT และ ON DUPLICATE KEY UPDATE
    const queryString = `
      INSERT INTO users (citizenId, \`rank\`, firstName, lastName, personType, roster, department, rosterName, level1Department)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      \`rank\` = VALUES(\`rank\`),
      firstName = VALUES(firstName),
      lastName = VALUES(lastName),
      personType = VALUES(personType),
      roster = VALUES(roster),
      department = VALUES(department),
      rosterName = VALUES(rosterName),
      level1Department = VALUES(level1Department);
    `;

    // ตรวจสอบ: Make sure 'query' function is correctly defined and available,
    // and it handles prepared statements with an array of values.
    await query(queryString, [citizenId, rank, firstName, lastName, personType, roster, department, rosterName, level1Department]);

    res.status(200).send({ message: 'User data saved successfully' });
  } catch (error) {
    console.error('Database error:', error); // Log ข้อผิดพลาดของฐานข้อมูล
    res.status(500).send({ message: 'Error saving user data' }); // ส่งข้อความผิดพลาดกลับไป
  }
});

// Route to save or update assessment results
// Route to save or update assessment results
app.post('/saveAssessmentResults', async (req, res) => {
  const {
    citizenId,
    hopeScore,
    selfEfficacyScore,
    resilienceScore,
    optimismScore,
    hopeAverage,
    selfEfficacyAverage,
    resilienceAverage,
    optimismAverage,
    overallAverage,
  } = req.body;

  if (!citizenId) {
    return res.status(400).send({ message: 'Citizen ID is required' });
  }

  try {
    const queryString = `
      INSERT INTO assessment_results 
        (citizenId, hopeScore, selfEfficacyScore, resilienceScore, optimismScore, hopeAverage, selfEfficacyAverage, resilienceAverage, optimismAverage, overallAverage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        hopeScore = VALUES(hopeScore),
        selfEfficacyScore = VALUES(selfEfficacyScore),
        resilienceScore = VALUES(resilienceScore),
        optimismScore = VALUES(optimismScore),
        hopeAverage = VALUES(hopeAverage),
        selfEfficacyAverage = VALUES(selfEfficacyAverage),
        resilienceAverage = VALUES(resilienceAverage),
        optimismAverage = VALUES(optimismAverage),
        overallAverage = VALUES(overallAverage);
    `;

    await query(queryString, [
      citizenId,
      hopeScore,
      selfEfficacyScore,
      resilienceScore,
      optimismScore,
      hopeAverage,
      selfEfficacyAverage,
      resilienceAverage,
      optimismAverage,
      overallAverage,
    ]);

    res.status(200).send({ message: 'Assessment results saved successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).send({ message: 'Error saving assessment results' });
  }
});




// Route to generate report with data from both users and assessment_results
app.get('/report', async (req, res) => {
  const criteria = {
    hope: 33,            // Changed from 50 to 3.41
    selfEfficacy: 41,    // Changed from 50 to 3.41
    resilience: 41,      // Changed from 50 to 3.41
    optimism: 33         // Changed from 50 to 3.41
  };

  try {
    const queryString = `
      SELECT 
        u.level1Department,
        COUNT(*) AS totalAssessors,
        (SUM(CASE WHEN a.hopeScore >= ? THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS hopePassPercentage,
        (SUM(CASE WHEN a.selfEfficacyScore >= ? THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS selfEfficacyPassPercentage,
        (SUM(CASE WHEN a.resilienceScore >= ? THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS resiliencePassPercentage,
        (SUM(CASE WHEN a.optimismScore >= ? THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS optimismPassPercentage
      FROM assessment_results a
      JOIN users u ON a.citizenId = u.citizenId
      GROUP BY u.level1Department
    `;

    console.log('Running query:', queryString); // Log query

    const results = await query(queryString, [
      criteria.hope,
      criteria.selfEfficacy,
      criteria.resilience,
      criteria.optimism
    ]);

    console.log('Results:', results); // Log results

    res.status(200).json(results);
  } catch (error) {
    console.error('Database error:', error); // Log error details
    res.status(500).send({ message: 'Error generating report', error: error.message });
  }
});


app.get('/getAssessmentResults/:citizenId', async (req, res) => {
  const { citizenId } = req.params;
  try {
    const results = await query(
      `SELECT hopeScore, selfEfficacyScore, resilienceScore, optimismScore, hopeAverage, selfEfficacyAverage, resilienceAverage, optimismAverage, overallAverage 
       FROM assessment_results 
       WHERE citizenId = ?`,
      [citizenId]
    );
    if (results.length > 0) {
      res.json(results[0]); // Send back the assessment results including raw scores
    } else {
      res.status(404).json({ message: 'No assessment results found for this citizen ID.' });
    }
  } catch (error) {
    console.error('Error fetching assessment results:', error);
    res.status(500).json({ error: 'Error fetching assessment results' });
  }
});
// Start the server (ควรจะเริ่ม Server หลังจากมั่นใจว่า DB พร้อม)
// แต่ใน Node.js app ทั่วไป มักจะรัน server ทันที
// และให้ retry logic จัดการการเชื่อมต่อ DB
app.listen(5000, () => {
  console.log('Server running on port 5000');
});