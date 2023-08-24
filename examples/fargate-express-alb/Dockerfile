FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install --ci --omit=dev

# Copy the rest of the application code to the working directory
COPY src src

# Expose the port your app will listen on
EXPOSE 80

# Command to run your app when the container starts
CMD ["node","src/index.js" ]
