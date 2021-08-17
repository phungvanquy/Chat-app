const path = require('path')
const fs = require('fs')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const  {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)             // this automatically serve up socket.io/socket.io.js for client side

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket)=>{
    console.log("New websocket connection")

    socket.on('join', ({username, room}, callback)=>{
        
        // get saved chat and send to client
        var savedChat
        fs.readFile(`ChatOf${username}inRoom${room}.txt`, 'utf8', function(err, data) {
            if(data){
                savedChat = data
                socket.emit('renderSavedChat', savedChat)
            }else{
                socket.emit('renderSavedChat', '') 
            }

        });

        setTimeout(() => {
            socket.emit('message', generateMessage('ADMIN', 'Welcome'))            
        }, 500);
        
        const {error, user} =addUser({ id: socket.id, username: username, room: room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        socket.broadcast.to(user.room).emit('message', generateMessage(username, `${user.username} has joined!`))
        callback()

    })

    socket.on('sendMessage', (message, callback) =>{
        const user = getUser(socket.id)
        if(user) {
            io.to(user.room).emit('message', generateMessage(user.username, message))
            callback('Delivered!')
        }
    })

    socket.on('sendLocation', (coords, callback)=>{
        const user = getUser(socket.id)
        if(user){
            io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
            callback()
        }
    })


    socket.on('saveChat', (data) =>{
        const user = getUser(socket.id)

        fs.writeFile(`ChatOf${user.username}inRoom${user.room}.txt`, data , function (err) {
            if (err) throw err;
            console.log('Saved!');
          });
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('ADMIN', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })
 
})


server.listen(port, () =>{
    console.log(`Server is served on port ${port}`)
})

