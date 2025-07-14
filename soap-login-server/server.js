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

// Start the server (ควรจะเริ่ม Server หลังจากมั่นใจว่า DB พร้อม)
// แต่ใน Node.js app ทั่วไป มักจะรัน server ทันที
// และให้ retry logic จัดการการเชื่อมต่อ DB
app.listen(5000, () => {
  console.log('Server running on port 5000');
});