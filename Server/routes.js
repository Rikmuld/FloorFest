var url = require('url');
var server = require('./server');
var fs = require('fs');
var PI = require('./pi');
var path = require('path');
var app = server.app;
var io = server.io;
var controlerId;
var players = 0;
var currMusic;
var ROOM = "controller";
for (var i = 0; i < PI.numOfPins(); i++)
    PI.setup(i, PI.PinMode.OUT);
app.get('/', function (req, res) {
    res.render('index');
});
app.get('/musicList', function (req, res) {
    res.render('musicList', { players: players });
});
app.use(error404);
app.use(function (error, req, res, next) {
    res.render('error', { code: "500", message: error });
});
var FRAME_PLAYER = "framePlayer";
var FRAME_SELECT = "frameSelect";
var FRAME_MUSIC = "frameMusic";
var I_ACCESS_REQUEST = "access_request";
var O_ACCESS_RESPONSE = "access_response";
var I_FRAME_REQUEST = "frame_request";
var O_FRAME_RESPONS = "frame_respons";
var O_MUSIC_START = "music_start";
var I_MUSIC_SET = "music_set";
var I_PLAYER_SET = "player_set";
var O_PLAYER_SET_CLIENT = "player_set_client";
var I_READ_FILE = "file_read";
var O_READ_FILE = "file_read_get";
var I_SET_PIN = "set_pin";
io.on('connection', function (socket) {
    socket.join(ROOM);
    if (controlerId == null || Object.keys(io.nsps['/'].adapter.rooms[ROOM]).length == 1)
        controlerId = socket.id;
    socket.on('disconnect', function () {
        if (socket.id == controlerId)
            controlerId = null;
    });
    socket.on(I_ACCESS_REQUEST, function () {
        if (socket.id == controlerId) {
            socket.emit(O_ACCESS_RESPONSE, true);
            socket.emit(O_PLAYER_SET_CLIENT, players);
        }
        else
            socket.emit(O_ACCESS_RESPONSE, false);
    });
    socket.on(I_FRAME_REQUEST, function (name) {
        if (name == null) {
            setupClient(socket);
        }
        else {
            switch (name) {
                case FRAME_PLAYER:
                    playerFrame(socket);
                    break;
                case FRAME_SELECT:
                    musicListFrame(socket);
                    break;
                case FRAME_MUSIC:
                    musicPlayingFrame(socket);
                    break;
            }
        }
    });
    socket.on(I_MUSIC_SET, function (name) {
        currMusic = name;
        if (currMusic != null)
            musicStart(socket);
    });
    socket.on(I_PLAYER_SET, function (num) {
        players = num;
        socket.emit(O_PLAYER_SET_CLIENT, players);
    });
    socket.on(I_SET_PIN, PI.write);
    socket.on(I_READ_FILE, function (name) {
        fs.readFile(path.join(__dirname, 'public') + "/" + name, "utf8", function (err, data) {
            console.log(err, data);
            socket.emit(O_READ_FILE, data);
        });
    });
});
function setupClient(socket) {
    if (players == 0)
        playerFrame(socket);
    else if (currMusic == null)
        musicListFrame(socket);
    else {
        musicPlayingFrame(socket);
        musicStart(socket);
    }
}
function musicStart(socket) {
    socket.emit(O_MUSIC_START, currMusic);
}
function playerFrame(socket) {
    app.render('player', function (err, player) {
        socket.emit(O_FRAME_RESPONS, FRAME_PLAYER, player);
    });
}
function musicListFrame(socket) {
    app.render('musicList', { players: players }, function (err, music) {
        console.log(err);
        socket.emit(O_FRAME_RESPONS, FRAME_SELECT, music);
    });
}
function musicPlayingFrame(socket) {
    app.render('music', { music: currMusic }, function (err, music) {
        socket.emit(O_FRAME_RESPONS, FRAME_MUSIC, music);
    });
}
function error404(res, req) {
    res.render('error', { code: "404" });
}
//# sourceMappingURL=routes.js.map