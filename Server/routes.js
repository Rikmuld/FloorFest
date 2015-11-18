var url = require('url');
var server = require('./server');
var fs = require('fs');
var sys = require('sys');
var exec = require('child_process').exec;
var path = require('path');
var app = server.app;
var io = server.io;
var controlerId;
var players = 0;
var ROOM = "controller";
/*
 *  Music
 */
var music = [];
var Song = (function () {
    function Song(id, name, author, cover, banner) {
        this.name = name;
        this.img = cover;
        this.author = author;
        this.id = id;
        if (banner)
            this.longImage = banner;
        else
            this.longImage = cover.split('.')[0] + "-long.png";
        music.push(this);
    }
    Song.prototype.getId = function () { return this.id; };
    Song.prototype.getLongImg = function () { return this.longImage; };
    Song.find = function (id) {
        return music.filter(function (song, index, array) {
            return song.getId() == id;
        })[0];
    };
    return Song;
})();
var CANON_IN_D = new Song("canon", "Canon in D", "Johann Pachelbel", "canon.jpg");
var LET_IT_GO = new Song("frozen", "Let it Go", "Idina Menzel", "frozen.jpg");
var LORT_RINGS = new Song("hobbit", "Concerning Hobbits", "Howard Shore", "hobbit.jpg", "hobbit-long.jpg");
var HELLO = new Song("hello", "Hello", "Adele", "adele.jpg", "adele-long.jpg");
var PIRATE = new Song("pirate", "He is a Pirate", "Klaus Badelt", "pirate.jpg", "pirate-long.jpg");
var JURESIC = new Song("juresic", "Jurassic Park: Main Theme", "John Williams", "park.jpg", "park-long.jpg");
var ALL_I_EVER = new Song("all_I_ever", "All I Ever Wanted", "T", "canon.jpg");
var COUNTDOWN = new Song("countdown", "The Final Countdown", "T", "canon.jpg");
var FIREFLIES = new Song("fireflies", "Fireflies", "T", "canon.jpg");
var HOW_DEEP_LOVE = new Song("how_deep_love", "How Deep is Your Love", "T", "canon.jpg");
var LAST_GOODBYE = new Song("last_goodbye", "Last Goodbye", "T", "canon.jpg");
var LAY_IT_ALL = new Song("lay_it_all", "Lay it All on Me", "T", "canon.jpg");
var LINDSEY = new Song("lindsey", "Shatter Me", "T", "canon.jpg");
var LUSH_LIFE = new Song("lush_life", "Lush Life", "T", "canon.jpg");
var RUN_WILD = new Song("run_wild", "Who run the World", "T", "canon.jpg");
var SORRY = new Song("sorry", "Sorry", "T", "canon.jpg");
var STICHES = new Song("stiches", "Stiches", "T", "canon.jpg");
var SWIFT = new Song("swift", "Blanc Space", "T", "canon.jpg");
var TIGER = new Song("tiger", "Eye of the Tiger", "T", "canon.jpg");
var VILLAGE = new Song("village", "Village People", "T", "canon.jpg");
var VIVA = new Song("viva", "Viva la Vida", "T", "canon.jpg");
var GANGAN = new Song("gangan", "Gangnam Style", "", "canon.jpg");
var currMusic;
/*
 * Routes
 */
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
        currMusic = Song.find(name);
        if (currMusic != null)
            musicStart(socket);
    });
    socket.on(I_PLAYER_SET, function (num) {
        players = num;
        socket.emit(O_PLAYER_SET_CLIENT, players);
    });
    socket.on(I_SET_PIN, writePin);
    socket.on(I_READ_FILE, function (name) {
        fs.readFile(path.join(__dirname, 'public') + "/" + name, "utf8", function (err, data) {
            console.log(err, data);
            socket.emit(O_READ_FILE, data);
        });
    });
});
var pins = [2, 3, 4, 17, 27, 22, 10, 9, 11, 5, 6, 13, 19, 26, 21, 20, 16, 12, 7, 8, 25, 24, 23, 18, 15, 14];
function writePin(pin, value) {
    exec("pigs p " + pins[pin] + " " + value, function (error, stdout, stderr) {
        if (error != null) {
            console.log('exec error: ' + error);
        }
    });
}
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
    socket.emit(O_MUSIC_START, currMusic.getId());
}
function playerFrame(socket) {
    app.render('player', function (err, player) {
        socket.emit(O_FRAME_RESPONS, FRAME_PLAYER, player);
    });
}
function musicListFrame(socket) {
    app.render('musicList', { players: players, music: music }, function (err, music) {
        console.log(err);
        socket.emit(O_FRAME_RESPONS, FRAME_SELECT, music);
    });
}
function musicPlayingFrame(socket) {
    app.render('music', function (err, music) {
        socket.emit(O_FRAME_RESPONS, FRAME_MUSIC, music, currMusic.getId(), currMusic.getLongImg());
    });
}
function error404(res, req) {
    res.render('error', { code: "404" });
}
//# sourceMappingURL=routes.js.map