import {Server} from '../../src/panels/panels-server';
import {FakePanel} from '../../test-kit/panels-client'
import {expect} from 'chai';
import {EventsMatcher} from "../../test-kit/events-matcher";
import {Noop_MsgType, Msg, IncomingMsg} from "../../src/panels/protocol";

const PORT_NUM = 8888;

const eventMatcherOptions: EventsMatcher.Options = {
    interval: 5,
    noExtraEventsGrace: 30,
    timeout: 100
};

describe('Panels server', ()=>{
    let server:Server;
    let matcher: EventsMatcher;
    let panel:FakePanel;
    beforeEach('init panels server', ()=>{
        matcher = new EventsMatcher(eventMatcherOptions);
        server = new Server(PORT_NUM);
        panel = new FakePanel();
        matcher.track(server);
        return server.start()
            .then(()=> panel.connect(PORT_NUM));
    });
    afterEach('destroy panels server and fake client', ()=>{
        return  panel.close()
            .then(()=>server.stop());
    });

    it('reports connection after getting an ID', function () {
        return panel.write({type:'hello', id:'foo', state: {foo: {bar:5}}})
            .then(()=>matcher.expect([{event:'connected', panel:{id:'foo', state: {foo: {bar:5}}}}]))
    });
    it('reports disconnection after getting an ID', function () {
        return panel.write({type:'hello', id:'foo'})
            .then(()=>panel.close())
            .then(()=>matcher.expect([{event:'disconnected', panel:{id:'foo'}}]))
    });
    it('does not report disconnection if no connection', function () {
        return panel.close()
            .then(()=>matcher.expect([]))
    });
    it('does not report state change if same as before', function () {
        return panel.write({type:'hello', id:'foo', state: {foo: {bar:5}}})
            .then(()=>matcher.expect([{event:'connected', panel:{id:'foo', state: {foo: {bar:5}}}}]))
            .then(()=>panel.write({type:'state', state: {foo: {bar:5}}}))
            .then(()=>matcher.expect([]))
    });
    it('reports state change if new state', function () {
        return panel.write({type:'hello', id:'foo', state: {foo: {bar:5}}})
            .then(()=>matcher.expect([{event:'connected', panel:{id:'foo', state: {foo: {bar:5}}}}]))
            .then(()=>panel.write({type:'state', state: {foo: {baz:'foo'}}}))
            .then(()=>matcher.expect([{event:'stateChange', panel:{id:'foo', state: {foo: {baz:'foo'}}}}]))
    });
    it('gets and reports an unknown message', function () {
        const msg = {foo:3};
        return panel.write(msg)
            .then(()=>matcher.expect([{event:'unknown', msg:msg}]))
    });
    it('does not report a no-op message', function () {
        const msg:IncomingMsg<Noop_MsgType> = {type:'noop', foo:3};
        return panel.write(msg)
            .then(()=>matcher.expect([]))
    });
});
