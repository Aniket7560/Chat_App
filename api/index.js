const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const ws = require('ws');
const Message = require('./models/Message');
const fs = require('fs');

dotenv.config();

const clientUrl = process.env.CLIENT_URL;    
 
const secretkey = process.env.SECRET_KEY;
console.log(secretkey);
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();

mongoose.connect(mongodb+srv://mernchat:pSbvB6xSRoqQIPdn@cluster0.mdtqcg6.mongodb.net/test?retryWrites=true&w=majority);

app.use(cors({
    credentials: true,
    origin: ["https://deploy-mern-1whq.vercel.app"],
    methods: ["POST", "GET"],
}));

// app.use('/uploads', express.static(__dirname+'/uploads'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());

app.get('/test', (req, res) => {
    res.send("Hello world!");
});

function getOurUserId(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;

        if (token) {
            jwt.verify(token, secretkey, {}, (err, userData) => {
                if (err) {
                    throw err;
                }
                resolve(userData);
            });
        } else {
            reject('!no token');
        }
    });
}

app.get('/messages/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userData = await getOurUserId(req);
        const ourId = userData.userId;

        const messages = await Message.find({
            sender: { $in: [userId, ourId] },
            recipient: { $in: [userId, ourId] },
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }  

});  

app.get('/user', async (req, res)=>{
    const userObj = await User.find({}, '_id username');
    res.json(userObj);
})

 
app.get('/profile', (req, res) => {
    const token = req.cookies?.token;

    if (token) {
        jwt.verify(token, secretkey, {}, (err, userData) => {
            if (err) {
                throw err;
            }
            res.json(userData);
        })
    } else { 
        res.status(401).json('!no token');
    }
})   

app.post('/logout', (req, res) => {
    res.cookie('token', '', { sameSite: 'none', secure: true }).json('ok');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const founduser = await User.findOne({ username });

    if (!founduser) {
        return res.status(401).json('Invalid credentials');
    }

    const passOk = bcrypt.compareSync(password, founduser.password);
 
    if (passOk) { 
        console.log(founduser);
        jwt.sign({ userId: founduser._id, username }, secretkey, {}, (err, token) => {
            if (err) {
                console.error('Error signing JWT:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            // Set the token in a cookie and send a success response
            res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
                id: founduser._id,
            });
        });
    }


})  

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the username already exists
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create a new user
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
        const createUser = await User.create({
            username: username,
            password: hashedPassword,
        });

        // Generate JWT token
        jwt.sign({ userId: createUser._id, username }, secretkey, {}, (err, token) => {
            if (err) {
                console.error('Error signing JWT:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            // Set the token in a cookie and send a success response
            res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
                id: createUser._id,
            });
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}); 

const server = app.listen(4000)

const wss = new ws.WebSocketServer({ server });

wss.on('connection', (connection, req) => {

    function notifyAboutOnlinePeople(){
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
            }));
        });
    }

    connection.isAlive = true;

    connection.timer = setInterval(()=>{
        connection.ping();
        connection.deathTimer = setTimeout(()=>{
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlinePeople();
        }, 1000);
    }, 5000);  
   
    connection.on('pong', ()=>{
        clearTimeout(connection.deathTimer);
    })    

    // read username and id from the cookie for this connection
    const cookies = req.headers.cookie;
    if (cookies) {
        const tokenCookieString = cookies.split(';').find(str => str.startsWith('token'));
        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1];
            if (token) {
                jwt.verify(token, secretkey, {}, (err, userData) => {
                    if (err) throw err;
                    const { userId, username } = userData;
                    connection.userId = userId;
                    connection.username = username;
                    // console.log(userData);
                });
            }  
        }

    }

    connection.on('message', async (message) => {
        const data = JSON.parse(message.toString());
        const { to, text, file } = data;
        let filename = null;
        if(file){
            console.log(file);
            const parts = file.name.split('.');
            const ext = parts[parts.length-1];
            filename = Date.now() + '.' + ext;
            const path = __dirname + '/uploads/' + filename;
            const bufferData = new Buffer(file.data.split(',')[1], 'base64');
            fs.writeFile(path, bufferData,()=>{
                console.log('file saved' + path);
            });
        }
         
        if (to && (text || file)) {
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient: to,
                text,
                file: filename,
            }) 
            console.log(to);
            console.log(text);
            [...wss.clients]
                .filter(c => c.userId === to)
                .forEach(c => c.send(JSON.stringify({
                    file: filename,
                    text,
                    sender: connection.userId,
                    _id: messageDoc._id,
                })));
        }
    });

    // notify everyone about online people (when someone connects)
    notifyAboutOnlinePeople();
});

  
