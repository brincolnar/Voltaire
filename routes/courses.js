const express = require('express')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// create application/json parser
const jsonParser = bodyParser.json()
const router = express.Router();


// DATABASE
const Course = require('../models/Course');
const User = require('../models/User');
const { update } = require('../models/User');

// route: GET /api/courses or /api/courses?keyword=value
// desc: gets all courses, if provided query params then we search by course title and by course author
// example: ?keyword=mat --> would return courses with 'mat' (case ins.) in title or courses created by author with 'mat' in his full name
router.get('/', (req, res) => {

    const searchKeyword = req.query.keyword;
    const results = { byTitle: [], byUser: [] };

    if (searchKeyword == undefined || searchKeyword == '') {

        // no keyword specified, return all courses
        Course.find({}, (error, courses) => {

            console.log('searching on searchKeyword:' + searchKeyword);

            if (error) {
                console.log(error);
                res.status(500).json({ error: 'Something went wrong...' });
                return;
            }

            res.json(courses);
        });

    } else {
        // user specified search keyword
        console.log('searching on searchKeyword:' + searchKeyword);

        // search by course title
        console.log('searching for courses...');

        Course.find({ title: { $regex: searchKeyword, $options: 'i' } }, (error, courses) => {

            if (error) {
                console.log(error);
                res.status(500).json({ error: 'Something went wrong...' });
                return;
            }

            console.log('matching courses:');
            console.log(courses);

            courses.forEach(course => {
                results.byTitle.push(course);
            });

            // continue inside this callback searching by users...

            // search by creator name (first/last name)
            // 1. search in User
            // 2. get matching User ObjectId
            // 3. search creators field with ObjectId
            // 4. append results to course title results 

            console.log('searching for users...');
            User.find({
                $or: [
                    { firstName: { $regex: searchKeyword, $options: 'i' } },
                    { lastName: { $regex: searchKeyword, $options: 'i' } }
                ]
            }, (error, users) => {

                if (error) {
                    console.log(error);
                    res.status(500).json({ error: 'Something went wrong...' });
                    return;
                }

                console.log('matching users: ')
                console.log(users);

                // if no users are found, respond with byTitle results and return
                if (users.length == 0) {
                    res.json(results);
                    return;
                }

                users.forEach(user => {
                    let userId = user._id;

                    console.log('searching courses by user ' + userId);
                    Course.find({ creators: userId }, (error, courses) => {

                        if (error) {
                            console.log(error);
                            // res.status(500).json({ error: 'Something went wrong...' });
                            return;
                        }

                        console.log(`Courses by ${userId}: `);
                        console.log(courses);

                        courses.forEach(course => {

                            if (results.byUser.filter(el => el._id.toString() == course._id.toString()).length == 0) {
                                // not added yet
                                results.byUser.push(course);
                            }

                        });

                        console.log('results:');
                        console.log(results);

                        // last user
                        if (userId == users[users.length - 1]._id) {
                            res.json(results);
                        }
                    });
                });


            });
        });
    }
});

// route: GET /api/courses/:courseId
// desc: gets course by courseId
router.get('/:courseId', (req, res) => {

    const courseId = req.params.courseId;

    Course.findById(courseId, (error, result) => {

        if (error) {
            console.log(error);
            res.status(500).json({ error: 'Something went wrong...' });
            return;
        }

        if (result == null) {
            res.status(400).json({ error: `Course ${courseId} does not exist!!` });
            return;
        }

        res.json(result);

    });
});


// route: POST /api/courses
// desc: creates new course
router.post('/', jsonParser, (req, res) => {
    const course = req.body;

    // see CUSTOM VALIDATORS defined in Course schema for validation methods
    // Create new course and save
    const newCourse = new Course(course);

    newCourse.save((error, document) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: `${error}` });
            return;
        }

        console.log('saving course to database...');
        console.log(document);

        // document is the saved course in the database
        document.creators.forEach((creatorId, index, arr) => {

            User.findById(creatorId, (error, user) => {

                if (error) {
                    console.log(error);
                    res.status(500).json({ error: 'Something went wrong...' });
                    return;
                };

                console.log('found user: ');
                console.log(user);

                user.createdCourses.push(document._id);

                // update user, return updated doc
                User.findOneAndUpdate({ _id: { $eq: user._id } }, user, { new: true }, (error, updatedUser) => {
                    if (error) {
                        console.log(error);
                        res.status(500).json({ error: 'Something went wrong...' });
                        return;
                    };

                    console.log("updated user:  ");
                    console.log(updatedUser);

                    if (index == arr.length - 1) { // last iteration
                        res.json({ message: 'New course created...' }); // as there always must be a creator provided this will get executed
                    }
                });
            });
        });
    });
});

