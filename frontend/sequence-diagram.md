# WebRTC Peer-to-Peer Connection Flow

```mermaid
sequenceDiagram
    participant A as User A (Browser)
    participant S as Server (Node.js)
    participant B as User B (Browser)

    Note over A: 1. A opens /room/123
    A->>A: navigator.mediaDevices.getUserMedia()
    A->>S: Socket connect
    A->>S: emit('join_room', '123', A_id)

    Note over B: 2. B opens /room/123
    B->>B: navigator.mediaDevices.getUserMedia()
    B->>S: Socket connect
    B->>S: emit('join_room', '123', B_id)

    Note over S: 3. Server alerts A
    S->>A: emit('User-connected', B_id)

    Note over A: 4. The Handshake (Offer/Answer)
    A->>A: pc.createOffer()
    A->>S: emit('offer', offer_data)
    S->>B: emit('offer', offer_data)

    B->>B: pc.setRemoteDescription(offer)
    B->>B: pc.createAnswer()
    B->>S: emit('answer', answer_data)
    S->>A: emit('answer', answer_data)

    A->>A: pc.setRemoteDescription(answer)

    Note over A,B: 5. Network Routing (ICE Candidates)
    A->>S: emit('ice-candidate')
    S->>B: emit('ice-candidate')
    B->>S: emit('ice-candidate')
    S->>A: emit('ice-candidate')

    Note over A,B: 6. Direct P2P Connection Established!
    A->>A: pc.ontrack (Receives B's Video)
    B->>B: pc.ontrack (Receives A's Video)
