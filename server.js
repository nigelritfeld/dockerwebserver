/**
 * Environment variables
 */
 const TWO_HOURS = 1000 * 60 * 60 * 2
 const {
     NODE_ENV = 'development',
     SESSION_NAME = 'sid',
     SESSION_SECRET = 'ssh!quiet,it\'asecret!',
     PORT = 3000,
 } = process.env
 const IN_PROD = NODE_ENV === 'production'
 
 /**
  * Setting global constants for the express public
  */
 const path = require('path');
 const express = require('express'); // Express module
 const session = require('express-session'); // Express session module
 const bcrypt = require('bcrypt'); // Bcrypt module for hashing passwords
 const bodyParser = require('body-parser') // Body parser for reading request messages
 const mysql2 = require('mysql2') // Database driver for database connection
 const compression = require('compression'); // Caching
 const helmet = require('helmet');
 const {body, validationResult} = require('express-validator'); // Server-side form validation
 
 /**
  *  Application Settings
  *  All the settings for express are defined here
  */
 const app = express();
 const server = require('http').Server(app);
 require('log-timestamp')('#Starting app');
 app.set('view engine', 'ejs');
 app.use(compression());
 app.use(helmet());
 app.use(express.static(__dirname + '/public'));
 app.use(express.static(__dirname + '/public/assets'));
 app.use(express.static(__dirname + 'app.js'));
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
 })) // Session settings
 app.use(bodyParser.urlencoded({
     extended: true
 })) // Bodyparser settings
 
 /**
  * Global Variables
  */
 let broadcaster;
 let onlineUsers = [] // Array to store the currently online users
 
 // Expose port 3000
 server.listen(PORT, () => {
     console.info(`Server is listening on port ${process.env.PORT || 3000}`)
     console.log(`App currently in ${NODE_ENV}, Author: Nigel Ritfeld \< info@nigelritfeld.nl \> `)
     // console.log(`p`)
     // console.log(`Author: Nigel Ritfeld "info@nigelritfeld.nl"`)
     require('log-timestamp')('#LOG');
 });
 
 /**
  * Creating websocket with cross origin for client app
  * @type {*}
  */
 const io = require('socket.io')(server,
     {
         // Cors settings
         cors: {
             // Allow these origins
             origin: "https://watch.brainbug.tech",
             // origin: "http://localhost:3001",
             // Allowing get and post methods for these origins
             methods: ["GET", "POST"]
         }
     });
 
 
 /**
  * Creating a connection pool
  * @type {Pool}
  */
 const connection = mysql2.createPool(
    {
        host: 'localhost',
        port: '1234',
        user: 'username',
        password: 'password',
        database: 'database_name',
        connectionLimit: 10
     }
     )
 
 
 /**
  * Check if there is a existing session
  * @param req
  * @param res
  * @param next
  */
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
  * Checks if there is a existing session
  * @param req
  * @param res
  * @param next
  */
 const isLoggedIn = (req, res, next) => {
     if (!req.session.userId) {
         // Else continue..
         next()
     } else {
         res.redirect('/')
     }
 }
 
 /**
  * All application routes
  */
 app.get('/', redirectLogin, (req, res) => {
     res.sendFile(path.join(__dirname, 'public/main.html'))
 });
 
 /**
  * Profile routes
  */
 app.get('/profile', redirectLogin, (req, res) => {
     // Getting user id from session
     const userId = req.session.userId
     // Getting index of user in online sessions
     const userIndex = onlineUsers.map((user) => {
         return user.id;
     }).indexOf(userId);
     // Getting user from session
     const user = onlineUsers[userIndex]
 
     let username = user.username
     let name = user.name
     let email = user.email
 
     res.render('profile', {
         username: username,
         name: name,
         email: email
     })
 });
 
 /**
  * Profile POST routes
  */
 app.post('/profile', (req, res) => {
     const {username, name, email, password} = req.body
     // Getting user id from session
     const userId = req.session.userId
     // Getting index of user in online sessions
     const userIndex = onlineUsers.map((user) => {
         return user.id
     }).indexOf(userId);
     bcrypt.hash(password, 10, function (err, hash) {
         // Creating a user with received input username, name, email, password, id, userIndex, req, res
         updateUser(`${username}`, `${name}`, `${email}`, `${hash}`, `${userId}`, userIndex, req, res)
     });
 });
 
 /**
  * Login error route
  */
 app.get('/login/:error', redirectLogin, (req, res) => {
     let error = req.query.error;
     console.log(error)
     // Redirecting to the sign up page
     res.render('login.ejs', {
         error: error
     })
 })
 /**
  * Delete user profile
  */
 app.post('/deleteUserProfile', (req, res) => {
     // Getting user id from session
     const userId = req.session.userId
     // Getting index of user in online sessions
     const userIndex = onlineUsers.map((user) => {
         return user.id
     }).indexOf(userId);
     setOfflineUser(userIndex, userId, req, res)
     deleteUser(userId)
 });
 /**
  * Login GET route
  */
 app.get('/login/:error', redirectLogin, (req, res) => {
     let error = req.query.error;
     console.log(error)
     // Redirecting to the sign up page
     res.render('login.ejs', {
         error: error
     })
 })
 /**
  * Login GET route
  */
 app.get('/login', (req, res) => {
     // If there is a GET parameter passed
     if (req.query.session) {
         // if there is a session GET parameter is given
         let errorMessage = 'Your session expired, please log in again '
         // Render page with error message
         res.render('login', {error: errorMessage})
     } else if (req.query.error) {
         // Render page with error message
         // Create var of given error GET parameter
         let errorMessage = req.query.error
 
         if (errorMessage === '1') {
             errorMessage = 'Login incorrect'
         }
         console.log(`Detected error: ${errorMessage}`)
         res.render('login', {error: errorMessage})
     } else {
         // If there is no user ID in the session
         if (!req.session.userId) {
             res.sendFile(path.join(__dirname, 'public/login.html'))
         } else {
             // Else return redirect to profile page..
             res.redirect('/profile')
         }
     }
 
 });
 /**
  * Login POST route
  */
 app.post('/login', (req, res) => {
     const {login_username, login_password} = req.body
     if (login_username && login_password) {
         validateUser(login_username.toLowerCase(), login_password, req, res)
     }
 })
 /**
  * Register GET route
  */
 app.get('/registreren', isLoggedIn, (req, res) => {
         res.sendFile(path.join(__dirname, 'public/register.html'))
     }
 );
 /**
  * Register GET route
  */
 app.get('/registreren/:error', isLoggedIn, (req, res) => {
         if (req.query.error === 1) {
             let errorMessage = 'Ingevoerde is geen geldige e-mailadres'
             res.render('register', {error: errorMessage})
         }
 
         if (req.query.error === 2) {
             let errorMessage = 'Wachtwoord is niet langer dan 6 karakters'
             res.render('register', {error: errorMessage})
         }
         if (req.query.error === 3) {
             let errorMessage = 'Ingevoerde is geen geldige e-mailadres'
             res.render('register', {error: errorMessage})
         }
         res.sendFile(path.join(__dirname, 'public/register.html'))
     }
 );
 /**
  * Register POST route
  */
 app.post('/registreren', (req, res) => {
     try {
         // SALT ROUNDS
         const saltRounds = 10;
         // Received input
         const {username, name, email, password} = req.body
         // checkInput(username,email, req, res)
 
         // Hasing the password
         bcrypt.hash(password, saltRounds, function (err, hash) {
             // Creating a user with received input
             createUser(`${username.toLowerCase()}`, `${name}`, `${email}`, `${hash}`)
         });
 
         // Redirecting
         res.redirect('/login')
     } catch (e) {
         res.redirect('/404')
     }
 
 });
 
 /**
  * Logout route
  */
 app.get('/logout', (req, res) => {
     try {
         // Remove from online users array
         let userId = req.session.userId
         let userIndex = onlineUsers.map((user) => {
             return user.id
         }).indexOf(userId);
 
         setOfflineUser(userIndex, userId, req, res)
 
     } catch (e) {
         console.log(e)
         res.redirect('/404')
     }
 });
 /**
  * Redirect non existing pages to the homepage
  */
 app.get('*', (req, res) => {
     res.redirect('/')
 })
 
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
 function User(id, username, name, email, created_at, updated_at) {
     this.id = id
     this.username = username
     this.name = name
     this.email = email
     this.created_at = created_at
     this.updated_at = updated_at
 }
 
 
 /**
  * Get user from database
  * @param username
  */
 
 function getUser(username, req, res) {
     return new Promise((resolve, reject) => {
 
         try {
             // Doing a query on the database
             connection.execute(`SELECT * FROM \`users\` WHERE \`username\` = ?`, [username], function (err, results, rows) {
                 if (results[0] === undefined) {
                     console.log(`Login attempt for user: ${username} `)
                     res.redirect('/login?error=1')
                 } else if (results[0].username === username) {
                     return resolve(results[0]);
                 }
 
             });
         } catch (err) {
             console.log(err)
         }
     })
 }
 
 /**
  * Checks input
  * @param username
  * @param email
  * @param req
  * @param res
  */
 function checkInput(username, email, req, res) {
     try {
         connection.query(`SELECT * FROM \`users\` WHERE username = ? `, [username],
             function (err, results, fields) {
                 console.log(results)
                 console.log(results[0].username)
                 if (results[0].username === username) {
                     res.redirect('/registreren?username=1')
                     console.log(results); // results contains rows returned by server
                 }
                 if (results['email'] === email) {
                     res.redirect('/registreren?email=1')
                 }
             })
     } catch (e) {
         console.log(e)
     }
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
         connection.execute(`INSERT INTO \`users\`(\`username\`, \`name\`, \`email\`, \`password\`) 
             VALUES (?,?,?,?)`, [username, name, email, password],
             function (err, results, fields) {
                 console.log(results); // results contains rows returned by server
             }
         )
     } catch (err) {
         console.log(err)
     }
 }
 
 /**
  * Update user in database
  * @param username
  * @param name
  * @param email
  * @param password
  * @param id
  * @param userIndex
  * @param req
  * @param res
  */
 
 function updateUser(username, name, email, password, id, userIndex, req, res) {
     try {
         connection.execute(`UPDATE \`users\` SET \`username\`=?,\`name\`=?,\`email\`=?,\`password\`=? WHERE id = ? `, [username, name, email, password, id],
             function (err, results, fields) {
 
                 console.log(results); // results contains rows returned by server
                 setOfflineUser(`${userIndex}`, `${id}`, req, res)
             }
         )
     } catch (err) {
         console.log(err)
     }
 }
 
 /**
  * Delete user from database
  */
 function deleteUser(id) {
     connection.execute('DELETE from \`users\` WHERE id = ? ', [id], function (err, results, fields) {
         if (!err) {
             console.log(`Deleted user #${id}`)
         } else {
             console.log(err)
         }
     })
 }
 
 /**
  * Validates user
  * @param username
  * @param receivedPassword
  * @param req
  * @param res
  * @returns {Promise<void>}
  */
 async function validateUser(username, receivedPassword, req, res) {
     return await getUser(`${username}`, req, res)
         .then((result) => {
             return checkPass(receivedPassword, result, req, res)
         }).catch((err) => {
             console.error(err);
             res.redirect('/login?error=1')
         });
 
 }
 
 /**
  * Set user in the onlineUsers array
  * @param user
  */
 function setOnlineUser(user) {
     onlineUsers.push(user)
     console.log(`[ ${user.username.toUpperCase()}: IS NOW ONLINE ]`)
     console.log('[ONLINE USERS:]')
 
     function allOnlineUsers(onlineUsers) {
         for (user of onlineUsers) {
             console.log(`* ${user.username}`)
         }
     }
 
     allOnlineUsers(onlineUsers)
 
 }
 
 /**
  * Removes user from onlineUsers array and removes session & cookie
  * @param userIndex
  * @param userID
  * @param req
  * @param res
  */
 function setOfflineUser(userIndex, userID, req, res) {
     // Console log
     console.log(`[${onlineUsers[userIndex].username} IS NOW OFFLINE]`)
     // Remove session
     req.session.destroy();
     // Remove cookie
     res.clearCookie(SESSION_NAME, {path: '/'});
     // Remove from registered online user
     onlineUsers.splice(userIndex, 1)
     // Redirecting
     res.redirect('/login?session=expired')
     // Checking all online users
     if (onlineUsers < 0) {
         for (let user of onlineUsers) {
             console.log('[ONLINE USER:]')
             console.log('[ONLINE USER:]')
             console.log(user.username)
         }
     } else {
         console.log('Currently no users online')
     }
 
 }
 
 /**
  * Validates the password
  * @param receivedPassword
  * @param user
  * @param req
  * @param res
  */
 function checkPass(receivedPassword, result, req, res) {
     // Hashed password
     let hash = result['password']
     // Load hash from your password DB.
     bcrypt.compare(receivedPassword, hash, function (err, verified) {
         // result == true
         if (verified) {
             let user = new User(`${result['id']}`, `${result['username']}`, `${result['name']}`, `${result['email']}`, `${result['created_at']}`, `${result['updated_at']}`)
             req.session.userId = user.id
             setOnlineUser(user)
             res.redirect('/')
         } else {
             console.log('Login incorrect')
             res.redirect('/login?error=1')
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