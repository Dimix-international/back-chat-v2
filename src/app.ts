import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";

const cors = require('cors');
const app = express();

app.use(cors());


const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', //*
        methods: ['GET', 'POST']
    }
});
let users: UTUsers = {}

app.get('/', (req, res) => {
    res.send('Hello it is WS server'); //создали endpoint
})

io.on("connection", (socket) => {
    //'all-users'
    socket.on('disconnect', () => {
        delete users[socket.id]
        io.emit(ACTIONS_CHAT.ALL_USERS, users)
    });

    //-----чат ----//
    //'new_user' 'all-users'
    socket.on(ACTIONS_CHAT.NEW_USER, (username: string, successFn) => {
        users[socket.id] = {id: socket.id, nickName: username}

        successFn(socket.id);
        //скажем всем users что мы присоединились
        io.emit(ACTIONS_CHAT.ALL_USERS, users);
    });

    //'send_message' 'new_message'
    socket.on(ACTIONS_CHAT.SEND_MESSAGE, (data: InfoMessageType) => {
        const socketId = data.receivedUser;

        io.to(socketId).emit(ACTIONS_CHAT.NEW_MESSAGE, data)
    })

    //'client-typing_message' 'user-typing_message'
    socket.on(ACTIONS_CHAT.CLIENT_TYPING_MESSAGE, (data: ClientTypingMessageType) => {
        const socketId = data.receivedUser;

        io.to(socketId).emit(ACTIONS_CHAT.USER_TYPING_MESSAGE, data)
    })

    console.log(' a user connected')
});

const PORT = process.env.PORT || 7000;

httpServer.listen(PORT, () => {
    console.log(`listening => http://localhost:${PORT}`)
});

type UserType = { id: string; nickName: string; }
type UTUsers = {
    [key: string]: UserType
}
type InfoMessageType = {
    senderUser: string
    receivedUser: string;
    textMessage: string;
    avatar: string;
    media: any;
    isTypingMessage: boolean;
}

type ClientTypingMessageType = {
    receivedUser: string;
    isTypingMessage: boolean;
    avatar: string;
    textMessage: string;
}

const ACTIONS_CHAT = {
    ALL_USERS: 'all-users',
    NEW_USER: 'new_user',
    SEND_MESSAGE: 'send_message',
    NEW_MESSAGE: 'new_message',
    CLIENT_TYPING_MESSAGE: 'client-typing_message',
    USER_TYPING_MESSAGE: 'user-typing_message',
}