// route: PUT /api/courses/:courseId
// desc: updates course
router.put('/:courseId', jsonParser, (req, res) => {

    const reqCourse = req.body;
    const courseId = req.params.courseId;

    // check for validation of course first
    const newCourse = new Course(reqCourse);

    newCourse.validate(error => {
        if (error) {
            console.log(`error: ${error}`);

            res.status(400).json({ message: `${error}` });
            return;
        } 

        // validation needs to happen first (maybe change to promises)
        uponValidCourse();
    });

    const uponValidCourse = () => {
        Course.findOne({ _id: { $eq: courseId } }, (error, course) => {

            if (error) {
                console.log(error);
                res.status(500).json({ error: 'Something went wrong...' });
                return;
            };

            // desc: check if original creators still exist in updated version, if not alter their createdCourses
            course.creators.forEach(creatorId => {

                if (error) {
                    console.log(error);
                    res.status(500).json({ error: 'Something went wrong...' });
                    return;
                };

                // in updated course?
                if (reqCourse.creators.indexOf(creatorId.toString()) == -1) {

                    // not in updated version --> remove course from creator's createdCourses
                    User.findById(creatorId, (error, creator) => {

                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Something went wrong...' });
                            return;
                        };

                        const createdCourses = creator.createdCourses.filter(course => course._id != courseId);
                        creator.createdCourses = createdCourses;

                        // update creator
                        User.findOneAndUpdate({ _id: { $eq: creator._id } }, creator, { runValidators: true, new: true, useFindAndModify: false }, (error, updatedCreator) => {
                            if (error) {
                                console.log(error);
                                res.status(500).json({ error: 'Something went wrong...' });
                                return;
                            };

                            console.log('updated creator:   ');
                            console.log(updatedCreator);
                        })
                    });
                }
            });

            let courseIdField = course._id; // may be potentially needed (type == ObjectId)

            // check if new creators have been added and alter creators's createdCourses
            reqCourse.creators.forEach(creatorId => { // creatorId is a string
                User.findOne({ _id: { $eq: creatorId } }, (error, creator) => {

                    if (error) {
                        console.log(error);
                        res.status(500).json({ error: 'Something went wrong...' });
                        return;
                    };

                    let stringfiedCourseIds =
                        creator.createdCourses.map(courseId => courseId._id.toString());

                    if (stringfiedCourseIds.indexOf(courseId) == -1) { // here we are comparing stringified ids
                        // course not in creator's createdCourses -> add it
                        creator.createdCourses.push(courseIdField); // here i add object id (check in models/User.js)

                        // update user
                        User.findOneAndUpdate({ _id: { $eq: creatorId } }, creator, { runValidators: true, new: true, useFindAndModify: false }, (error, updatedCreator) => {
                            if (error) {
                                console.log(error);
                                res.status(500).json({ error: 'Something went wrong...' });
                                return;
                            };

                            console.log('updated creator(after adding course in his createdCourses): ');
                            console.log(updatedCreator);
                        });
                    }
                });
            });

            // try to find document with courseId and update it with reqCourse 
            // {new: true} --> callback returns the updated document
            // executed after users get updated correctly
            Course.findOneAndUpdate({ _id: { $eq: courseId } }, reqCourse, { runValidators: true, new: true, useFindAndModify: false }, (error, course) => {

                if (error) {
                    console.log(error);
                    res.status(500).json({ error: `${error}` });
                    return;
                };

                console.log('updated course:    ');
                console.log(course);

                if (course == null) {
                    console.log(`Course ${courseId} doesn't exist...`);
                    res.json({ message: `Course ${courseId} doesn't exist...` });
                } else {
                    console.log(`Updating course ${courseId}...`);
                    res.json(course);
                }
            });
        });
    }

})

// router: DELETE /api/courses/:courseId
// desc: deletes courseId course
router.delete('/:courseId', (req, res) => {

    const courseId = req.params.courseId;

    Course.findOneAndDelete({ _id: { $eq: courseId } }, (error, course) => {

        if (error) {
            console.log(error);
            res.status(500).json({ error: 'Something went wrong...' });
            return;
        };

        if (course == null) {
            console.log(`Course ${courseId} doesn't exist...`);
            res.status(400).json({ message: `Course ${courseId} doesn't exist...` });
            return;
        }

        console.log('deleted course:    ');
        console.log(course);

        // update createdCourses for all creators of this course (delete it from createdCourses)
        course.creators.forEach((creatorId, index, arr) => {
            User.findOne({ _id: { $eq: creatorId } }, (error, creator) => {

                console.log('creator:   ');
                console.log(creator);

                if (error) {
                    console.log(error);
                    res.status(500).json({ error: 'Something went wrong...' });
                    return;
                };

                // remove course
                const updatedCourses = creator.createdCourses.filter(createdCourseId => createdCourseId._id != courseId);

                creator.createdCourses = updatedCourses;

                // update creator
                User.findOneAndUpdate({ _id: { $eq: creatorId } }, creator, { new: true }, (error, updatedUser) => {
                    if (error) {
                        console.log(error);
                        res.status(500).json({ error: 'Something went wrong...' });
                        return;
                    };

                    console.log("updated user:  ");
                    console.log(updatedUser);

                    if (index == arr.length - 1) { // last iteration
                        res.json({ message: 'Course has been removed...' }); // as there always must be a creator provided this will get executed
                    }
                });
            });
        });

    });
});


module.exports = router;