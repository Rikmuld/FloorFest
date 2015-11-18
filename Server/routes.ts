﻿var url = require('url')
var server = require('./server')
var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;

import path = require('path')

var app = server.app
var io = server.io

var controlerId: string;
var players: number = 0;

var ROOM = "controller";

/*
 *  Music
 */

var music:Song[] = [];

class Song {
    private name: string;
    private img: string;
    private longImage: string;
    private author: string;
    private id: string;

    constructor(id: string, name: string, author: string, cover: string, banner?: string) {
        this.name = name;
        this.img = cover;
        this.author = author;
        this.id = id;
        if (banner) this.longImage = banner;
        else this.longImage = cover.split('.')[0] + "-long.png";

        music.push(this);
    }

    getId(): string { return this.id }
    getLongImg(): string { return this.longImage }

    static find(id: string): Song {
        return music.filter((song:Song, index:number, array:Song[]): boolean => {
            return song.getId() == id;
        })[0];
    }
}

var CANON_IN_D = new Song("canon", "Canon in D", "Johann Pachelbel", "canon.jpg");
var LET_IT_GO = new Song("frozen", "Let it Go", "Idina Menzel", "frozen.jpg");
var LORT_RINGS = new Song("hobbit", "Concerning Hobbits", "Howard Shore", "hobbit.jpg", "hobbit-long.jpg");
var HELLO = new Song("hello", "Hello", "Adele", "adele.jpg", "adele-long.jpg");
var PIRATE = new Song("pirate", "He is a Pirate", "Klaus Badelt", "pirate.jpg", "pirate-long.jpg");
var JURESIC = new Song("juresic", "Jurassic Park: Main Theme", "John Williams", "park.jpg", "park-long.jpg");

var currMusic: Song;

/*
 * Routes
 */ 

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

var I_ACCESS_REQUEST = "access_request"
var O_ACCESS_RESPONSE = "access_response"
var I_FRAME_REQUEST = "frame_request"
var O_FRAME_RESPONS = "frame_respons"
var O_MUSIC_START = "music_start"
var I_MUSIC_SET = "music_set"
var I_PLAYER_SET = "player_set"
var O_PLAYER_SET_CLIENT = "player_set_client"
var I_READ_FILE = "file_read"
var O_READ_FILE = "file_read_get"
var I_SET_PIN = "set_pin"

io.on('connection', function (socket) {
    socket.join(ROOM);

    if (controlerId == null || Object.keys(io.nsps['/'].adapter.rooms[ROOM]).length == 1) controlerId = socket.id;

    socket.on('disconnect', function () {
        if (socket.id == controlerId) controlerId = null;
    })
    socket.on(I_ACCESS_REQUEST, function () {
        if (socket.id == controlerId) {
            socket.emit(O_ACCESS_RESPONSE, true)
            socket.emit(O_PLAYER_SET_CLIENT, players);
        }
        else socket.emit(O_ACCESS_RESPONSE, false)
    })
    socket.on(I_FRAME_REQUEST, function (name: string) {
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

    socket.on(I_MUSIC_SET, function (name: string) {
        currMusic = Song.find(name);
        if (currMusic != null) musicStart(socket);
    })
    socket.on(I_PLAYER_SET, function (num: number) {
        players = num;
        socket.emit(O_PLAYER_SET_CLIENT, players);
    })
    socket.on(I_SET_PIN, writePin);
    socket.on(I_READ_FILE, function (name: string) {
        fs.readFile(path.join(__dirname, 'public') + "/" + name, "utf8", function (err, data) {
            console.log(err, data)
            socket.emit(O_READ_FILE, data);
        })
    })
})

var pins = [2, 3, 4, 17, 27, 22, 10, 9, 11, 5, 6, 13, 19, 26, 21, 20, 16, 12, 7, 8, 25, 24, 23, 18, 15, 14];

function writePin(pin: number, value: number) {
    exec("pigs p " + pins[pin] + " " + value, function (error, stdout, stderr) {
        if (error != null) {
            console.log('exec error: ' + error);
        }
    });
}

function setupClient(socket) {
    if (players == 0) playerFrame(socket)
    else if (currMusic == null) musicListFrame(socket);
    else {
        musicPlayingFrame(socket)
        musicStart(socket);
    }
}

function musicStart(socket) {
    socket.emit(O_MUSIC_START, currMusic.getId());
}

function playerFrame(socket) {
    app.render('player', function (err, player) {
        socket.emit(O_FRAME_RESPONS, FRAME_PLAYER, player);
    })
}

function musicListFrame(socket) {
    app.render('musicList', { players: players, music:music }, function (err, music) {
        console.log(err)
        socket.emit(O_FRAME_RESPONS, FRAME_SELECT, music);
    })
}

function musicPlayingFrame(socket) {
    app.render('music', function (err, music) {
        socket.emit(O_FRAME_RESPONS, FRAME_MUSIC, music, currMusic.getId(), currMusic.getLongImg());
    })
}

function error404(res, req) {
    res.render('error', { code: "404" })
}