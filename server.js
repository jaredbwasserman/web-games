const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(8080, function () {
    console.log(`Listening on ${server.address().port}`);
});

io.on('connection', function (socket) {
    console.log('a user connected'); // TODO: Remove?
    socket.on('disconnect', function () {
        console.log('user disconnected'); // TODO: Remove?
    });
});
