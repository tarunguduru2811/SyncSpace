// frontend/src/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Keyboard } from 'lucide-react';

export default function Home() {
    const [roomId, setRoomId] = useState('');
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();

    // Handle joining an existing room
    const handleJoin = (e) => {
        e.preventDefault();
        if (roomId.trim()) {
            navigate(`/room/${roomId}`, { state: { userName: userName.trim() || 'Guest' } });
        }
    };

    // Handle creating a new, random room
    const handleCreateRoom = () => {
        const newRoomId = Math.random().toString(36).substring(2, 9);
        navigate(`/room/${newRoomId}`, { state: { userName: userName.trim() || 'Guest' } });
    };

    return (
        <div className="home-container">
            <div className="glass-panel home-panel">

                {/* Trendy Logo/Icon Container */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <img 
                        src="/logo.png" 
                        alt="SyncSpace Logo" 
                        style={{ width: '120px', height: '120px', borderRadius: '2.5rem', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', objectFit: 'cover' }} 
                    />
                </div>

                <h1 className="home-title">
                    SyncSpace
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.1rem', fontWeight: '300' }}>Connect with anyone, anywhere in crystal clear quality.</p>

                {/* Name Input */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="Enter your name..."
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)' }}
                    />
                </div>

                {/* Join Room Form */}
                <form onSubmit={handleJoin} className="join-form">
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                </div>

                {/* Create Room Button */}
                <button onClick={handleCreateRoom} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}>
                    <Video size={20} />
                    New Meeting
                </button>

            </div>
        </div>
    );
}
