const express = require('express');
const expressValidator =  require('express-validator');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

// DATABASE
const User = require('../models/User');

// create application/json parser
const jsonParser = bodyParser.json()

const router = express.Router();
router.use(expressValidator());

// route: GET /api/users
// desc: gets all users
router.get('/', (req, res) => {

    // Access database and return users
    // no keyword specified, return all courses
    User.find({}, (error, users) => {

        if (error) {
            console.log(error);
            res.status(500).json({ error: 'Something went wrong...' });
            return;
        }

        res.json(users);
    });
});

// route: GET /api/users/:userId
// desc: gets user by id
router.get('/:userId', (req, res) => {

    const userId = req.params.userId;

    User.findById(userId, (error, result) => {

        if (error) {
            console.log(error);
            return;
        }

        if (result == null) { // creator not found
            console.error('User with this id does not exists.');
            res.send('User with this id does not exists.');
        } else {
            console.log('Found user!!');
            console.log(result);
            res.json(result);
        }

    })
});

// route: POST /api/users
// desc: register user
router.post('/', jsonParser, async (req, res) => {

    console.log("req.body");
    console.log(req.body);
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const username = req.body.username;
    const isCreator = req.body.isCreator;
    const rating = req.body.rating;
    const following = req.body.following;
    const followers = req.body.followers;
    const chargeRate = req.body.chargeRate;
    const createdCourses = req.body.createdCourses;
    const addedCourses = req.body.addedCourses;
    const email = req.body.email;
    const password = req.body.password;
    const password2 = req.body.password2; // confirm

    req.checkBody('firstName', 'firstName is required').notEmpty();
    req.checkBody('lastName', 'lastName is required').notEmpty();
    req.checkBody('username', 'username is required').notEmpty();
    req.checkBody('isCreator', 'isCreator is required').notEmpty();
    req.checkBody('email', 'Passwords do not match').isEmail();
    req.checkBody('password', 'Passwords do not match').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    // only check if user is creator
    if(isCreator) {
        req.checkBody('chargeRate', 'chargeRate is required').notEmpty();
    }

    let errors = req.validationErrors();

    if (errors) {

        console.log("Errors while registering: ");

        errors.forEach(error => {
            console.log(JSON.stringify(error));
        })

        /*
        res.render('register', {
        errors: errors
      });
      */
    } else {

        const salt = await bcrypt.genSalt(10);

        const newUser = await User.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            username: req.body.username,
            isCreator: req.body.isCreator,
            rating: req.body.rating,
            following: req.body.following,
            followers: req.body.followers,
            chargeRate: req.body.chargeRate,
            createdCourses: req.body.createdCourses,
            addedCourses: req.body.addedCourses,
            email: req.body.email,
            password: await bcrypt.hash(req.body.password, salt) // saves hashed password
        });

        newUser.save();
        res.status(200).json({ message: "New user has been created..." });
    }
});

// route: POST /api/users/login
// desc: login
router.post('/login', jsonParser, (req, res) => {
    const password = req.body.password;
    const username = req.body.username;
    let match = false;

    // get hash for username from DB
    User.findOne({ username: username }, (error, result) => {

        // compare hashes
        if(result != null) {

            bcrypt.compare(password, result.password, (error, result) => {
                if(result == true) {
                    match = true;
                    res.status(200).json({ message: "Login succesful..." }); 
                } else {
                    res.status(200).json({ message: "Login failed. Wrong password..." });  
                }
            });

        } else {
            res.status(200).json({ message: "Invalid username. No user found..." });
        }

    });
});

module.exports = router;