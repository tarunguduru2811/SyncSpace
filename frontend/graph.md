### Visualizing the Mesh

```mermaid
graph TD
    subgraph "The Mesh Network (Direct Video/Audio)"
        Alice <-->|PeerConnection 1| Bob
        Bob <-->|PeerConnection 2| Charlie
        Charlie <-->|PeerConnection 3| Alice
    end
    
    subgraph "The Signaling Server (Only used for handshakes)"
        Alice -.->|Socket.io| Server
        Bob -.->|Socket.io| Server
        Charlie -.->|Socket.io| Server
    end
