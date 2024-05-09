const userService = require('../services/user.service')
const logger = require('../util/logger')

let userController = {
    create: (req, res, next) => {
        const user = req.body
        logger.info('create user', user.firstName, user.lastName)
            userService.create(user, (error, success) => {
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

    getAll: (req, res, next) => {
        logger.trace('getAll')
        userService.getAll((error, success) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                })
            }
            if (success) {
                res.status(200).json({
                    status: 200,
                    message: success.message,
                    data: success.data
                })
            }
        })
    },

    getById: (req, res, next) => {
        const userId = req.params.userId
        logger.trace('userController: getById', userId)
        userService.getById(userId, (error, success) => {
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

    // Todo: Implement the update and delete methods
    update: (req, res, next) => {
        const userId = parseInt(req.params.userId)
        const updatedUser = {
            id: userId, 
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password 

        };
        logger.trace('userController: update', updatedUser);
        userService.update(userId, updatedUser, (error, success) =>{
            if(error){
                return next({
                    status: error.status,
                    message: error.status,
                    data: {}
                });
            }
            if (success){
                res.status(200).json({
                    status: success.status,
                    message: success.message,
                    data: success.data
                });
            }
        })
    }, 
    deleteUser: (req, res) => {
        const userId = parseInt(req.params.id);
        userService.delete(userId, (err, message) => {
            if (err) {
                logger.error(err);
                return res.status(err.status || 500).send(err.message || 'Failed to delete user');
            }
            logger.trace(message);
            res.send(message);
        });
    }
}

module.exports = userController
