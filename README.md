# Streaming Webapplication

This application is a web based streaming application used in a hologram streaming project. The application uses Socket.IO to establish a P2P Connection in Javascript. That connection is nessecary to stream the data from the WebRTC API to every connected client in realtime.

***NOTE before trying to use the app you need to create a database with an users table and pass the database credentials in the server js file. (I will add a SQL file to import the tables soon...)***

## Using the app

You will need to have node.js and npm. If you don't have it installed already refrence this link: https://nodejs.org/en/

I use Nodemon to speed up the development process.

## Configuration

You need to have working database

Edit the server js file on linel

    $ {
        host: 'localhost',
        port: '1234',
        user: 'username',
        password: 'password',
        database: 'database_name',
        connectionLimit: 10
     }

To install nodemon globally use the command:

    $ npm install -g nodemon

Then run:

    $ npm install

When all the dependencies are installed correctly
run:

    $ nodemon server.js
    
Without nodemon run:

    $ node server.js

# Docker usage

You can use docker to run the app.
To install docker engine refrence this link:
https://www.docker.com/products/docker-desktop

I added dockerfiles to create images and a docker compose file to run the app on the host machine.
#### Pulling image from the dockerhub

    $ docker pull nigelhr/streaming-app-image
    
Then: 

    $ docker run -dt nigelhr/streaming-app-image -p 3000:3000

### Creating images for containers
In terminal navigate to the folder of the app and run:

    $ docker build -t streaming-app .

Check your images with the following command:

    $ docker images

### Starting container

Then run:

    $ docker run -dt [created image] -p 3000:3000


Happy testing ❤️ Nigel

https://dev.ritfeldmediadesign.nl
