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

export function useWebRTC(roomId, userName = 'Guest') {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]); // Array to hold multiple video streams
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenStream, setScreenStream] = useState(null);
    const [peerNames, setPeerNames] = useState({}); // Track names of remote peers
    const [peerStates, setPeerStates] = useState({}); // Track mute/video status of remote peers
    const [messages, setMessages] = useState([]); // Chat messages
    const localMediaState = useRef({ isAudioMuted: false, isVideoOff: false });

    const broadcastState = (isAudioMuted, isVideoOff) => {
        localMediaState.current = { isAudioMuted, isVideoOff };
        if (socketRef.current?.connected) {
            socketRef.current.emit('peer-state-change', {
                roomId,
                userId: socketRef.current.id,
                isAudioMuted,
                isVideoOff
            });
        }
    };

    const socketRef = useRef(null);
    const peersRef = useRef({}); // Dictionary tracking every connection (socketId -> RTCPeerConnection)

    useEffect(() => {
        // Request browser notification permissions
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }

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
                    socketRef.current.emit('offer', { 
                        target: newUserId, 
                        caller: socketRef.current.id, 
                        callerName: userName, 
                        callerState: localMediaState.current,
                        offer 
                    });
                });

                // B. Someone sent us an Offer. Create a connection, accept the offer, and reply with Answer.
                socketRef.current.on('offer', async (payload) => {
                    console.log("Received offer from:", payload.callerName || payload.caller);
                    
                    // Save their name and state
                    setPeerNames(prev => ({ ...prev, [payload.caller]: payload.callerName || 'Peer' }));
                    if (payload.callerState) {
                        setPeerStates(prev => ({ ...prev, [payload.caller]: payload.callerState }));
                    }

                    if (!peersRef.current[payload.caller]) {
                        peersRef.current[payload.caller] = createPeer(payload.caller);
                    }
                    const pc = peersRef.current[payload.caller];

                    await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    
                    socketRef.current.emit('answer', { 
                        target: payload.caller, 
                        sender: socketRef.current.id, 
                        senderName: userName, 
                        senderState: localMediaState.current,
                        answer 
                    });
                });

                // C. Someone replied to our Offer with their Answer. Finalize their connection.
                socketRef.current.on('answer', async (payload) => {
                    console.log("Received answer from:", payload.senderName || payload.sender);
                    
                    // Save their name and state
                    setPeerNames(prev => ({ ...prev, [payload.sender]: payload.senderName || 'Peer' }));
                    if (payload.senderState) {
                        setPeerStates(prev => ({ ...prev, [payload.sender]: payload.senderState }));
                    }

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

                // E. Listen for mute/video state changes mid-call
                socketRef.current.on('peer-state-change', (payload) => {
                    setPeerStates(prev => ({
                        ...prev,
                        [payload.userId]: {
                            isAudioMuted: payload.isAudioMuted,
                            isVideoOff: payload.isVideoOff
                        }
                    }));
                });

                // F. Listen for Chat Messages
                socketRef.current.on('receive-message', (messageData) => {
                    setMessages(prev => [...prev, messageData]);
                    
                    // Show browser notification if tab is hidden
                    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
                        new Notification(`New message from ${messageData.sender}`, {
                            body: messageData.text,
                            icon: '/logo.png'
                        });
                    }
                });

                // G. Cleanup when someone leaves the room
                socketRef.current.on('User-disconnected', (userId) => {
                    console.log("User disconnected:", userId);
                    if (peersRef.current[userId]) {
                        peersRef.current[userId].close(); // Close the specific WebRTC connection
                        delete peersRef.current[userId]; // Remove from dictionary
                    }
                    // Remove their video and name
                    setRemoteStreams((prev) => prev.filter(streamObj => streamObj.id !== userId));
                    setPeerNames(prev => {
                        const newNames = { ...prev };
                        delete newNames[userId];
                        return newNames;
                    });
                    setPeerStates(prev => {
                        const newStates = { ...prev };
                        delete newStates[userId];
                        return newStates;
                    });
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

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            // Stop sharing
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
            setIsScreenSharing(false);

            // Revert back to local camera track for all peers
            const videoTrack = localStream.getVideoTracks()[0];
            Object.values(peersRef.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender && videoTrack) sender.replaceTrack(videoTrack);
            });
        } else {
            // Start sharing
            try {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                setScreenStream(displayStream);
                setIsScreenSharing(true);

                const screenTrack = displayStream.getVideoTracks()[0];

                // Listen for native "Stop Sharing" button in browser UI
                screenTrack.onended = () => {
                    setScreenStream(null);
                    setIsScreenSharing(false);
                    const videoTrack = localStream?.getVideoTracks()[0];
                    Object.values(peersRef.current).forEach(pc => {
                        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                        if (sender && videoTrack) sender.replaceTrack(videoTrack);
                    });
                };

                // Replace video track for all active peer connections
                Object.values(peersRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                });
            } catch (err) {
                console.error("Error sharing screen", err);
            }
        }
    };

    const sendMessage = (text) => {
        if (socketRef.current?.connected && text.trim()) {
            const messageData = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                sender: userName,
                text: text.trim(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            // Send to peers
            socketRef.current.emit('send-message', roomId, messageData);
            // Add locally
            setMessages(prev => [...prev, messageData]);
        }
    };

    return { localStream, remoteStreams, toggleAudio, toggleVideo, isScreenSharing, screenStream, toggleScreenShare, peerNames, peerStates, broadcastState, messages, sendMessage };
}
