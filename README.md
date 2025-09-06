# 📱 Ribbed AI Mobile App

A React Native app for creating TikTok-style UGC videos with AI-generated avatars and custom voices.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- React Native development environment ([Setup Guide](https://reactnative.dev/docs/set-up-your-environment))
- iOS: Xcode and CocoaPods
- Android: Android Studio

### Installation

```bash
# Install dependencies
npm install

# iOS setup (first time only)
bundle install
bundle exec pod install

# Start Metro bundler
npm start

# Run on device/simulator
npx react-native run-ios     # iOS
npm react-native run-android # Android
```

## App Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React Context providers
├── navigation/     # Navigation setup
├── screens/        # App screens
├── services/       # API and socket services
├── types/          # TypeScript definitions
└── utils/          # Helper functions
```


## 🔧 Configuration

### Backend Connection
Create an `endpoints.ts` file in the root directory:

```typescript
class Endpoints {
  static readonly BASE_URL = 'YOUR_BACKEND_URL/api';
  static readonly SOCKET_URL = 'YOUR_BACKEND_URL';
}

export default Endpoints;
```

Backend repo : https://github.com/Utkarsh4517/ribbed-ai-backend

## Features

- **AI Avatar Creation** - Generate custom avatars from text
- **Script to Video** - Convert text scripts to engaging videos
- **Real-time Updates** - Live generation status via WebSockets
- **Queue Management** - Track video generation progress
- **Profile System** - User authentication and management

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling via NativeWind
- **React Navigation** - Navigation library
- **Socket.IO** - Real-time communication
- **Lottie** - Beautiful animations


