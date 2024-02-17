FROM node:18-alpine

# Set the working directory in the container
WORKDIR /react

# Copy the React app to the container
COPY ./react_app .

# Install required dependencies
RUN npm install

# Expose the port the React app runs on
EXPOSE 3000

# Start the React application
CMD ["npm", "start"]
