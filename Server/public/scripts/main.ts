/*
 * Game Logic
 */

module Play {
    type Colour = Vec3;

    var RED = [255, 0, 0];
    var GREEN = [0, 255, 0];
    var BLUE = [0, 0, 255];

    export var ZONES = 10;

    export var colors = new List<Vec3>(RED, GREEN, BLUE);
    var currentSong: Queue<MusicEvent>;
    var currentMusic: AudioObj;

    var noteSpeed: number;
    var currTime: number;
    var song: string;
    var score: number = 0;
    var audio: AudioManager = new AudioManager();
    export var numOfPlayers: number;
    var songLength: number;

    export function setNumOfPlayers(players: number) {
        numOfPlayers = players;
        setText(PLAYER_DISP, players.toString())
    }

    export function playMusic(name: string) {
        if (currentMusic != null) return;

        //DummyFF.createDummy();

        hide(FINAL_SCORE)
        currTime = 0;
        score = 0;

        if (audio.getAudio(name) == null) audio.loadAudio(name, music[name].audio);
        currentMusic = audio.getAudio(name);

        setTimeout(function () { loadMusicFile("music/" + name + ".ff") }, 2000);
    }

    export function musicFileCalback(music: string) {
        currentSong = loadSong(music, numOfPlayers);
        currentMusic.play();
        run(null);
        updateMusicProg();
    }

    export function scoreAdd() {
        console.log(songLength)
        score += (1 / songLength) * 1000000;
        setText(SCORE, "Score: " + score.toFixed(0));
    }

    function keyDown(event) {
        if (event.keyCode == Keyboard.KEY_SPACE) {
            console.log(Math.floor(currentMusic.time()*10));
        }
    }

    export function kill() {
        var scre = fixScore(parseInt((score / 10000).toFixed(0)));
        setText(FINAL_SCORE_TEXT, "" + scre + "% " + musicText(scre));

        setTimeout(function () {
            fadeOut(MUSIC_COVER, 2500, function () {
                fadeIn(FINAL_SCORE, 500)
            })
        }, 1000);

        currentMusic.pause();
        currentMusic.time(0);
        currentMusic = null;
        document.body.removeChild(document.body.lastChild);
    }

    function fixScore(score: number): number {
        return Math.min(100, Math.sqrt(1.1738304539443973 + 103.95285000595457 * score));
    }

    function musicText(score: number): string {
             if (score   < 50) return ", Fail!";
        else if (score   < 70) return ", Try Harder!";
        else if (score   < 80) return ", Decent!";
        else if (score   < 90) return ", Good Job!";
        else if (score   < 95) return ", Well Done!";
        else if (score   < 99) return ", Great Job!";
        else if (score  < 100) return ", Amazing!";
        else if (score == 100) return ", Perfect!";
    }

    function updateMusicProg() {
        if (currentMusic == null || currentMusic.audio.ended) return;
        setMusicProg(currentMusic.time(), currentMusic.audio.duration);
        setTimeout(updateMusicProg, 20);
    }

    function run(event: MusicEvent) {
        if (currentMusic == null) return;

        if (event != null) {
            FFInterface.powerZone(event.color, event.zone)
            setTimeout(function () { FFInterface.releaseZone(event.zone, event.color) }, noteSpeed*100)
        }

        if (currentMusic.audio.ended) {
            kill();
            return;
        }

        var eventNext = currentSong.dequeue();
        currTime = Math.floor(10 * currentMusic.time());
        if (eventNext == null || typeof eventNext == "undefined") setTimeout(function () { run(null) }, 1000);
        else {
            var sleepTime = (eventNext.time - currTime) * 100;
            setTimeout(function () { run(eventNext) }, sleepTime);
        }
    }

    function showMusicList() {
        cencelMusic(true);
    }

    function loadSong(music: string, players: number): Queue<MusicEvent> {
        var options = music.split("&");

        var speed: string = decompOptions(options, MusicOptions.SPEED);
        var notes: string = decompOptions(options, MusicOptions.NOTES);
        noteSpeed = parseInt(speed);

        var musicData = notes.split(",");
        var musc = new Queue<MusicEvent>();
        songLength = 0;
        var seed = 5 * music.length + 3 * music.indexOf("a") + 4 * music.indexOf("o") + 2 * music.indexOf("u") + 7 * music.indexOf("i") + 3 * music.indexOf("e");
        MMath.setRandomSeed(seed);

        var busy: number[] = new Array(players);
        var occupied: number[] = new Array(ZONES);
        var currLoc: number[] = new Array(players);
        var lastPlayer: number = -1;

        for (var i = 0; i < musicData.length; i++) {
            var time = parseInt(musicData[i]);

            var data = getPlayer(busy, occupied, currLoc, players, lastPlayer, time, 0);
            var player = data[0]
            var zone = data[1]

            if (player >= 0) {
                songLength += 1;
                musc.enqueue(new MusicEvent(time, zone, player));

                busy[player] = time + (noteSpeed * (players == 1 ? 1 : (4 / 3)));
                currLoc[player] = zone;
                lastPlayer = player;
                occupied[zone] = time + (noteSpeed * 4)/3;
            }
        }
        return musc;
    }

