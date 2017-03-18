import {Server} from '../../src/panels/panels-server';
import {FakePanel} from '../../test-kit/panels-client'
import {expect} from 'chai';
import {EventsMatcher} from "../../test-kit/events-matcher";

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
        const emptyMsg = {foo:3};
        return panel.connect(PORT_NUM)
            .then(()=>panel.write(emptyMsg))
            .then(()=>matcher.expect([{msg:emptyMsg}]))
    });
});
