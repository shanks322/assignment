# Use ubuntu 22.04 as the base image
FROM ubuntu:22.04

# Install required packages including Java
# Update software packages
RUN apt-get update && apt-get install -y \
    software-properties-common \
    openjdk-8-jdk \
    python3 \
    python3-pip \
    curl \
    wget \
 && rm -rf /var/lib/apt/lists/*
# Set the working directory for the Flask app
WORKDIR /app

# Copy the Flask app and requirements to container
COPY ./app.py .
COPY ./requirements.txt .

# Install Flask and other Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Install Pyspark
RUN pip3 install pyspark

# Download data from GHArchive to process
RUN for i in $(seq 0 23); do \
    wget "https://data.gharchive.org/2024-01-08-$i.json.gz"; \
    done


# Expose the port Flask runs on
EXPOSE 5000

# Command to run Flask app
CMD ["python3", "/app/app.py"]
