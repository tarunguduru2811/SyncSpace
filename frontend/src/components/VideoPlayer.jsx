import { useEffect, useRef } from 'react';
import { MicOff, VideoOff } from 'lucide-react';

export default function VideoPlayer({ stream, isLocal = false, name, isAudioMuted = false, isVideoOff = false }) {
  const videoRef = useRef(null);

  // Whenever the stream changes, attach it to the video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', background: '#000', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', aspectRatio: '16/9' }}>
      
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // CRITICAL: Always mute your own video so you don't hear a feedback echo loop!
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }} // Mirror the local camera like a mirror
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
          {isVideoOff ? (
              <VideoOff size={48} opacity={0.5} />
          ) : (
              'Waiting for connection...'
          )}
        </div>
      )}

      {/* Mute Indicator Overlay */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
          {isAudioMuted && (
              <div style={{ background: 'rgba(239, 68, 68, 0.8)', padding: '0.5rem', borderRadius: '50%', color: 'white', display: 'flex', backdropFilter: 'blur(4px)' }}>
                  <MicOff size={16} />
              </div>
          )}
      </div>
      
      {/* Small badge to identify the user */}
      <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', backdropFilter: 'blur(4px)', color: 'white' }}>
        {name || (isLocal ? 'You' : 'Peer')}
      </div>
    </div>
  );
}
