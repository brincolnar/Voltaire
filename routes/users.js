const express = require('express');
const expressValidator =  require('express-validator');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const auth = require('../services/auth');
const refreshTokensStorage = require('../services/refreshTokens');
const jwt = require("jsonwebtoken");

// for secrets
require('dotenv').config()

// DATABASE
const User = require('../models/User');

// create application/json parser
const jsonParser = bodyParser.json();

const router = express.Router();
router.use(expressValidator());

// route: GET /api/users
// desc: gets all users
router.get('/', auth.authenticateJWT, (req, res) => {

    console.log('req.tokenPayload:  ' + JSON.stringify(req.tokenPayload)); // courtesy of authenticateJWT middleware

    const isAdmin = (req.tokenPayload.role == 'admin') ? true : false;

    if(!isAdmin) {
        res.status(401).json({ message: 'Only admin can list all users' });
        return;
    }

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

// route: POST /api/users/register
// desc: register user
router.post('/', jsonParser, async (req, res) => {

    console.log("req.body");
    console.log(req.body);
    const isCreator = req.body.isCreator;
    const password = req.body.password;

    req.checkBody('firstName', 'firstName is required').notEmpty();
    req.checkBody('lastName', 'lastName is required').notEmpty();
    req.checkBody('username', 'username is required').notEmpty();
    req.checkBody('isCreator', 'isCreator is required').notEmpty();
    req.checkBody('email', 'Passwords do not match').isEmail();
    req.checkBody('password', 'Passwords do not match').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(password);
    req.checkBody('role', 'Non-member roles are assigned manually').equals('member');

    // only check if user is creator
    if(isCreator) {
        req.checkBody('chargeRate', 'chargeRate is required').notEmpty();
    }

    let errors = req.validationErrors();

    if (errors) {

        console.log("Errors while registering: ");

        errors.forEach(error => {
            console.log(JSON.stringify(error));
        });

        // res.json with the right http status
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
            password: await bcrypt.hash(req.body.password, salt), // saves hashed password
            role: req.body.role
        });

        newUser.save();
        res.status(200).json({ message: "New user has been created..." });
    }
});


// route: POST /api/users/login
// desc: user login
router.post('/login', jsonParser, (req, res) => {
    const password = req.body.password;
    const username = req.body.username;

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    // get hash for username from DB
    User.findOne({ username: username }, (error, user) => {

        if (error) {
            console.log(error);
            res.status(500).json({ error: 'Something went wrong...' });
            return;
        }

        // compare hashes
        if(user != null) {

            bcrypt.compare(password, user.password, (error, result) => {

                if (error) {
                    console.log(error);
                    res.status(500).json({ error: 'Something went wrong...' });
                    return;
                }

                if(result == true) {
                    match = true;

                    // upon succesful login, generate an JWT acess token, and a refresh token for generating new tokens
                    const accessToken = jwt.sign({ username: user.username,  role: user.role }, accessTokenSecret, { expiresIn: '20m' });
                    const refreshToken = jwt.sign({ username: user.username,  role: user.role }, refreshTokenSecret);

                    // save it later for refreshing user's session
                    refreshTokensStorage.refreshTokens.push(refreshToken);

                    // send both back
                    res.status(200).json({ accessToken, refreshToken }); 
                } else {
                    res.status(401).json({ message: "Login failed. Wrong password..." });  
                }
            });

        } else {
            res.status(200).json({ message: "Invalid username. No user found..." });
        }

    });
});

// route: POST /api/users/logout
// desc: user logout, destroys user's refreshToken
router.post('/logout', jsonParser, (req, res) => {

    const token = req.body.token;

    // delete token from storage
    refreshTokensStorage.refreshTokens = refreshTokensStorage.refreshTokens.filter(t => t !== token);

    res.status(200).json({
        message: 'Logout succesful'
    });
})


module.exports = router;