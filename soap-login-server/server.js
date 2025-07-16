const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const util = require('util');
require('dotenv').config();

const jwt = require('jsonwebtoken'); // เพิ่ม: สำหรับ JWT
const cookieParser = require('cookie-parser'); // เพิ่ม: สำหรับจัดการ Cookie

const app = express();

// --- Security Headers ---
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// --- CORS Configuration ---
// Allow credentials for HttpOnly cookies. Specify exact origin in production.
app.use(cors({
    origin: 'http://localhost:3000', // **สำคัญมาก: เปลี่ยนเป็นโดเมน Frontend ของคุณใน Production**
    methods: ['GET', 'POST'],
    credentials: true // อนุญาตให้ส่ง Cookie ข้าม Origin ได้
}));

app.use(bodyParser.json());
app.use(cookieParser()); // เพิ่ม: ใช้ cookie-parser

// --- MySQL Connection Retry Logic ---
const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 5000;
let db;
let databaseConnected = false;

function connectDB(retries = 0) {
    if (retries >= MAX_RETRIES) {
        console.error('Failed to connect to MySQL after multiple retries. Exiting Node.js process.');
        process.exit(1);
    }

    db = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        // ssl: { rejectUnauthorized: false } // uncomment if using SSL/TLS with MySQL
    });

    db.connect(err => {
        if (err) {
            console.log(`Database connection error (attempt ${retries + 1}/${MAX_RETRIES}):`, err.code);
            console.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
            setTimeout(() => connectDB(retries + 1), RETRY_DELAY_MS);
        } else {
            console.log('Connected to MySQL');
            exports.query = util.promisify(db.query).bind(db);
            databaseConnected = true;
        }
    });
}
connectDB();

