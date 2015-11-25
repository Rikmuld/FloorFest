/*
 * Game Logic
 */
var Play;
(function (Play) {
    var RED = [255, 0, 0];
    var GREEN = [0, 255, 0];
    var BLUE = [0, 0, 255];
    Play.ZONES = 10;
    Play.colors = new List(RED, GREEN, BLUE);
    var currentSong;
    var currentMusic;
    var noteSpeed;
    var currTime;
    var song;
    var score;
    var audio = new AudioManager();
    Play.numOfPlayers;
    function setNumOfPlayers(players) {
        Play.numOfPlayers = players;
        setText(PLAYER_DISP, players.toString());
    }
    Play.setNumOfPlayers = setNumOfPlayers;
    function playMusic(name) {
        if (currentMusic != null)
            return;
        //DummyFF.createDummy();
        currTime = 0;
        if (audio.getAudio(name) == null)
            audio.loadAudio(name, music[name].audio);
        currentMusic = audio.getAudio(name);
        setTimeout(function () { loadMusicFile("music/" + name + ".ff"); }, 2000);
    }
    Play.playMusic = playMusic;
    function musicFileCalback(music) {
        currentSong = loadSong(music, Play.numOfPlayers);
        currentMusic.play();
        run(null);
        updateMusicProg();
    }
    Play.musicFileCalback = musicFileCalback;
    function keyDown(event) {
        if (event.keyCode == Keyboard.KEY_SPACE) {
            console.log(Math.floor(currentMusic.time() * 10));
        }
    }
    function kill() {
        currentMusic.pause();
        currentMusic.time(0);
        currentMusic = null;
        document.body.removeChild(document.body.lastChild);
    }
    Play.kill = kill;
    function updateMusicProg() {
        if (currentMusic == null || currentMusic.audio.ended)
            return;
        setMusicProg(currentMusic.time(), currentMusic.audio.duration);
        setTimeout(updateMusicProg, 20);
    }
    function run(event) {
        if (currentMusic == null)
            return;
        if (event != null) {
            FFInterface.powerZone(event.color, event.zone);
            setTimeout(function () { FFInterface.releaseZone(event.zone, event.color); }, noteSpeed * 100);
        }
        if (currentMusic.audio.ended) {
            cencelMusic();
            return;
        }
        var eventNext = currentSong.dequeue();
        currTime = Math.floor(10 * currentMusic.time());
        if (eventNext == null || typeof eventNext == "undefined")
            setTimeout(function () { run(null); }, 1000);
        else {
            var sleepTime = (eventNext.time - currTime) * 100;
            setTimeout(function () { run(eventNext); }, sleepTime);
        }
    }
    function loadSong(music, players) {
        var options = music.split("&");
        var speed = decompOptions(options, MusicOptions.SPEED);
        var notes = decompOptions(options, MusicOptions.NOTES);
        noteSpeed = parseInt(speed);
        var musicData = notes.split(",");
        var musc = new Queue();
        var seed = 5 * music.length + 3 * music.indexOf("a") + 4 * music.indexOf("o") + 2 * music.indexOf("u") + 7 * music.indexOf("i") + 3 * music.indexOf("e");
        MMath.setRandomSeed(seed);
        var busy = new Array(players);
        var occupied = new Array(Play.ZONES);
        var currLoc = new Array(players);
        for (var i = 0; i < musicData.length; i++) {
            var time = parseInt(musicData[i]);
            var zone = getZone(occupied, currLoc, time, 0);
            var player = zone == -1 ? -1 : getPlayer(busy, zone, players, time, 0);
            if (player >= 0) {
                musc.enqueue(new MusicEvent(time, zone, player));
                busy[player] = time + (noteSpeed * (players == 1 ? 1 : (4 / 3)));
                currLoc[player] = zone;
                occupied[zone] = time + (noteSpeed * 4) / 3;
            }
        }
        return musc;
    }
    function getZone(occupied, currLoc, time, ittrs) {
        if (ittrs == 100)
            return -1;
        var zoneQuess = MMath.random(0, Play.ZONES);
        if (currLoc.indexOf(zoneQuess) >= 0)
            return getZone(occupied, currLoc, time, ittrs + 1);
        if (occupied[zoneQuess] >= time || occupied[MMath.mod(zoneQuess + 1, Play.ZONES)] >= time || occupied[MMath.mod(zoneQuess - 1, Play.ZONES)] >= time)
            return getZone(occupied, currLoc, time, ittrs + 1);
        return zoneQuess;
    }
    function getPlayer(busy, zone, players, time, ittrs) {
        if (ittrs == 100)
            return -1;
        var playerGuess = MMath.random(0, players);
        if ((zone == 9 && playerGuess == 2) || (zone == 8 && playerGuess != 0) || (zone == 7 && playerGuess != 2) || (zone == 6 && playerGuess != 1) || (zone == 5 && playerGuess == 2))
            return getPlayer(busy, zone, players, time, ittrs + 1);
        if (busy[playerGuess] > time)
            return getPlayer(busy, zone, players, time, ittrs + 1);
        return playerGuess;
    }
    function decompOptions(options, option) {
        var split;
        if (option == MusicOptions.SPEED)
            split = "s=";
        if (option == MusicOptions.NOTES)
            split = "n=";
        return options.filter(function (value, index, array) {
            return value.split(split).length == 2;
        })[0].split(split)[1];
    }
    var MusicOptions;
    (function (MusicOptions) {
        MusicOptions[MusicOptions["NOTES"] = 0] = "NOTES";
        MusicOptions[MusicOptions["SPEED"] = 1] = "SPEED";
    })(MusicOptions || (MusicOptions = {}));
    var MusicEvent = (function () {
        function MusicEvent(time, zone, player) {
            this.time = time;
            this.zone = zone;
            this.color = player;
        }
        return MusicEvent;
    })();
    function getColor(player) {
        return Play.colors.apply(player);
    }
})(Play || (Play = {}));
/*
 * Dummy output (will be replaced by real life stuff)
 */
