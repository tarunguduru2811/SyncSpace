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
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '500px', textAlign: 'center' }}>

                {/* Logo/Icon Container */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--primary-color)', padding: '1rem', borderRadius: '1rem', display: 'inline-flex', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)' }}>
                        <Video size={40} color="white" />
                    </div>
                </div>

                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: '700' }}>Premium Video Calls</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Connect with anyone, anywhere in crystal clear quality.</p>

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
                <form onSubmit={handleJoin} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
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
