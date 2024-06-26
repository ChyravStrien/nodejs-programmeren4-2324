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
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAddress`, `password`, `street`, `city` ) VALUES' +
    '(1, "first", "last", "n.ame@server.nl", "secret", "street", "city");'

const endpointToTest = '/api/user/profile/my'

describe('UC203 Opvragen van gebruikersprofiel', () => {
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
    it('TC-203-1 Ongeldig token', (done) => {
        chai.request(server)
            .get(endpointToTest)
            .set('Authorization', 'Bearer ' + 'ongeldigtoken')
            .end((err, res) => {
                /**
                 * Voorbeeld uitwerking met chai.expect
                 */
                chai.expect(res).to.have.status(401)
                chai.expect(res).not.to.have.status(200)
                chai.expect(res.body).to.be.a('object')
                chai.expect(res.body).to.have.property('status').equals(401)
                chai.expect(res.body).to.have.property('message').equals('Not authorized!')
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty

                done()
            })
    })

    it('TC-203-2 Gebruiker is ingelogd met geldig token', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' })
        chai.request(server)
        .get(endpointToTest)
        .set('Authorization', 'Bearer ' + token)
        .end((err, res) =>{
            chai.expect(res).to.have.status(200)
            chai.expect(res).not.to.have.status(400)
            chai.expect(res.body).to.be.a('object')
            chai.expect(res.body).to.have.property('status').equals(200)
            chai.expect(res.body).to.have.property('message').equals('User profile fetched with associated meals.')
            chai.expect(res.body).to.have.property('data').that.is.a('object')
            chai.expect(res.body.data).to.have.property('user').that.is.a('object')
            chai.expect(res.body.data.user).to.have.property('id').equals(1)
            chai.expect(res.body.data.user).to.have.property('firstName').that.is.a('string')
            chai.expect(res.body.data.user).to.have.property('lastName').that.is.a('string')
            chai.expect(res.body.data.user).to.have.property('emailAddress').that.is.a('string')
            chai.expect(res.body.data.user).to.have.property('street').that.is.a('string')
            chai.expect(res.body.data.user).to.have.property('city').that.is.a('string')
            chai.expect(res.body.data).to.have.property('meals').that.is.a('array')
            done()

        })
        done()
    })
})
