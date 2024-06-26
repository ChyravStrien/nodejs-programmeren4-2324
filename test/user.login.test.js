process.env.DB_DATABASE = process.env.DB_DATABASE || 'share_a_meal_testdb'
process.env.LOGLEVEL = 'trace'

const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../index')
const tracer = require('tracer')
const db = require('../src/dao/mysql-db')
const logger = require('../src/util/logger')
require('dotenv').config()

chai.should()
chai.use(chaiHttp)
tracer.setLevel('warn')

const CLEAR_MEAL_TABLE = 'DELETE IGNORE FROM `meal`;'
const CLEAR_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM `meal_participants_user`;'
const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM `user`;'
const CLEAR_DB = CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE

const INSERT_USER =
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAddress`, `password`, `street`, `city` ) VALUES' +
    '(1, "first", "last", "n.ame@server.nl", "secret", "street", "city");'

const endpointToTest = '/api/auth/login'

describe('UC101 Inloggen als user', () => {
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

    /**
     * Hier starten de testcases
     */
    it('TC-101-1 Verplicht veld ontbreekt', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                // email: 'e.mail@server.nl', ontbreekt
                password: 'password'
            })
            .end((err, res) => {
                /**
                 * Voorbeeld uitwerking met chai.expect
                 */
                chai.expect(res).to.have.status(400)
                chai.expect(res).not.to.have.status(200)
                chai.expect(res.body).to.be.a('object')
                chai.expect(res.body).to.have.property('status').equals(400)
                chai.expect(res.body).to.have.property('message').equals('Missing email')
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty

                done()
            })
    })

    it('TC-101-2 Niet-valide password', (done) => {
        chai.request(server)
        .post(endpointToTest)
        .send({
            emailAddress: 'n.ame@server.nl',
            password: 'twee'
        })
        .end((err, res) =>{
            chai.expect(res).to.have.status(409)
            chai.expect(res).not.to.have.status(200)
            chai.expect(res.body).to.be.a('object')
            chai.expect(res.body).to.have.property('status').equals(409)
            chai.expect(res.body).to.have.property('message').equals('User not found or password invalid')

        })
        done()
    })

    it('TC-101-3 Gebruiker bestaat niet', (done) => {
        chai.request(server)
        .post(endpointToTest)
        .send({
            emailAddress: 'r.email@server.nl',
            password: 'pPassword4',
        })
        .end((err, res) => {
            chai.expect(res).to.have.status(409)
            chai.expect(res).not.to.have.status(200)
            chai.expect(res.body).to.be.a('object')
            chai.expect(res.body).to.have.property('status').equals(409)
            chai.expect(res.body).to.have.property('message').equals('User not found or password invalid')
        })
       
        done()
    })
    it('TC-101-4 Succesvol inloggen', (done) => {
        chai.request(server)
        .post(endpointToTest)
        .send({
            emailAddress: "n.ame@server.nl",
            password: "secret"
        })
        .end((err, res) => {
            chai.expect(res).to.have.status(200)
            chai.expect(res.body).to.be.a('object')
            chai.expect(res.body).to.have.property('status').equals(200)
            chai.expect(res.body).to.have.property('message').equals('User logged in')
            chai.expect(res.body).to.have.property('data').that.is.a('object')
            chai.expect(res.body.data).to.have.property('token').that.is.a('string')
            chai.expect(res.body.data).to.have.property('id').that.is.a('number')
            chai.expect(res.body.data).to.have.property('firstName').that.is.a('string')
            chai.expect(res.body.data).to.have.property('lastName').that.is.a('string')
        })
        done()
    })
})
