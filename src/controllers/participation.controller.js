const participationService = require('../services/participation.service');
const logger = require('../util/logger');

let participationController = {
    participate: (req, res, next) => {
        const mealId = req.params.mealId;
        const userId = req.userId;
        logger.info('participate', mealId, userId)
        participationService.participate(mealId, userId, (error, success) => {
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
module.exports = participationController;