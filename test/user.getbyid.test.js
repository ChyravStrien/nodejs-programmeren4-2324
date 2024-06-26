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
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAddress`, `password`, `phoneNumber`, `roles`, `street`, `city` ) VALUES' +
    '(1, "first", "last", "n.ame@server.nl", "secret", "0610251885", "", "street", "city");'

const endpointToTest = (userId) => `/api/user/${userId}`

describe('UC204 Opvragen van gebruikersprofiel met id', () => {
    beforeEach((done) => {
        logger.debug('Before each test')
        db.getConnection(function (err, connection) {
            if (err) throw err // not connected!
            connection.query(
                CLEAR_DB + INSERT_USER,
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
    it('TC-204-1 Ongeldig token', (done) => {
        chai.request(server)
            .get(endpointToTest(1))
            .set('Authorization', 'Bearer ' + 'ongeldigtoken')
            .end((err, res) => {
                chai.expect(res.status).to.equal(401)
                chai.expect(res.body).to.be.an('object')
                chai.expect(res.body).to.have.property('message').equals('Not authorized!')
                chai.expect(res.body).to.have.property('status').equals(401)
                chai.expect(res.body).to.have.property('data').to.be.empty
                done()
            })
    })
    it('TC-204-2 Gebruiker bestaat niet', (done) => {
        const token = jwt.sign({ id: 1 }, jwtSecretKey, { expiresIn: '1h' })
        chai.request(server)
            .get(endpointToTest(20))
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                chai.expect(res.body).to.be.an('object')
                chai.expect(res.body).to.have.property('message').equals('User with id 20 not found.')
                chai.expect(res.body).to.have.property('status').equals(404)
                chai.expect(res.body).to.have.property('data').to.be.null
                done()
            })
        })
    it('TC-204-3 Gebruiker bestaat wel', (done) => {
        const token = jwt.sign({ id: 1 }, jwtSecretKey, { expiresIn: '1h' })
        chai.request(server)
            .get(endpointToTest(1))
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                chai.expect(res.status).to.equal(200)
                chai.expect(res.body).to.be.an('object')
                chai.expect(res.body).to.have.property('message').equals('User with id 1 found.')
                chai.expect(res.body).to.have.property('status').equals(200)
                chai.expect(res.body).to.have.property('data').to.be.an('object')
                chai.expect(res.body.data).to.have.property('id').equals(1)
                chai.expect(res.body.data).to.have.property('firstName').equals('first')
                chai.expect(res.body.data).to.have.property('lastName').equals('last')
                chai.expect(res.body.data).to.have.property('emailAddress').equals('n.ame@server.nl')
                chai.expect(res.body.data).to.have.property('street').equals('street')
                chai.expect(res.body.data).to.have.property('city').equals('city')
                chai.expect(res.body.data).to.have.property('roles')
                chai.expect(res.body.data).to.have.property('phoneNumber').equals('0610251885')
                done()

    })
})


})