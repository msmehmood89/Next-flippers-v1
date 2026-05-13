# Use Node.js 20 as the base image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm install

# Copy all project files
COPY . .

# Build the app (Frontend + Backend bundle)
RUN npm run build

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Use a specific environment variable for production
ENV NODE_ENV=production

# Start the application using the bundled server
CMD ["npm", "start"]
