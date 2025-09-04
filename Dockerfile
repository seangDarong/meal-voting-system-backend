FROM node:latest
# Set working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the source code into the container
COPY . . 

# Build the application
RUN npm run build-ts

# Expose the application on port 3000
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start-ts"]