// Middleware to ensure database is connected
app.use((req, res, next) => {
    if (!databaseConnected) {
        return res.status(503).send({ message: 'Service Unavailable: Database connection not established.' });
    }
    next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_please_change_in_production_env'; // **สำคัญ: ต้องเปลี่ยนใน .env ให้เป็นคีย์ที่ซับซ้อนและยาว**

// --- Middleware สำหรับตรวจสอบ JWT (Authentication) ---
const authenticateToken = (req, res, next) => {
    // ดึง Token จาก HttpOnly Cookie
    const token = req.cookies.jwt_token;

    if (!token) {
        return res.status(401).send({ message: 'Access Denied: No Token Provided.' });
    }

    try {
        // ตรวจสอบและถอดรหัส Token
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // เก็บข้อมูลผู้ใช้ที่ถอดรหัสได้ไว้ใน req.user
        next(); // ไปยัง Route ถัดไป
    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        // ลบ Cookie หาก Token ไม่ถูกต้องหรือหมดอายุ
        res.clearCookie('jwt_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // ต้องเป็น true ใน production (HTTPS)
            sameSite: 'Lax', // หรือ 'None' ถ้ามีการส่งข้ามโดเมนที่ต่างกันมากๆ
        });
        return res.status(403).send({ message: 'Invalid Token.' });
    }
};

// --- New Login Endpoint ---
app.post('/login', async (req, res) => {
    const { modid, password } = req.body;

    if (!modid || !password) {
        return res.status(400).send({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }

    // สร้าง SOAP Request เหมือนเดิม (สมมติว่า service นี้อยู่ใน Backend เดียวกัน หรือเข้าถึงได้จาก Backend)
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
        // Call external SOAP service for authentication (assuming axios is available for backend too)
        const axios = require('axios'); // ต้องมั่นใจว่า axios ถูก require ไว้ด้วย
        const xml2js = require('xml2js'); // ต้องมั่นใจว่า xml2js ถูก require ไว้ด้วย

        const response = await axios.post('http://frontend/webservice/checkauthentication.php', soapRequest, { // **สำคัญ: เปลี่ยน URL SOAP service ให้ถูกต้อง**
            headers: {
                'Content-Type': 'text/xml',
                'SOAPAction': 'uri:checkauthentication',
            },
            timeout: 10000,
        });

        const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
        const result = await parser.parseStringPromise(response.data);

        const soapBody = result['SOAP-ENV:Envelope']['SOAP-ENV:Body'];
        const soapResponse = soapBody['ns1:checkauthenticationResponse'];
        const citizenId = soapResponse['return'];

        if (citizenId && /^\d{13}$/.test(citizenId)) {
            // Login successful with SOAP, now get user info from SOAP service
            const userInfoResponse = await axios.post('http://frontend/webservice/getinfobycitizenid.php', null, { // **สำคัญ: เปลี่ยน URL SOAP service ให้ถูกต้อง**
                params: { citizenid: citizenId, check: 'check' },
                timeout: 10000,
            });
            const userInfo = userInfoResponse.data;

            // Optional: Save/Update user info in your local DB
            // This logic is already in /saveOrUpdateUser, consider calling it internally
            // or making sure necessary fields are present for JWT payload.
            // For simplicity, we'll use a subset of info for JWT
            const userPayload = {
                citizenId: citizenId,
                modid: modid,
                firstName: userInfo.FirstName,
                lastName: userInfo.LastName,
                rank: userInfo.Rank,
                level1Department: userInfo.Level1Department,
                // Add any other crucial info needed for future requests
            };

            // Create JWT
            const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' }); // Token หมดอายุใน 1 ชั่วโมง

            // Set JWT as an HttpOnly cookie
            res.cookie('jwt_token', token, {
                httpOnly: true, // ทำให้ JavaScript เข้าถึงไม่ได้ (ป้องกัน XSS)
                secure: process.env.NODE_ENV === 'production', // ใช้ HTTPS เท่านั้นใน Production
                sameSite: 'Lax', // หรือ 'Strict' หรือ 'None' (ต้องใช้ secure: true ด้วย)
                maxAge: 3600000, // 1 ชั่วโมง (ใน milliseconds)
            });

            // Send back a success message and perhaps limited user info (without citizenId directly)
            res.status(200).json({
                message: 'Login successful!',
                userInfo: {
                    firstName: userInfo.FirstName,
                    lastName: userInfo.LastName,
                    rank: userInfo.Rank,
                    level1Department: userInfo.Level1Department,
                },
                // Do NOT send the token in the response body if you're using HttpOnly cookies.
                // It defeats the purpose of HttpOnly.
            });

        } else {
            res.status(401).send({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
    } catch (error) {
        console.error('Login error:', error);
        // Generic error message to user
        let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง';
        if (error.code === 'ECONNABORTED') {
            errorMessage = 'การเชื่อมต่อกับบริการยืนยันตัวตนใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
        } else if (error.response && error.response.status === 404) {
            errorMessage = 'ไม่พบ SOAP service กรุณาตรวจสอบการตั้งค่าเซิร์ฟเวอร์';
        } else if (error.response) {
            errorMessage = `เกิดข้อผิดพลาดในการเชื่อมต่อบริการยืนยันตัวตน (${error.response.status})`;
        } else if (error.request) {
            errorMessage = 'ไม่สามารถเชื่อมต่อกับบริการยืนยันตัวตนได้ กรุณาตรวจสอบการเชื่อมต่อเครือข่าย';
        }
        res.status(500).send({ message: errorMessage });
    }
});

// --- Logout Endpoint ---
app.post('/logout', (req, res) => {
    res.clearCookie('jwt_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
    });
    res.status(200).send({ message: 'Logged out successfully.' });
});

// --- Protected Routes (ใช้ authenticateToken Middleware) ---
// Route to save or update user data
// ตรวจสอบว่ามี JWT ก่อนเข้าถึง
app.post('/saveOrUpdateUser', authenticateToken, async (req, res) => {
    // ดึง citizenId จาก JWT payload แทนที่จะรับจาก req.body โดยตรง
    const citizenIdFromToken = req.user.citizenId;
    const { rank, firstName, lastName, personType, roster, department, rosterName, level1Department } = req.body;

    // ใช้ citizenId จาก Token ในการอัปเดตข้อมูลเสมอ เพื่อป้องกันการแก้ไขข้อมูลผู้ใช้คนอื่น
    const citizenId = citizenIdFromToken;

    if (!citizenId || !firstName || !lastName || !rank || !level1Department) {
        return res.status(400).send({ message: 'Missing required user information.' });
    }

    try {
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
        await exports.query(queryString, [citizenId, rank, firstName, lastName, personType, roster, department, rosterName, level1Department]);
        res.status(200).send({ message: 'User data saved successfully' });
    } catch (error) {
        console.error('Database error in /saveOrUpdateUser:', error);
        res.status(500).send({ message: 'Error saving user data. Please try again later.' });
    }
});

// Route to save or update assessment results
app.post('/saveAssessmentResults', authenticateToken, async (req, res) => {
    const citizenIdFromToken = req.user.citizenId; // ใช้ citizenId จาก Token
    const {
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

    const citizenId = citizenIdFromToken; // ใช้ citizenId จาก Token

    if (!citizenId) { // This check might be redundant if token verification ensures citizenId
      return res.status(400).send({ message: 'Citizen ID is required from token.' });
    }

    const numericFields = { hopeScore, selfEfficacyScore, resilienceScore, optimismScore, hopeAverage, selfEfficacyAverage, resilienceAverage, optimismAverage, overallAverage };
    for (const key in numericFields) {
        const value = numericFields[key];
        if (typeof value === 'undefined' || value === null || isNaN(Number(value))) {
            return res.status(400).send({ message: `Invalid or missing data for ${key}. Please provide a numeric value.` });
        }
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
        await exports.query(queryString, [
            citizenId, hopeScore, selfEfficacyScore, resilienceScore, optimismScore,
            hopeAverage, selfEfficacyAverage, resilienceAverage, optimismAverage, overallAverage,
        ]);
        res.status(200).send({ message: 'Assessment results saved successfully' });
    } catch (error) {
        console.error('Database error in /saveAssessmentResults:', error);
        res.status(500).send({ message: 'Error saving assessment results. Please try again later.' });
    }
});

// Route to generate report
app.get('/report', authenticateToken, async (req, res) => {
   const criteria = { hope: 33, selfEfficacy: 41, resilience: 41, optimism: 33 };
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
     const results = await exports.query(queryString, [
       criteria.hope, criteria.selfEfficacy, criteria.resilience, criteria.optimism
     ]);
     res.status(200).json(results);
   } catch (error) {
     console.error('Database error in /report:', error);
     res.status(500).send({ message: 'Error generating report. Please try again later.', error: error.message });
   }
});

app.get('/getAssessmentResults/:citizenId', authenticateToken, async (req, res) => {
   // ตรวจสอบว่า citizenId ที่ร้องขอตรงกับ citizenId ใน Token หรือไม่ (ป้องกันการดึงข้อมูลของคนอื่น)
   const requestedCitizenId = req.params.citizenId;
   const citizenIdFromToken = req.user.citizenId;

   if (requestedCitizenId !== citizenIdFromToken) {
       return res.status(403).json({ message: 'Forbidden: You can only view your own assessment results.' });
   }

   if (!requestedCitizenId || !/^\d{13}$/.test(requestedCitizenId)) {
     return res.status(400).json({ message: 'Invalid Citizen ID format.' });
   }

   try {
     const results = await exports.query(
       `SELECT hopeScore, selfEfficacyScore, resilienceScore, optimismScore, hopeAverage, selfEfficacyAverage, resilienceAverage, optimismAverage, overallAverage
        FROM assessment_results
        WHERE citizenId = ?`,
       [requestedCitizenId]
     );
     if (results.length > 0) {
       res.json(results[0]);
     } else {
       res.status(404).json({ message: 'No assessment results found for this citizen ID.' });
     }
   } catch (error) {
     console.error('Error fetching assessment results:', error);
     res.status(500).json({ error: 'Error fetching assessment results. Please try again later.' });
   }
});

app.get('/user-profile', authenticateToken, async (req, res) => {
  // ข้อมูลผู้ใช้ (citizenId, firstName, etc.) ถูกเก็บไว้ใน req.user โดย authenticateToken middleware
  const { citizenId, modid, firstName, lastName, rank, level1Department } = req.user;

  try {
      // คุณสามารถเลือกได้ว่าจะ:
      // 1. ดึงข้อมูลจากฐานข้อมูลของคุณเอง (users table) เพื่อความรวดเร็ว
      // 2. เรียก SOAP service อีกครั้งเพื่อดึงข้อมูลที่สดใหม่ (ถ้าจำเป็น)
      // สำหรับตัวอย่างนี้ เราจะส่งข้อมูลที่อยู่ใน JWT Payload กลับไปเลย
      // หากต้องการข้อมูลเพิ่มเติมที่ไม่ได้อยู่ใน JWT เช่น PersonType, Roster, Department, RosterName
      // คุณจะต้อง Query จาก DB หรือเรียก SOAP service อีกครั้ง

      // ตัวอย่างการเรียก SOAP service อีกครั้งเพื่อดึงข้อมูลเต็ม
      const axios = require('axios');
      const xml2js = require('xml2js');
      const soapServiceBaseUrl = process.env.SOAP_SERVICE_URL || 'http://host.docker.internal'; // ควรดึงจาก env

      const userInfoResponse = await axios.post(`${soapServiceBaseUrl}/webservice/testgetinfobycitizenid.php`, null, {
          params: { citizenid: citizenId, check: 'check' },
          headers: { Accept: '*/*' },
      });

      // Parse SOAP response (เหมือนใน Login endpoint)
      const arrayDataMatch = userInfoResponse.data.match(/Array\s*\(([^)]+)\)/);
      let fullUserInfo = {};
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

          fullUserInfo = {
              Rank: arrayData['Rank'],
              FirstName: arrayData['FirstName'],
              LastName: arrayData['LastName'],
              PersonType: arrayData['PersonType'],
              Roster: arrayData['Roster'],
              Department: arrayData['Department'],
              RosterName: arrayData['RosterName'],
              Level1Department: arrayData['Level1Department'],
          };
      } else {
          console.warn('Unable to parse SOAP user info response for citizenId:', citizenId);
          // Fallback to info from JWT if SOAP parsing fails
          fullUserInfo = { Rank: rank, FirstName: firstName, LastName: lastName, Level1Department: level1Department };
      }


      // ส่งข้อมูลผู้ใช้กลับไปให้ Frontend
      res.status(200).json({
          message: 'User profile fetched successfully!',
          userInfo: fullUserInfo
      });

  } catch (error) {
      console.error('Error fetching user profile from SOAP:', error);
      // หาก SOAP service มีปัญหา, อาจจะส่งข้อมูลบางส่วนจาก JWT กลับไป หรือแจ้ง error
      // สำหรับตอนนี้, จะส่ง error กลับไปเพื่อให้ frontend แสดงผล
      res.status(500).json({ message: 'Failed to fetch user profile details.' });
  }
});


// ปรับแก้ Route /getAssessmentResults/:citizenId
app.get('/getAssessmentResults/:citizenId', authenticateToken, async (req, res) => {
 const requestedCitizenId = req.params.citizenId;
 const citizenIdFromToken = req.user.citizenId;

 // หาก Frontend ส่ง '/self' มา, ให้ใช้ citizenId จาก Token
 let targetCitizenId = requestedCitizenId;
 if (requestedCitizenId === 'self') {
     targetCitizenId = citizenIdFromToken;
 }

 // ตรวจสอบว่า citizenId ที่ร้องขอ (หลังจาก Resolve 'self' แล้ว) ตรงกับ citizenId ใน Token หรือไม่
 if (targetCitizenId !== citizenIdFromToken) {
     return res.status(403).json({ message: 'Forbidden: You can only view your own assessment results.' });
 }

 // ตรวจสอบรูปแบบ citizenId
 if (!targetCitizenId || !/^\d{13}$/.test(targetCitizenId)) {
   return res.status(400).json({ message: 'Invalid Citizen ID format.' });
 }

 try {
   const results = await exports.query(
     `SELECT hopeScore, selfEfficacyScore, resilienceScore, optimismScore, hopeAverage, selfEfficacyAverage, resilienceAverage, optimismAverage, overallAverage
      FROM assessment_results
      WHERE citizenId = ?`,
     [targetCitizenId]
   );
   if (results.length > 0) {
     res.json(results[0]);
   } else {
     // ถ้าไม่พบผลลัพธ์ ควรส่ง 404 เพื่อให้ Frontend ทราบว่าไม่มีข้อมูล
     res.status(404).json({ message: 'No assessment results found for this citizen ID.' });
   }
 } catch (error) {
   console.error('Error fetching assessment results:', error);
   res.status(500).json({ error: 'Error fetching assessment results. Please try again later.' });
 }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});