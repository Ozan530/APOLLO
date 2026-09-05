const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static("public"));

const players = {};

const COLORS = [
    "#e53935",
    "#1976d2",
    "#43a047",
    "#fbc02d",
    "#8e24aa",
    "#fb8c00",
    "#00acc1",
    "#f06292",
    "#6d4c41",
    "#546e7a"
];

const MAP = {
    width: 1600,
    height: 900
};

function randomColor() {
    const used = Object.values(players).map(p => p.color);
    const available = COLORS.filter(c => !used.includes(c));

    if (available.length > 0) {
        return available[Math.floor(Math.random() * available.length)];
    }

    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function randomSpawn() {
    return {
        x: 150 + Math.random() * 1300,
        y: 150 + Math.random() * 600
    };
}

io.on("connection", socket => {

    console.log("Oyuncu bağlandı:", socket.id);

    const spawn = randomSpawn();

    players[socket.id] = {
        id: socket.id,
        name: "Player",
        x: spawn.x,
        y: spawn.y,
        color: randomColor()
    };

    socket.emit("init", {
        id: socket.id,
        players,
        map: MAP
    });

    socket.broadcast.emit("playerJoined", players[socket.id]);

    socket.on("setName", name => {

        if (!players[socket.id]) return;

        name = String(name || "Player")
            .replace(/[<>]/g, "")
            .slice(0, 16);

        if (!name.trim()) {
            name = "Player";
        }

        players[socket.id].name = name;

        io.emit("playerUpdated", players[socket.id]);
    });

    socket.on("move", data => {

        const player = players[socket.id];

        if (!player) return;

        let x = Number(data.x);
        let y = Number(data.y);

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return;
        }

        // Hileyle haritanın dışına çıkmayı engelle
        x = Math.max(30, Math.min(MAP.width - 30, x));
        y = Math.max(30, Math.min(MAP.height - 30, y));

        player.x = x;
        player.y = y;

        socket.broadcast.emit("playerMoved", {
            id: socket.id,
            x,
            y
        });
    });

    socket.on("chat", message => {

        if (!players[socket.id]) return;

        message = String(message || "")
            .replace(/[<>]/g, "")
            .slice(0, 120);

        if (!message.trim()) return;

        io.emit("chat", {
            id: socket.id,
            name: players[socket.id].name,
            color: players[socket.id].color,
            message
        });
    });

    socket.on("disconnect", () => {

        console.log("Oyuncu ayrıldı:", socket.id);

        delete players[socket.id];

        io.emit("playerLeft", socket.id);
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("==================================");
    console.log("       AMOGUS MULTIPLAYER");
    console.log("==================================");
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
    console.log("==================================");
    console.log("");
});
