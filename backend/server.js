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

io.on("connection", (socket) => {
    console.log(`User Connected : ${socket.id}`);

    //1.User wants to join a specific room
    socket.on("join_room", (roomId, userId) => {
        socket.join(roomId);

        console.log(`User ${userId} has joined room ${roomId}`);

        //Tell everyone else in that room that a new person has joined
        socket.to(roomId).emit("User-connected", userId);

        //2.Handle when this user disconnects
        socket.on("disconnect", () => {
            console.log(`User disconnected : ${userId}`);
            socket.to(roomId).emit("User-disconnected", userId);
        })
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
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Signaling server running on port: ${PORT}`)
})