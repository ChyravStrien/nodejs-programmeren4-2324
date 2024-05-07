const database = require('../dao/inmem-db')
const logger = require('../util/logger')

//const db = require('../dao/mysql-db')

const userService = {
    create: (user, callback) => {
        logger.info('create user', user)
        database.add(user, (err, data) => {
            if (err) {
                logger.info(
                    'error creating user: ',
                    err.message || 'unknown error'
                )
                callback(err, null)
            } else {
                logger.trace(`User created with id ${data.id}.`)
                callback(null, {
                    message: `User created with id ${data.id}.`,
                    data: data
                })
            }
        })
    },

    getAll: (callback) => {
        logger.info('getAll')

        // Deprecated: de 'oude' manier van werken, met de inmemory database
         database.getAll((err, data) => {
             if (err) {
                 callback(err, null)
             } else {
                 callback(null, {
                     message: `Found ${data.length} users.`,
                     data: data
                 })
             }
         })

        // Nieuwe manier van werken: met de MySQL database
        // db.getConnection(function (err, connection) {
        //     if (err) {
        //         logger.error(err)
        //         callback(err, null)
        //         return
        //     }

        //     connection.query(
        //         'SELECT id, firstName, lastName FROM `user`',
        //         function (error, results, fields) {
        //             connection.release()

        //             if (error) {
        //                 logger.error(error)
        //                 callback(error, null)
        //             } else {
        //                 logger.debug(results)
        //                 callback(null, {
        //                     message: `Found ${results.length} users.`,
        //                     data: results
        //                 })
        //             }
        //         }
        //     )
        // })
    },
    getById: (userId, callback) => {
        logger.trace('userService: getById', userId);
        database.getById(userId, (err, data) => {
            if(err){
                logger.info('error fetching user: ', err.message || 'unknown error');
                callback(err, null);
            } else {
                logger.trace(`User with ID ${userId} found.`);
                callback(null, {
                    status: 200,
                    message: `User with ID ${userId} found.`,
                    data: data
                });
            }
        });
    }, 
    update: (userId, updatedUser, callback) => {
        logger.trace(`userService: update`, updatedUser);
        database.updateUserById(userId, updatedUser, (err, updatedUser) =>{
            if (err){
                logger.info('error updating user: ', err.message || 'unknown error');
                callback({
                    status: 500,
                    message: 'Failed to update user',
                }, null);
            } else {
                logger.trace(`User with ID ${userId} updated.`);
                callback(null, {
                    status: 200,
                    message: `User with ID ${userId} updated.`,
                    data: updatedUser
                
            
                });
            }
        });
    }, 
    delete: (userId, callback) => {
        logger.trace(`userService: delete, userId: ${userId}`);
        database.deleteUserById(userId, (err, deletedUser)=> {
            if (err) {
                logger.info('error deleting user: ', err.message || 'unknown error');
                callback({status: 500, message: 'Failed to delete user'}, null);
            } else {
                logger.trace(`User with ID ${userId} deleted.`);
                callback(null, `User with ID ${userId} has been successfully deleted.`)
            }
        });
    }
}


module.exports = userService
