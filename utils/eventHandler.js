const EventEmitter = require('events');

class EventHander extends EventEmitter {}
let eventHandler = new EventHander()

module.exports = {
    eventHandler
}
