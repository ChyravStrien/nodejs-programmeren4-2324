//const database = require('../dao/inmem-db')
const logger = require('../util/logger')

const db = require('../dao/mysql-db')

const userService = {
    create: (user, callback) => {
        logger.info('create user', user)
        db.getConnection(function(err, connection){
            if(err){
                logger.error(err)
                callback(err, null)
                return
            }
            const query = `INSERT INTO \`user\` (firstName, lastName, emailAddress, password, phoneNumber, roles, street, city) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

            const values = [
                user.firstName,
                user.lastName,
                user.emailAddress,
                user.password,
                user.phoneNumber || '', //als er niks is ingevuld, dan leeglaten
                user.roles,
                user.street, 
                user.city 
            ]
            
            connection.query(query, values, (error, results) =>{
                
                    if(error){
                        logger.error(error)
                        callback(error, null)
                    } else{
                        user.id = results.insertId
                        logger.trace(`User created with id ${user.id}.`)
                        callback(null, {
                            message: `User created with id ${user.id}.`,
                            data: user
                        })
                    }
                }
            )
        })
    },

    getAll: (filters, callback) => {
        logger.info('getAll');
        let query = `SELECT id, firstName, lastName, isActive, emailAddress, roles, street, city FROM \`user\` WHERE 1=1`; //1=1 is altijd true, dit maakt het makkelijk om filters toe te voegen aan where clause
        const queryParams = [];
        
        if (filters.isActive !== undefined) {
            if(filters.isActive === 'true' || filters.isActive === 'false'){
                query += ' AND isActive = ?';
                queryParams.push(filters.isActive === 'true' ? 1 : 0); // if status is true then 1 else 0 for false 
            } else {
                logger.warn('Invalid value for isActive filter:', filters.isActive);
                return callback(null,{
                    status: 400,
                    message: 'Invalid value for isActive filter',
                    data: null
                });
            }
          
        }
        //stel er komt nog een filter bij dan kan je hier nog een if statement toevoegen
    
        db.getConnection((err, connection) => {
            if (err) {
                logger.error(err);
                return callback(err, null);
            }
    
            connection.query(query, queryParams, (error, results) => {
                if (error) {
                    logger.error(error);
                    return callback(error, null);
                } else {
                    logger.debug(results);
                    callback(null, {
                        message: `Found ${results.length} users.`,
                        data: results
                    });
                }
            });
        });
    },
    
    getById: (requestingUserId, userId, callback) => {
        logger.trace('userService: getById', userId);
        db.getConnection(function (err, connection){
            if(err){
                logger.error(err)
                callback(err, null)
                return
            }
            connection.query(
                `SELECT id, firstName, lastName, isActive, emailAddress, phoneNumber, roles, street, city, 
                CASE WHEN id = ? THEN password ELSE NULL END AS password 
                FROM \`user\` WHERE id = ?`, //als id gelijk is aan requestingUserId, dan geef password terug, anders null
                [requestingUserId, userId],
                (error, results)=> {
                    connection.release()
                    if(error){
                        logger.error(error)
                        callback(error, null)
                    } else {
                        if (results.length>0){
                            const user = results[0]
                            if(user.password === null){
                                delete user.password
                            }
                            logger.trace(`User with id ${userId} found.`)
                            callback(null, {
                                status: 200,
                                message: `User with id ${userId} found.`,
                                data: results[0]
                            })
                        } else{
                            callback(null, {
                                status: 404,
                                message: `User with id ${userId} not found.`,
                                data: null
                            })
                        }
                    }
                }
            )
        })
    }, 
    update: (userId, updatedUser, callback) => {
        logger.trace('userService: update', updatedUser);
        db.getConnection((err, connection) => {
            if (err) {
                logger.error('Error getting DB connection:', err);
                callback(err, null);
                return;
            }

            const sql = `
                UPDATE \`user\`
                SET firstName = ?, lastName = ?, isActive = ?, emailAddress = ?, password = ?, phoneNumber = ?, roles = ?, street = ?, city = ?
                WHERE id = ?
            `;
            const values = [
                updatedUser.firstName,
                updatedUser.lastName,
                updatedUser.isActive,
                updatedUser.emailAddress,
                updatedUser.password,
                updatedUser.phoneNumber,
                updatedUser.roles,
                updatedUser.street,
                updatedUser.city,
                userId
            ];

            logger.trace('SQL Query:', sql);
            logger.trace('Values:', values);

            connection.query(sql, values, (error, results) => {
                connection.release();

                if (error) {
                    logger.error('Error executing query:', error);
                    callback(error, null);
                    return;
                }

                logger.trace('Query Results:', results);

                if (results.affectedRows > 0) {
                    logger.trace(`User with id ${userId} updated.`);
                    callback(null, {
                        status: 200,
                        message: `User with id ${userId} updated.`,
                        data: { id: userId, ...updatedUser }
                    });
                } else {
                    logger.warn(`User with id ${userId} not found.`);
                    callback({
                        status: 404,
                        message: `User with id ${userId} not found.`,
                    }, null);
                }
            });
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
    },
    getProfile: (userId, callback) => {
        logger.info('getProfile userId:', userId)

        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                callback(err, null)
                return;
            }

            connection.query(
                'SELECT id, firstName, lastName FROM `user` WHERE id = ?',
                [userId],
                function (error, results, fields) {
                    connection.release()

                    if (error) {
                        logger.error(error)
                        callback(error, null)
                    } else {
                        if(results.length === 0){
                            callback({
                                status: 404,
                                message: `User with ID ${userId} not found`
                            }, null);
                        }else{
                        logger.debug(results)
                        callback(null, {
                            message: `Found ${results.length} user.`,
                            data: results
                        });

                        }
                        
                    }
                }
            );
        });
    }

};


module.exports = userService
