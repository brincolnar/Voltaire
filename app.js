const express = require('express');
const expressValidator = require('express-validator');
const app = express();
const port = 3000;

// DATABASE
const mongoose = require('mongoose');
const url = 'mongodb://localhost:27017/voltaire';

// connect option { useNewUrlParser: true }
mongoose.connect(url, { useNewUrlParser: true });

const db = mongoose.connection;

db.once('open', _ => {
    console.log('Database connected: ', url);
});

db.once('error', error => {
    console.log('Connection error: ', error);
});

// ROUTES

// route: /courses
const courses = require('./routes/courses');

// route: /users
const users = require('./routes/users');

// route: /search
const search = require('./routes/search');

// MIDDLEWARE
app.use('/api/courses', courses);
app.use('/api/users', users);
app.use('/api/search', search);

app.get('/', (req, res) => {
    res.send('hello world');
});

app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`);
});