# Use Node.js 20 as the base image for building
FROM node:20-slim AS builder

# Set the working directory
WORKDIR /app

# Copy package definition files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy all project files into the image
COPY . .

# Build the application (Frontend + Backend bundle)
RUN npm run build

# --- Production Image ---
# Use a fresh slim Node.js image for the production runtime
FROM node:20-slim

# Set to production mode
ENV NODE_ENV=production

# Set the working directory
WORKDIR /app

# Copy package files to install production dependencies
COPY package*.json ./

# Install ONLY production dependencies to keep the image small
RUN npm install --production

# Copy built assets and the bundled server from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the internal port (Cloud Run will route traffic here)
EXPOSE 8080

# Start the application using the production command defined in package.json
CMD ["npm", "start"]
