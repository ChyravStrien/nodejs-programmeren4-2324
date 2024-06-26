process.env.DB_DATABASE = process.env.DB_DATABASE || 'share-a-meal-testdb'
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
const CLEAR_MEAL_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM `meal_participants_user`;'
const CLEAR_DB = CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE + CLEAR_MEAL_PARTICIPANTS_TABLE

const INSERT_USER =
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAddress`, `password`, `phoneNumber`, `roles`, `street`, `city` ) VALUES ' +
    '(1, "first", "last", "n.ame@server.nl", "secret", "0610251885", "", "street", "city"), ' +
    '(2, "John", "Doe", "john.doe@example.com", "password123", "0612345678", "", "Main St", "New York");';

const INSERT_MEAL = 'INSERT INTO `meal` (`id`, `isActive`, `isVega`, `isVegan`, `isToTakeHome`, `dateTime`, `maxAmountOfParticipants`, `price`, `imageUrl`, `cookId`, `name`, `description`, `allergenes`) VALUES ' +
    '(1, 1, 0, 0, 0, "2021-06-01 12:00:00", 1, 10.00, "https://www.example.com/image.jpg", 1, "Pasta", "Pasta with tomato sauce", "gluten,lactose")';

const INSERT_PARTICIPATION = 'INSERT INTO meal_participants_user (mealId, userId) VALUES (1, 1)';




const endpointToTest = (mealId) => `/api/meal/${mealId}/participate`

describe('UC-401 Aanmelden voor maaltijd', () => {
    beforeEach((done) => {
        logger.debug('Before each test')
        db.getConnection(function (err, connection) {
            if (err) throw err // not connected!
            connection.query(
                CLEAR_DB + INSERT_USER + INSERT_MEAL + INSERT_PARTICIPATION,
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

    it.skip('TC-301-2 Gebruiker is niet ingelogd', (done) => {
        chai.request(server)
            .post(endpointToTest(1)) 
            .end((err, res) => {
                chai.expect(res.status).to.equal(401);
                chai.expect(res.body).to.be.an('object');
                chai.expect(res.body).to.have.property('message').equals('Authorization header missing!');
                chai.expect(res.body).to.have.property('status').equals(401);
                chai.expect(res.body).to.have.property('data').to.be.empty;
                done();
            });
    });

    
    it.skip('TC-401-2 Maaltijd bestaat niet', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' });
        chai.request(server)
            .post(endpointToTest(999))  
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                res.should.have.status(404);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(404);
                res.body.should.have.property('message').eql('Meal not found');
                done();
            });
    });

    it.skip('TC-401-3 Succesvol aangemeld', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' });
        chai.request(server)
            .post(endpointToTest(2))
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(200);
                res.body.should.have.property('message').eql('Participation added');
                res.body.data.should.have.property('mealId').eql(testMealId);
                res.body.data.should.have.property('userId').eql(testUserId);
                done();
            });
    });

    it.skip('TC-401-4 Maximumaantal aanmeldingen is bereikt', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' });
            chai.request(server)
                .post(endpointToTest(1))
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    res.should.have.status(404);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status').eql(404);
                    res.body.should.have.property('message').eql('Maximum number of participants reached');
                    done();
                });
    });
});






