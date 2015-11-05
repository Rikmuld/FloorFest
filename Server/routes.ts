var url = require('url')
var server = require('./server')
var app = server.app
var io = server.io

var controlerId: string;
var players: number = 0;
var currMusic: string;

var ROOM = "controller";

app.get('/', function (req, res) {
    res.render('index')
})

app.get('/musicList', function (req, res) {
    res.render('musicList', { players: players })
})

app.use(error404)
app.use(function (error, req, res, next) {
    res.render('error', { code: "500", message: error })
})

var FRAME_PLAYER = "framePlayer";
var FRAME_SELECT = "frameSelect";
var FRAME_MUSIC = "frameMusic";

io.on('connection', function (socket) {
    socket.join(ROOM);

    if (controlerId == null || Object.keys(io.nsps['/'].adapter.rooms[ROOM]).length == 1) controlerId = socket.id;

    socket.on('disconnect', function () {
        if (socket.id == controlerId) controlerId = null;
    })
    socket.on('access_request', function () {
        if (socket.id == controlerId) socket.emit('access_response', true)
        else socket.emit('access_response', false)
    })
    socket.on('request_frame', function (name: string) {
        if (name == null) {
            setupClient(socket);
        } else {
            switch(name) {
                case FRAME_PLAYER: playerFrame(socket); break;
                case FRAME_SELECT: musicListFrame(socket); break;
                case FRAME_MUSIC: musicPlayingFrame(socket); break;
            }
        }
    })

    socket.on('music_set', function (name: string) {
        currMusic = name;
        if (currMusic != null) musicStart(socket);
    })
    socket.on('players_set', function (num: number) {
        players = num;
    })
})

function setupClient(socket) {
    if (players == 0) playerFrame(socket)
    else if (currMusic == null) musicListFrame(socket);
    else {
        musicPlayingFrame(socket)
        musicStart(socket);
    }
}

function musicStart(socket) {
    socket.emit('music_start', currMusic);
}

function playerFrame(socket) {
    app.render('player', function (err, player) {
        socket.emit('frame', 'players', player);
    })
}

function musicListFrame(socket) {
    app.render('musicList', { players: players }, function (err, music) {
        socket.emit('frame', 'musicList', music);
    })
}

function musicPlayingFrame(socket) {
    app.render('music', { music: currMusic }, function (err, music) {
        socket.emit('frame', 'music', music);
    })
}

function error404(res, req) {
    res.render('error', { code: "404" })
}
