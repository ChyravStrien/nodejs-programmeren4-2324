//const database = require('../dao/inmem-db')
const logger = require('../util/logger')

const db = require('../dao/mysql-db');

const userService = {
    create: (user, callback) => {
        logger.info('create user', user)
        db.getConnection(function(err, connection){
            if(err){
                logger.error(err)
                callback(err, null)
                return
            }
            const checkQuery = 'SELECT id from `user` WHERE emailAddress = ?'
            connection.query(checkQuery, [user.emailAddress], (error, results) => {
                if(error){
                    logger.error(error)
                    callback(error, null)
                    return
                }
                if(results.length > 0){
                    logger.warn('User already exists with this email address')
                    callback({
                        status: 403,
                        message: 'User already exists with this email address',
                        data: null
                    }, null)
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
                            status: 201,
                            message: `User created with id ${user.id}.`,
                            data: user
                        })
                    }
                }
            )
            })
            
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
    update: (userId, user, requestingUserId, callback) => {
        logger.trace('userService: update', user);
        db.getConnection((err, connection) => {
            if (err) {
                logger.error('Error getting DB connection:', err);
                callback(err, null);
                return;
            }
            const checkQuery = 'SELECT * FROM `user` WHERE id = ?';
            connection.query(checkQuery, [userId], (error, results) => {
                if (error) {
                    logger.error('Error executing query:', error);
                    connection.release();
                    callback(error, null);
                    return;
                }
    
                if (results.length === 0) {
                    connection.release();
                    callback({
                        status: 404,
                        message: `User with ID ${userId} not found.`
                    }, null);
                    return;
                }
                if (userId.toString() !== requestingUserId.toString()) { //beide omzetten naar string anders gaat vergelijking fout
                    connection.release();
                    callback({
                        status: 403,
                        message: 'You are not allowed to update this user.' 
                    }, null);
                    return;
                }
    
                //gebruiker bestaat en userId is gelijk aan requestingUserId, voer update-query uit
                const currentUser = results[0];
                const sql = `
                    UPDATE \`user\`
                    SET firstName = ?, lastName = ?, isActive = ?, emailAddress = ?, password = ?, phoneNumber = ?, roles = ?, street = ?, city = ?
                    WHERE id = ?
                `;
                const values = [
                    user.firstName !== undefined ? user.firstName : currentUser.firstName,
                    user.lastName !== undefined ? user.lastName : currentUser.lastName,
                    user.isActive !== undefined ? user.isActive : currentUser.isActive,
                    user.emailAddress, // verplicht veld
                    user.password !== undefined ? user.password : currentUser.password,
                    user.phoneNumber !== undefined ? user.phoneNumber : currentUser.phoneNumber,
                    user.roles !== undefined ? user.roles : currentUser.roles,
                    user.street !== undefined ? user.street : currentUser.street,
                    user.city !== undefined ? user.city : currentUser.city,
                    userId
                ];
    
                connection.query(sql, values, (error, results) => {
                    connection.release();
                    if (error) {
                        logger.error('Error executing query:', error);
                        callback(error, null);
                        return;
                    }
    
                    if (results.affectedRows > 0) {
                        logger.trace(`User with id ${userId} updated.`);
                        const getUpdatedUserQuery = 'SELECT * FROM `user` WHERE id = ?'; //nieuwe user ophalen met oude waardes
                        connection.query(getUpdatedUserQuery, [userId], (error, results) => {
                            if (error) {
                                logger.error('Error executing query:', error);
                                callback(error, null);
                                return;
                            }
    
                            const updatedUser = results[0];
                            callback(null, {
                                status: 200,
                                message: `User with ID ${userId} updated.`,
                                data: updatedUser
                            });
                        });
                    } else {
                        logger.trace(`User with id ${userId} not found or no changes were made.`);
                        callback(null, {
                            status: 404,
                            message: `User with ID ${userId} not found or no changes were made.`,
                            data: null
                        });
                    }
                });
            });
        });
    }
    ,
    delete: (userId, requestingUserId, callback) => {
        logger.trace(`userService: delete, userId: ${userId}`);
        db.getConnection((err, connection) => {
            if (err) {
                logger.error('Error getting DB connection:', err);
                callback(err, null);
                return;
            }
            const checkQuery = 'SELECT * FROM `user` WHERE id = ?';
            connection.query(checkQuery, [userId], (error, results) => {
                if (error) {
                    logger.error('Error executing query:', error);
                    connection.release();
                    callback(error, null);
                    return;
                }
                if(results.length === 0){
                    connection.release();
                    callback({
                        status: 404,
                        message: `User with ID ${userId} not found.`
                    }, null);
                    return;
                }
                if(userId.toString() !== requestingUserId.toString()){
                    connection.release();
                    callback({
                        status: 403,
                        message: 'You are not allowed to delete this user.'
                    }, null);
                    return;
                }
                //gebriker bestaat en userId is gelijk aan requestingUserId, voer delete-query uit
                const sql = 'DELETE FROM `user` WHERE id = ?';
                connection.query(sql, [userId], (error, results) => {
                    connection.release();
                    if (error) {
                        logger.error('Error executing query:', error);
                        callback(error, null);
                        return;
                    }
                    if(results.affectedRows > 0){
                        logger.trace(`User with id ${userId} deleted.`);
                        callback(null, {
                            status: 200,
                            message: `User with ID ${userId} deleted.`,
                            data: null
                        });
                    } else {
                        logger.trace(`User with id ${userId} not found or no changes were made.`);
                        callback(null, {
                            status: 404,
                            message: `User with ID ${userId} not found or no changes were made.`,
                            data: null
                        });
                    }
                })
            })
        })
    },
    getProfile: (userId, callback) => {
        logger.info('getProfile userId:', userId)

        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                callback(err, null)
                return;
            }
            const userQuery = 'SELECT id, firstName, lastName, emailAddress, password, phoneNumber, roles, street, city FROM `user` WHERE id = ?'
            connection.query(userQuery, [userId], (error, results) => {
                if(error){
                    connection.release()
                    logger.error(error)
                    return callback({ status: 500, message: 'Error fetching user profile.' }, null)
                }
                if(results.length === 0){
                    connection.release()
                    return callback({ status: 404, message: `User with Id ${userId} not found.`}, null)
                }
                const user = results[0]
                const mealsQuery = `SELECT id, isActive, isVega, isVegan, isToTakeHome, dateTime,
                maxAmountOfParticipants, price, imageUrl, createDate, updateDate, name, description, 
                allergenes 
                FROM \`meal\` 
                WHERE cookId = ? AND dateTime > NOW() ORDER BY dateTime ASC`
                connection.query(mealsQuery, [userId], (error, results) => {
                    connection.release()
                    if(error){
                        logger.error(error)
                        return callback({ status: 500, message: 'Error fetching user profile.' }, null)
                    }
                    const userProfile = {
                        user: user,
                        meals: results
                    }
                    callback(null, {
                        status: 200,
                        message: 'User profile fetched with associated meals.',
                        data: userProfile
                        
                    })
                })
            })
        });
    }

};


module.exports = userService
