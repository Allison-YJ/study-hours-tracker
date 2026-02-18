const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const AUTH_URL = process.env.AUTH_SERVICE_URL;
const MONGO_URI = process.env.MONGO_URI;

app.get('/analytics', async (req, res) => {
    try {
        const auth = await axios.get(`${AUTH_URL}/auth/verify`, { headers: { Authorization: req.headers.authorization } });
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        const data = await client.db().collection('analytics').findOne({ user_id: auth.data.user_id });
        await client.close();
        
        res.json(data || { username: auth.data.username, metrics: { total_minutes: 0, avg_minutes_per_day: 0, min_session: 0, max_session: 0, session_count: 0 }, subject_breakdown: [] });
    } catch (e) {
        res.status(401).json({ error: 'Auth/DB Error' });
    }
});

app.listen(8081, () => console.log('Results Port 8081'));