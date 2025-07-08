# WatermelonDB Studio

<p>
<a href="https://badge.fury.io/js/watermelondb-studio"><img src="https://badge.fury.io/js/watermelondb-studio.svg" alt="npm version" height="30"></a>
<a href="https://www.buymeacoffee.com/vucinatim" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="20" style="margin-left: 10px;"></a>
</p>

A developer tool for browsing and managing your WatermelonDB database directly from your device, inspired by tools like Flipper, but with no native client installation needed.

It provides an on-device server and a web-based client to view, query, and manage your database in real-time.

![Screenshot of WatermelonDB Studio](https://raw.githubusercontent.com/vucinatim/watermelondb-studio/main/assets/screenshot.png)

## Features

-   **Live Database Inspection:** Connect directly to your app's WatermelonDB instance on a running device or simulator.
-   **Wireless Connectivity:** Works over your local Wi-Fi network, no USB cable required.
-   **QR Code Connection:** A simple and fast connection process using your webcam to scan a QR code.
-   **Browse Tables:** View and paginate through all the records in your tables.
-   **Raw SQL Queries:** Run custom SQL queries against the database and see the results instantly.
-   **CRUD Operations:** Create, Read, Update, and Delete records through the web interface.
-   **Expo & Bare React Native:** Compatible with both major React Native development environments.

## Installation & Setup

### 1. Install Package

```sh
yarn add watermelondb-studio
# or
npm install watermelondb-studio
```

### 2. Install Peer Dependencies

This package relies on several peer dependencies which you need to install in your project.

```sh
yarn add @react-native-async-storage/async-storage expo-device expo-network react-native-svg react-native-tcp-socket
# or
npm install @react-native-async-storage/async-storage expo-device expo-network react-native-svg react-native-tcp-socket
```

> **Note:** You must already have `@nozbe/watermelondb` installed and configured in your project.

This package itself contains no native code, which means it won't introduce new sources of native build errors. The native modules it relies on are the peer dependencies listed above, many of which may already be in your project.

### 3. Native Dependencies

If you are using a bare React Native project (not Expo), you will need to ensure the native modules for `react-native-svg` and `react-native-tcp-socket` are correctly linked.

Run `npx pod-install` for iOS. For Android, the autolinking should handle it, but please refer to the respective packages' documentation if you encounter any issues.

## How It Works

WatermelonDB Studio has two parts:

1.  **The In-App Component (`DebugProvider`):** You add this to your React Native app. It wraps your application and starts a small server that has direct access to your WatermelonDB instance.
2.  **The Web Client:** A separate web application that you run from your terminal. This client provides the UI for interacting with your database and connects to the in-app server over your local network.

## Usage

### 1. Wrap Your App with DebugProvider

In your app's entry file (e.g., `App.tsx`), import the `DebugProvider` and wrap your root component. It's highly recommended to only enable it during development.

```jsx
// App.tsx
import { DebugProvider } from 'watermelondb-studio';
import { database } from './path/to/your/db'; // 👈 Make sure to import your database instance

const App = () => (
  // The DebugProvider should be one of your top-level components
  <DebugProvider database={database} enabled={__DEV__}>
    {/* The rest of your app */}
  </DebugProvider>
);

export default App;
```

### 2. Run the Studio Client

In your project's root directory, run the following command in your terminal:

```sh
npx watermelondb-studio
```

This will start the web server and should automatically open the Studio client in your browser.

### 3. Connect to Your App

1.  With your React Native app running on a device or simulator, **use a four-finger tap** on the screen to open the debug overlay.
2.  Tap the **"Start Server"** button. The server status will change to "Running," and a QR code will appear.
3.  In the **web client** (in your browser), click the **"Scan QR Code"** button.
4.  Allow browser permissions for your webcam, and point it at the QR code displayed on your device's screen.
5.  The client will automatically connect, and you will see your database tables appear.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
