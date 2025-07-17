const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const util = require('util');
const axios = require('axios');
const xml2js = require('xml2js');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// --- Security Headers ---
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// --- CORS Configuration ---
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://psycap.nmd.go.th' 
        : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(cookieParser());

// --- MySQL Connection ---
let db;
let databaseConnected = false;
function connectDB() {
    db = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    });

    db.connect(err => {
        if (err) {
            console.error('Database connection error:', err.code, '- Retrying in 5 seconds...');
            setTimeout(connectDB, 5000);
        } else {
            console.log('Connected to MySQL');
            exports.query = util.promisify(db.query).bind(db);
            databaseConnected = true;
        }
    });

    db.on('error', (err) => {
        console.error('MySQL connection lost:', err.code);
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
            databaseConnected = false;
            connectDB();
        } else {
            throw err;
        }
    });
}
connectDB();

app.use((req, res, next) => {
    if (!databaseConnected) {
        return res.status(503).json({ message: 'Service Unavailable: Database connection not established.' });
    }
    next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_please_change_in_production_env';

// --- XML Parser Configuration ---
const xmlParser = new xml2js.Parser({
    explicitArray: false,
    tagNameProcessors: [xml2js.processors.stripPrefix],
    ignoreAttrs: true, 
});

// --- Middleware: JWT Authentication ---
const authenticateToken = (req, res, next) => {
    const token = req.cookies.jwt_token;
    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided.' });

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        res.clearCookie('jwt_token');
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

// --- API Routes ---

app.post('/api/login', async (req, res) => {
    const { modid, password } = req.body;
    if (!modid || !password) return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });

    const soapRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="uri:checkauthentication"><soapenv:Header/><soapenv:Body><urn:checkauthentication><modid>${modid}</modid><password>${password}</password></urn:checkauthentication></soapenv:Body></soapenv:Envelope>`;

    try {
        const soapAuthResponse = await axios.post('http://frontend/webservice/checkauthentication.php', soapRequest, {
            headers: { 'Content-Type': 'text/xml', 'SOAPAction': 'uri:checkauthentication' },
            timeout: 30000
        });
        const authResult = await xmlParser.parseStringPromise(soapAuthResponse.data);
        const citizenId = authResult.Envelope.Body.checkauthenticationResponse.return;

        if (citizenId && /^\d{13}$/.test(citizenId)) {
            const token = jwt.sign({ citizenId: citizenId, modid: modid }, JWT_SECRET, { expiresIn: '1h' });
            res.cookie('jwt_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                maxAge: 3600 * 1000,
            });
            res.status(200).json({ message: 'Login successful!' });
        } else {
            res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
    } catch (error) {
        console.error('Login Error:', error.message);
        let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง';
        if (error.code === 'ECONNABORTED') errorMessage = 'การเชื่อมต่อกับบริการยืนยันตัวตนใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
        res.status(500).json({ message: errorMessage });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('jwt_token');
    res.status(200).json({ message: 'Logged out successfully.' });
});

app.get('/api/user-profile', authenticateToken, async (req, res) => {
    const { citizenId } = req.user;
    if (!citizenId) return res.status(400).json({ message: 'Citizen ID not found in token.' });

    // **แก้ไข: สร้าง SOAP Envelope ที่ถูกต้องโดยไม่มี <check>**
    const soapInfoRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="uri:getinfobycitizenid"><soapenv:Header/><soapenv:Body><urn:getinfobycitizenid><citizenid>${citizenId}</citizenid></urn:getinfobycitizenid></soapenv:Body></soapenv:Envelope>`;

    try {
        const soapInfoResponse = await axios.post(`http://frontend/webservice/getinfobycitizenid.php`, soapInfoRequest, {
            headers: { 'Content-Type': 'text/xml', 'SOAPAction': 'uri:getinfobycitizenid' },
            timeout: 30000
        });

        const result = await xmlParser.parseStringPromise(soapInfoResponse.data);
        const userInfo = result.Envelope.Body.getinfobycitizenidResponse.return;

        if (userInfo && typeof userInfo === 'object') {
            const { Rank, FirstName, LastName, PersonType, Roster, Department, RosterName, Level1Department } = userInfo;
            const insertQuery = `INSERT INTO users (citizenId, \`rank\`, firstName, lastName, personType, roster, department, rosterName, level1Department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE \`rank\` = VALUES(\`rank\`), firstName = VALUES(firstName), lastName = VALUES(lastName), personType = VALUES(personType), roster = VALUES(roster), department = VALUES(department), rosterName = VALUES(rosterName), level1Department = VALUES(level1Department);`;
            await exports.query(insertQuery, [citizenId, Rank, FirstName, LastName, PersonType, Roster, Department, RosterName, Level1Department]);

            console.log(`User data for ${citizenId} saved/updated.`);
            res.status(200).json({ message: 'User profile fetched successfully!', userInfo });
        } else {
            throw new Error('Could not parse user info from SOAP response.');
        }
    } catch (error) {
        console.error('Error in /api/user-profile route:', error.message);
        res.status(500).json({ message: 'Failed to fetch or process user profile details.' });
    }
});

app.post('/api/saveAssessmentResults', authenticateToken, async (req, res) => {
    const { citizenId } = req.user;
    const { hopeScore, selfEfficacyScore, resilienceScore, optimismScore, hopeAverage, selfEfficacyAverage, resilienceAverage, optimismAverage, overallAverage } = req.body;
    try {
        const queryString = `INSERT INTO assessment_results (citizenId, hopeScore, selfEfficacyScore, resilienceScore, optimismScore, hopeAverage, selfEfficacyAverage, resilienceAverage, optimismAverage, overallAverage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE hopeScore = VALUES(hopeScore), selfEfficacyScore = VALUES(selfEfficacyScore), resilienceScore = VALUES(resilienceScore), optimismScore = VALUES(optimismScore), hopeAverage = VALUES(hopeAverage), selfEfficacyAverage = VALUES(selfEfficacyAverage), resilienceAverage = VALUES(resilienceAverage), optimismAverage = VALUES(optimismAverage), overallAverage = VALUES(overallAverage);`;
        await exports.query(queryString, [citizenId, hopeScore, selfEfficacyScore, resilienceScore, optimismScore, hopeAverage, selfEfficacyAverage, resilienceAverage, optimismAverage, overallAverage]);
        res.status(200).json({ message: 'Assessment results saved successfully' });
    } catch (error) {
        console.error('Database error in /saveAssessmentResults:', error);
        res.status(500).json({ message: 'Error saving assessment results.' });
    }
});

app.get('/api/getAssessmentResults/self', authenticateToken, async (req, res) => {
    const { citizenId } = req.user;
    try {
        const results = await exports.query('SELECT * FROM assessment_results WHERE citizenId = ?', [citizenId]);
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ message: 'No assessment results found.' });
        }
    } catch (error) {
        console.error('Error fetching assessment results:', error);
        res.status(500).json({ error: 'Error fetching assessment results.' });
    }
});

app.get('/api/report', authenticateToken, async (req, res) => {
    const criteria = { hope: 33, selfEfficacy: 41, resilience: 41, optimism: 33 };
    try {
        const queryString = `SELECT u.level1Department, COUNT(*) AS totalAssessors, (SUM(CASE WHEN a.hopeScore >= ? THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS hopePassPercentage, (SUM(CASE WHEN a.selfEfficacyScore >= ? THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS selfEfficacyPassPercentage, (SUM(CASE WHEN a.resilienceScore >= ? THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS resiliencePassPercentage, (SUM(CASE WHEN a.optimismScore >= ? THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS optimismPassPercentage FROM assessment_results a JOIN users u ON a.citizenId = u.citizenId GROUP BY u.level1Department`;
        const results = await exports.query(queryString, [criteria.hope, criteria.selfEfficacy, criteria.resilience, criteria.optimism]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Database error in /report:', error);
        res.status(500).json({ message: 'Error generating report.' });
    }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});