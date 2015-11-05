declare var io
var socket = io()

/*
 * Some variables and constants
 */

var access: boolean = false;

var audio: AudioManager;
var TEST_SONG = new List("test", "../music/testMusic.mp3");

/*
 * Initiation
 */

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
 * Sockets Access
 */

socket.on('access_response', responseAccess)

function requestAccess() {
    socket.emit('access_request');
}

function responseAccess(hasAccess: boolean) {
    access = hasAccess;
}

/*
 * Sockets Frame
 */ 

var FRAME_PLAYER = "framePlayer";
var FRAME_SELECT = "frameSelect";
var FRAME_MUSIC = "frameMusic";
var FRAME_CURRENT = null;

var currentFrame: string;

socket.on('frame', responseFrame)

function requestFrame(name: string) {
    socket.emit('request_frame', name);
}

function responseFrame(id:string, frame) {
    setHtml(FRAME, frame);
    currentFrame = id;
}

/*
 * Button clicks
 */

function openSettings() {
    requestFrame(FRAME_PLAYER);
}

function setNumOfPlayers(players: number) {
    numOfPlayers = players;
    socket.emit('players_set', players);
    requestFrame(FRAME_SELECT);
}

function playMusic(name: string) {
    socket.emit('music_set', name);
    requestFrame(FRAME_MUSIC);
}

function cencelMusic(name: string) {
    socket.emit('music_set', null);
    requestFrame(FRAME_SELECT);
    endMusic();
}

/*
 * Some music stuff
 */

var currentMusic: AudioObj;
var numOfPlayers: number;
var audioTime: number;

socket.on('music_start', startMusic)

function startMusic(name: string) {
    currentMusic = audio.getAudio(name);
    currentMusic.play();

    audioTime = 0;
    musicTick(false);
}

function musicTick(count:boolean) {
    if (count) audioTime = Math.floor(10 * currentMusic.time());
    setTimeout(function () { musicTick(true) }, 25);
}

function endMusic() {
    currentMusic.pause();
    currentMusic.time(0);
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