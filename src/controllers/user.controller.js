const userService = require('../services/user.service')
const logger = require('../util/logger')

const validFilters = ['isActive', 'roles']; // Array met toegestane filters

//functie om te checken of de filters die worden meegegeven in de query parameters wel toegestane filters zijn
const validateFilters = (queryParams) => {
    const keys = Object.keys(queryParams);
    for (let key of keys) {
        if (!validFilters.includes(key)) {
            return { isValid: false, message: `Unknown filter field: ${key}`};
        }
    }
    return { isValid: true };
}

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
        const queryParams = req.query;
        const validation = validateFilters(queryParams);

        if(!validation.isValid){
            return next({
                status: 400,
                message: validation.message,
                data: null
            });
        }
        const filters = {};
        for (const [key, value] of Object.entries(queryParams)){
            if(validFilters.includes(key)){
                filters[key] = value;
            }
        }

        userService.getAll(filters, (error, result) => {
            if (error) {
                return next({
                    status: error.status || 500,
                    message: error.message || 'Internal Server Error',
                    data: null
                });
            }

            res.status(200).json({
                status: 200,
                message: result.message,
                data: result.data
            });
        });
    },


    getById: (req, res, next) => {
        const userId = req.params.userId //id van user die je wilt ophalen
        const requestingUserId = req.userId
        logger.trace('userController: getById', userId)
        userService.getById(requestingUserId, userId, (error, success) => {
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
        // const userId = parseInt(req.params.userId)
        // const updatedUser = {
        //     id: userId,
        //     firstName: req.body.firstName,
        //     lastName: req.body.lastName,
        //     isActive: req.body.isActive,
        //     emailAddress: req.body.emailAddress,
        //     password: req.body.password,
        //     phoneNumber: req.body.phoneNumber,
        //     roles: req.body.roles,
        //     street: req.body.street,
        //     city: req.body.city
        // };
        const userId = req.params.userId; //user id van de user die je wilt updaten
        const user = req.body;
        const requestingUserId = req.userId;
        logger.trace('userController: update', user);
        logger.trace('requestingUserId:', requestingUserId);
        logger.trace('userId:', userId);
        userService.update(userId, user, requestingUserId, (error, success) =>{
            if(error){
                logger.error('Error in userService.update', error);
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
                if(success){
                    logger.trace('Update success:', success);
                    res.status(200).json({
                        status: success.status,
                        message: success.message,
                        data: success.data
                    });
                }
                
        })
    
    }, 
    deleteUser: (req, res, next) => {
        const userId = req.params.userId; //user die we willen verwijderen 
        const requestingUserId = req.userId; //user die de delete actie uitvoert
        logger.trace('userController: delete', userId);
        logger.trace('requestingUserId:', requestingUserId);
        userService.delete(userId, requestingUserId, (err, success) => {
            if (err) {
                logger.error(err);
                return next({
                    status: err.status,
                    message: err.message,
                    data: {}
                })
            }
            if(success){
                logger.trace('Delete success:', success);
                res.status(200).json({
                    status: success.status,
                    message: success.message,
                    data: success.data
                });
            }
        });
    }, 
    getProfile: (req, res, next) => {
        const userId = req.userId
        logger.trace('getProfile for userId', userId)
        userService.getProfile(userId, (error, success) => {
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
                });
            }
        });
    },
};

module.exports = userController
