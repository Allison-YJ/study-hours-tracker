const express = require('express');
const mysql = require('mysql2/promise');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const AUTH_URL = process.env.AUTH_SERVICE_URL;
const dbConf = { host: process.env.MYSQL_HOST, user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DB };

app.post('/sessions', async (req, res) => {
    try {
        const auth = await axios.get(`${AUTH_URL}/auth/verify`, { headers: { Authorization: req.headers.authorization } });
        const { study_date, duration_minutes, subject, note } = req.body;
        
        const conn = await mysql.createConnection(dbConf);
        await conn.execute('INSERT INTO study_sessions (user_id, study_date, duration_minutes, subject, note) VALUES (?,?,?,?,?)', 
            [auth.data.user_id, study_date, duration_minutes, subject, note]);
        await conn.end();
        res.status(201).json({ status: 'ok' });
    } catch (e) {
        res.status(401).json({ error: 'Auth/DB Error' });
    }
});

app.listen(8080, () => console.log('Entry Port 8080'));