var DummyFF;
(function (DummyFF) {
    var lines = new MutableList();
    var color = [];
    var render;
    var shader;
    var STRIP_COUNT = Play.ZONES;
    function createDummy() {
        //QuickGL.initGL(setup, loop, 25, 99, 500, 500, [0, 0, 0, 1]);
    }
    DummyFF.createDummy = createDummy;
    function setup() {
        shader = QuickGL.createShader(QuickGL.ShaderType.COLOR);
        shader.matrix.setProjectionMatrix(Matrix4.ortho(0, 300, 300, 0));
        render = new QuickGL.SIPRender(shader, QuickGL.StartType.ONCE);
        lines.clear();
        for (var i = 0; i < STRIP_COUNT; i++) {
            lines.insert(Geometry.line(Geometry.point(150 + Math.cos(MMath.toRad(i * (360 / STRIP_COUNT))) * 10, 150 + Math.sin(MMath.toRad(i * (360 / STRIP_COUNT))) * 10), Geometry.point(150 + Math.cos(MMath.toRad(i * (360 / STRIP_COUNT))) * 125, 150 + Math.sin(MMath.toRad(i * (360 / STRIP_COUNT))) * 125)));
        }
    }
    function setColor(nwColor, index) {
        color[index] = nwColor;
    }
    DummyFF.setColor = setColor;
    function loop() {
        GLF.clearBufferColor();
        for (var i = 0; i < lines.size(); i++) {
            var nwColor = color[i];
            if (nwColor == null)
                nwColor = [1, 1, 1];
            render.setColorV3(nwColor);
            render.line(lines.apply(i));
        }
    }
})(DummyFF || (DummyFF = {}));
/*
 * Connects the program to light output.
 */
