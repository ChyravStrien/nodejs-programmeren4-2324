const express = require('express')
const assert = require('assert')
const chai = require('chai')
chai.should()
const router = express.Router()
const userController = require('../controllers/user.controller')
const validateToken = require('./authentication.routes').validateToken;
const logger = require('../util/logger')

// Tijdelijke functie om niet bestaande routes op te vangen
const notFound = (req, res, next) => {
    next({
        status: 404,
        message: 'Route not found',
        data: {}
    })
}

// Input validation function 2 met gebruik van assert
const validateUserCreateAssert = (req, res, next) => {
    try {
        assert(req.body.firstName, 'Missing or incorrect first name')
        assert(req.body.lastName, 'Missing last name')
        assert(req.body.emailAddress, 'Missing email')
        assert(validateEmail(req.body.emailAddress), 'Invalid email')
        assert(req.body.password, 'Missing password')
        assert(validatePassword(req.body.password), 'Invalid password')
        assert(req.body.phoneNumber, 'Missing phonenumber')
        assert(validatePhoneNumber(req.body.phoneNumber), 'Invalid phonenumber')
        assert(req.body.roles, 'Missing roles')
        assert(req.body.street, 'Missing street')
        assert(req.body.city, 'Missing city')
        next()
    } catch (ex) {
        next({
            status: 400,
            message: ex.message,
            data: {}
        })
    }
}

const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z](?:\.[a-zA-Z]+)?@[a-zA-Z]{2,}\.[a-zA-Z]{2,3}$/;
    return emailRegex.test(email);
};
const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/; //?=.* means that it checks for the condition in the brackets and d is for digit
    return passwordRegex.test(password);

};
const validatePhoneNumber = (phoneNumber) => {
    const phoneRegex = /^06[-\s]?\d{8}$/;
    return phoneRegex.test(phoneNumber);
};

const validateUserUpdateAssert = (req, res, next) => {
    try {
        assert(req.body.emailAddress, 'Missing email') //email is verplicht bij updaten
        assert(validateEmail(req.body.emailAddress), 'Invalid email')
        if (req.body.password) assert(validatePassword(req.body.password), 'Invalid password') //alleen als er een password is, dan wordt het gevalideerd
        if (req.body.phoneNumber) assert(validatePhoneNumber(req.body.phoneNumber), 'Invalid phonenumber') //alleen als er een phonenumber is, dan wordt het gevalideerd
        next()
    } catch (ex) {
        next({
            status: 400,
            message: ex.message,
            data: {}
        })
    }
}


const validateUserCreateChaiExpect = (req, res, next) => {
    try {
        assert(req.body.firstName, 'Missing or incorrect firstName field')
        chai.expect(req.body.firstName).to.not.be.empty
        chai.expect(req.body.firstName).to.be.a('string')
        chai.expect(req.body.firstName).to.match(
            /^[a-zA-Z]+$/,
            'firstName must be a string'
        )
        assert(req.body.lastName, 'Missing or incorrect lastName field')
        chai.expect(req.body.lastName).to.not.be.empty
        chai.expect(req.body.lastName).to.be.a('string')
        chai.expect(req.body.lastName).to.match(
            /^[a-zA-Z\s]+$/,
            'lastName must be a string'
        )

        assert(req.body.emailAddress, 'Missing or incorrect emailAddress field')
        chai.expect(req.body.emailAddress).to.not.be.empty
        chai.expect(req.body.emailAddress).to.be.a('string')
        if(!validateEmail(req.body.emailAddress)){
            throw new Error('Invalid emailAddress');
        }
        assert(req.body.password, 'Missing or incorrect password field')
        chai.expect(req.body.password).to.not.be.empty
        if(!validatePassword(req.body.password)){
            throw new Error('Invalid password');
        }
        logger.trace('User successfully validated')
        next()
    } catch (ex) {
        logger.trace('User validation failed:', ex.message)
        next({
            status: 400,
            message: ex.message,
            data: {}
        })
    }
}


// Userroutes
//nieuwe user aanmaken
router.post('/api/user', validateUserCreateAssert, userController.create)
//lijst van users ophalen
router.get('/api/user', validateToken, userController.getAll)
//user ophalen met id
router.get('/api/user/:userId', validateToken, userController.getById)
//user updaten
router.put('/api/user/:userId', validateToken, validateUserUpdateAssert, userController.update);
//user verwijderen 
router.delete('/api/user/:id', userController.deleteUser);
//profiel van user ophalen
router.get('/api/user/profile', validateToken, userController.getProfile)



module.exports = router
