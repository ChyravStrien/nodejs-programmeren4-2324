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

describe('UC305 Verwijderen van een maaltijd', () => {
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
    it('TC-305-1 Gebruiker is niet ingelogd', (done) => {
        chai.request(server)
            .delete(endpointToTest(1)) 
            .end((err, res) => {
                chai.expect(res.status).to.equal(401);
                chai.expect(res.body).to.be.an('object');
                chai.expect(res.body).to.have.property('message').equals('Authorization header missing!');
                chai.expect(res.body).to.have.property('status').equals(401);
                chai.expect(res.body).to.have.property('data').to.be.empty;
                done();
            });
    });
    it('TC-305-2 Niet de eigenaar van de data', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' });
        chai.request(server)
            .delete(endpointToTest(2))
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                chai.expect(res.body).to.be.an('object')
                chai.expect(res.body).to.have.property('message').equals('Je hebt geen toestemming om maaltijd met id 2 te verwijderen')
                chai.expect(res.body).to.have.property('status').equals(403)
                chai.expect(res.body).to.have.property('data').to.be.null
                done()
            })
    })
    it('TC-305-3 Maaltijd bestaat niet', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' });
        chai.request(server)
            .delete(endpointToTest(-1))
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                chai.expect(res.body).to.be.an('object')
                chai.expect(res.body).to.have.property('message').equals('Maaltijd met id -1 niet gevonden')
                chai.expect(res.body).to.have.property('status').equals(404)
                chai.expect(res.body).to.have.property('data').to.be.null
                done()
            })
    })
    it('TC-305-4 Maaltijd succesvol verwijderd', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' });
        chai.request(server)
            .delete(endpointToTest(1))
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                chai.expect(res.status).to.equal(200)
                chai.expect(res.body).to.be.an('object')
                chai.expect(res.body).to.have.property('message').equals('Maaltijd met ID 1 is verwijderd')
                chai.expect(res.body).to.have.property('status').equals(200)
                chai.expect(res.body).to.have.property('data').to.be.null
                done()
            })
    })
})