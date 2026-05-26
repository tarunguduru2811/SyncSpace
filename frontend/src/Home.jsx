// frontend/src/Home.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Keyboard, Phone, User, Check, X } from 'lucide-react';
import { io } from 'socket.io-client';

export default function Home() {
    const [userName, setUserName] = useState('');
    const [isOnline, setIsOnline] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState({});
    
    // Call states
    const [incomingCall, setIncomingCall] = useState(null); // { callerName, callerId }
    const [outgoingCall, setOutgoingCall] = useState(null); // { targetName }
    
    // Room entry
    const [roomId, setRoomId] = useState('');
    
    const navigate = useNavigate();
    const socketRef = useRef(null);

    // Initialize lobby socket
    useEffect(() => {
        if (isOnline) {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            socketRef.current = io(backendUrl);
            
            socketRef.current.on('connect', () => {
                socketRef.current.emit('login', userName);
            });

            socketRef.current.on('online-users', (users) => {
                // Filter out ourselves
                const others = { ...users };
                delete others[socketRef.current.id];
                setOnlineUsers(others);
            });

            // Handle receiving a call
            socketRef.current.on('incoming-call', (data) => {
                setIncomingCall(data);
            });

            // Handle when someone accepts our call
            socketRef.current.on('call-accepted', (data) => {
                // Navigate to the newly generated room
                socketRef.current.disconnect();
                navigate(`/room/${data.roomId}`, { state: { userName } });
            });

            // Handle when someone rejects our call
            socketRef.current.on('call-rejected', () => {
                setOutgoingCall(null);
                alert("Call was declined.");
            });

            return () => {
                socketRef.current.disconnect();
            };
        }
    }, [isOnline, userName, navigate]);

    // Handle initiating a call to a specific user
    const handleCallUser = (targetId, targetName) => {
        if (socketRef.current) {
            socketRef.current.emit('call-user', { 
                targetId, 
                callerName: userName, 
                callerId: socketRef.current.id 
            });
            setOutgoingCall({ targetName });
        }
    };

    // Handle accepting an incoming call
    const acceptCall = () => {
        if (socketRef.current && incomingCall) {
            const newRoomId = Math.random().toString(36).substring(2, 9); // Generate a unique room for the call
            socketRef.current.emit('accept-call', { 
                callerId: incomingCall.callerId, 
                roomId: newRoomId 
            });
            
            socketRef.current.disconnect();
            navigate(`/room/${newRoomId}`, { state: { userName } });
        }
    };

    // Handle rejecting an incoming call
    const rejectCall = () => {
        if (socketRef.current && incomingCall) {
            socketRef.current.emit('reject-call', { callerId: incomingCall.callerId });
            setIncomingCall(null);
        }
    };

    // Manual Room Entry
    const handleJoin = (e) => {
        e.preventDefault();
        if (roomId.trim()) {
            if (socketRef.current) socketRef.current.disconnect();
            navigate(`/room/${roomId}`, { state: { userName: userName.trim() || 'Guest' } });
        }
    };

    const handleCreateRoom = () => {
        const newRoomId = Math.random().toString(36).substring(2, 9);
        if (socketRef.current) socketRef.current.disconnect();
        navigate(`/room/${newRoomId}`, { state: { userName: userName.trim() || 'Guest' } });
    };

    return (
        <div className="home-container">
            <div className="glass-panel home-panel" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <img src="/logo.png" alt="SyncSpace Logo" style={{ width: '100px', height: '100px', borderRadius: '2rem', objectFit: 'cover' }} />
                </div>
                <h1 className="home-title" style={{ fontSize: '2.5rem' }}>SyncSpace</h1>
                
                {!isOnline ? (
                    // STEP 1: LOGIN
                    <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Enter your name to join the lobby.</p>
                        <form onSubmit={(e) => { e.preventDefault(); if (userName.trim()) setIsOnline(true); }}>
                            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    style={{ paddingLeft: '3rem', textAlign: 'left' }}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                                Go Online
                            </button>
                        </form>
                    </div>
                ) : (
                    // STEP 2: LOBBY
                    <div>
                        <p style={{ color: '#10b981', fontWeight: '500', marginBottom: '1.5rem' }}>
                            <span className="status-dot" style={{ display: 'inline-block', marginRight: '8px' }}></span>
                            Online as {userName}
                        </p>

                        {/* Online Users List */}
                        <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Active Users ({Object.keys(onlineUsers).length})</h3>
                            {Object.keys(onlineUsers).length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem 0' }}>No one else is online right now.</p>
                            ) : (
                                <div className="online-users-list">
                                    {Object.entries(onlineUsers).map(([socketId, name]) => (
                                        <div key={socketId} className="user-item">
                                            <div className="user-name-display">
                                                <div className="status-dot"></div>
                                                {name}
                                            </div>
                                            <button 
                                                onClick={() => handleCallUser(socketId, name)}
                                                className="btn-primary btn-small"
                                                style={{ padding: '0.4rem 1rem' }}
                                            >
                                                <Phone size={14} /> Call
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>or use a code</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                        </div>

                        {/* Join Room Form */}
                        <form onSubmit={handleJoin} className="join-form" style={{ marginBottom: '1rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Keyboard size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    placeholder="Enter a room code"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    style={{ paddingLeft: '3rem' }}
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={!roomId.trim()}>
                                Join
                            </button>
                        </form>

                        <button onClick={handleCreateRoom} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}>
                            <Video size={20} />
                            New Empty Meeting
                        </button>
                    </div>
                )}
            </div>

            {/* Outgoing Call Modal */}
            {outgoingCall && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ width: '60px', height: '60px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary-color)' }}>
                            <Phone size={30} style={{ animation: 'modalPop 1s infinite alternate' }} />
                        </div>
                        <h2 className="modal-title">Calling {outgoingCall.targetName}...</h2>
                        <p className="modal-subtitle">Waiting for them to answer</p>
                        <button className="btn-danger" onClick={() => setOutgoingCall(null)} style={{ width: '100%' }}>
                            <X size={18} /> Cancel Call
                        </button>
                    </div>
                </div>
            )}

            {/* Incoming Call Modal */}
            {incomingCall && !outgoingCall && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#10b981' }}>
                            <Phone size={30} style={{ animation: 'modalPop 0.5s infinite alternate' }} />
                        </div>
                        <h2 className="modal-title">{incomingCall.callerName}</h2>
                        <p className="modal-subtitle">is calling you</p>
                        <div className="modal-actions">
                            <button className="btn-danger" onClick={rejectCall} style={{ flex: 1 }}>
                                <X size={18} /> Decline
                            </button>
                            <button className="btn-success" onClick={acceptCall} style={{ flex: 1 }}>
                                <Check size={18} /> Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
