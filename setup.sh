#!/bin/bash

echo "🐺 Loup-Garou Online - Setup Script"
echo "===================================="
echo ""

# Check if Redis is running
echo "Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running!"
    echo "Please start Redis:"
    echo "  Ubuntu/Debian: sudo service redis-server start"
    echo "  macOS: redis-server"
    echo "  Docker: docker run -d -p 6379:6379 redis"
    exit 1
fi
echo "✅ Redis is running"
echo ""

# Backend setup
echo "Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -q -r requirements.txt

echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

echo "✅ Backend setup complete!"
echo ""

# Frontend setup
echo "Setting up Frontend..."
cd ../frontend

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

echo "Installing Node dependencies..."
npm install

echo "✅ Frontend setup complete!"
echo ""

# Final instructions
echo "🎉 Setup Complete!"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser!"
