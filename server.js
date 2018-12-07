var express = require("express");
var app =express();
var server = require("http").createServer(app);
var io =require("socket.io").listen(server);
var mongoose = require("mongoose"),


users = [];
connections = [];

mongoose.connect('mongodb://localhost/chatapps', function(err){
    if(err){
        console.log(err);
    }
    else{
        console.log('connect to mongodb');
    }
})

var chatSchema = mongoose.Schema({
    user :String,
    msg :String,
    
})

var chatapp = mongoose.model('message',chatSchema);


server.listen(process.env.PORT,process.env.IP);
        console.log('Server Running...');

        
app.get('/', function(req,res){
    res.sendFile(__dirname + '/index.html')
});

io.sockets.on('connection',function(socket){
    var query =chatapp.find({});
    query.limit(5).exec(function(err, docs){
        if(err) throw err;
        socket.emit('Load old msgs', docs);
    });
    connections.push(socket);
    console.log('Connected: %s socket connected',connections.length);
    
    
    socket.on('disconnect',function(data){
        users.splice(users.indexOf(socket.username),1);
        updateUsernames();
        connections.splice(connections.indexOf(socket),1);
    console.log('Disconnected: %s socket connected',connections.length);
    })
    
    socket.on('send message',function(data){
        var newMsg = new chatapp({msg :'msg', user : socket.username});
        newMsg.save(function(err){
            if(err) throw err;
        })
        io.sockets.emit('new message',{msg:data, user : socket.username})
    })
    
    socket.on('new user',function(data,callback){
        callback(true);
        socket.username = data;
        users.push(socket.username);
        updateUsernames();
    })
    function updateUsernames(){
        io.sockets.emit('get users', users);
    }
    
})