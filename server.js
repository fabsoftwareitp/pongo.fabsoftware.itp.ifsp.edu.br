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

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
})

app.all("/tela", (req, res) => {
  res.sendFile(__dirname + "/tela.html");
  app.locals.roomID = req.query.roomID;
})

app.use(express.static('img'));
app.use(express.static('css'));
app.use(express.static('sounds'));

app.use(express.urlencoded({
  extended: true
}))

app.post('/verify', (req, res) => {
  if(rooms.indexOf(req.body.roomID) == -1){
    res.redirect('/');
  }else{
    res.redirect('/tela?roomID='+req.body.roomID);;
  }
})

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

    if(this.ball.y == this.height-20 && this.ball.x >= player1Pos && this.ball.x <= player1Pos+100 || this.ball.y == 20 && this.ball.x >= player2Pos && this.ball.x <= player2Pos+100){
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

const rooms = [];
let roomUsers = 0;

io.on("connection", (socket) => {
  socket.on('userConnection', ()=> {
    const roomID = app.locals.roomID;
    console.log(`[${socket.id}] Usuário Conectado`);
    console.log(roomID);

    if(rooms.indexOf(roomID) == -1){
      socket.join(roomID);
      io.to(roomID).emit("player1", socket.id);
      rooms.push(roomID);
    }else{
      socket.join(roomID);
      io.to(roomID).emit("player2", socket.id);
    }

    socket.on('player1Mov', (pos) => {
      player1Pos = pos;
      io.to(roomID).emit('player1Mov', pos);
    })
    
    socket.on('player2Mov', (pos) => {
      player2Pos = pos;
      io.to(roomID).emit('player2Mov', pos);
    })

    socket.on('reset', (reset) => {
      io.to(roomID).emit('reset', reset);
    })

    socket.on('loading', (green, none) => {
      io.to(roomID).emit('loading', green, none);
    })

    socket.on('start', () => {
      io.to(roomID).emit('start', '');
    })

    console.log(roomUsers);

    socket.on("disconnect", () => {
      console.log(`[${socket.id}] Usuário Desconectado`);
      console.log(roomUsers);
      
      io.to(roomID).emit('loading', 'white', 'flex');
      io.to(roomID).emit('left', '');
      if(roomUsers === 0){
        rooms.splice(rooms.indexOf(roomID), 1);
      }else{
        roomUsers -= 1;
      }
    });
  })
});

//sync data to client
setInterval(() => {
  io.emit('score', player1Score, player2Score);
  gamestate.ballUpdate();
  io.emit("game-sync", gamestate);
  //console.log(gamestate);

  //io.emit("game-sync", gamestate);
}, (1 / HERTZ) * 1000);

server.listen(3000, () => {
  console.log("listening on *:3000");
});
