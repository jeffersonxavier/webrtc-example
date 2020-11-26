console.log('Main JS!');

// Map All HTML Elements
const videoGrid = document.getElementById('video-grid');
const messagesEl = document.querySelector('.messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('message-button');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');

const logMessage = (message) => {
  const newMessage = document.createElement('div');
  newMessage.innerText = message;
  messagesEl.appendChild(newMessage);
};

// Open Camera To Capture Audio and Video
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    // Show My Video
    videoGrid.style.display = 'grid';
    localVideo.srcObject = stream;

    // Start a Peer Connection to Transmit Stream
    initConnection(stream);
  })
  .catch(error => console.log(error));

const initConnection = (stream) => {
  const socket = io('/');
  let localConnection;
  let remoteConnection;
  let localChannel;
  let remoteChannel;

  // Start a RTCPeerConnection to each client
  socket.on('other-users', (otherUsers) => {
    // Ignore when not exists other users connected
    if (!otherUsers || !otherUsers.length) return;

    const socketId = otherUsers[0];

    // Ininit peer connection
    localConnection = new RTCPeerConnection();

    // Add all tracks from stream to peer connection
    stream.getTracks().forEach(track => localConnection.addTrack(track, stream));

    // Send Candidtates to establish a channel communication to send stream and data
    localConnection.onicecandidate = ({ candidate }) => {
      candidate && socket.emit('candidate', socketId, candidate);
    };
  
    // Receive stream from remote client and add to remote video area
    localConnection.ontrack = ({ streams: [ stream ] }) => {
      remoteVideo.srcObject = stream;
    };

    // Start the channel to chat
    localChannel = localConnection.createDataChannel('chat_channel');

    // Function Called When Receive Message in Channel
    localChannel.onmessage = (event) => logMessage(`Receive: ${event.data}`);
    // Function Called When Channel is Opened
    localChannel.onopen = (event) => logMessage(`Channel Changed: ${event.type}`);
    // Function Called When Channel is Closed
    localChannel.onclose = (event) => logMessage(`Channel Changed: ${event.type}`);

    // Create Offer, Set Local Description and Send Offer to other users connected
    localConnection
      .createOffer()
      .then(offer => localConnection.setLocalDescription(offer))
      .then(() => {
        socket.emit('offer', socketId, localConnection.localDescription);
      });
  });

  // Receive Offer From Other Client
  socket.on('offer', (socketId, description) => {
    // Ininit peer connection
    remoteConnection = new RTCPeerConnection();

    // Add all tracks from stream to peer connection
    stream.getTracks().forEach(track => remoteConnection.addTrack(track, stream));

    // Send Candidtates to establish a channel communication to send stream and data
    remoteConnection.onicecandidate = ({ candidate }) => {
      candidate && socket.emit('candidate', socketId, candidate);
    };
  
    // Receive stream from remote client and add to remote video area
    remoteConnection.ontrack = ({ streams: [ stream ] }) => {
      remoteVideo.srcObject = stream;
    };

    // Chanel Received
    remoteConnection.ondatachannel = ({ channel }) => {
      // Store Channel
      remoteChannel = channel;

      // Function Called When Receive Message in Channel
      remoteChannel.onmessage = (event) => logMessage(`Receive: ${event.data}`);
      // Function Called When Channel is Opened
      remoteChannel.onopen = (event) => logMessage(`Channel Changed: ${event.type}`);
      // Function Called When Channel is Closed
      remoteChannel.onclose = (event) => logMessage(`Channel Changed: ${event.type}`);
    }

    // Set Local And Remote description and create answer
    remoteConnection
      .setRemoteDescription(description)
      .then(() => remoteConnection.createAnswer())
      .then(answer => remoteConnection.setLocalDescription(answer))
      .then(() => {
        socket.emit('answer', socketId, remoteConnection.localDescription);
      });
  });

  // Receive Answer to establish peer connection
  socket.on('answer', (description) => {
    localConnection.setRemoteDescription(description);
  });

  // Receive candidates and add to peer connection
  socket.on('candidate', (candidate) => {
    // GET Local or Remote Connection
    const conn = localConnection || remoteConnection;
    conn.addIceCandidate(new RTCIceCandidate(candidate));
  });

  // Map the 'message-button' click
  sendButton.addEventListener('click', () => {
    // GET message from input
    const message = messageInput.value;
    // Clean input
    messageInput.value = '';
    // Log Message Like Sended
    logMessage(`Send: ${message}`);

    // GET the channel (can be local or remote)
    const channel = localChannel || remoteChannel;
    // Send message. The other client will receive this message in 'onmessage' function from channel
    channel.send(message);
  });
}
