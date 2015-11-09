/*
 * Game Logic
 */

module Play {
    type Colour = Vec3;

    var RED = [255, 0, 0];
    var GREEN = [0, 255, 0];
    var BLUE = [0, 0, 255];

    export var ZONES = 10;

    var colors = new List<Vec3>(RED, GREEN, BLUE);
    var currentSong: Queue<MusicEvent>;
    var currentMusic: AudioObj;

    var noteSpeed: number;
    var currTime: number;
    var song: string;
    var score: number;
    var numOfPlayers: number;

    export function setNumOfPlayers(players: number) {
        numOfPlayers = players;
    }

    export function playMusic(name: string) {
        if (currentMusic != null) return;

        DummyFF.createDummy();
        Keyboard.listenForKeysCustom(keyDown, null);

        currTime = 0;

        readFile("music/" + name + ".ff", function (music) {
            currentMusic = audio.getAudio(name);
            currentSong = loadSong(music, numOfPlayers);
            currentMusic.play();
            run(null);
        });
    }

    function keyDown(event) {
        if (event.keyCode == Keyboard.KEY_SPACE) {
            //console.log(Math.floor(currentMusic.time()*10));
        }
    }

    export function kill() {
        currentMusic.pause();
        currentMusic.time(0);
        currentMusic = null;
        document.body.removeChild(document.body.lastChild);
    }

    function run(event: MusicEvent) {
        if (currentMusic == null) return;

        if (event != null) {
            FFInterface.powerZone(event.color, event.zone)
            setTimeout(function () { FFInterface.releaseZone(event.zone) }, noteSpeed*100)
        }

        if (currentMusic.audio.ended) {
            cencelMusic();
            return;
        }

        var eventNext = currentSong.dequeue();
        currTime = Math.floor(10 * currentMusic.time());
        if (eventNext == null || typeof eventNext == "undefined") setTimeout(function () { run(null) }, 1000);

        var sleepTime = (eventNext.time - currTime) * 100;
        setTimeout(function () { run(eventNext) }, sleepTime);
    }

    function loadSong(music: string, players: number): Queue<MusicEvent> {
        var options = music.split("&");

        var speed: string = decompOptions(options, MusicOptions.SPEED);
        var notes: string = decompOptions(options, MusicOptions.NOTES);

        noteSpeed = parseInt(speed);

        var musicData = notes.split(",");
        var musc = new Queue<MusicEvent>();
        var seed = 5 * music.length + 3 * music.indexOf("a") + 4 * music.indexOf("o") + 2 * music.indexOf("u") + 7 * music.indexOf("i") + 3 * music.indexOf("e");
        MMath.setRandomSeed(seed);

        var busy: number[] = new Array(players);
        var occupied: number[] = new Array(ZONES);

        for (var i = 0; i < musicData.length; i++) {
            var time = parseInt(musicData[i]);
            var player = getPlayer(busy, players, time);
            var zone = getZone(occupied, time);

            musc.enqueue(new MusicEvent(time, zone, player));

            busy[player] = time + (noteSpeed*4)/3;
            occupied[zone] = time + (noteSpeed*4)/3;
        }
        return musc;
    }

    function getZone(occupied: number[], time:number):number {
        var zoneQuess = MMath.random(0, ZONES);
        if (occupied[zoneQuess] >= time || occupied[numToFrame(zoneQuess + 1, ZONES)] >= time || occupied[numToFrame(zoneQuess - 1, ZONES)] >= time) return getZone(occupied, time);
        return zoneQuess;
    }

    function getPlayer(busy: number[], players:number, time:number):number {
        var playerGuess = MMath.random(0, players);
        if (busy[playerGuess] >= time) return getPlayer(busy, players, time);
        return playerGuess;
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
        color: Colour;

        constructor(time: number, zone: number, player: number) {
            this.time = time;
            this.zone = zone;
            this.color = getColor(player);
        }
    }

    function getColor(player: number) {
        return colors.apply(player);
    }