var FFInterface;
(function (FFInterface) {
    var NUM_ZONES = Play.ZONES;
    function powerZone(color, zone) {
        //dummy (disable when on pi)
        //DummyFF.setColor(Play.colors.apply(color), zone);
        //DummyFF.setColor(Play.colors.apply(color), MMath.mod(zone + 1, NUM_ZONES));
        //pi
        setPin(zone * 3 + color, 255);
        setPin(MMath.mod(zone + 1, NUM_ZONES) * 3 + color, 255);
    }
    FFInterface.powerZone = powerZone;
    function releaseZone(zone, color) {
        //dummy (disable when on pi)
        //DummyFF.setColor(null, zone);
        //DummyFF.setColor(null, MMath.mod(zone + 1, NUM_ZONES));
        //pi
        setPin(zone * 3 + color, 0);
        setPin(MMath.mod(zone + 1, NUM_ZONES) * 3 + color, 0);
    }
    FFInterface.releaseZone = releaseZone;
})(FFInterface || (FFInterface = {}));
/*
 * Initiation
 */
var music = {};
var Song = (function () {
    function Song(id, name) {
        this.name = name;
        this.audio = "../music/" + id + ".mp3";
        music[id] = this;
    }
    return Song;
})();
var CANON_IN_D = new Song("canon", "Canon in D");
var LET_IT_GO = new Song("frozen", "Let it Go");
var LORT_RINGS = new Song("hobbit", "Concerning Hobbits");
var HELLO = new Song("hello", "Hello");
var PIRATE = new Song("pirate", "He is a Pirate");
var JURESIC = new Song("juresic", "Jurassic Park: Main Theme");
var ALL_I_EVER = new Song("all_I_ever", "All I Ever Wanted");
var COUNTDOWN = new Song("countdown", "The Final Countdown");
var FIREFLIES = new Song("fireflies", "Fireflies");
var HOW_DEEP_LOVE = new Song("how_deep_love", "How Deep is Your Love");
var LAST_GOODBYE = new Song("last_goodbye", "The Last Goodbye");
var LAY_IT_ALL = new Song("lay_it_all", "Lay it All on Me");
var LINDSEY = new Song("lindsey", "Shatter Me");
var LUSH_LIFE = new Song("lush_life", "Lush Life");
var RUN_WILD = new Song("run_wild", "Run Wild");
var SORRY = new Song("sorry", "Sorry");
var STICHES = new Song("stiches", "Stiches");
var SWIFT = new Song("swift", "Blanck Space");
var TIGER = new Song("tiger", "Eye of the Tiger");
var VILLAGE = new Song("village", "Vilage People");
var VIVA = new Song("viva", "Viva la Vida");
var GANGAN = new Song("gangan", "Gangnam Style");
var POMPEII = new Song("popeii", "Pompeii");
$(document).ready(init);
function init() {
    startIntro();
    Keyboard.listenForKeys();
    requestAccess();
}
/*
 * Intro animation
 */
