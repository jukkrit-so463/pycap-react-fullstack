const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const util = require('util'); // Add this line
require('dotenv').config()


const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL connection

const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,    // << แก้ตรงนี้
  user: process.env.MYSQL_USER,    // << แก้ตรงนี้
  password: process.env.MYSQL_PASSWORD,  // << แก้ตรงนี้
  database: process.env.MYSQL_DATABASE // << แก้ตรงนี้
});

db.connect(err => {
  if (err) {
    console.log('Database connection error:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

const query = util.promisify(db.query).bind(db); // Use promisify

const secretKey = process.env.JWT_SECRET || 'your_secret_key';



// Route to save or update user data
app.post('/saveOrUpdateUser', async (req, res) => {
  const { citizenId, rank, firstName, lastName, personType, roster, department, rosterName, level1Department } = req.body;

  try {
    const queryString = `
      INSERT INTO users (citizenId, rank, firstName, lastName, personType, roster, department, rosterName, level1Department)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      rank = VALUES(rank),
      firstName = VALUES(firstName),
      lastName = VALUES(lastName),
      personType = VALUES(personType),
      roster = VALUES(roster),
      department = VALUES(department),
      rosterName = VALUES(rosterName),
      level1Department = VALUES(level1Department);
    `;

    await query(queryString, [citizenId, rank, firstName, lastName, personType, roster, department, rosterName, level1Department]);

    res.status(200).send({ message: 'User data saved successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).send({ message: 'Error saving user data' });
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

// Start the server
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
