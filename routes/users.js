const express = require('express');
const router = express.Router();
const User = require('../models').User;
const bcryptjs = require('bcryptjs');

const { userRules, validate } = require('./expressValidator');
const authUser = require('./authUser');

// async handler
function asyncHandler(callback) {
    return async (req, res, next) => {
        try {
            await callback(req, res, next);
        } catch (error) {
            next(error);
        }
    };
}


//GET route for current user
router.get('/', authUser, asyncHandler(async (req, res) => {
    const user = await User.findOne({
        attributes: ['firstName', 'lastName', 'emailAddress'],
        where: {emailAddress: req.currentUser.emailAddress}
    });
    res.json({ user });
}));


//POST route to create a new user
router.post('/', userRules(), validate, asyncHandler(async (req, res) => {
    const newUser = req.body;
    newUser.password = bcryptjs.hashSync(newUser.password);
    try {
        await User.create({
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            emailAddress: newUser.emailAddress,
            password: newUser.password
        });
        res.location('/');
        res.status(201).end();
    } catch (error) {
        if (
            error.name === 'SequelizeValidationError' ||
            error.name === 'SequelizeUniqueConstraintError'
        ) {
            const errorMessage = [];
            error.errors.map((err) => errorMessage.push(err.message));
            return res.status(400).json({errors: errorMessage});
        } else {
            throw error;
        }
    }
}));

module.exports = router;