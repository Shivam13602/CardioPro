# CardioPro Fitness App

<img src="assets/icon.png" alt="CardioPro Logo" width="120" height="120" />

A comprehensive fitness tracking application designed to help users monitor their cardio workouts, set goals, and make consistent progress in their fitness journey.

## Features

- **GPS Workout Tracking**: Track your runs, walks, cycling, and HIIT workouts with real-time GPS mapping
- **User-Specific Workout History**: View your workout history with detailed statistics and metrics
- **Training Programs**: Follow structured workout programs tailored to different fitness levels
- **Offline Functionality**: Continue tracking workouts even without internet connection
- **Personalized Profiles**: Maintain your fitness profile with goals and stats
- **Visual Progress**: See your routes and performance metrics for each workout
- **Achievement System**: Earn achievements as you reach fitness milestones

## Screenshots

<div style="display: flex; flex-wrap: wrap; justify-content: space-around;">
  <img src="assets/screenshots/home.png" alt="Home Screen" width="200" />
  <img src="assets/screenshots/tracking.png" alt="Workout Tracking" width="200" />
  <img src="assets/screenshots/programs.png" alt="Training Programs" width="200" />
  <img src="assets/screenshots/stats.png" alt="Workout Stats" width="200" />
</div>

## Technical Details

- Built with React Native and Expo for cross-platform compatibility
- Firebase Authentication for secure user management
- Firestore Database for cloud data storage
- AsyncStorage for local data persistence when offline
- React Navigation for seamless screen transitions
- Expo Location API for precise GPS tracking
- React Native Maps for route visualization
- Expo Sensors for step counting and activity detection

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Firebase account (for authentication and database)
- Google Maps API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Shivam13602/CardioPro.git
   cd CardioPro
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration and Google Maps API key

4. Start the development server:
   ```bash
   npx expo start
   ```

5. Run on a device or emulator:
   - Scan the QR code with the Expo Go app on your phone
   - Press 'a' in the terminal to open in an Android emulator
   - Press 'i' to open in an iOS simulator

## Project Structure

```
CardioPro/
├── assets/             # Images, fonts, and static resources
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React Context providers
│   ├── screens/        # App screens
│   ├── services/       # API and service integrations
│   ├── utils/          # Utility functions
│   └── config/         # Configuration files
├── App.js              # App entry point
└── firebase-config/    # Firebase configuration files
```

## API Keys

The app requires the following API keys that need to be configured in your `.env` file:

- Firebase - Authentication and database
- Google Maps - Route visualization and tracking
- (Optional) Weather API - For weather conditions during workouts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Expo Team for their excellent React Native tooling
- Firebase for authentication and database services
- The open-source community for various packages used in this project 
