//uncomment code on a Pi
var gpio = require('rpi-gpio');

var pins = [3, 5, 7, 11, 13, 15, 19, 21, 23, 29, 31, 33, 35, 37, 8, 10, 12, 16, 18, 22, 24, 26, 32, 36, 38, 40]

function setup(pin: number, mode: PinMode) { gpio.setup(pins[pin], mode == PinMode.OUT ? gpio.DIR_OUT : gpio.DIR_IN, setupError) }
function write(pin: number, value: boolean) { gpio.write(pins[pin], value); }
function read(pin: number, callback: (err, value) => void) { gpio.write(pins[pin], callback); }
function numOfPins(): number { return pins.length  };

function setupError(err) { console.log(setupError) }

enum PinMode { OUT, IN }

exports.setup = setup;
exports.write = write;
exports.read = read;
exports.numOfPins = numOfPins;
exports.PinMode = PinMode;