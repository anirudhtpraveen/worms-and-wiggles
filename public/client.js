const socket = io(window.location.origin);

const boardSize = 10;
const totalSquares = 100;

const snakes = { 16: 6, 49: 11, 62: 19, 87: 24, 93: 73, 95: 75, 98: 78 };
const ladders = { 2: 38, 7: 14, 8: 31, 15: 26, 28: 84, 21: 42, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94 };
const yellowOdors = [13, 22, 41, 66];
const greenOdors = [18, 29, 59, 82];
const mites = [25, 55, 88];

let playerId = null;
let players = [];
let positions = {};
let turn = null;

socket.on("connect", () => {
  playerId = socket.id;
});

socket.on("game_created", ({ gameId }) => {
  document.getElementById("gameId").innerText = "Game ID: " + gameId;
});

socket.on("game_update", ({ players: p, positions: pos, turnIndex }) => {
  players = p;
  positions = pos;
  turn = players[turnIndex];
  document.getElementById("turn").innerText = "Current Turn: " + (turn === playerId ? "Your Turn" : turn);
  renderBoard();
});

socket.on("dice_rolled", ({ value }) => {
  document.getElementById("message").innerText = "Dice Rolled: " + value;
});

socket.on("message", (msg) => {
  document.getElementById("message").innerText = msg;
});

function createGame() {
  socket.emit("create_game");
}

function joinGame() {
  const id = prompt("Enter game code:");
  if (id) {
    socket.emit("join_game", { gameId: id });
  }
}

function rollDice() {
  const gameIdText = document.getElementById("gameId").innerText;
  if (!gameIdText) {
    alert("Create or join a game first!");
    return;
  }
  const gameId = gameIdText.split(": ")[1];
  socket.emit("roll_dice", { gameId });
}

function renderBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  for (let i = totalSquares; i > 0; i--) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.innerText = i;

    if (snakes[i]) cell.classList.add("snake");
    if (ladders[i]) cell.classList.add("ladder");
    if (yellowOdors.includes(i)) cell.classList.add("yellow-odor");
    if (greenOdors.includes(i)) cell.classList.add("green-odor");
    if (mites.includes(i)) cell.classList.add("mite");

    const playersOnCell = Object.entries(positions)
      .filter(([_, pos]) => pos === i)
      .map(([id]) => (id === playerId ? "🪱" : "🧬"));

    if (playersOnCell.length > 0) {
      const playerSpan = document.createElement("div");
      playerSpan.innerText = playersOnCell.join(" ");
      cell.appendChild(playerSpan);
    }

    board.appendChild(cell);
  }
}
