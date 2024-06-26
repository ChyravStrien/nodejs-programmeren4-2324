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
'(1, 1, 0, 0, 0, "2021-06-01 12:00:00", 5, 10.00, "https://www.example.com/image.jpg", 1, "Pasta", "Pasta with tomato sauce", "gluten,lactose"), ' +
'(2, 1, 0, 0, 0, "2021-06-01 12:00:00", 5, 10.00, "https://www.example.com/image.jpg", 2, "Pizza", "Pizza with tomato sauce", "gluten,lactose");';

const endpointToTest = (mealId) => `/api/meal/${mealId}`

describe('UC304 Opvragen van maaltijd bij ID', () => {
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
    it('TC-304-1 Maaltijd bestaat niet', (done) => {
        chai.request(server)
            .get(endpointToTest(-1))
            .end((err, res) => {
                chai.expect(res.body).to.be.an('object')
                chai.expect(res.body).to.have.property('message').equals('Meal with id -1 not found.')
                chai.expect(res.body).to.have.property('status').equals(404)
                chai.expect(res.body).to.have.property('data').to.be.null

                done()
            })
    })
    it('TC-304-2 Details van maaltijd geretourneerd', (done) => {
        chai.request(server)
            .get(endpointToTest(1))
            .end((err, res) => {
                chai.expect(res.status).to.equal(200)
                chai.expect(res.body).to.be.an('object')
                chai.expect(res.body).to.have.property('message').equals('Meal with id 1 retrieved successfully.')
                chai.expect(res.body).to.have.property('status').equals(200)
                chai.expect(res.body).to.have.property('data').to.be.an('object')
                chai.expect(res.body.data).to.have.property('id').to.be.a('number').equals(1)
                chai.expect(res.body.data).to.have.property('isActive').to.be.a('number').equals(1)
                chai.expect(res.body.data).to.have.property('isVega').to.be.a('number').equals(0)
                chai.expect(res.body.data).to.have.property('isVegan').to.be.a('number').equals(0)
                chai.expect(res.body.data).to.have.property('isToTakeHome').to.be.a('number').equals(0)
                chai.expect(res.body.data).to.have.property('maxAmountOfParticipants').to.be.a('number').equals(5)
                chai.expect(res.body.data).to.have.property('price').to.be.a('string').equals('10.00')
                chai.expect(res.body.data).to.have.property('imageUrl').to.be.a('string').equals('https://www.example.com/image.jpg')
                chai.expect(res.body.data).to.have.property('cook').to.be.an('object')
                chai.expect(res.body.data.cook).to.have.property('id').to.be.a('number').equals(1)  
                chai.expect(res.body.data.cook).to.have.property('firstName').to.be.a('string').equals('first')
                chai.expect(res.body.data.cook).to.have.property('lastName').to.be.a('string').equals('last')
                chai.expect(res.body.data.cook).to.have.property('isActive').to.be.a('number').equals(1)
                chai.expect(res.body.data.cook).to.have.property('emailAddress').to.be.a('string').equals('n.ame@server.nl')
                chai.expect(res.body.data.cook).to.have.property('phoneNumber').to.be.a('string').equals('0610251885')
                chai.expect(res.body.data.cook).to.have.property('roles').to.be.a('string').equals('')  
                chai.expect(res.body.data.cook).to.have.property('street').to.be.a('string').equals('street')
                chai.expect(res.body.data.cook).to.have.property('city').to.be.a('string').equals('city')
                chai.expect(res.body.data).to.have.property('createDate').to.be.a('string')
                chai.expect(res.body.data).to.have.property('updateDate').to.be.a('string')
                chai.expect(res.body.data).to.have.property('name').to.be.a('string').equals('Pasta')
                chai.expect(res.body.data).to.have.property('description').to.be.a('string').equals('Pasta with tomato sauce')
                chai.expect(res.body.data).to.have.property('allergenes').to.be.a('string').equals('gluten,lactose')
                done()
            })
    })
})