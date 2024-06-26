process.env.DB_DATABASE = process.env.DB_DATABASE || 'share_a_meal_testdb'
process.env.LOGLEVEL = 'trace'

const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../index')
const tracer = require('tracer')
const db = require('../src/dao/mysql-db')
const logger = require('../src/util/logger')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const jwtSecretKey = require('../src/util/config').secretkey

chai.should()
chai.use(chaiHttp)
tracer.setLevel('warn')

const CLEAR_MEAL_TABLE = 'DELETE IGNORE FROM `meal`;'
const CLEAR_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM `meal_participants_user`;'
const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM `user`;'
const CLEAR_DB = CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE

const INSERT_USER =
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAddress`, `password`, `phoneNumber`, `roles`, `street`, `city` ) VALUES ' +
    '(1, "first", "last", "n.ame@server.nl", "secret", "0610251885", "", "street", "city"), ' +
    '(2, "John", "Doe", "john.doe@example.com", "password123", "0612345678", "", "Main St", "New York");';

const INSERT_MEAL = 'INSERT INTO `meal` (`id`, `isActive`, `isVega`, `isVegan`, `isToTakeHome`, `dateTime`, `maxAmountOfParticipants`, `price`, `imageUrl`, `cookId`, `name`, `description`, `allergenes`) VALUES ' +
'(1, 1, 0, 0, 0, "2021-06-01 12:00:00", 5, 10.00, "https://www.example.com/image.jpg", 1, "Pasta", "Pasta with tomato sauce", "gluten, lactose"), ' +
'(2, 1, 0, 0, 0, "2021-06-01 12:00:00", 5, 10.00, "https://www.example.com/image.jpg", 2, "Pizza", "Pizza with tomato sauce", "gluten, lactose");';

const endpointToTest = `/api/meal`

describe('UC303 Opvragen van alle maaltijden', () => {
    beforeEach((done) => {
        logger.debug('Before each test')
        db.getConnection(function (err, connection) {
            if (err) throw err // not connected!
            connection.query(
                CLEAR_DB + INSERT_USER + INSERT_MEAL,
                function (error, results, fields) {
                    connection.release()
                    if (error) throw error
                    logger.debug('beforeeach done')
                    done()
                }
            )
        })
        console.log('Before each test')
    })
    afterEach((done) => {
        console.log('After each test')
        done()
    })
    it('TC-303-1 Lijst van alle maaltijden geretourneerd', (done) => {
        chai.request(server)
            .get(endpointToTest)
            .end((err, res) => {
                chai.expect(res.status).to.equal(200)
                chai.expect(res.body).to.be.an('object')
                chai.expect(res.body).to.have.property('message').equals('Meals retrieved successfully')
                chai.expect(res.body).to.have.property('status').equals(200)
                chai.expect(res.body).to.have.property('data').to.be.an('array')
                res.body.data.forEach((meal) => {
                    chai.expect(meal).to.have.property('id').to.be.a('number')
                    chai.expect(meal).to.have.property('isActive').to.be.a('number')
                    chai.expect(meal).to.have.property('isVega').to.be.a('number')
                    chai.expect(meal).to.have.property('isVegan').to.be.a('number')
                    chai.expect(meal).to.have.property('isToTakeHome').to.be.a('number')
                    chai.expect(meal).to.have.property('dateTime').to.be.a('string')
                    chai.expect(meal).to.have.property('maxAmountOfParticipants').to.be.a('number')
                    chai.expect(meal).to.have.property('price').to.be.a('string')
                    chai.expect(meal).to.have.property('imageUrl').to.be.a('string')
                    chai.expect(meal).to.have.property('cook').to.be.an('object')
                    chai.expect(meal.cook).to.have.property('id').to.be.a('number')
                    chai.expect(meal.cook).to.have.property('firstName').to.be.a('string')
                    chai.expect(meal.cook).to.have.property('lastName').to.be.a('string')
                    chai.expect(meal.cook).to.have.property('isActive').to.be.a('number')
                    chai.expect(meal.cook).to.have.property('emailAddress').to.be.a('string')
                    chai.expect(meal.cook).to.have.property('phoneNumber').to.be.a('string')
                    chai.expect(meal.cook).to.have.property('roles').to.be.a('string')
                    chai.expect(meal.cook).to.have.property('street').to.be.a('string')
                    chai.expect(meal.cook).to.have.property('city').to.be.a('string')
                    chai.expect(meal).to.have.property('createDate').to.be.a('string')
                    chai.expect(meal).to.have.property('updateDate').to.be.a('string')
                    chai.expect(meal).to.have.property('name').to.be.a('string')
                    chai.expect(meal).to.have.property('description').to.be.a('string')
                    chai.expect(meal).to.have.property('allergens').to.be.a('string')
                    chai.expect(meal).to.have.property('participants').to.be.an('array')

                    // Voor elke deelnemer in de participants array
                    meal.participants.forEach((participant) => {
                        chai.expect(participant).to.have.property('id').to.be.a('number')
                        chai.expect(participant).to.have.property('firstName').to.be.a('string')
                        chai.expect(participant).to.have.property('lastName').to.be.a('string')
                        chai.expect(participant).to.have.property('isActive').to.be.a('number')
                        chai.expect(participant).to.have.property('emailAddress').to.be.a('string')
                        chai.expect(participant).to.have.property('phoneNumber').to.be.a('string')
                        chai.expect(participant).to.have.property('roles').to.be.a('string')
                        chai.expect(participant).to.have.property('street').to.be.a('string')
                        chai.expect(participant).to.have.property('city').to.be.a('string')
                    })
                })
                done()
            })
    })
})