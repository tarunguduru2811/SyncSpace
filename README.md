# SyncSpace

A modern, real-time group video calling application built from scratch to demonstrate the power of WebRTC Mesh Networking and Socket.io signaling. 

The application features a premium "glassmorphism" aesthetic, dynamic video grid layouts, and supports multiple concurrent users in a single room.

## ✨ Features

- **Mesh Networking**: Fully supports group calls (3+ peers) by dynamically creating individual 1-to-1 WebRTC connections between every user in the room.
- **Live Screen Sharing**: Share your screen with the room natively. Replaces your camera track across all active peer connections without dropping the call.
- **Dynamic Grid Layout & Pinning**: Automatically resizes videos based on the number of participants. Click on any user to pin them to the main stage, shrinking other users into a scrollable thumbnail gallery.
- **Real-Time Mute Indicators**: Broadcasts your audio/video toggle states via Socket.io so other users can see if you intentionally muted your microphone or turned off your camera.
- **Custom Usernames**: Enter your name before joining; your name is securely passed through the WebRTC handshake payloads to identify you on everyone's screen.
- **Premium UI**: Designed with modern CSS, featuring glass panels, smooth micro-animations, and a responsive layout.

## 🛠️ Technology Stack

- **Frontend**: React, Vite, CSS (Glassmorphism), Lucide-React (Icons)
- **Backend**: Node.js, Express.js
- **Signaling**: Socket.io (WebSockets)
- **Real-Time Media**: WebRTC (`RTCPeerConnection`, `getUserMedia`, `getDisplayMedia`)

## 🚀 How to Run Locally

Because the application is split into a frontend and a backend, you will need to run two separate servers.

### 1. Start the Signaling Server (Backend)
Open a terminal and navigate to the backend folder:
```bash
cd backend
npm install
npm start
```
*The signaling server will start on `http://localhost:5000`.*

### 2. Start the React App (Frontend)
Open a new, separate terminal and navigate to the frontend folder:
```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` folder to point the React app to your backend:
```env
VITE_BACKEND_URL=http://localhost:5000
```

Start the Vite development server:
```bash
npm run dev
```

### 3. Test it out!
Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`). Enter a username, create a room, and share the room URL to open in a different browser window to see the WebRTC connection in action!
