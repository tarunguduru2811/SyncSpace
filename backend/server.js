const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
})

let onlineUsers = {}; // { socketId: username }

io.on("connection", (socket) => {
    console.log(`User Connected : ${socket.id}`);

    // --- LOBBY / DIRECT CALLING EVENTS ---
    socket.on("login", (username) => {
        onlineUsers[socket.id] = username;
        io.emit("online-users", onlineUsers);
        console.log(`${username} logged in. Online:`, Object.keys(onlineUsers).length);
    });

    socket.on("call-user", (data) => {
        // data: { targetId, callerName, callerId }
        io.to(data.targetId).emit("incoming-call", {
            callerName: data.callerName,
            callerId: data.callerId
        });
    });

    socket.on("accept-call", (data) => {
        // data: { callerId, roomId }
        io.to(data.callerId).emit("call-accepted", { roomId: data.roomId });
    });

    socket.on("reject-call", (data) => {
        io.to(data.callerId).emit("call-rejected");
    });

    // --- ROOM / WEBRTC EVENTS ---
    socket.on("join_room", (roomId, userId) => {
        socket.roomId = roomId;
        socket.userId = userId;
        socket.join(roomId);

        console.log(`User ${userId} has joined room ${roomId}`);
        socket.to(roomId).emit("User-connected", userId);
        
        // Remove from online lobby while in a room so they aren't disturbed
        if (onlineUsers[socket.id]) {
            delete onlineUsers[socket.id];
            io.emit("online-users", onlineUsers);
        }
    });

    socket.on("disconnect", () => {
        console.log(`Socket disconnected : ${socket.id}`);
        
        // Lobby Cleanup
        if (onlineUsers[socket.id]) {
            delete onlineUsers[socket.id];
            io.emit("online-users", onlineUsers);
        }

        // Room Cleanup
        if (socket.roomId && socket.userId) {
            socket.to(socket.roomId).emit("User-disconnected", socket.userId);
        }
    });

    //WebRTC Signalling Events
    //These events simply relay the connections data from one peer to another

    //Relay a connection offer
    socket.on("offer", (payload) => {
        io.to(payload.target).emit('offer', payload);
    })

    //Relay an answer
    socket.on("answer", (payload) => {
        io.to(payload.target).emit("answer", payload);
    })

    //Relay ICE candidates 
    socket.on("ice-candidate", (payload) => {
        io.to(payload.target).emit('ice-candidate', payload);
    })

    //Relay peer state changes (mute/video off)
    socket.on("peer-state-change", (payload) => {
        socket.to(payload.roomId).emit("peer-state-change", payload);
    })
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Signaling server running on port: ${PORT}`)
})