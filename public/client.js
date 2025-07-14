const socket = io();

socket.on("game_created", ({ gameId }) => {
  document.getElementById("gameId").innerText = "Game ID: " + gameId;
});

socket.on("game_update", ({ players, positions, turnIndex }) => {
  document.getElementById("state").innerText = JSON.stringify({ players, positions }, null, 2);
  document.getElementById("turn").innerText = "Current Turn: " + players[turnIndex];
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
