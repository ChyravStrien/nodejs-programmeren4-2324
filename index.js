const express = require('express')
const userRoutes = require('./src/routes/user.routes')
const authRoutes = require('./src/routes/authentication.routes').routes
const logger = require('./src/util/logger')
const mealRoutes = require('./src/routes/meal.routes')

const app = express()

// express.json zorgt dat we de body van een request kunnen lezen
app.use(express.json())

const port = process.env.PORT || 3000

// Dit is een voorbeeld van een simpele route
app.get('/api/info', (req, res) => {
    console.log('GET /api/info')
    const info = {
        status: 200,
        message: 'Server info endpoint',
        data: {
            studentName: 'Chyra van Strien',
            studentNumber: '2219603',
            description: 'Welkom bij de share-a-meal API!'
        }
    }
    res.json(info)
})

// Hier komen alle routes
app.use('/api/auth', authRoutes)
app.use(userRoutes)
app.use(mealRoutes)

// Route error handler
app.use((req, res, next) => {
    next({
        status: 404,
        message: 'Route not found',
        data: {}
    })
})

// Hier komt je Express error handler te staan!
app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        status: error.status || 500,
        message: error.message || 'Internal Server Error',
        data: {}
    })
})

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`)
})

// Deze export is nodig zodat Chai de server kan opstarten
module.exports = app