function startIntro() {
    css(INTRO_SHOW, "display", "block");
    css(INTRO_HIDE, "display", "none");
    setTimeout(function () {
        animate(LOAD_PROGRESS, { width: '60vw' }, 1500, endIntro);
    }, 200);
}
function endIntro() {
    animate(LOAD_BAR, { width: '0vw' }, 500, start);
    if (window.innerHeight < window.innerWidth)
        fadeOut(INTRO_MESSAGE, 500);
}
function killIntro() {
    kill(INTRO);
    show(TURN_MESSAGE);
    css(INTRO_SHOW, "display", "");
    css(INTRO_HIDE, "display", "");
}
function start() {
    killIntro();
    if (!access)
        setText(ACCESS_MESSAGE, "Sorry, iemand anders is al verbonden!");
    else
        requestFrame(FRAME_CURRENT);
}
var FRAME_PLAYER = "framePlayer";
var FRAME_SELECT = "frameSelect";
var FRAME_MUSIC = "frameMusic";
var FRAME_CURRENT = null;
var O_ACCESS_REQUEST = "access_request";
var I_ACCESS_RESPONSE = "access_response";
var O_FRAME_REQUEST = "frame_request";
var I_FRAME_RESPONS = "frame_respons";
var I_MUSIC_START = "music_start";
var O_MUSIC_SET = "music_set";
var I_PLAYER_SET_CLIENT = "player_set_client";
var O_PLAYER_SET = "player_set";
var O_READ_FILE = "file_read";
var I_READ_FILE = "file_read_get";
var O_SET_PIN = "set_pin";
var socket = io();
var currentFrame;
var access = false;
socket.on(I_ACCESS_RESPONSE, responseAccess);
socket.on(I_FRAME_RESPONS, responseFrame);
socket.on(I_MUSIC_START, Play.playMusic);
socket.on(I_READ_FILE, Play.musicFileCalback);
socket.on(I_PLAYER_SET_CLIENT, Play.setNumOfPlayers);
function setPin(pin, value) {
    socket.emit(O_SET_PIN, pin, value);
}
function loadMusicFile(name) {
    socket.emit(O_READ_FILE, name);
}
function requestAccess() {
    socket.emit(O_ACCESS_REQUEST);
}
function responseAccess(hasAccess) {
    access = hasAccess;
}
function requestFrame(name) {
    socket.emit(O_FRAME_REQUEST, name);
}
function responseFrame(id, frame, song, img) {
    setHtml(FRAME, frame);
    if (id == FRAME_MUSIC) {
        css(MUSIC_COVER, "background-image", "Url(image/" + img + ")");
        setHeaderText("Now playing: " + music[song].name);
        setHeaderIcon(ICON_CENCEL);
    }
    else {
        setHeaderText("FloorFest");
        setHeaderIcon(ICON_USERS);
    }
    currentFrame = id;
}
/*
 * Client Input
 */
function openSettings() {
    if (access && currentFrame == FRAME_SELECT)
        requestFrame(FRAME_PLAYER);
    else if (currentFrame == FRAME_MUSIC)
        cencelMusic();
}
function setNumOfPlayers(players) {
    socket.emit(O_PLAYER_SET, players);
    requestFrame(FRAME_SELECT);
}
function playMusic(name) {
    socket.emit(O_MUSIC_SET, name);
    requestFrame(FRAME_MUSIC);
}
function cencelMusic() {
    socket.emit(O_MUSIC_SET, null);
    requestFrame(FRAME_SELECT);
    Play.kill();
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
var MUSIC_COVER = ".coverbox";
var HEADER_ICON = "#headerIcon";
var HEADER_TEXT = "#logo";
var MUSIC_PROG = "#musicProg-bar";
function setMusicProg(current, total) {
    var value = ((current / total) * 100).toString() + "%";
    css(MUSIC_PROG, "width", value);
}
function setHeaderText(text) {
    setText(HEADER_TEXT, text);
}
var ICON_USERS = "users";
var ICON_CENCEL = "ban";
function setHeaderIcon(icon) {
    remClass(HEADER_ICON, "fa-" + ICON_USERS);
    remClass(HEADER_ICON, "fa-" + ICON_CENCEL);
    addClass(HEADER_ICON, "fa-" + icon);
    if (icon == ICON_USERS)
        setText(PLAYER_DISP, Play.numOfPlayers.toString());
    else
        setText(PLAYER_DISP, "");
}
function setText(id, text) {
    $(id).text(text);
}
function fadeOut(id, time, callback) {
    $(id).fadeOut(time, callback);
}
function animate(id, animation, time, callback) {
    $(id).animate(animation, time, "", callback);
}
function kill(id) {
    $(id).hide();
}
function show(id) {
    $(id).show();
}
function css(id, prop, value) {
    $(id).css(prop, value);
}
function setHtml(id, data) {
    $(id).html(data);
}
function attr(id, attr) {
    return $(id).attr(attr);
}
function remClass(id, clas) {
    $(id).removeClass(clas);
}
function addClass(id, clas) {
    $(id).addClass(clas);
}
//# sourceMappingURL=main.js.map