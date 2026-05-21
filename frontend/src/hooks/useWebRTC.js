// frontend/src/hooks/useWebRTC.js
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Public STUN servers provided by Google to help peers discover their public IP addresses
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export function useWebRTC(roomId) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const socketRef = useRef(null);
    const peerConnectionRef = useRef(null);

    useEffect(() => {
        // 1. Connect to our signaling server
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        socketRef.current = io(backendUrl);

        const startConnection = async () => {
            try {
                // 2. Request access to Camera and Microphone
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);

                // 3. Initialize the Peer Connection
                const pc = new RTCPeerConnection(ICE_SERVERS);
                peerConnectionRef.current = pc;

                // Add our local audio/video tracks to the connection
                stream.getTracks().forEach((track) => {
                    pc.addTrack(track, stream);
                });

                // When we receive tracks from the other peer, save them to state
                pc.ontrack = (event) => {
                    console.log("Received remote track!");
                    setRemoteStream(event.streams[0]);
                };

                // When our browser finds a new network path (ICE Candidate), send it to the room
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socketRef.current.emit('ice-candidate', {
                            target: roomId,
                            sender: socketRef.current.id, // Identify ourselves so we don't process our own candidates
                            candidate: event.candidate,
                        });
                    }
                };

                // --- 4. Signaling Event Listeners ---

                // A. When someone joins, create an Offer and send it directly to them
                socketRef.current.on('User-connected', async (newUserId) => {
                    console.log("A new user connected:", newUserId);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    console.log("Sending offer to:", newUserId);
                    // Send offer to the new user, and tell them who we are
                    socketRef.current.emit('offer', { target: newUserId, caller: socketRef.current.id, offer });
                });

                // B. When we receive an Offer, accept it and reply with an Answer
                socketRef.current.on('offer', async (payload) => {
                    console.log("Received offer from:", payload.caller);
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    console.log("Sending answer to:", payload.caller);
                    // Send answer back to the caller
                    socketRef.current.emit('answer', { target: payload.caller, answer });
                });

                // C. When we receive an Answer, finalize the connection
                socketRef.current.on('answer', async (payload) => {
                    console.log("Received answer, setting remote description");
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
                });

                // D. When we receive an ICE candidate from the other peer, add it
                socketRef.current.on('ice-candidate', async (payload) => {
                    // Ignore our own candidates that the server broadcasted
                    if (payload.sender !== socketRef.current.id) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                        } catch (e) {
                            console.error('Error adding ICE candidate', e);
                        }
                    }
                });

                // Finally, tell the server we are ready and have joined the room!
                if (socketRef.current.connected) {
                    console.log("Joining room with ID:", socketRef.current.id);
                    socketRef.current.emit('join_room', roomId, socketRef.current.id);
                } else {
                    socketRef.current.on('connect', () => {
                        console.log("Socket connected, joining room with ID:", socketRef.current.id);
                        socketRef.current.emit('join_room', roomId, socketRef.current.id);
                    });
                }

            } catch (err) {
                console.error("Error accessing media devices", err);
            }
        };

        startConnection();

        // Cleanup function when we leave the page
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomId]);

    // Expose helpful functions to toggle media on/off
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

    return { localStream, remoteStream, toggleAudio, toggleVideo };
}
