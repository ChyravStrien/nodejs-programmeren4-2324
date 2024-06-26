const logger = require('../util/logger')
const db = require('../dao/mysql-db')

const mealService = {
    create: (meal, cookId, callback) => {
        logger.info('Creating meal: ', meal)
        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                callback(err, null)
                return
            }
            const query = 'INSERT INTO `meal` (`isActive`, `isVega`, `isVegan`, `isToTakeHome`, `dateTime`, `maxAmountOfParticipants`, `price`, `imageUrl`, `cookId`, `name`, `description`, `allergenes`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'


                const values = [
                    meal.isActive || 0,
                    meal.isVega || 0,
                    meal.isVegan || 0,
                    meal.isToTakeHome || 1,
                    new Date(meal.dateTime),
                    meal.maxAmountOfParticipants,
                    meal.price,
                    meal.imageUrl,
                    cookId,
                    meal.name,
                    meal.description,
                    meal.allergenes || '' 
                ];
                
            connection.query(query, values, (error, results) => {
                if (error) {
                    logger.error(error)
                    callback(error, null)
                } else {
                    meal.id = results.insertId
                    logger.trace(`Created meal with id ${meal.id}`)
                    callback(null, {
                        status: 201,
                        message: `Meal created with id ${meal.id}`,
                        data: meal
                    })
                }
            })
        })
    }, 
    getAll: (callback) => {
        logger.info('Getting all meals')
        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                callback(err, null)
                return
            }
            //query om alle maaltijden op te halen met cookinfo
            const mealQuery = `SELECT m.id, m.isActive, m.isVega, m.isVegan, m.isToTakeHome, m.dateTime, m.maxAmountOfParticipants, m.price, m.imageUrl, m.cookId, m.createDate, m.updateDate, m.name, m.description, m.allergenes, 
            u.id AS cookId, u.firstName AS cookName, u.lastName, u.isActive, u.emailAddress AS cookEmail, u.phoneNumber AS cookPhone, u.roles, u.street, u.city
            FROM meal m 
            JOIN user u ON m.cookId = u.id;`
            connection.query(mealQuery, (mealError, mealResults) => { 
                if (mealError) {                                               
                    logger.error(mealError)
                    callback(mealError, null)
                    return;
                } 
                const meals = mealResults.map(meal => ({
                    id: meal.id,
                    isActive: meal.isActive,
                    isVega: meal.isVega,
                    isVegan: meal.isVegan,
                    isToTakeHome: meal.isToTakeHome,
                    dateTime: meal.dateTime,
                    maxAmountOfParticipants: meal.maxAmountOfParticipants,
                    price: meal.price,
                    imageUrl: meal.imageUrl,
                    cook: {
                        id: meal.cookId,
                        firstName: meal.cookName,
                        lastName: meal.lastName,
                        isActive: meal.isActive,
                        emailAddress: meal.cookEmail,
                        phoneNumber: meal.cookPhone,
                        roles: meal.roles,
                        street: meal.street,
                        city: meal.city
                    },
                    createDate: meal.createDate,
                    updateDate: meal.updateDate,
                    name: meal.name,
                    description: meal.description,
                    allergens: meal.allergenes,
                    participants: []
                }));
                //query om alle deelnemers op te halen per meal
                const participantQuery = `SELECT mp.mealId, mp.userId, u.firstName AS participantName, u.lastName, u.isActive, u.emailAddress AS participantEmail, u.phoneNumber AS participantPhone, u.roles, u.street, u.city
                FROM meal_participants_user mp
                JOIN user u ON mp.userId = u.id`;

                connection.query(participantQuery, (participantError, participantResults) => {
                    if(participantError){
                        logger.error(participantError)
                        callback(participantError, null)
                        return
                    }
                    meals.forEach(meal => {
                        meal.participants = participantResults
                        .filter(participant => participant.mealId === meal.id)
                        .map(participant => ({
                            id: participant.userId,
                            firstName: participant.participantName,
                            lastName: participant.lastName,
                            isActive: participant.isActive,
                            emailAddress: participant.participantEmail,
                            phoneNumber: participant.participantPhone,
                            roles: participant.roles,
                            street: participant.street,
                            city: participant.city
                        }))

                    })
                    callback(null, {
                        status: 200, 
                        message: 'Meals retrieved successfully',
                        data: meals
                    })
                })
            })
        })
    },
    getById: (mealId, callback) => {
        logger.trace('mealService: getById', mealId);
        db.getConnection(function (err, connection){
            if(err){
                logger.error(err)
                callback(err, null)
                return
            }
            const mealQuery = `SELECT m.id, m.isActive, m.isVega, m.isVegan, m.isToTakeHome, m.dateTime, m.maxAmountOfParticipants, m.price, m.imageUrl, m.cookId, m.createDate, m.updateDate, m.name, m.description, m.allergenes, 
            u.id AS cookId, u.firstName AS cookName, u.lastName, u.isActive, u.emailAddress AS cookEmail, u.phoneNumber AS cookPhone, u.roles, u.street, u.city
            FROM meal m 
            JOIN user u ON m.cookId = u.id
            WHERE m.id = ?`;

            connection.query(mealQuery, [mealId], (mealError, mealResults) => {
                if(mealError){
                    logger.error(mealError)
                    callback(mealError, null)
                    return;
                }
                if(mealResults.length===0){
                    callback(null, {
                        status: 404,
                        message: `Meal with id ${mealId} not found.`, 
                        data: null
                    });
                    return;
                }
                const meal = {
                    id: mealResults[0].id,
                    isActive: mealResults[0].isActive,
                    isVega: mealResults[0].isVega,
                    isVegan: mealResults[0].isVegan,
                    isToTakeHome: mealResults[0].isToTakeHome,
                    dateTime: mealResults[0].dateTime,
                    maxAmountOfParticipants: mealResults[0].maxAmountOfParticipants,
                    price: mealResults[0].price,
                    imageUrl: mealResults[0].imageUrl,
                    cook: {
                        id: mealResults[0].cookId,
                        firstName: mealResults[0].cookName,
                        lastName: mealResults[0].lastName,
                        isActive: mealResults[0].isActive,
                        emailAddress: mealResults[0].cookEmail,
                        phoneNumber: mealResults[0].cookPhone,
                        roles: mealResults[0].roles,
                        street: mealResults[0].street,
                        city: mealResults[0].city
                    },
                    createDate: mealResults[0].createDate,
                    updateDate: mealResults[0].updateDate,
                    name: mealResults[0].name,
                    description: mealResults[0].description,
                    allergens: mealResults[0].allergens,
                    participants: []
                };
                const participantQuery = `SELECT mp.mealId, mp.userId, u.firstName AS participantName, u.lastName, u.isActive, u.emailAddress AS participantEmail, u.phoneNumber AS participantPhone, u.roles, u.street, u.city
                FROM meal_participants_user mp
                JOIN user u ON mp.userId = u.id
                WHERE mp.mealId = ?`;

                connection.query(participantQuery, [mealId], (participantError, participantsResults) => {
                    if(participantError){
                        logger.error(participantError)
                        callback(participantError, null)
                    } else {
                        meal.partcipants = participantsResults.map(row => ({
                            id: row.userId,
                            firstName: row.participantName,
                            lastName: row.lastName,
                            isActive: row.isActive,
                            emailAddress: row.participantEmail,
                            phoneNumber: row.participantPhone,
                            roles: row.roles,
                            street: row.street,
                            city: row.city
                        }));
                        callback(null, {
                            status: 200, 
                            message: `Meal with id ${mealId} retrieved successfully.`,
                            data: meal
                        })
                    }
                })
            })
        })
    }, 
    delete: (mealId, cookId, callback) => {
        logger.info('Deleting meal: ', mealId)
        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                callback(err, null)
                return
            }
            //cheken of maaltijd bestaan en gemaakt is door user die wil verwijderen
            const checkQuery = `SELECT cookId FROM meal WHERE id = ${mealId}`;
            connection.query(checkQuery, (checkError, checkResults) => {
                if(checkError){
                    logger.error(checkError)
                    callback(checkError, null)
                    return
                }
                if (checkResults.length === 0){
                    //maaltijd bestaat niet
                    logger.trace(`Meal with id ${mealId} not found`)
                    callback(null, {
                        status: 404,
                        message: `Maaltijd met id ${mealId} niet gevonden`,
                        data: null
                    })

                } else {
                    const mealCookId = checkResults[0].cookId //cookId van de maaltijd uit bovenstaande query
                    if (mealCookId !== cookId){
                        //maaltijd is niet gemaakt door de user die wil verwijderen 
                        logger.trace(`User with id ${cookId} is not the creator of meal with id ${mealId}`)
                        callback(null, {
                            status: 403, 
                            message: `Je hebt geen toestemming om maaltijd met id ${mealId} te verwijderen`,
                            data: null
                        })
                    } else {
                        //maaltijd bestaat en is gemaakt door user, dus mag verwijdert worden 
                        const deleteQuery = `DELETE FROM meal WHERE id = ? AND cookId = ?`
                        connection.query(deleteQuery, [mealId, cookId], (deleteError, deleteResults) => {
                            if (deleteError){
                                logger.error(deleteError)
                                callback(deleteError, null)
                            } else {
                                logger.trace(`Deleted meal with id ${mealId}`)
                                callback(null, {
                                    message: `Maaltijd met ID ${mealId} is verwijderd`,
                                    data: null
                                })

                            }
                        })
                    }
                }
            })
        }
    )},
    update: (mealId, meal, cookId, callback) => {
        logger.info('Updating meal: ', mealId)
        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                callback(err, null)
                return
            }
            //checken of maaltijd bestaat en gemaakt is door user die wil updaten
            const checkQuery = `SELECT cookId FROM meal WHERE id = ${mealId}`;
            connection.query(checkQuery, (checkError, checkResults) => {
                if(checkError){
                    logger.error(checkError)
                    callback(checkError, null)
                    return
                }
                if (checkResults.length === 0){
                    //maaltijd bestaat niet
                    logger.trace(`Meal with id ${mealId} not found`)
                    callback(null, {
                        status: 404,
                        message: `Maaltijd met id ${mealId} niet gevonden`,
                        data: null
                    })
                } else {
                    const mealCookId = checkResults[0].cookId //cookId van de maaltijd uit bovenstaande query
                    if (mealCookId !== cookId){
                        //maaltijd is niet gemaakt door de user die wil updaten 
                        logger.trace(`User with id ${cookId} is not the creator of meal with id ${mealId}`)
                        callback(null, {
                            status: 403, 
                            message: `Je hebt geen toestemming om maaltijd met id ${mealId} te updaten`,
                            data: null
                        })
                } else {
                    //maaltijd bestaat en is gemaakt door user, dus mag geupdatet worden 
                    const getCurrentValuesQuery = `SELECT * FROM meal WHERE id = ? AND cookId = ?`
                    connection.query(getCurrentValuesQuery, [mealId, cookId], (getCurrentValuesError, getCurrentValuesResults) => {
                        if (getCurrentValuesError){
                            logger.error(getCurrentValuesError)
                            callback(getCurrentValuesError, null)
                            return
                        }
                        if(getCurrentValuesResults.length === 0){
                            logger.trace(`Meal with id ${mealId} not found`)
                            callback(null, {
                                status: 404,
                                message: `Maaltijd met id ${mealId} niet gevonden`,
                                data: null
                            })
                        } else {
                            const currentMeal = getCurrentValuesResults[0]
                            const updateQuery = `UPDATE meal SET isActive = ?, isVega = ?, isVegan = ?, isToTakeHome = ?, dateTime = ?, maxAmountOfParticipants = ?, price = ?, imageUrl = ?, name = ?, description = ?, allergenes = ? WHERE id = ? AND cookId = ?`
                            const values = [
                                meal.isActive !== undefined ? meal.isActive : currentMeal.isActive,
                                meal.isVega !== undefined ? meal.isVega : currentMeal.isVega,
                                meal.isVegan !== undefined ? meal.isVegan : currentMeal.isVegan,
                                meal.isToTakeHome !== undefined ? meal.isToTakeHome : currentMeal.isToTakeHome,
                                meal.dateTime ? new Date(meal.dateTime) : currentMeal.dateTime, //datetime is date meal is served btw hij geeft het verkeerd terug door timezone?
                                meal.maxAmountOfParticipants, //verplicht 
                                meal.price, //verplicht
                                meal.imageUrl !== undefined ? meal.imageUrl : currentMeal.imageUrl, 
                                meal.name, //verplicht 
                                meal.description !== undefined ? meal.description : currentMeal.description, 
                                meal.allergenes !== undefined ? meal.allergenes : currentMeal.allergenes, //als t undefined is dan blijft allergenes hetzelfde anders nieuwe waarde
                                mealId,
                                cookId
                            ]
                            connection.query(updateQuery, values, (updateError, updateResults) => {
                                if (updateError){
                                    logger.error(updateError)
                                    callback(updateError, null)
                                } else {
                                    logger.trace(`Updated meal with id ${mealId}`)
                                    const getUpdatedMealQuery = `SELECT * FROM meal WHERE id = ? AND cookId = ?`;
                                    connection.query(getUpdatedMealQuery, [mealId, cookId], (getUpdatedMealError, getUpdatedMealResults) => {
                                        if(getUpdatedMealError){
                                            logger.error(getUpdatedMealError)
                                            callback(getUpdatedMealError, null)
                                        } else {
                                            const updatedMeal = getUpdatedMealResults[0]
                                            callback(null, {
                                                status: 200,
                                                message: `Maaltijd met id ${mealId} is geupdatet`,
                                                data: updatedMeal
                                            })
                                        }
                                    })
        
                                }
                            })

                        }
                            

                    })

                }
            }
        })
    }
)}
}
module.exports = mealService
