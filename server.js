const express = require("express");
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

// LowDB
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const adapter = new JSONFile("db.json");
const db = new Low(adapter, { messages: [] });

async function initDB() {
    await db.read();
    db.data ||= { messages: [] };
    await db.write();
}
initDB();

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// 🔐 CHANGE IF YOU WANT
const ROOM_ID = "13022026";
const PASSWORD = "english";

let users = {};
let lastSeen = {};

io.on("connection", (socket) => {

    socket.on("join", async ({ name, room, password }) => {

        if (!name || room !== ROOM_ID || password !== PASSWORD) {
            socket.emit("errorMsg", "Wrong Room/Password or Name missing");
            return;
        }

        socket.join(room);
        socket.name = name.trim();
        socket.room = room;

        users[socket.id] = socket.name;

        await db.read();
        const oldMessages = db.data.messages.filter(m => m.room === room);
        socket.emit("loadMessages", oldMessages);

        io.to(room).emit("users", Object.values(users));
        io.to(room).emit("status", { text: "Online" });
    });

    socket.on("chat message", async (msg) => {
        if (!socket.name) return;

        const messageData = {
            text: msg,
            sender: socket.name,
            room: socket.room,
            time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        await db.read();
        db.data.messages.push(messageData);
        await db.write();

        io.to(socket.room).emit("chat message", messageData);
    });

    socket.on("disconnect", () => {
        if (socket.name) {
            lastSeen[socket.name] = new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });

            delete users[socket.id];

            io.emit("users", Object.values(users));

            io.emit("status", {
                text: "Last seen at " + lastSeen[socket.name]
            });
        }
    });

});

http.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});