# Period Tracker - PWA Application

A minimalist, privacy-focused period tracking Progressive Web App (PWA) built with React, TypeScript, and Node.js. Track your menstrual cycle with intelligent predictions, symptom logging, and multi-language support.

![Period Tracker](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### Core Functionality
- 📅 **Period Tracking**: Log period start/end dates with flow intensity
- 🔮 **Intelligent Predictions**: AI-powered cycle predictions with confidence levels
- 🥚 **Ovulation & Fertility Tracking**: Automatic fertile window calculations
- 📝 **Symptom Logging**: Track symptoms with fun emoji icons
- 📊 **Cycle Analytics**: View average cycle length and period duration
- 🚫 **No Period Logging**: Track when expected periods don't arrive

### User Experience
- 📱 **Mobile-First Design**: Native app-like experience on mobile devices
- 🌐 **Multi-Language Support**: Available in English, French, German, and Spanish
- 🔄 **Offline Support**: Works without internet connection with data sync
- 🎨 **Calm UI**: Soft, soothing color palette designed for comfort
- 🦖 **Fun Symptom Icons**: Playful emojis for symptom tracking (mood swings = dinosaur!)

### Technical Features
- 🔐 **Privacy-Focused**: Your data stays on your device
- ⚡ **PWA Technology**: Installable as a native app
- 🚀 **Fast Performance**: Optimized React application
- 🛡️ **Type-Safe**: Full TypeScript implementation

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **PWA** with offline support
- **i18next** for internationalization
- **date-fns** for date manipulation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **Zod** for validation
- **JWT** authentication
- **Rate limiting** for API protection

### Infrastructure
- **Docker** & Docker Compose
- **PostgreSQL 15** database
- **Nginx** (optional for production)

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/period-tracker.git
cd period-tracker
```

### 2. Environment Setup
Copy the example environment files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Start with Docker
```bash
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:7850
- Backend API: http://localhost:7851
- Database: localhost:7852

## 🔧 Development Setup

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations
```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

## 🌍 Deployment

### Option 1: Docker Deployment (Recommended)

#### Local/VPS Deployment
1. **Prepare your server**:
   ```bash
   # Install Docker and Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. **Clone and configure**:
   ```bash
   git clone https://github.com/yourusername/period-tracker.git
   cd period-tracker
   ```

3. **Set production environment variables**:
   ```bash
   # backend/.env
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres:your-secure-password@db:5432/period_tracker
   JWT_SECRET=your-very-secure-jwt-secret-min-32-chars
   PORT=7851
   
   # frontend/.env
   VITE_API_URL=https://api.yourdomain.com
   ```

4. **Update docker-compose.yml for production**:
   ```yaml
   version: '3.8'
   services:
     frontend:
       environment:
         - NODE_ENV=production
       restart: always
     
     backend:
       environment:
         - NODE_ENV=production
       restart: always
     
     db:
       environment:
         - POSTGRES_PASSWORD=your-secure-password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: always
   
   volumes:
     postgres_data:
   ```

5. **Deploy**:
   ```bash
   docker-compose up -d
   ```

#### Using Nginx Reverse Proxy
Create `/etc/nginx/sites-available/period-tracker`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:7850;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:7851;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Cloud Platform Deployment

#### Deploy to Heroku
1. **Install Heroku CLI** and login
2. **Create Heroku apps**:
   ```bash
   heroku create your-app-frontend
   heroku create your-app-backend
   ```

3. **Add PostgreSQL**:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev -a your-app-backend
   ```

4. **Deploy backend**:
   ```bash
   cd backend
   heroku git:remote -a your-app-backend
   git push heroku main
   heroku run npm run prisma:migrate
   ```

5. **Deploy frontend**:
   ```bash
   cd frontend
   heroku git:remote -a your-app-frontend
   heroku config:set VITE_API_URL=https://your-app-backend.herokuapp.com
   git push heroku main
   ```

#### Deploy to DigitalOcean App Platform
1. **Create a new app** in DigitalOcean App Platform
2. **Add components**:
   - Frontend: Static Site from GitHub
   - Backend: Web Service from GitHub
   - Database: Dev Database (PostgreSQL)
3. **Configure environment variables** in the platform
4. **Deploy**

### Option 3: Traditional VPS Deployment

1. **Setup Node.js and PostgreSQL**:
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Setup the database**:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE period_tracker;
   CREATE USER period_user WITH ENCRYPTED PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE period_tracker TO period_user;
   \q
   ```

3. **Build and deploy**:
   ```bash
   # Backend
   cd backend
   npm install
   npm run build
   npm run prisma:migrate deploy
   
   # Frontend
   cd frontend
   npm install
   npm run build
   # Serve the dist folder with a web server
   ```

4. **Use PM2 for process management**:
   ```bash
   npm install -g pm2
   cd backend
   pm2 start dist/index.js --name period-tracker-api
   pm2 save
   pm2 startup
   ```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **HTTPS**: Always use HTTPS in production
3. **Database**: Use strong passwords and restrict access
4. **API Keys**: Rotate JWT secrets regularly
5. **Rate Limiting**: Configured by default (100 req/15min in production)
6. **CORS**: Configure appropriate origins in production

## 📱 PWA Installation

### iOS
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

### Android
1. Open the app in Chrome
2. Tap the menu (3 dots)
3. Select "Add to Home screen"

### Desktop
1. Look for the install icon in the address bar
2. Click "Install"

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Periods
- `GET /api/periods` - Get user's periods
- `POST /api/periods` - Create new period
- `PUT /api/periods/:id` - Update period
- `DELETE /api/periods/:id` - Delete period
- `GET /api/periods/current` - Get current active period

### Predictions
- `GET /api/predictions` - Get cycle predictions

### User
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Icons by [OpenMoji](https://openmoji.org/)
- Date handling by [date-fns](https://date-fns.org/)
- UI components inspired by Material Design

## 📞 Support

- Create an issue for bug reports
- Start a discussion for feature requests
- Email: support@yourapp.com

---

Made with ❤️ for better period tracking