    function numToFrame(num: number, max: number): number {
        return ((num % max) + max) % max;
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
        QuickGL.initGL(setup, loop, window.innerWidth - 300, 0, 300, 300, [0, 0, 0, 1]);
    }

    function setup() {
        shader = QuickGL.createShader(QuickGL.ShaderType.COLOR);
        shader.matrix.setProjectionMatrix(Matrix4.ortho(0, 300, 300, 0));

        render = new QuickGL.SIPRender(shader, QuickGL.StartType.ONCE);

        for (var i = 0; i < STRIP_COUNT; i++) {
            lines.insert(Geometry.line(Geometry.point(150 + Math.cos(toRad(i * (360 / STRIP_COUNT))) * 10, 150 + Math.sin(toRad(i * (360 / STRIP_COUNT))) * 10),
                Geometry.point(150 + Math.cos(toRad(i * (360 / STRIP_COUNT))) * 125, 150 + Math.sin(toRad(i * (360 / STRIP_COUNT))) * 125)));
        }
    }

    export function setColor(nwColor: Vec3, index: number) {
        color[index] = nwColor;
    }

    function toRad(deg: number): number {
        return (deg / 360) * 2 * Math.PI;
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
 * Connects the program to light output, is for now connected to the DummyFF.
 */
module FFInterface {
    var NUM_ZONES = Play.ZONES;

    export function powerZone(color: Vec3, zone: number) {
        DummyFF.setColor(color, zone);
        DummyFF.setColor(color, numToFrame(zone + 1, NUM_ZONES));
    }

    export function releaseZone(zone: number) {
        DummyFF.setColor(null, zone);
        DummyFF.setColor(null, numToFrame(zone + 1, NUM_ZONES));
    }

    function numToFrame(num: number, max: number): number {
        return ((num % max) + max) % max;
    }
}

/*
 * Initiation
 */ 

var audio: AudioManager;
var TEST_SONG = new List("testMusic", "../music/testMusic.mp3");

$(document).ready(init);

function init() {
    startIntro();

    requestAccess()

    audio = new AudioManager();
    audio.loadAudio(TEST_SONG.apply(0), TEST_SONG.apply(1));
}

/*
 * Intro animation
 */

function startIntro() {
    css(INTRO_SHOW, "display", "block");
    css(INTRO_HIDE, "display", "none");
    animate(LOAD_PROGRESS, { width: '60vw' }, 3000, endIntro);
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
var O_PLAYER_SET = "player_set"
var O_READ_FILE = "file_read"
var I_READ_FILE = "file_read_get"

var socket = io();
var currentFrame: string;
var access: boolean = false;

socket.on(I_ACCESS_RESPONSE, responseAccess)
socket.on(I_FRAME_RESPONS, responseFrame)
socket.on(I_MUSIC_START, Play.playMusic)

function readFile(name: string, callback:(html)=>void) {
    socket.emit(O_READ_FILE, name)
    socket.on(I_READ_FILE, callback)
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

function responseFrame(id:string, frame) {
    setHtml(FRAME, frame);
    currentFrame = id;
}

/*
 * Client Input
 */

function openSettings() {
    requestFrame(FRAME_PLAYER);
}

function setNumOfPlayers(players: number) {
    Play.setNumOfPlayers(players);
    socket.emit(O_PLAYER_SET, players);
    requestFrame(FRAME_SELECT);
}

function playMusic(name: string) {
    socket.emit(O_MUSIC_SET, name);
    requestFrame(FRAME_MUSIC);
}

function cencelMusic() {
    socket.emit(O_MUSIC_SET, null);
    requestFrame(FRAME_SELECT);
    Play.kill();
}

/*
 * JQuerry, document constants and helper methods
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

function setText(id: string, text: string) {
    $(id).text(text);
}

function fadeOut(id: string, time, callback?: () => void) {
    $(id).fadeOut(time, callback);
}

function animate(id: string, animation, time, callback?: () => void) {
    $(id).animate(animation, time, "", callback);
}

function kill(id: string) {
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