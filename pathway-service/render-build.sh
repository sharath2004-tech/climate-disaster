#!/usr/bin/env bash
# Render build script for Pathway service

set -e

echo "Installing system dependencies..."
apt-get update
apt-get install -y build-essential cmake

echo "Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Build completed successfully!"
