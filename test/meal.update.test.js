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
const CLEAR_DB = CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE

const INSERT_USER =
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAddress`, `password`, `phoneNumber`, `roles`, `street`, `city` ) VALUES ' +
    '(1, "first", "last", "n.ame@server.nl", "secret", "0610251885", "", "street", "city"), ' +
    '(2, "John", "Doe", "john.doe@example.com", "password123", "0612345678", "", "Main St", "New York");';

const INSERT_MEAL = 'INSERT INTO `meal` (`id`, `isActive`, `isVega`, `isVegan`, `isToTakeHome`, `dateTime`, `maxAmountOfParticipants`, `price`, `imageUrl`, `cookId`, `name`, `description`, `allergenes`) VALUES ' +
    '(1, 1, 0, 0, 0, "2021-06-01 12:00:00", 5, 10.00, "https://www.example.com/image.jpg", 1, "Pasta", "Pasta with tomato sauce", "gluten, lactose"), ' +
    '(2, 1, 0, 0, 0, "2021-06-01 12:00:00", 5, 10.00, "https://www.example.com/image.jpg", 2, "Pizza", "Pizza with tomato sauce", "gluten, lactose");';




const endpointToTest = (mealId) => `/api/meal/${mealId}`

describe('UC-302 Wijzigen van maaltijdgegevens', () => {
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

    
    it('TC-302-1 Verplichte velden ontbreken', (done) => {
        //bv price ontbreekt, verder is name en mazAmountOfParticipants ook verplicht
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' });
        chai.request(server)
            .put(endpointToTest(1)) 
            .set('Authorization', 'Bearer ' + token)
            .send({
                name: "Spaghetti Carbonara",
                description: "Delicious Italian pasta dish with bacon, eggs, and Parmesan cheese",
                dateTime: "2024-06-24 17:00:00",
                maxAmountOfParticipants: 6,
                imageUrl: "https://example.com/image.jpg"
            })
            .end((err, res) => {
                chai.expect(res.status).to.equal(400);
                chai.expect(res.body).to.be.an('object');
                chai.expect(res.body).to.have.property('message').equals('Missing price');
                chai.expect(res.body).to.have.property('status').equals(400);
                chai.expect(res.body).to.have.property('data').to.be.empty;
                done();
            });
    });

    
    it('TC-302-2 Gebruiker is niet ingelogd', (done) => {
        chai.request(server)
            .put(endpointToTest(1)) 
            .end((err, res) => {
                chai.expect(res.status).to.equal(401);
                chai.expect(res.body).to.be.an('object');
                chai.expect(res.body).to.have.property('message').equals('Authorization header missing!');
                chai.expect(res.body).to.have.property('status').equals(401);
                chai.expect(res.body).to.have.property('data').to.be.empty;
                done();
            });
    });

    
    it('TC-302-3 Niet de eigenaar van de data', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' });
        chai.request(server)
            .put(endpointToTest(2))  
            .set('Authorization', 'Bearer ' + token)
            .send({
                name: "Spaghetti Carbonara",
                description: "Delicious Italian pasta dish with bacon, eggs, and Parmesan cheese",
                price: 10.99,
                dateTime: "2024-06-24 17:00:00",
                maxAmountOfParticipants: 6,
                imageUrl: "https://example.com/image.jpg"
            })
            .end((err, res) => {
                chai.expect(res.body).to.be.an('object');
                chai.expect(res.body).to.have.property('message').contains('Je hebt geen toestemming om maaltijd met id 2 te updaten');
                chai.expect(res.body).to.have.property('status').equals(403);
                chai.expect(res.body).to.have.property('data').to.be.null;
                done();
            });
    });
    it('TC-302-4 Maaltijd bestaat niet', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' });
        chai.request(server)
            .put(endpointToTest(44)) 
            .set('Authorization', 'Bearer ' + token)
            .send({
                name: "Spaghetti Carbonara",
                description: "Delicious Italian pasta dish with bacon, eggs, and Parmesan cheese",
                price: 10.99,
                dateTime: "2024-06-24 17:00:00",
                maxAmountOfParticipants: 6,
                imageUrl: "https://example.com/image.jpg"
            })
            .end((err, res) => {
                //chai.expect(res.status).to.equal(403);
                chai.expect(res.body).to.be.an('object');
                chai.expect(res.body).to.have.property('message').equals('Maaltijd met id 44 niet gevonden');
                chai.expect(res.body).to.have.property('status').equals(404);
                chai.expect(res.body).to.have.property('data').to.be.null;
                done();
            });
    });
    it('TC-302-5 Maaltijd succesvol gewijzigd', (done) => {
        const token = jwt.sign({ userId: 1 }, jwtSecretKey, { expiresIn: '1h' });
        chai.request(server)
            .put(endpointToTest(1))  
            .set('Authorization', 'Bearer ' + token)
            .send({
                name: "Spaghetti Carbonara",
                description: "Delicious Italian pasta dish with bacon, eggs, and Parmesan cheese",
                price: 10.99,
                dateTime: "2024-06-24 17:00:00",
                maxAmountOfParticipants: 6,
                imageUrl: "https://example.com/image.jpg"
            })
            .end((err, res) => {
                chai.expect(res.status).to.equal(200);
                chai.expect(res.body).to.be.an('object');
                chai.expect(res.body).to.have.property('message').contains('Maaltijd met id 1 is geupdatet');
                chai.expect(res.body).to.have.property('status').equals(200);
                chai.expect(res.body).to.have.property('data').to.be.an('object');
                chai.expect(res.body.data).to.have.property('id').to.be.a('number');
                chai.expect(res.body.data).to.have.property('name').to.be.a('string').to.equal('Spaghetti Carbonara');
                chai.expect(res.body.data).to.have.property('description').to.be.a('string').to.equal('Delicious Italian pasta dish with bacon, eggs, and Parmesan cheese');
                chai.expect(res.body.data).to.have.property('price').to.be.a('string').to.equal('10.99');
                chai.expect(res.body.data).to.have.property('maxAmountOfParticipants').to.be.a('number').to.equal(6);
                chai.expect(res.body.data).to.have.property('imageUrl').to.be.a('string').to.equal('https://example.com/image.jpg');
                done();
            });
    });
});
