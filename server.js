//Iniciando Server
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const HERTZ = 30; //Game updates per second

//Setup Socket.io
const { Server } = require("socket.io");
const io = new Server(server, {
  connectionStateRecovery: {}
});

app.get("/", function (req, res, next) {
  res.sendFile(__dirname + "/client.html");
});

app.use(express.static('img'));
app.use(express.static('css'));
app.use(express.static('sounds'));

class GameState {
  constructor() {
    this.ball = {x: 615/2, y: 800/2, tamanho: 10};
    this.velox = 5;
    this.veloy = 5;
    this.width = 615;
    this.height = 800;
    this.player1 = {pos: 0};
  }

  ballUpdate() {
    if (this.ball.x + this.ball.tamanho > this.width || this.ball.x - this.ball.tamanho < 0) {
      this.velox = -this.velox;
    }

    if (this.ball.y + this.ball.tamanho > this.height || this.ball.y - this.ball.tamanho < 0) {
      this.veloy = -this.veloy;
    }

    if(this.ball.y == this.height-15 && this.ball.x >= player1Pos && this.ball.x <= player1Pos+100 || this.ball.y == 15 && this.ball.x >= player2Pos && this.ball.x <= player2Pos+100){
      this.veloy = -this.veloy;
    }

    if(this.ball.y < 10){
      this.ball.x = 615/2
      this.ball.y = 800/2
      player1Score += 1;
    }else if(this.ball.y > this.height - 10){
      this.ball.x = 615/2
      this.ball.y = 800/2
      player2Score += 1;
    }

    this.ball.x = this.ball.x + this.velox;
    this.ball.y = this.ball.y + this.veloy;
  }

}

const gamestate = new GameState();
let player1Pos = 615/2;
let player2Pos = 615/2;

let player1Score = 0;
let player2Score = 0;

let users = 0

io.on("connection", (socket) => {
  console.log('connect');
  users += 1;

  if (users == 2) {
    io.emit('player1', socket.id);
  }else if(users == 4){
    io.emit('player2', socket.id);
  }

  socket.on('sla', (e) => {
    console.log(e);
  })

  socket.on('player1Mov', (pos) => {
    player1Pos = pos;
    io.emit('player1Mov', pos);
  })

  socket.on('player2Mov', (pos) => {
    player2Pos = pos;
    io.emit('player2Mov', pos);
  })

  socket.on('reset', (reset) => {
    io.emit('reset', reset);
  })

  socket.on('loading', (green, none) => {
    io.emit('loading', green, none);
  })

  socket.on('start', () => {
    io.emit('start', '');
  })

  socket.on('disconnect', () =>{
    io.emit('loading', 'white', 'flex');
    io.emit('left', '');
    users -= 1;
  })
});

//sync data to client
setInterval(() => {
  io.emit('score', player1Score, player2Score);
  gamestate.ballUpdate();
  io.emit("game-sync", gamestate);
  //console.log(gamestate);

  //io.emit("game-sync", gamestate);
}, (1 / HERTZ) * 900);

server.listen(3000, () => {
  console.log("listening on *:3000");
});
