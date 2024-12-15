
# Express File Upload and WebSocket Server

## Description

This project is an Express server that handles file uploads using Multer and real-time communication using Socket.IO. It supports joining and leaving rooms, sending messages, and sharing files within rooms.

## Installation

Follow these steps to set up and run the project locally.

### Prerequisites

- Node.js

- npm (Node Package Manager)

### Steps

1. Clone the repository

```bash
git clone https://github.com/dark-hat-Darkie/chat.git
```

2. Navigate to the project directory

```bash
cd chat/basic-chat
```

3. Install dependencies

```bash
npm install
```

## Usage

To start the server in development mode, run the following command:

```bash
npm run dev # start development server
```

To start the server in production mode, first build the code then start the server:
```bash
npm run build && npm start
```

The server will start on port `7777` by default. You can change the port by setting the `PORT` environment variable.

## Endpoints

`GET /` - Check if the server is running.

`POST /upload` - Upload a file. The file should be attached in the form-data with the key file.

## WebSocket Events

`connection` - Triggered when a user connects.

`joinRoom` - Join a specific room. Requires room and username in the data.

`leaveRoom` - Leave a specific room. Requires room in the data.

`sendMessage` - Send a message to a room. Requires room and message in the data.

`shareFile` - Share a file in a room. Requires room, file, and isImage in the data.

`disconnect` - Triggered when a user disconnects.

## Static Files

Uploaded files are served statically from the `uploads` directory.

## Implementation Process

1. **Setup Express Server:** Initialize an Express application and configure it to use JSON and static file serving.
2. **Configure CORS:** Set up CORS to allow requests from http://localhost:3000.
3. **Setup Multer for File Uploads:** Configure Multer to handle file uploads and store them in the uploads directory.
4. **Create HTTP Server:** Create an HTTP server using the Express app.
5. **Initialize Socket.IO:** Set up Socket.IO to handle real-time communication, allowing connections from http://localhost:3000.
6. **Define Routes:** Implement routes for checking server status and handling file uploads.
7. **Handle WebSocket Events:** Implement WebSocket event handlers for connecting, joining/leaving rooms, sending messages, sharing files, and disconnecting.
8. **Start the Server:** Start the HTTP server on the specified port.

## Contributing

If you would like to contribute to this project, please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature-branch`)
5. Open a pull request

## License
This project is licensed under the MIT License - see the LICENSE file for details.
