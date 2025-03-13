#!/bin/sh
# Install system dependencies
apt-get update && apt-get install -y portaudio19-dev ffmpeg
pip install -r requirements.txt
