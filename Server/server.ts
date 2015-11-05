import path = require('path')
import stylus = require('stylus')

var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)

app.set('view engine', 'jade')
app.set('views', path.join(__dirname, 'views'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(stylus.middleware(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'public')))

exports.app = app
exports.io = io

require('./routes')
require('./routes')

server.listen(3000)