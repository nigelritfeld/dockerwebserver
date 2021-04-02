#Docker image for streaming application

#Base image
FROM node:lts
#Defining the work directory in the image
WORKDIR /usr/src/app
#Copying the package.json file to the work directory
COPY package*.json ./
#Command to install all the depencies defined in the package.json
RUN npm install
# Copying local files to the image
COPY . .
# Portmapping internal port 3000 to the host port 3000
EXPOSE 3000
# Running the application
CMD [ "node", "server.js" ]