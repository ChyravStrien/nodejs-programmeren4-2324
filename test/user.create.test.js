const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../index')
const tracer = require('tracer')

chai.should()
chai.use(chaiHttp)
tracer.setLevel('warn')

const endpointToTest = '/api/user'

describe('UC201 Registreren als nieuwe user', () => {
    /**
     * Voorbeeld van een beforeEach functie.
     * Hiermee kun je code hergebruiken of initialiseren.
     */
    beforeEach((done) => {
        console.log('Before each test')
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
                emailAdress: 'v.a@server.nl'
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
                    .equals('Missing or incorrect firstName field')
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
            emailAdress: 'ongeldigemail'
        })
        .end((err, res) => {
            chai.expect(res).to.have.status(400)
            chai.expect(res).not.to.have.status(200)
            chai.expect(res.body).to.be.a('object')
            chai.expect(res.body).to.have.property('status').equals(400)
            chai.expect(res.body).to.have.property('message').equals('Missing or incorrect emailAddress field')
            done()
        })
        
    })

    it.skip('TC-201-3 Niet-valide password', (done) => {
        //
        // Hier schrijf je jouw testcase.
        //
        done()
    })

    it.skip('TC-201-4 Gebruiker bestaat al', (done) => {
        //
        // Hier schrijf je jouw testcase.
        //
        done()
    })
    it('TC-201-5 Gebruiker succesvol geregistreerd', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                firstName: 'Voornaam',
                lastName: 'Achternaam',
                emailAddress: 'v.a@server.nl'
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body).to.be.an('object');
                chai.expect(res.body).to.have.property('data').that.is.an('object');
                chai.expect(res.body).to.have.property('message').that.is.a('string').equal('User created with id 2.');
    
                const data = res.body.data;
                chai.expect(data).to.have.property('firstName').that.is.a('string').equal('Voornaam');
                chai.expect(data).to.have.property('lastName').that.is.a('string').equal('Achternaam');
                chai.expect(data).to.have.property('emailAddress').that.is.a('string').equal('v.a@server.nl');
                chai.expect(data).to.have.property('id').that.is.a('number');
    
                done();
            });
    });
    
})
