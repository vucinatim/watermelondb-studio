#!/bin/bash
echo "🔎 Discovering Android device IP address..."

# Try to get the IP address from the wlan0 interface.
# The `tr -d '\r'` is important to remove carriage returns from the adb shell output.
IP=$(adb shell ip route | awk '/wlan0/ {print $9}' | tr -d '\r')

if [ -z "$IP" ]; then
    echo "❌ Could not determine device IP address via 'ip route'."
    echo "   Attempting fallback method..."
    # Fallback for some devices: query the network properties directly.
    IP=$(adb shell getprop dhcp.wlan0.ipaddress | tr -d '\r')
fi

if [ -z "$IP" ]; then
    echo "❌ Could not determine device IP address."
    echo "   Please ensure your Android device is connected via USB,"
    echo "   is on the same Wi-Fi network as your computer,"
    echo "   and has USB debugging enabled."
    exit 1
fi

echo "✅ Device IP found: $IP"
echo "🚀 Starting development server for the DB Viewer..."

# Pass the IP to Vite as an environment variable and use --host to make it accessible
# on the local network.
VITE_DEVICE_IP=$IP vite --host 