    function getZone(occupied: number[], currLoc: number[], time: number, ittrs: number): number {
        if (ittrs == 100) return -1;
        var zoneQuess = MMath.random(0, ZONES);
        if (currLoc.indexOf(zoneQuess) >= 0) return getZone(occupied, currLoc, time, ittrs + 1);
        if (occupied[zoneQuess] >= time || occupied[MMath.mod(zoneQuess + 1, ZONES)] >= time || occupied[MMath.mod(zoneQuess - 1, ZONES)] >= time) return getZone(occupied, currLoc, time, ittrs+1);
        return zoneQuess;
    }

    function getPlayer(busy: number[], occupied: number[], currLoc: number[], players: number, lastPlayer:number, time: number, ittrs: number): [number, number]{
        var zone = getZone(occupied, currLoc, time, 0);
        if (ittrs == 100 || zone == -1) return [-1,-1];
        var playerGuess = MMath.random(0, players);
        if (playerGuess == lastPlayer, busy[playerGuess] > time || (zone == 9 && playerGuess == 2) || (zone == 8 && playerGuess != 0) || (zone == 7 && playerGuess != 2) || (zone == 6 && playerGuess != 1) || (zone == 5 && playerGuess == 2)) {
            return getPlayer(busy, occupied, currLoc, players, lastPlayer, time, ittrs + 1);
        }
        return [playerGuess, zone];
    }

    function decompOptions(options: string[], option: MusicOptions): string {
        var split: string;

        if (option == MusicOptions.SPEED) split = "s=";
        if (option == MusicOptions.NOTES) split = "n=";

        return options.filter((value: string, index: number, array: string[]): boolean => {
            return value.split(split).length == 2;
        })[0].split(split)[1];
    }

    enum MusicOptions {
        NOTES, SPEED
    }

    class MusicEvent {
        time: number;
        zone: number;
        color: number;

        constructor(time: number, zone: number, player: number) {
            this.time = time;
            this.zone = zone;
            this.color = player;
        }
    }

    function getColor(player: number) {
        return colors.apply(player);
    }
}

/*
 * Dummy output (will be replaced by real life stuff)
 */

module DummyFF {
    var lines = new MutableList<Geometry.Line>();
    var color: Vec3[] = [];

    var render: QuickGL.SIPRender;
    var shader: Shader;
    var STRIP_COUNT = Play.ZONES;

    export function createDummy() {
        QuickGL.initGL(setup, loop, 25, 99, 500, 500, [0, 0, 0, 1]);
    }

    function setup() {
        shader = QuickGL.createShader(QuickGL.ShaderType.COLOR);
        shader.matrix.setProjectionMatrix(Matrix4.ortho(0, 300, 300, 0));

        render = new QuickGL.SIPRender(shader, QuickGL.StartType.ONCE);
        lines.clear();

        for (var i = 0; i < STRIP_COUNT; i++) {
            lines.insert(Geometry.line(Geometry.point(150 + Math.cos(MMath.toRad(i * (360 / STRIP_COUNT))) * 10, 150 + Math.sin(MMath.toRad(i * (360 / STRIP_COUNT))) * 10),
                Geometry.point(150 + Math.cos(MMath.toRad(i * (360 / STRIP_COUNT))) * 125, 150 + Math.sin(MMath.toRad(i * (360 / STRIP_COUNT))) * 125)));
        }
    }

    export function setColor(nwColor: Vec3, index: number) {
        color[index] = nwColor;
    }

    function loop() {
        GLF.clearBufferColor();
        for (var i = 0; i < lines.size(); i++) {
            var nwColor = color[i];
            if (nwColor == null) nwColor = [1, 1, 1];
            render.setColorV3(nwColor);
            render.line(lines.apply(i));
        }
    }
}

/*
 * Connects the program to light output.
 */
module FFInterface {
    var NUM_ZONES = Play.ZONES;

