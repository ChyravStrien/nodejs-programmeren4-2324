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
    'INSERT INTO `user` (`id`, `isActive`, `firstName`, `lastName`, `emailAddress`, `password`, `phoneNumber`, `roles`, `street`, `city` ) VALUES ' +
    '(1, 1, "first", "last", "n.ame@server.nl", "secret", "0610251885", "", "street", "city"), ' +
    '(2, 1, "John", "Doe", "j.doe@example.com", "password123", "0612345678", "", "Main St", "New York"), ' +
    '(3, 0, "Joker", "Xue", "J.xue@server.nl", "Piaoxue2", "0612547894", "guest", "turan", "ziji");';

const endpointToTest = '/api/user'

describe('UC203 Opvragen van ocerzicht van users', () => {
    /**
     * Voorbeeld van een beforeEach functie.
     * Hiermee kun je code hergebruiken of initialiseren.
     */
    beforeEach((done) => {
        logger.debug('Before each test')
        //maak testdatabase leeg zodat we onze testen kunnen uitvoeren
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

    /**
     * Hier starten de testcases
     */
    it('TC-202-1 Toon alle gebruikers(minimaal 2)', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' })
        chai.request(server)
            .get(endpointToTest)
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                /**
                 * Voorbeeld uitwerking met chai.expect
                 */
                chai.expect(res).to.have.status(200)
                chai.expect(res).not.to.have.status(400)
                chai.expect(res.body).to.be.a('object')
                chai.expect(res.body).to.have.property('status').equals(200)
                chai.expect(res.body).to.have.property('message').equals('Found 3 users.')
                chai.expect(res.body).to.have.property('data').that.is.a('array')
                chai.expect(res.body.data).to.have.lengthOf(3)
                res.body.data.forEach(user => {
                    chai.expect(user).to.have.property('id').that.is.a('number')
                    chai.expect(user).to.have.property('firstName').that.is.a('string')
                    chai.expect(user).to.have.property('lastName').that.is.a('string')
                    chai.expect(user).to.have.property('isActive').that.is.a('number')
                    chai.expect(user).to.have.property('emailAddress').that.is.a('string')
                    chai.expect(user).to.have.property('roles').that.is.a('string')
                    chai.expect(user).to.have.property('street').that.is.a('string')
                    chai.expect(user).to.have.property('city').that.is.a('string')
                })
                done()
            })
    })

    it('TC-202-2 Toon gebruikers met zoektermen op niet-bestaande velden', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' })
        chai.request(server)
        .get(endpointToTest + '?nonexistingfield=nonexistingvalue')
        .set('Authorization', 'Bearer ' + token)
        .end((err, res) =>{
            chai.expect(res).to.have.status(400)
            chai.expect(res).not.to.have.status(200)
            chai.expect(res.body).to.be.a('object')
            chai.expect(res.body).to.have.property('status').equals(400)
            chai.expect(res.body).to.have.property('message').equals('Unknown filter field: nonexistingfield')
            chai.expect(res.body).to.have.property('data').that.is.empty
            done()

        })
    })
    it('TC-202-3 Toon gebruikers met gebruik van de zoekterm op het veld isActive=false', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' })
        chai.request(server)
        .get(endpointToTest + '?isActive=false')
        .set('Authorization', 'Bearer ' + token)
        .end((err, res) =>{
            chai.expect(res).to.have.status(200)
            chai.expect(res).not.to.have.status(400)
            chai.expect(res.body).to.be.a('object')
            chai.expect(res.body).to.have.property('status').equals(200)
            chai.expect(res.body).to.have.property('message').equals('Found 1 users.')
            chai.expect(res.body).to.have.property('data').that.is.a('array')
            chai.expect(res.body.data).to.have.lengthOf(1)
            done()

        })
    })
    it('TC-202-4 Toon gebruikers met gebruik van de zoekterm op het veld isActive=true', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' })
        chai.request(server)
        .get(endpointToTest + '?isActive=true')
        .set('Authorization', 'Bearer ' + token)
        .end((err, res) =>{
            chai.expect(res).to.have.status(200)
            chai.expect(res).not.to.have.status(400)
            chai.expect(res.body).to.be.a('object')
            chai.expect(res.body).to.have.property('status').equals(200)
            chai.expect(res.body).to.have.property('message').equals('Found 2 users.')
            chai.expect(res.body).to.have.property('data').that.is.a('array')
            chai.expect(res.body.data).to.have.lengthOf(2)
            done()

        })
    })
    it('TC-202-5 Toon gebruikers met zoektermen op bestaande velden', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' })
        chai.request(server)
        .get(endpointToTest + '?roles=guest')
        .set('Authorization', 'Bearer ' + token)
        .end((err, res) =>{
            chai.expect(res).to.have.status(200)
            chai.expect(res).not.to.have.status(400)
            chai.expect(res.body).to.be.a('object')
            chai.expect(res.body).to.have.property('status').equals(200)
            chai.expect(res.body).to.have.property('message').equals('Found 1 users.')
            chai.expect(res.body).to.have.property('data').that.is.a('array')
            chai.expect(res.body.data).to.have.lengthOf(1)
            chai.expect(res.body.data[0]).to.have.property('id').equals(3)
            done()

        })
    })
})
