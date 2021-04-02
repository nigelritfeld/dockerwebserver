/**
 * Setting global constants for the express public
 */
const path = require('path');
const express = require('express');
const router = express.Router();
const session = require('express-session');
const app = express();
const server = require('http').Server(app);
const bcrypt = require('bcrypt');
const gsap = require('gsap');
const bodyParser = require('body-parser')
const mysql2 = require('mysql2')
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'))
app.use(express.static(__dirname + 'app.js'))
server.listen(3000, () => {
    console.info(`Server is listening on port 3000`)
});

/**
 * Creating websocket with cross origin for client app
 * @type {*}
 */
const io = require('socket.io')(server, {
    // Cors settings
    cors: {
        // Allow these origins
        origin: "https://watch.brainbug.tech",
        // Allowing get and post methods for these origins
        methods: ["GET", "POST"]
    }
});



// Global vars
let broadcaster;
let onlineUsers = []


/**
 * Environment variables
 */
const TWO_HOURS = 1000 * 60 * 60 * 2
const {
    NODE_ENV = 'development',
    SESSION_NAME = 'sid',
    SESSION_SECRET = 'ssh!quiet,it\'asecret!',
} = process.env
const IN_PROD = NODE_ENV === 'production'

// Using session
app.use(session({
    name: SESSION_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESSION_SECRET,
    cookie: {
        maxAge: TWO_HOURS,
        sameSite: true,
        secure: IN_PROD,

    }
}))

// Body parser settings to use request body's
app.use(bodyParser.urlencoded({
    extended: true
}))

// Creating a connection pool
const connection = mysql2.createPool()


// Check if there is a existing session
const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {

        // Redirecting to the sign up page
        res.redirect('/login')
    } else {


        // Else continue..
        next()
    }
}


/**
 * All application routes
 */
app.get('/', redirectLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/main.html'))
});
// Login routes

// GET Route
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'))
});


// POST Route
app.post('/login', (req, res) => {
    const {login_username,login_password} = req.body

    if (login_username && login_password) {
        validateUser(login_username, login_password, req, res)
    }
})

app.get('/login/:error', (req, res) => {
    let error = req.query.error;
    console.log(error)
    // Redirecting to the sign up page
    res.render('login.ejs', {
        error: error
    })
})



router.get('/profile', ((req, res) => {
    getUser(`${req.params.username}`)
        .then((result) => {
            if (result['username'])
            {
                let user = new User(`${result['id']}`, `${result['username']}`, `${result['name']}`, `${result['email']}`, `${result['password']}`, `${result['created_at']}`, `${result['updated_at']}`)

                let userName = user.username
                let name = user.name
                let email = user.email
                // let created_at = user.created_at
                // let updated_at = user.updated_at
                res.render('profile.ejs', {username: userName, name: name, email: email})
            }else{

            }
        })
}))
// Register routes

// GET Route
app.get('/registreren', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/register.html'))
});
// POST Route
app.post('/registreren', (req, res) => {
    try {
        // SALT ROUNDS
        const saltRounds = 10;
        // Received input
        const {username, name, email, password} = req.body
        // Hasing the password
        bcrypt.hash(password, saltRounds, function (err, hash) {
            // Creating a user with received input

            createUser(`${username}`, `${name}`, `${email}`, `${hash}`)
        });
        // Redirecting
        res.redirect('/login')
    } catch (e) {
        res.redirect('/404')
    }

});

// Logout Route
app.get('/logout', (req, res) => {
    try {
        // Remove session
        req.session.destroy(null);
        // Remove cookie
        res.clearCookie(SESSION_NAME, { path: '/' });
        // Redirecting
        res.redirect('/login')
    } catch (e) {
        res.redirect('/404')
    }
});



/**
 * User constructor
 *
 * @param id
 * @param username
 * @param name
 * @param password
 * @param created_at
 * @param updated_at
 * @constructor
 */
function User(id, username, name, email, password, created_at, updated_at) {
    this.id = id
    this.username = username
    this.name = name
    this.email = email
    this.password = password
    this.created_at = created_at
    this.updated_at = updated_at

}

