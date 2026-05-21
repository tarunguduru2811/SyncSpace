// frontend/src/hooks/useWebRTC.js
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Public STUN servers
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export function useWebRTC(roomId) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]); // Array to hold multiple video streams

    const socketRef = useRef(null);
    const peersRef = useRef({}); // Dictionary tracking every connection (socketId -> RTCPeerConnection)

    useEffect(() => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        socketRef.current = io(backendUrl);

        const startConnection = async () => {
            try {
                // 1. Get Camera/Mic
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);

                // Helper function to create a new WebRTC connection for a specific user
                const createPeer = (userId) => {
                    const pc = new RTCPeerConnection(ICE_SERVERS);
                    
                    // Give them our video/audio
                    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

                    // When they give us their video, add it to our array
                    pc.ontrack = (event) => {
                        console.log("Received remote track from:", userId);
                        setRemoteStreams((prevStreams) => {
                            // Avoid adding duplicates if the event fires twice for audio/video
                            if (prevStreams.some(s => s.id === userId)) return prevStreams;
                            return [...prevStreams, { id: userId, stream: event.streams[0] }];
                        });
                    };

                    // Send them our network routing info
                    pc.onicecandidate = (event) => {
                        if (event.candidate) {
                            // Now we send ICE candidates directly to the specific user!
                            socketRef.current.emit('ice-candidate', {
                                target: userId,
                                sender: socketRef.current.id,
                                candidate: event.candidate,
                            });
                        }
                    };

                    return pc;
                };

                // --- 2. Mesh Networking Signaling Events ---

                // A. A new user enters. Create a connection, generate an Offer, and send it to them.
                socketRef.current.on('User-connected', async (newUserId) => {
                    console.log("A new user joined the room:", newUserId);
                    const pc = createPeer(newUserId);
                    peersRef.current[newUserId] = pc; // Store in our dictionary

                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socketRef.current.emit('offer', { target: newUserId, caller: socketRef.current.id, offer });
                });

                // B. Someone sent us an Offer. Create a connection, accept the offer, and reply with Answer.
                socketRef.current.on('offer', async (payload) => {
                    console.log("Received offer from:", payload.caller);
                    
                    if (!peersRef.current[payload.caller]) {
                        peersRef.current[payload.caller] = createPeer(payload.caller);
                    }
                    const pc = peersRef.current[payload.caller];

                    await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    
                    socketRef.current.emit('answer', { target: payload.caller, sender: socketRef.current.id, answer });
                });

                // C. Someone replied to our Offer with their Answer. Finalize their connection.
                socketRef.current.on('answer', async (payload) => {
                    console.log("Received answer from:", payload.sender);
                    const pc = peersRef.current[payload.sender];
                    if (pc) {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
                    }
                });

                // D. We received network routing info (ICE Candidate) from someone. Add it to their connection.
                socketRef.current.on('ice-candidate', async (payload) => {
                    const pc = peersRef.current[payload.sender];
                    if (pc) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                        } catch (e) {
                            console.error('Error adding ICE candidate', e);
                        }
                    }
                });

                // E. Cleanup when someone leaves the room
                socketRef.current.on('User-disconnected', (userId) => {
                    console.log("User disconnected:", userId);
                    if (peersRef.current[userId]) {
                        peersRef.current[userId].close(); // Close the specific WebRTC connection
                        delete peersRef.current[userId]; // Remove from dictionary
                    }
                    // Remove their video from the screen
                    setRemoteStreams((prev) => prev.filter(streamObj => streamObj.id !== userId));
                });

                // Finally, tell the server we are ready
                if (socketRef.current.connected) {
                    socketRef.current.emit('join_room', roomId, socketRef.current.id);
                } else {
                    socketRef.current.on('connect', () => {
                        socketRef.current.emit('join_room', roomId, socketRef.current.id);
                    });
                }

            } catch (err) {
                console.error("Error accessing media devices", err);
            }
        };

        startConnection();

        // Global cleanup when WE leave the page
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            // Loop through all our connections and close them
            Object.values(peersRef.current).forEach(pc => pc.close());
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomId]);

    const toggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            return audioTrack.enabled;
        }
        return false;
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            return videoTrack.enabled;
        }
        return false;
    };

    return { localStream, remoteStreams, toggleAudio, toggleVideo };
}
