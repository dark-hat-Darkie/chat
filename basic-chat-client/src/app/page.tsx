'use client';
import { useState, useEffect, JSX } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

const Chat = () => {
  const [room, setRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ text: string | JSX.Element; sender: string, username: string, file?: string }[]>([]);
  const [username, setUsername] = useState('');
  const [connectedRoom, setConnectedRoom] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [userId, setUserId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    socket = io('http://localhost:7777'); // Replace with your backend URL

    socket.on('message', (data: { text: string; sender: string, username: string }) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on('fileShared', (data: { filename: string, sender: string, username: string, isImage: boolean }) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: data.isImage ? <img src={`http://localhost:7777/${data.filename}`} alt="shared file" /> : `File shared: ${data.filename}`, sender: data.sender, username: data.username },
      ]);
    });

    socket.on('fileStream', (chunk: Buffer) => {
      // Handle file streaming in chunks
      console.log('Received file chunk:', chunk.length);
    });

    socket.on('fileStreamComplete', () => {
      console.log('File streaming complete');
    });

    socket.on('connected', (data: { sender: string }) => {
      setUserId(data.sender);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = () => {
    if (room && username) {
      socket.emit('joinRoom', { room, username });
      setConnectedRoom(room);
      setIsJoined(true);
    }
  };

  const leaveRoom = () => {
    if (connectedRoom) {
      socket.emit('leaveRoom', connectedRoom);
      setConnectedRoom('');
      setIsJoined(false);
      setMessages([]);
    }
  };

  const sendMessage = () => {
    if (connectedRoom && message) {
      socket.emit('sendMessage', { room: connectedRoom, message, sender: username });
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: message, sender: 'You', username: username },
      ]);
      setMessage('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const shareFile = () => {
    if (connectedRoom && file) {
      const formData = new FormData();
      formData.append('file', file);

      fetch('http://localhost:7777/upload', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          socket.emit('shareFile', { room: connectedRoom, file: data, isImage: file.type.startsWith('image/') });
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: file.type.startsWith('image/') ? <img src={`http://localhost:7777/${data.filename}`} alt="shared file" /> : `File shared: ${file.name}`, sender: 'You', username },
          ]);
          setFile(null); // Clear file input after sharing
        })
        .catch(error => console.error('Error uploading file:', error));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {!isJoined ? (
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center text-gray-700 mb-4">Join a Room</h1>
          <input type="text" placeholder="Your Name" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 border rounded-lg mb-4" />
          <input type="text" placeholder="Room Name" value={room} onChange={(e) => setRoom(e.target.value)} className="w-full p-3 border rounded-lg mb-4" />
          <button onClick={joinRoom} className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600">Join Room</button>
        </div>
      ) : (
        <div className="w-full max-w-lg bg-white shadow-lg rounded-lg flex flex-col h-screen">
          {/* Room Header */}
          <div className="flex items-center justify-between bg-blue-500 text-white p-4 rounded-t-lg">
            <h2 className="text-xl font-semibold">{connectedRoom}</h2>
            <button onClick={leaveRoom} className="text-sm bg-red-500 py-2 px-4 rounded-lg hover:bg-red-600">Leave</button>
          </div>

          {/* Messages Section */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
            {messages.filter(msg => msg.sender !== userId).map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender === 'You' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  <span className="text-sm font-semibold">{msg.sender !== 'You' && `${msg.username}: `}</span>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} className="flex-1 p-3 border rounded-lg" />
              <button onClick={sendMessage} className="bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600">Send</button>
            </div>

            {/* File Input */}
            <input type="file" onChange={handleFileChange} className="mt-4 p-2 border rounded-lg" />
            <button onClick={shareFile} className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600" disabled={!file}>Share File</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
