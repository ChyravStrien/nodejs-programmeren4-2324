const logger = require('../util/logger')
const db = require('../dao/mysql-db')

let participationService = {
    participate: (mealId, userId, callback) => {
        // Check if the user is already registered for the meal
        const checkRegistration = 'SELECT COUNT(*) as count FROM meal_participants_user WHERE mealId = ? AND userId = ?';
        db.query(checkRegistration, [mealId, userId], (error, result) => {
            if (error) {
                logger.error('participationService:participate', error);
                return callback({
                    status: 500,
                    message: 'Internal server error',
                    data: {}
                }, null);
            }
            if (result[0].count > 0) {
                // User is already registered
                logger.error('participationService:participate', 'User already registered for this meal');
                return callback({
                    status: 400,
                    message: 'User already registered for this meal',
                    data: {}
                }, null);
            }

            // Retrieve the meal to get maxAmountOfParticipants
            const getMaxParticipants = 'SELECT maxAmountOfParticipants FROM meal WHERE id = ?';
            db.query(getMaxParticipants, [mealId], (error, result) => {
                if (error) {
                    logger.error('participationService:participate', error);
                    return callback({
                        status: 500,
                        message: 'Internal server error',
                        data: {}
                    }, null);
                }
                if (result.length === 0) {
                    logger.error('participationService:participate', 'Meal not found');
                    return callback({
                        status: 404,
                        message: 'Meal not found',
                        data: {}
                    }, null);
                }
                const maxParticipants = result[0].maxAmountOfParticipants;

                // Check the current number of participants
                db.query('SELECT COUNT(*) as participantCount FROM meal_participants_user WHERE mealId = ?', [mealId], (error, result) => {
                    if (error) {
                        logger.error('participationService:participate', error);
                        return callback({
                            status: 500,
                            message: 'Internal server error',
                            data: {}
                        }, null);
                    }
                    const currentParticipants = result[0].participantCount;
                    if (currentParticipants >= maxParticipants) {
                        logger.error('participationService:participate', 'Max amount of participants reached');
                        return callback({
                            status: 400,
                            message: 'Max amount of participants reached',
                            data: {}
                        }, null);
                    }

                    // Add the user to the participation table
                    db.query('INSERT INTO meal_participants_user (mealId, userId) VALUES (?, ?)', [mealId, userId], (error, result) => {
                        if (error) {
                            logger.error('participationService:participate', error);
                            return callback({
                                status: 500,
                                message: 'Internal server error',
                                data: {}
                            }, null);
                        }
                        if (result.affectedRows === 0) {
                            logger.error('participationService:participate', 'No rows affected');
                            return callback({
                                status: 404,
                                message: 'No rows affected',
                                data: {}
                            }, null);
                        }
                        callback(null, {
                            status: 200,
                            message: 'User with id ' + userId + ' has been successfully registered for meal with id ' + mealId,
                            data: { mealId: mealId, userId: userId }
                        });
                    });
                });
            });
        });
    }
};
module.exports = participationService