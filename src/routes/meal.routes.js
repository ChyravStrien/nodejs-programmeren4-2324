const express = require('express')
const assert = require('assert')
const chai = require('chai')
chai.should()
const router = express.Router()
const mealController = require('../controllers/meal.controller')
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
const validateMealCreateAssert = (req, res, next) => {
    try {
        assert(req.body.name, 'Missing name')
        assert(req.body.description, 'Missing description')
        assert(req.body.price, 'Missing price')
        assert(req.body.dateTime, 'Missing dateTime')
        assert(req.body.maxAmountOfParticipants, 'Missing maxAmountOfParticipants')
        assert(req.body.imageUrl, 'Missing imageUrl')
        next()
    } catch (ex) {
        next({
            status: 400,
            message: ex.message,
            data: {}
        })
    }
}
const validateMealUpdateAssert = (req, res, next) => {
    try {
        assert(req.body.name, 'Missing name')
        assert(req.body.price, 'Missing price')
        assert(req.body.maxAmountOfParticipants, 'Missing maxAmountOfParticipants')
        next()
    } catch (ex) {
        next({
            status: 400,
            message: ex.message,
            data: {}
        })
    }
}

router.post('/api/meal', validateToken, validateMealCreateAssert, mealController.create)
router.get('/api/meal', mealController.getAll)
router.get('/api/meal/:mealId', mealController.getById)
router.delete('/api/meal/:mealId', validateToken, mealController.delete)
router.put('/api/meal/:mealId', validateToken, validateMealUpdateAssert, mealController.update)

module.exports = router;