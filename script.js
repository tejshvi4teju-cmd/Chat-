const socket = io();

let name = (localStorage.getItem("name") || "").trim();
const room = (localStorage.getItem("room") || "").trim();
const password = (localStorage.getItem("password") || "").trim();

if (!name) {
    alert("Login again");
    window.location.href = "/";
}

socket.emit("join", { name, room, password });

socket.on("errorMsg", () => {
    alert("Wrong password/room");
    window.location.href = "/";
});

socket.on("loadMessages", (messages) => {
    messages.forEach(addMessage);
});

function send() {
    const input = document.getElementById("msg");
    const text = input.value.trim();
    if (!text) return;

    socket.emit("chat message", text);
    input.value = "";
}

socket.on("chat message", (msg) => {
    addMessage(msg);
});

function addMessage(msg) {
    const li = document.createElement("li");
    li.classList.add("message");

    const sender = (msg.sender || "").trim();

    if (sender === name) {
        li.classList.add("me");
    } else {
        li.classList.add("other");
    }

    li.innerHTML = `
        <div class="sender">${sender}</div>
        <div>${msg.text}</div>
        <div class="time">${msg.time}</div>
    `;

    document.getElementById("messages").appendChild(li);
    autoScroll();
}

socket.on("users", (users) => {
    document.getElementById("users").innerText = "Online: " + users.join(", ");
});

socket.on("status", (data) => {
    document.getElementById("status").innerText = data.text;
});

function autoScroll() {
    const box = document.getElementById("messages");
    box.scrollTop = box.scrollHeight;
}