const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Serve static files from the 'public' folder
app.use(express.static("public"));

// Game logic storage
const games = {};

// Socket.io logic
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("create_game", () => {
    const gameId = Math.random().toString(36).substring(2, 7);
    games[gameId] = { players: [socket.id], positions: { [socket.id]: 1 }, turnIndex: 0 };
    socket.join(gameId);
    socket.emit("game_created", { gameId });
    io.to(gameId).emit("game_update", { players: games[gameId].players, positions: games[gameId].positions, turnIndex: 0 });
  });

  socket.on("join_game", ({ gameId }) => {
    if (games[gameId] && games[gameId].players.length < 4) {
      if (!games[gameId].players.includes(socket.id)) {
        games[gameId].players.push(socket.id);
        games[gameId].positions[socket.id] = 1;
        socket.join(gameId);
        io.to(gameId).emit("game_update", { players: games[gameId].players, positions: games[gameId].positions, turnIndex: games[gameId].turnIndex });
      } else {
        socket.emit("message", "You are already in this game.");
      }
    } else {
      socket.emit("message", "Cannot join game. Either full or invalid.");
    }
  });

  socket.on("roll_dice", ({ gameId }) => {
    const game = games[gameId];
    if (!game) return;

    const currentPlayer = game.players[game.turnIndex];
    if (currentPlayer !== socket.id) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    let newPos = game.positions[socket.id] + roll;

    const snakes = { 16: 6, 49: 11, 62: 19, 87: 24, 93: 73, 95: 75, 98: 78 };
    const ladders = { 2: 38, 7: 14, 8: 31, 15: 26, 28: 84, 21: 42, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94 };
    const yellowOdors = [13, 22, 41, 66];
    const greenOdors = [18, 29, 59, 82];
    const mites = [25, 55, 88];

    if (newPos > 100) newPos = 100;
    if (snakes[newPos]) newPos = snakes[newPos];
    else if (ladders[newPos]) newPos = ladders[newPos];
    else if (yellowOdors.includes(newPos)) newPos += 1;
    else if (greenOdors.includes(newPos)) newPos -= 1;
    else if (mites.includes(newPos)) newPos = 1;

    game.positions[socket.id] = newPos;

    if (newPos >= 100) {
      io.to(gameId).emit("message", `Player ${socket.id} wins!`);
      delete games[gameId];
      return;
    }

    game.turnIndex = (game.turnIndex + 1) % game.players.length;
    io.to(gameId).emit("dice_rolled", { value: roll });
    io.to(gameId).emit("game_update", { players: game.players, positions: game.positions, turnIndex: game.turnIndex });
  });

  socket.on("disconnect", () => {
    for (const gameId in games) {
      const game = games[gameId];
      if (game.players.includes(socket.id)) {
        game.players = game.players.filter(id => id !== socket.id);
        delete game.positions[socket.id];
        if (game.players.length === 0) {
          delete games[gameId];
        } else {
          io.to(gameId).emit("game_update", { players: game.players, positions: game.positions, turnIndex: game.turnIndex });
        }
      }
    }
  });
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
