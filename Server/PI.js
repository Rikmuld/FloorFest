//uncomment code on a Pi
var gpio = require('rpi-gpio');
var pins = [3, 5, 7, 11, 13, 15, 19, 21, 23, 29, 31, 33, 35, 37, 8, 10, 12, 16, 18, 22, 24, 26, 32, 36, 38, 40];
function setup(pin, mode) { gpio.setup(pins[pin], mode == PinMode.OUT ? gpio.DIR_OUT : gpio.DIR_IN, setupError); }
function write(pin, value) { gpio.write(pins[pin], value); }
function read(pin, callback) { gpio.write(pins[pin], callback); }
function numOfPins() { return pins.length; }
;
function setupError(err) { console.log(setupError); }
var PinMode;
(function (PinMode) {
    PinMode[PinMode["OUT"] = 0] = "OUT";
    PinMode[PinMode["IN"] = 1] = "IN";
})(PinMode || (PinMode = {}));
exports.setup = setup;
exports.write = write;
exports.read = read;
exports.numOfPins = numOfPins;
exports.PinMode = PinMode;
//# sourceMappingURL=pi.js.map