import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 7777;

app.use(express.json());

app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}));

app.use(express.static(path.join(__dirname, 'uploads')));
console.log('Uploads directory:', path.join(__dirname, 'uploads'));
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        console.log('Upload Path:', uploadPath);

        fs.access(uploadPath, fs.constants.F_OK, (err) => {
            if (err) {
                fs.mkdir(uploadPath, { recursive: true }, (err) => {
                    if (err) {
                        console.error("Error creating directory:", err);
                        return cb(new Error("Directory creation failed."), 'uploads');
                    }
                    cb(null, uploadPath);
                });
            } else {
                cb(null, uploadPath);
            }
        });
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });
const server = http.createServer(app);

const userMap = new Map<string, string>();

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.get('/', (req: Request, res: Response) => {
    res.send('WebSocket with Rooms is live!');
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        res.status(200).json({ filename: req.file.filename });
    } else {
        res.status(400).send('No file uploaded');
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.emit('connected', { text: 'You are connected to the server.', sender: socket.id });

    // Join a room
    socket.on('joinRoom', (data: { room: string, username: string }) => {
        socket.join(data.room);
        console.log(`User ${socket.id} joined room: ${data.room}`);
        userMap.set(socket.id, data.username);
        const joinMessage = { text: `User ${socket.id} joined the room.`, sender: socket.id, username: data.username };
        io.to(data.room).emit('message', joinMessage);
    });

    // Leave a room
    socket.on('leaveRoom', (room: string) => {
        socket.leave(room);
        console.log(`User ${socket.id} left room: ${room}`);
        const leaveMessage = { text: `User ${socket.id} left the room.`, sender: socket.id };
        io.to(room).emit('message', leaveMessage);
    });

    // Handle messages
    socket.on('sendMessage', ({ room, message }: { room: string; message: string }) => {
        console.log(`Message from ${socket.id} in room ${room}: ${message}`);
        const userMessage = { text: message, sender: socket.id, username: userMap.get(socket.id) };
        io.to(room).emit('message', userMessage);
    });

    // Handle file share
    socket.on('shareFile', (data: { room: string; file: Express.Multer.File, isImage: boolean }) => {
        const filePath = path.join(__dirname, 'uploads', data.file.filename);

        io.to(data.room).emit('fileShared', {
            filename: data.file.filename,
            size: data.file.size,
            sender: socket.id,
            username: userMap.get(socket.id),
            isImage: data.isImage
        });

        const stream = fs.createReadStream(filePath);
        stream.on('data', (chunk) => {
            socket.emit('fileStream', chunk);
        });

        stream.on('end', () => {
            socket.emit('fileStreamComplete');
        });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
