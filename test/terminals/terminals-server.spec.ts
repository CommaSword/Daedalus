import {Server} from '../../src/terminals';
import {Terminal} from '../test-kit/terminal'
import {EventsMatcher} from "../test-kit/events-matcher";
import {IncomingMsg, Noop_MsgType} from "../../src/terminals/protocol";

const PORT_NUM = 8888;

const eventMatcherOptions: EventsMatcher.Options = {
    interval: 5,
    noExtraEventsGrace: 30,
    timeout: 100
};

describe('Terminals server', () => {
    let server: Server;
    let matcher: EventsMatcher;
    let terminal: Terminal;
    beforeEach('init terminals server', async () => {
        matcher = new EventsMatcher(eventMatcherOptions);
        server = new Server(PORT_NUM);
        terminal = new Terminal();
        matcher.track(server);
        await server.start();
        await  terminal.connect(PORT_NUM);
    });
    afterEach('destroy terminals server and fake client', async () => {
        await terminal.close();
        await server.stop();
    });

    it('reports connection after getting an ID', async function () {
        await terminal.write({type: 'hello', id: 'foo', state: {foo: {bar: 5}}});
        await matcher.expect([{event: 'connected', terminal: {id: 'foo', clientState: {foo: {bar: 5}}}}]);
    });
    it('reports disconnection after getting an ID', async function () {
        await terminal.write({type: 'hello', id: 'foo', state: 2});
        await terminal.close();
        await matcher.expect([{event: 'disconnected', terminal: {id: 'foo'}}]);
    });
    it('does not report disconnection if no connection', async function () {
        await terminal.close();
        await matcher.expect([]);
    });
    it('does not report state change if same as before', async function () {
        await terminal.write({type: 'hello', id: 'foo', state: {foo: {bar: 5}}});
        await matcher.expect([{event: 'connected', terminal: {id: 'foo', clientState: {foo: {bar: 5}}}}]);
        await terminal.write({type: 'state', state: {foo: {bar: 5}}});
        await matcher.expect([]);
    });
    it('reports state change if new state', async function () {
        await terminal.write({type: 'hello', id: 'foo', state: {foo: {bar: 5}}});
        await matcher.expect([{event: 'connected', terminal: {id: 'foo', clientState: {foo: {bar: 5}}}}]);
        await terminal.write({type: 'state', state: {foo: {baz: 'foo'}}});
        await matcher.expect([{event: 'stateChange', terminal: {id: 'foo', clientState: {foo: {baz: 'foo'}}}}]);
    });
    it('gets and reports an unknown message', async function () {
        const msg = {foo: 3};
        await terminal.write(msg);
        await matcher.expect([{event: 'unknown', msg: msg}]);
    });
    it('does not report a no-op message', async function () {
        const msg: IncomingMsg<Noop_MsgType> = {type: 'noop', foo: 3};
        await terminal.write(msg);
        await matcher.expect([]);
    });
});