/**
 * Get user from database
 * @param username
 */

function getUser(username) {

    return new Promise((resolve, reject) => {

        try{
            // Doing a query on the database
            connection.query(`SELECT * FROM \`users\` WHERE \`username\` = '${username}'`, function(err, results,rows) {
                console.log(results[0])
                // console.log(results[0].username)
                if (results[0] === undefined){
                    console.log('[Lijn 221:]Error tijdens uitvoeren van query:' + err)
                    reject(err => {
                        return;
                    });

                }else if (results[0].username === username){
                    return resolve(results[0]);
                }

            });
        }catch (err){
            console.log(err)
        }

    });

}

/**
 * Insert new user to database
 * @param username
 * @param name
 * @param email
 * @param password
 */
function createUser(username, name, email, password) {
    try {
        connection.query(`INSERT INTO \`users\`(\`username\`, \`name\`, \`email\`, \`password\`) 
            VALUES ('${username}','${name}','${email}','${password}')`,
            function (err, results, fields) {
                console.log(results); // results contains rows returned by server
            }
        )
    } catch (err) {
        console.log(err)
    }
}


/**
 * Get all users from database
 */
function getAllUsers()
{
    connection.query(
        `SELECT * FROM \`users\``,
        function (err, results, fields) {
            console.log(results); // results contains rows returned by server
        }
    );
}

/**
 *
 * @param username
 * @param receivedPassword
 * @returns {Promise<void>}
 */
async function validateUser(username, receivedPassword, req, res)
{
    return await getUser(`${username}`)
        .then((results) => {
            let user = new User (`${results['id']}`, `${results['username']}`,`${results['name']}`,`${results['email']}`,`${results['password']}`,`${results['created_at']}`,`${results['updated_at']}`)
            console.log(user)
            return checkPass(receivedPassword, user, req, res)
        }).catch((err) => {
            console.error(err);
                // res.redirect('/login?error=' + err)
        });

}

/**
 * Online users
 */
function setOnlineUser(user)
{
    onlineUsers.push(user)
    console.log('[NEW Online user]' + user.username)
    console.log('[Online users:]')
    function allOnlineUsers(onlineUsers){
        for (user of onlineUsers){
            console.log(user.username)
        }
    }
    allOnlineUsers(onlineUsers)

}

/**
 * Online users
 */
function setOfflineUser(user)
{
    onlineUsers.splice(user)
    console.log('[NEW Online user]' + user.username)
}


/**
 * Validates the password
 * @param receivedPassword
 * @param user
 * @param req
 * @param res
 */
function checkPass(receivedPassword, user, req, res)
{
    let passwordHash = user.password

    // Load hash from your password DB.
    bcrypt.compare(receivedPassword, passwordHash, function(err, result) {
        // result == true
        if (result){
            req.session.userId = user.id
            setOnlineUser(user)
            res.redirect('/')
        }else{

            res.redirect('/login')
            console.log('Login incorrect')
        }
    });

}


/**
 * Socket IO
 * Creating a peer connection between Broadcaster and the client.
 * There are two scripts one for the Broadcaster and the client.
 * Via those scripts & the socket connection the peer connection will be established.
 */
io.sockets.on("error", e => console.log(e));
io.sockets.on("connection", socket => {

    socket.on("broadcaster", () => {
        broadcaster = socket.id;
        socket.broadcast.emit("broadcaster");
    });
    socket.on("watcher", () => {
        socket.to(broadcaster).emit("watcher", socket.id);
    });
    socket.on("offer", (id, message) => {
        socket.to(id).emit("offer", socket.id, message);
    });
    socket.on("answer", (id, message) => {
        socket.to(id).emit("answer", socket.id, message);
    });
    socket.on("candidate", (id, message) => {
        socket.to(id).emit("candidate", socket.id, message);
    });
    socket.on("disconnect", () => {
        socket.to(broadcaster).emit("disconnectPeer", socket.id);
    });

});



