import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";

import CustomDrawerContent from "./CustomDrawerContent";
import IpNavigator from "./IpNavigator";

// Drawer-only screens
import Favorites from "../screens/Favorites";
import Notifications from "../screens/Notifications";
import IpContracts from "../screens/IpContracts";
import Referral from "../screens/Referral";
import Dispute from "../screens/Dispute";
import Profile from "../screens/Profile";

const Drawer = createDrawerNavigator();
const BRAND_GREEN = "#16A34A";

export default function IpDrawerNavigator({ userId, onLogout }) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent {...props} userId={userId} onLogout={onLogout} />
      )}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: BRAND_GREEN,
        drawerActiveTintColor: "#fff",
        drawerInactiveTintColor: "#111",
        drawerLabelStyle: { marginLeft: -12, fontSize: 15 },
      }}
    >
      {/* Main Tabs */}
      <Drawer.Screen
        name="Main"
        options={{
          title: "Home",
          drawerIcon: ({ color }) => (
            <Ionicons name="home-outline" size={20} color={color} />
          ),
        }}
      >
        {() => <IpNavigator userId={userId} onLogout={onLogout} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Favorites"
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="heart-outline" size={20} color={color} />
          ),
        }}
      >
        {(props) => <Favorites {...props} userId={userId} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Notifications"
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="notifications-outline" size={20} color={color} />
          ),
        }}
      >
        {(props) => <Notifications {...props} userId={userId} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Contracts"
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="document-text-outline" size={20} color={color} />
          ),
        }}
      >
        {(props) => <IpContracts {...props} userId={userId} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Referral"
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="gift-outline" size={20} color={color} />
          ),
        }}
      >
        {(props) => <Referral {...props} userId={userId} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Support"
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="headset-outline" size={20} color={color} />
          ),
        }}
      >
        {(props) => <Dispute {...props} userId={userId} role="IP" />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Profile"
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={20} color={color} />
          ),
        }}
      >
        {(props) => <Profile {...props} userId={userId} role="IP" />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
