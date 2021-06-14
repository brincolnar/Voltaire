const mongoose = require('mongoose');
const { Schema } = mongoose;

const User = require('../models/User');

// schema 
const CourseSchema = new Schema({
    title: {type: String, required: true},
    rating: {type: Number, required: true, default: 0},
    creators: { 
        type: [
        {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' // {type: Schema.Types.ObjectId, ref: 'User'}
        }
        ], 
        validate: {
            validator: (creators) => new Promise(
                (resolve, reject) => {

                console.log('creators.length');
                console.log(creators.length);

                let creatorsFound = 0;

                if(creators.length == 0) {
                    reject();
                }

                creators.forEach(creatorId => {
                    console.log('creator:')
                    console.log(creatorId)

                    User.findById(creatorId, (error, result) => {
                        if(error) {
                            console.log(error);
                        }

                        if(result == null) {
                            console.log(`Creator ${creatorId} not found...`);
                            reject();
                        } else {
                            creatorsFound++;
                            console.log('creatorsFound')
                            console.log(creatorsFound)

                            if(creatorsFound == creators.length) {
                                resolve();
                            }
                        }
                    });
                });
            })
            .then(
                () => true 
            )
            .catch(
                () => false
            ),
            message:  'Creator doesnt exist...'
        }
    },
    type: {
        type: String, // limited to: ["Video", "Reading", "Quiz", "Course"]
        validate: {
            validator: (v) => {
                return ["Video", "Reading", "Quiz", "Course"].includes(v); 
            },
            message: 'Provide valid material type...' 
        }
    }
});


// export model and schema
module.exports = mongoose.model('Course', CourseSchema);