    export function powerZone(color: number, zone: number) {
        //dummy (disable when on pi)
        //DummyFF.setColor(Play.colors.apply(color), zone);
        //DummyFF.setColor(Play.colors.apply(color), MMath.mod(zone + 1, NUM_ZONES));
        //pi
        setPin(zone * 3 + color, 255);
        setPin(MMath.mod(zone + 1, NUM_ZONES) * 3 + color, 255);
    }

    export function releaseZone(zone: number, color:number) {
        //dummy (disable when on pi)
        //DummyFF.setColor(null, zone);
        //DummyFF.setColor(null, MMath.mod(zone + 1, NUM_ZONES));
        //pi

        zoneOcupied(zone);
        setPin(zone * 3 + color, 0);
        setPin(MMath.mod(zone + 1, NUM_ZONES) * 3 + color, 0);
    }
}

/*
 * Initiation
 */ 

var music = {};

class Song {
    name: string;
    audio: string;

    constructor(id: string, name:string) {
        this.name = name;
        this.audio = "../music/" + id + ".mp3";

        music[id] = this;
    }
}

var CANON_IN_D = new Song("canon", "Canon in D");
var LET_IT_GO = new Song("frozen", "Let it Go");
var LORT_RINGS = new Song("hobbit", "Concerning Hobbits");
var HELLO = new Song("hello", "Hello");
var PIRATE = new Song("pirate", "He is a Pirate");
var JURESIC = new Song("juresic", "Jurassic Park: Main Theme");
var ALL_I_EVER = new Song("all_I_ever", "All I Ever Wanted")
var COUNTDOWN = new Song("countdown", "The Final Countdown")
var FIREFLIES = new Song("fireflies", "Fireflies")
var HOW_DEEP_LOVE = new Song("how_deep_love", "How Deep is Your Love")
var LAST_GOODBYE = new Song("last_goodbye", "The Last Goodbye")
var LAY_IT_ALL = new Song("lay_it_all", "Lay it All on Me")
var LINDSEY = new Song("lindsey", "Shatter Me")
var LUSH_LIFE = new Song("lush_life", "Lush Life")
var RUN_WILD = new Song("run_wild", "Run Wild")
var SORRY = new Song("sorry", "Sorry")
var STICHES = new Song("stiches", "Stiches")
var SWIFT = new Song("swift", "Blanck Space")
var TIGER = new Song("tiger", "Eye of the Tiger")
var VILLAGE = new Song("village", "Vilage People")
var VIVA = new Song("viva", "Viva la Vida");
var GANGAN = new Song("gangan", "Gangnam Style");
var POMPEII = new Song("popeii", "Pompeii");

$(document).ready(init);

function init() {
    startIntro();
    Keyboard.listenForKeys();

    requestAccess()
}

/*
 * Intro animation
 */

function startIntro() {
    css(INTRO_SHOW, "display", "block");
    css(INTRO_HIDE, "display", "none");
    setTimeout(function () {
        animate(LOAD_PROGRESS, { width: '60vw' }, 1500, endIntro);
    }, 200)
}

function endIntro() {
    animate(LOAD_BAR, { width: '0vw' }, 500, start);
    if (window.innerHeight < window.innerWidth) fadeOut(INTRO_MESSAGE, 500);
}

function killIntro() {
    kill(INTRO);
    show(TURN_MESSAGE);
    css(INTRO_SHOW, "display", "");
    css(INTRO_HIDE, "display", "");
}

function start() {
    killIntro();

    if (!access) setText(ACCESS_MESSAGE, "Sorry, iemand anders is al verbonden!");
    else requestFrame(FRAME_CURRENT)
}

/*
 * Client/Server Comunication
 */

declare var io

var FRAME_PLAYER = "framePlayer";
var FRAME_SELECT = "frameSelect";
var FRAME_MUSIC = "frameMusic";
var FRAME_CURRENT = null;

var O_ACCESS_REQUEST = "access_request"
var I_ACCESS_RESPONSE = "access_response"
var O_FRAME_REQUEST = "frame_request"
var I_FRAME_RESPONS = "frame_respons"
var I_MUSIC_START = "music_start"
var O_MUSIC_SET = "music_set"
var I_PLAYER_SET_CLIENT = "player_set_client"
var O_PLAYER_SET = "player_set"
var O_READ_FILE = "file_read"
var I_READ_FILE = "file_read_get"
var O_SET_PIN = "set_pin"
var I_ZONE_OCUP = "scoreAdd"
var O_ZONE_OCUP = "zone_ocup_req"

var socket = io();
var currentFrame: string;
var access: boolean = false;

