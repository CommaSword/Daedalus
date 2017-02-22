import {ServerConnection} from '../src/serverConnection'


describe('Server Connection', function () {
    it('Starts a new server', function () {
        const server = new ServerConnection();
        return server.init();
    })
});
