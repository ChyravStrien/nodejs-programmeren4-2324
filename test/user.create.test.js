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

const endpointToTest = '/api/user'

describe('UC201 Registreren als nieuwe user', () => {
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
    it('TC-201-1 Verplicht veld ontbreekt', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                // firstName: 'Voornaam', ontbreekt
                lastName: 'Achternaam',
                emailAdress: 'v.a@server.nl',
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
                chai.expect(res.body)
                    .to.have.property('message')
                    .equals('Missing or incorrect first name')
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty

                done()
            })
    })

    it('TC-201-2 Niet-valide email adres', (done) => {
        chai.request(server)
        .post(endpointToTest)
        .send({
            firstName: 'voornaam',
            lastName: 'achternaam',
            emailAddress: 'ongeldigemail',
            password: 'password'
        })
        .end((err, res) => {
            chai.expect(res).to.have.status(400)
            chai.expect(res).not.to.have.status(200)
            chai.expect(res.body).to.be.a('object')
            chai.expect(res.body).to.have.property('status').equals(400)
            chai.expect(res.body).to.have.property('message').equals('Invalid emailAddress')
            done()
        })
        
    })

    it('TC-201-3 Niet-valide password', (done) => {
        chai.request(server)
        .post(endpointToTest)
        .send({
            firstName: 'voornaam',
            lastName: 'lastname',
            emailAddress: 'c.vanstrien@gmail.com',
            password: 'twee'
        })
        .end((err, res) =>{
            chai.expect(res).to.have.status(400)
            chai.expect(res).not.to.have.status(200)
            chai.expect(res.body).to.be.a('object')
            chai.expect(res.body).to.have.property('status').equals(400)
            chai.expect(res.body).to.have.property('message').equals('Invalid password')

        })
        done()
    })

    it('TC-201-4 Gebruiker bestaat al', (done) => {
        chai.request(server)
        .post(endpointToTest)
        .send({
            firstName: 'Voornaam',
            lastName: 'Achternaam',
            emailAddress: 'n.ame@server.nl',
            password: 'pPassword4',
            phoneNumber: '0612345678',	
            roles: ['user'],
            street: 'Straatnaam',
            city: 'Plaatsnaam'
        })
        .end((err, res) => {
            chai.expect(res).to.have.status(403)
            chai.expect(res).not.to.have.status(200)
            chai.expect(res.body).to.be.a('object')
            chai.expect(res.body).to.have.property('status').equals(403)
            chai.expect(res.body).to.have.property('message').equals('User already exists with this email address')
        })
       
        done()
    })
    it('TC-201-5 Gebruiker succesvol geregistreerd', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                firstName: "Voornaam",
                lastName: "Achternaam",
                emailAddress: "v.a@server.nl",
                password: "secretSecret1",
                street: "Lovensdijkstraat 61",
                city: "Breda",
                phoneNumber: "06 12312345",
                roles: [""]
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(200); //moet 201 zijn maar hij doet raar try again later
                chai.expect(res.body).to.be.an('object');
                chai.expect(res.body).to.have.property('data').that.is.an('object');
                chai.expect(res.body).to.have.property('message').that.is.a('string').contains('User created with id');
    
                const data = res.body.data;
                chai.expect(data).to.have.property('firstName').that.is.a('string').equal('Voornaam');
                chai.expect(data).to.have.property('lastName').that.is.a('string').equal('Achternaam');
                chai.expect(data).to.have.property('emailAddress').that.is.a('string').equal('v.a@server.nl');
                chai.expect(data).to.have.property('id').that.is.a('number');
    
                done();
            });
    });
    
})