socket.on(I_ACCESS_RESPONSE, responseAccess)
socket.on(I_FRAME_RESPONS, responseFrame)
socket.on(I_MUSIC_START, Play.playMusic)
socket.on(I_READ_FILE, Play.musicFileCalback)
socket.on(I_PLAYER_SET_CLIENT, Play.setNumOfPlayers)
socket.on(I_ZONE_OCUP, Play.scoreAdd)

function zoneOcupied(zone: number) {
    socket.emit(O_ZONE_OCUP, zone);
}

function setPin(pin: number, value:number) {
    socket.emit(O_SET_PIN, pin, value);
}

function loadMusicFile(name: string) {
    socket.emit(O_READ_FILE, name)
}

function requestAccess() {
    socket.emit(O_ACCESS_REQUEST);
}

function responseAccess(hasAccess: boolean) {
    access = hasAccess;
}

function requestFrame(name: string) {
    socket.emit(O_FRAME_REQUEST, name);
}

function responseFrame(id:string, frame, song?:string, img?:string) {
    setHtml(FRAME, frame);
    if (id == FRAME_MUSIC) {
        css(MUSIC_COVER, "background-image", "Url(image/" + img + ")")
        setHeaderText("Now playing: " + music[song].name);
        setHeaderIcon(ICON_CENCEL);
        kill(FINAL_SCORE);
    } else {
        setHeaderText("FloorFest");
        setHeaderIcon(ICON_USERS);
    }
    currentFrame = id;
}

/*
 * Client Input
 */

function openSettings() {
    if (access && currentFrame == FRAME_SELECT) requestFrame(FRAME_PLAYER);
    else if (currentFrame == FRAME_MUSIC) cencelMusic();
}

function setNumOfPlayers(players: number) {
    socket.emit(O_PLAYER_SET, players);
    requestFrame(FRAME_SELECT);
}

function playMusic(name: string) {
    socket.emit(O_MUSIC_SET, name);
    requestFrame(FRAME_MUSIC);
}

function cencelMusic(notKillMusic?:boolean) {
    socket.emit(O_MUSIC_SET, null);
    requestFrame(FRAME_SELECT);
    if (typeof notKillMusic == "undefined" || notKillMusic == false) {
        Play.kill();
    }
}

/*
 * JQuerry, constants and helper methods
 */

var ACCESS_MESSAGE = "#accessText";
var INTRO = "#intro";
var INTRO_MESSAGE = ".turnDevice";
var TURN_MESSAGE = ".turnDevice";
var LOAD_BAR = ".load, .progress";
var LOAD_PROGRESS = ".progress";
var INTRO_SHOW = ".diIntro";
var INTRO_HIDE = ".hiIntro";
var FRAME = "#landscape";
var PLAYER_DISP = ".playerDisp";
var MUSIC_COVER = ".coverbox"
var HEADER_ICON = "#headerIcon"
var HEADER_TEXT = "#logo"
var MUSIC_PROG = "#musicProg-bar";
var SCORE = "#score";
var FINAL_SCORE = "#hideOnPlay";
var MUSIC_COVER = ".coverbox";
var FINAL_SCORE_TEXT = ".finalscoreText";

function setMusicProg(current: number, total: number) {
    var value = ((current / total) * 100).toString() + "%"
    css(MUSIC_PROG, "width", value);
}

function setHeaderText(text: string) {
    setText(HEADER_TEXT, text);
}

var ICON_USERS = "users";
var ICON_CENCEL = "ban";

function setHeaderIcon(icon: string) {
    remClass(HEADER_ICON, "fa-" + ICON_USERS);
    remClass(HEADER_ICON, "fa-" + ICON_CENCEL);
    addClass(HEADER_ICON, "fa-" + icon);

    if (icon == ICON_USERS) setText(PLAYER_DISP, Play.numOfPlayers.toString())
    else setText(PLAYER_DISP, "")
}

function setText(id: string, text: string) {
    $(id).text(text);
}

function fadeOut(id: string, time, callback?: () => void) {
    $(id).fadeOut(time, callback);
}

function fadeIn(id: string, time, callback?: () => void) {
    $(id).fadeIn(time, callback);
}

function animate(id: string, animation, time, callback?: () => void) {
    $(id).animate(animation, time, "", callback);
}

function kill(id: string) {
    $(id).hide();
}

function hide(id: string) {
    $(id).hide();
}

function show(id: string) {
    $(id).show();
}

function css(id: string, prop, value: string) {
    $(id).css(prop, value);
}

function setHtml(id: string, data) {
    $(id).html(data);
}

function attr(id: string, attr: string):string {
    return $(id).attr(attr);
}

function remClass(id: string, clas: string) {
    $(id).removeClass(clas);
}

function addClass(id: string, clas: string) {
    $(id).addClass(clas);
}