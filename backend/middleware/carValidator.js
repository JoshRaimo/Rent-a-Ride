const { body, validationResult } = require('express-validator');

const validateCarRequest = [
    body('make').notEmpty().withMessage('Make is required.'),
    body('model').notEmpty().withMessage('Model is required.'),
    body('year')
        .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
        .withMessage('Year must be between 1990 and the current year.'),
    body('pricePerDay')
        .isFloat({ gt: 0 })
        .withMessage('Price per day must be greater than 0.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = { validateCarRequest };