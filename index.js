const botbuilder = require('botbuilder');
const expect = require('chai').expect;

const TestConnector = (function () {
    function TestConnector() {
    }

    TestConnector.prototype.queue = [];
    TestConnector.prototype.putResolver = function (resolve) {
        if (this.queue.length > 0) {
            resolve(this.queue.shift());
        } else if (!this.resolver) {
            this.resolver = resolve;
        } else {
            throw 'Someone is already hearing.';
        }
    };
    TestConnector.prototype.useResolver = function (text) {
        let resolver = this.resolver;

        if (resolver) {
            this.resolver = undefined;
            resolver(text);
        } else {
            this.queue.push(text);
        }
    };

    TestConnector.prototype.listen = function () {
    };
    TestConnector.prototype.say = function (text) {
        this.processMessage(text);
        return this;
    };
    TestConnector.prototype.processMessage = function (line) {
        if (this.onEventHandler) {
            let msg = new botbuilder.Message()
                .address({
                    channelId: 'console',
                    user: {id: 'user', name: 'User1'},
                    bot: {id: 'bot', name: 'Bot'},
                    conversation: {id: 'Convo1'}
                })
                .timestamp()
                .text(line);
            this.onEventHandler([msg.toMessage()]);
        } else {
            console.warn('Got a message but no eventHandler was registered.');
        }
        return this;
    };
    TestConnector.prototype.onEvent = function (handler) {
        this.onEventHandler = handler;
    };
    TestConnector.prototype.onInvoke = function (handler) {
    };
    TestConnector.prototype.hear = function (expected) {
        let p = new Promise(resolve => this.putResolver(resolve))
            .then(actual => expect(actual).to.be.deep.equal(expected));
        p.connector = this;
        return p;
    };
    TestConnector.prototype.send = function (messages, done) {
        messages
            .map(msg => msg.text || msg.attachments)
            .reduce((p, v) => p.concat(Array.isArray(v) ? v : [v]), [])
            .map(msg => this.useResolver(msg));

        done(null);
    };
    TestConnector.prototype.startConversation = function (address, cb) {
    };
    return TestConnector;
}());

Promise.prototype.say = function (text) {
    let p = this.then(() => this.connector.say(text));
    p.connector = this.connector;
    return p;
};

Promise.prototype.hear = function (text) {
    let p = this.then(() => this.connector.hear(text));
    p.connector = this.connector;
    return p;
};

module.exports = TestConnector;