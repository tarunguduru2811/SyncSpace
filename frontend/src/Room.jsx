// frontend/src/Room.jsx
import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWebRTC } from './hooks/useWebRTC';
import VideoPlayer from './components/VideoPlayer';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, MonitorOff, Copy, Check } from 'lucide-react';

export default function Room() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const userName = location.state?.userName || 'Guest';

    // Initialize our custom WebRTC hook!
    const { localStream, remoteStreams, toggleAudio, toggleVideo, isScreenSharing, screenStream, toggleScreenShare, peerNames, peerStates, broadcastState } = useWebRTC(id, userName);

    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [pinnedStreamId, setPinnedStreamId] = useState(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleToggleAudio = () => {
        const newState = !isAudioMuted;
        toggleAudio();
        setIsAudioMuted(newState);
        broadcastState(newState, isVideoOff);
    };

    const handleToggleVideo = () => {
        const newState = !isVideoOff;
        toggleVideo();
        setIsVideoOff(newState);
        broadcastState(isAudioMuted, newState);
    };

    const leaveRoom = () => {
        // Navigating away will unmount the component and automatically trigger the hook's cleanup function
        navigate('/');
    };

    // Combine local and remote streams into a single array for easier rendering
    const allStreams = [
        { 
            id: 'local', 
            stream: isScreenSharing ? screenStream : localStream, 
            isLocal: true, // Always mute local video (even screen share) to prevent echo
            isMirrored: !isScreenSharing, // Only mirror the camera, never the screen share
            name: userName + (isScreenSharing ? "'s Screen" : ' (You)'),
            isAudioMuted,
            isVideoOff
        },
        ...remoteStreams.map(rs => {
            const state = peerStates[rs.id] || { isAudioMuted: false, isVideoOff: false };
            return { 
                id: rs.id, 
                stream: rs.stream, 
                isLocal: false, 
                name: peerNames[rs.id] || 'Peer',
                isAudioMuted: state.isAudioMuted,
                isVideoOff: state.isVideoOff
            };
        })
    ];

    const pinnedStream = pinnedStreamId ? allStreams.find(s => s.id === pinnedStreamId) : null;
    const unpinnedStreams = pinnedStream ? allStreams.filter(s => s.id !== pinnedStreamId) : allStreams;

    return (
        <div className="room-container">

            {/* Header */}
            <header className="room-header">
                <div className="room-header-brand">
                    <img src="/logo.png" alt="SyncSpace Logo" className="room-logo" />
                    <h2 className="room-title">SyncSpace</h2>
                </div>
                
                <div className="room-header-info">
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Room: <span style={{ color: 'var(--primary-color)' }}>{id}</span>
                        <button 
                            onClick={handleCopyLink}
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: isCopied ? '#10b981' : 'var(--text-secondary)', 
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px'
                            }}
                            title="Copy Invite Link"
                        >
                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </span>
                </div>
                {pinnedStream && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', width: '100%', textAlign: 'center' }}>Click the large video to unpin</span>
                )}
            </header>

            {/* Video Layout */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', height: '100%' }}>
                
                {pinnedStream ? (
                    <>
                        {/* Pinned Video (Large) */}
                        <div 
                            style={{ flex: 1, display: 'flex', justifyContent: 'center', cursor: 'pointer' }}
                            onClick={() => setPinnedStreamId(null)}
                            title="Click to unpin"
                        >
                            <div style={{ width: '100%', maxWidth: '1200px' }}>
                                <VideoPlayer stream={pinnedStream.stream} isLocal={pinnedStream.isLocal} isMirrored={pinnedStream.isMirrored} name={pinnedStream.name} isAudioMuted={pinnedStream.isAudioMuted} isVideoOff={pinnedStream.isVideoOff} />
                            </div>
                        </div>

                        {/* Thumbnail Grid */}
                        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '1rem 0', justifyContent: 'center' }}>
                            {unpinnedStreams.map((peer) => (
                                <div 
                                    key={peer.id} 
                                    style={{ width: '250px', flexShrink: 0, cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.2s', transform: 'scale(0.95)' }}
                                    onClick={() => setPinnedStreamId(peer.id)}
                                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.transform = 'scale(0.95)'; }}
                                    title="Click to pin"
                                >
                                    <VideoPlayer stream={peer.stream} isLocal={peer.isLocal} isMirrored={peer.isMirrored} name={peer.name} isAudioMuted={peer.isAudioMuted} isVideoOff={peer.isVideoOff} />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    /* Standard Grid Layout */
                    <div className="video-grid">
                        {allStreams.map((peer) => (
                            <div 
                                key={peer.id} 
                                style={{ width: '100%', maxWidth: '800px', margin: '0 auto', cursor: 'pointer', transition: 'transform 0.2s' }}
                                onClick={() => setPinnedStreamId(peer.id)}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                title="Click to pin"
                            >
                                <VideoPlayer stream={peer.stream} isLocal={peer.isLocal} isMirrored={peer.isMirrored} name={peer.name} isAudioMuted={peer.isAudioMuted} isVideoOff={peer.isVideoOff} />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Control Bar (Glassmorphism) */}
            <footer style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                <div className="glass-panel control-bar-inner">

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

                    <button
                        className="btn-icon"
                        onClick={toggleScreenShare}
                        style={{ background: isScreenSharing ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: isScreenSharing ? 'var(--primary-color)' : 'white' }}
                    >
                        {isScreenSharing ? <MonitorOff size={24} /> : <MonitorUp size={24} />}
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
