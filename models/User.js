const mongoose = require('mongoose');
const { Schema } = mongoose;

// validation done in users.js (with middleware)
// schema 
const UserSchema = new Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    username: {type: String, required: true},
    isCreator: {type: Boolean, required: true, default: false},
    rating: {type: Number, required: true, default: 0},
    following: [{
        followed: { type:  Schema.Types.ObjectId, ref: 'User'},    
    }],
    followers: [{
        follower: { type:  Schema.Types.ObjectId, ref: 'User'},    
    }],
    chargeRate: {type: Number, default: 0},
    createdCourses: [{
        createdCourse: { type:  Schema.Types.ObjectId, ref: 'Course'}
    }],
    addedCourses: [{
        addedCourse: { type:  Schema.Types.ObjectId, ref: 'Course'}
    }],
    email:    { 
        type: String   
    },
    password: { 
        type: String
    },
    role: { 
        type: String,
        required: true,
        validate: {
            validator: (v) => {
                return ['member', 'admin'].includes(v); 
            },
            message: 'Must be member/admin...' 
        }
    }   
});

// export model and schema
module.exports = mongoose.model('User', UserSchema);
