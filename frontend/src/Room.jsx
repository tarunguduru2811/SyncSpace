// frontend/src/Room.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebRTC } from './hooks/useWebRTC';
import VideoPlayer from './components/VideoPlayer';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

export default function Room() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Initialize our custom WebRTC hook!
    const { localStream, remoteStream, toggleAudio, toggleVideo } = useWebRTC(id);

    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const handleToggleAudio = () => {
        toggleAudio();
        setIsAudioMuted(!isAudioMuted);
    };

    const handleToggleVideo = () => {
        toggleVideo();
        setIsVideoOff(!isVideoOff);
    };

    const leaveRoom = () => {
        // Navigating away will unmount the component and automatically trigger the hook's cleanup function
        navigate('/');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '1.5rem' }}>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontWeight: '600' }}>Room: <span style={{ color: 'var(--primary-color)' }}>{id}</span></h2>
            </header>

            {/* Video Grid Layout */}
            <main style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>

                {/* Local Video */}
                <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                    <VideoPlayer stream={localStream} isLocal={true} />
                </div>

                {/* Remote Video */}
                <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                    <VideoPlayer stream={remoteStream} isLocal={false} />
                </div>

            </main>

            {/* Control Bar (Glassmorphism) */}
            <footer style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                <div className="glass-panel" style={{ display: 'inline-flex', gap: '1rem', padding: '1rem 2rem', borderRadius: '3rem' }}>

                    <button
                        className="btn-icon"
                        onClick={handleToggleAudio}
                        style={{ background: isAudioMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: isAudioMuted ? 'var(--danger-color)' : 'white' }}
                    >
                        {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <button
                        className="btn-icon"
                        onClick={handleToggleVideo}
                        style={{ background: isVideoOff ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: isVideoOff ? 'var(--danger-color)' : 'white' }}
                    >
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>

                    <button className="btn-danger" style={{ borderRadius: '3rem', padding: '0.75rem 2rem' }} onClick={leaveRoom}>
                        <PhoneOff size={20} />
                        Leave
                    </button>

                </div>
            </footer>
        </div>
    );
}
