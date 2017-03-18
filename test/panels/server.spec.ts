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
        matcher.track(server);
        return server.start();
    });

    afterEach('destroy fake panel', ()=>{
        if (panel){
            return panel.close();
        }
    });
    afterEach('destroy panels server', ()=>{
        return server.stop();
    });
    it('gets and reports an unknown message', function () {
        panel = new FakePanel();
        const msg = {foo:3};
        return panel.connect(PORT_NUM)
            .then(()=>panel.write(msg))
            .then(()=>matcher.expect([{msg:msg}]))
    });
    it('does not report a no-op message', function () {
        panel = new FakePanel();
        const msg:IncomingMsg<Noop_MsgType> = {type:'noop', foo:3};
        return panel.connect(PORT_NUM)
            .then(()=>panel.write(msg))
            .then(()=>matcher.expect([]))
    });
});
