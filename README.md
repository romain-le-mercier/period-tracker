# Period Tracker - Privacy-First PWA

A minimalist, fully local period tracking Progressive Web App (PWA) built with React and TypeScript. Track your menstrual cycle with intelligent predictions and symptom logging - all data stays on your device.

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
- 🔐 **100% Private**: All data stored locally on your device using IndexedDB
- 🚫 **No Server**: No backend, no authentication, no data collection
- ⚡ **PWA Technology**: Installable as a native app
- 🚀 **Fast Performance**: Optimized React application
- 🛡️ **Type-Safe**: Full TypeScript implementation
- 📤 **Data Export**: Export/import your data anytime

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **IndexedDB** for local data storage
- **PWA** with full offline support
- **i18next** for internationalization
- **date-fns** for date manipulation
- **Zod** for validation

## 📋 Prerequisites

- Node.js 18+ 
- Git
- A modern web browser

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/period-tracker.git
cd period-tracker/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at http://localhost:7850

## 🔧 Development

```bash
cd frontend
npm install
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
npm test        # Run tests
npm run lint    # Run linter
```

## 🌍 Deployment

Since this is a static PWA with no backend, deployment is simple:

### Option 1: Static Hosting (Recommended)

#### Vercel
```bash
npm i -g vercel
cd frontend
vercel
```

#### Netlify
```bash
# Build the app
npm run build

# Deploy to Netlify
# Drag and drop the 'build' folder to netlify.com
```

#### GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"predeploy": "npm run build",
"deploy": "gh-pages -d build"

# Deploy
npm run deploy
```

### Option 2: Self-Hosted

1. **Build the application**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Serve with any static web server**:
   ```bash
   # Using Node.js
   npx serve build -p 8080
   
   # Using Python
   cd build && python -m http.server 8080
   
   # Using Nginx
   # Copy build folder contents to /var/www/html
   ```

### Option 3: Docker

Create a simple Dockerfile:
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t period-tracker .
docker run -p 8080:80 period-tracker
```

## 🔒 Privacy & Security

1. **100% Local Storage**: All data is stored in IndexedDB on the user's device
2. **No Server Communication**: The app never sends data to any server
3. **No Authentication**: No accounts, no passwords, no tracking
4. **Data Export**: Users can export their data anytime
5. **HTTPS**: Use HTTPS when hosting to ensure secure delivery of the app
6. **No Analytics**: No tracking scripts or analytics

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

## 📚 Data Storage

The app uses IndexedDB to store all data locally:

### Data Models
- **Periods**: Start/end dates, flow intensity, symptoms, notes
- **Cycles**: Calculated cycle data and statistics
- **Predictions**: AI-powered predictions for future cycles
- **Settings**: User preferences, language, theme

### Data Management
- All data is stored in the browser's IndexedDB
- Data persists across app sessions
- Users can export data as JSON
- Users can import previously exported data
- Clear all data option available in settings

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