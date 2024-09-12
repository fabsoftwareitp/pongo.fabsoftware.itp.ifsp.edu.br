var express = require("express");
var app = express();
const HERTZ = 30; //Game updates per second
const port = process.env.PORT || 80;
var server = require("http").createServer(app).listen(port);
var io = require("socket.io")(server);
const uNRegex = new RegExp("^[a-zA-Z0-9_.-]{3,}$");

app.get("/", function (req, res, next) {
  res.sendFile(__dirname + "/client.html");
});

let users = {};

//User class
class User {
  constructor(socket) {
    this.socket = socket;
    this.username = socket.id;
  }
}

class GameState {
  constructor() {
    this.x = 10;
    this.y = 10;
    this.velox = 5;
    this.veloy = 5;
    this.width = 550;
    this.height = 300;
    this.tamanho = 10;
  }

  ballUpdate() {
    if (this.x + this.tamanho > this.width || this.x - this.tamanho < 0) {
      this.velox = -this.velox;
    }

    if (this.y + this.tamanho > this.height || this.y - this.tamanho < 0) {
      this.veloy = -this.veloy;
    }

    this.x = this.x + this.velox;
    this.y = this.y + this.veloy;
  }
}

const gamestate = new GameState();

io.on("connection", (socket) => {
  console.log(`New client connected: socketID`);
  users[socket.id] = new User(socket);

  if (users.size >= 2) {
    gamestate = new GameState();
    socket.broadcast.emit("game-started", gamestate);
  }

  socket.on("reset", () => {
    users = {};
  });
});

//sync data to client
setInterval(() => {
  gamestate.ballUpdate();
  for (const key in users) {
    users[key].socket.emit("game-sync", gamestate);
  }
  //console.log(gamestate);

  //io.emit("game-sync", gamestate);
}, (1 / HERTZ) * 1000);
