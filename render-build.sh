#!/bin/sh
# Update package list and install system dependencies
apt-get update && apt-get install -y portaudio19-dev ffmpeg

# Install Python dependencies
pip install --upgrade pip
pip install wheel setuptools
pip install -r requirements.txt
