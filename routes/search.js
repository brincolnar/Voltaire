const express = require('express')
const router = express.Router();

// data from the database
const courses = [
    {
        name: 'Odvod & Integral',
        rating: 4.3,
        authorId: 1
    },
    {
        name: 'Informatika za maturo II. del',
        rating: 4.5,
        authorId: 1
    },
    {
        name: 'Skladnja',
        rating: 4.7,
        authorId: 2
    },
    {
        name: '2. svetovna vojna',
        rating: 4.5,
        authorId: 3
    }
];

const users = [
    {
        name: 'Andraz Karamazov',
        rating: 4.3,
        following: 4234,
        chargeRate: 5
    },
    {
        name: 'Anja Novak',
        rating: 4.7,
        following: 54,
        chargeRate: 7
    },
    {
        name: 'Mia Silar',
        rating: 4.9,
        following: 874,
        chargeRate: 5
    },
    {
        name: 'Andrej Cad',
        rating: 4.2,
        following: 1202,
        chargeRate: 6
    }
];


// route: GET /api/search?keyword=:keyword
router.get('/', (req, res) => {
    const queryParams = req.query;

    for(const key in queryParams) {
        console.log(key, queryParams[key]);
    }

    res.send('Preforming query on params...');
});

module.exports = router;