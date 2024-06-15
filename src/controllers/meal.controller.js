const { get } = require('../routes/user.routes');
const mealService = require('../services/meal.service');
const logger = require('../util/logger');
const { getById } = require('./user.controller');

let mealController = {
    create: (req, res, next) => {
        const meal = req.body;
        const cookId = req.userId;
        logger.info('Creating meal: ', meal);
        mealService.create(meal, cookId, (error, success) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
            if (success) {
                res.status(200).json({
                    status: success.status,
                    message: success.message,
                    data: success.data
                });
            }
        });
    }, 
    getAll: (req, res, next) => {
        logger.info('Getting all meals');
        mealService.getAll((error, success) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
            if (success) {
                res.status(200).json({
                    status: success.status,
                    message: success.message,
                    data: success.data
                });
            }
        });
    },
    getById: (req, res, next) => {
        const mealId = req.params.mealId;
        logger.trace('mealController: getById', mealId)
        mealService.getById(mealId, (error, success) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                })
            }
            if (success) {
                res.status(200).json({
                    status: success.status,
                    message: success.message,
                    data: success.data
                })
            }
        })
    },
    delete: (req, res, next) => {
        const mealId = req.params.mealId;
        const cookId = req.userId;
        logger.info('Deleting meal: ', mealId);
        mealService.delete(mealId, cookId, (error, success) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
            if (success) {
                res.status(200).json({
                    status: success.status,
                    message: success.message,
                    data: success.data
                });
            }
        });
    }
}
module.exports = mealController;