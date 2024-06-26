const express = require('express')
const assert = require('assert')
const chai = require('chai')
chai.should()
const router = express.Router()
const participationController = require('../controllers/participation.controller')
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

router.post('/api/meal/:mealId/participate', validateToken, participationController.participate)

module.exports = router;

