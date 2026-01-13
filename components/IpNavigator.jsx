import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Animated } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

import IpTopBar from "./IpTopBar";

// Screens
import Marketplace from "../screens/Marketplace";
import IpDashboard from "../screens/IpDashboard";
import Wallet from "../screens/Wallet";
import IpJourney from "../screens/IpJourney";
import Chat from "../screens/Chat";

const Tab = createBottomTabNavigator();
const BRAND_GREEN = "#16A34A";

export default function IpNavigator({ userId, role = "IP", onLogout }) {
  React.useEffect(() => {
    NavigationBar.setBackgroundColorAsync(BRAND_GREEN).catch(() => {});
    NavigationBar.setButtonStyleAsync("light").catch(() => {});
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_GREEN }}>
      <Tab.Navigator
        screenOptions={({ route, navigation }) => ({
          headerShown: true,
          header: (props) => (
            <IpTopBar
              {...props}
              onLogout={onLogout}
              onOpenProfile={() =>
                navigation.navigate("Profile", { userId, role })
              }
            />
          ),
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
          tabBarStyle: {
            height: 70,
            backgroundColor: BRAND_GREEN,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.2)",
          },
          tabBarLabelStyle: { fontWeight: "600", fontSize: 11, marginBottom: 2 },
          tabBarIcon: ({ color, focused }) => {
            let name = "ellipse-outline";
            switch (route.name) {
              case "Connect":
                name = focused ? "people" : "people-outline";
                break;
              case "Dashboard":
                name = focused ? "speedometer" : "speedometer-outline";
                break;
              case "Wallet":
                name = focused ? "card" : "card-outline";
                break;
              case "Journey":
                name = focused ? "map" : "map-outline";
                break;
              case "Chat":
                name = focused ? "chatbubbles" : "chatbubbles-outline";
                break;
            }

            // ripple animation
            const rippleScale = React.useRef(new Animated.Value(0)).current;
            const rippleOpacity = React.useRef(new Animated.Value(0)).current;

            React.useEffect(() => {
              if (focused) {
                rippleScale.setValue(0);
                rippleOpacity.setValue(0.4);
                Animated.parallel([
                  Animated.timing(rippleScale, {
                    toValue: 1.8,
                    duration: 400,
                    useNativeDriver: true,
                  }),
                  Animated.timing(rippleOpacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                  }),
                ]).start();
              }
            }, [focused]);

            return (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  height: 40,
                  width: 40,
                }}
              >
                <Animated.View
                  style={{
                    position: "absolute",
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(255,255,255,0.3)",
                    transform: [{ scale: rippleScale }],
                    opacity: rippleOpacity,
                  }}
                />
                <Ionicons name={name} size={24} color={color} />
              </View>
            );
          },
        })}
        initialRouteName="Dashboard"
      >
        <Tab.Screen name="Connect">
          {({ navigation }) => (
            <Marketplace
              userId={userId}
              onOpenChat={() => navigation.navigate("Chat")}
              onOpenWallet={() => navigation.navigate("Wallet")}
            />
          )}
        </Tab.Screen>

        <Tab.Screen
          name="Dashboard"
          component={IpDashboard}
          initialParams={{ role, userId }}
        />

        <Tab.Screen name="Wallet">
          {({ navigation }) => <Wallet userId={userId} />}
        </Tab.Screen>

        <Tab.Screen name="Journey">
          {({ navigation }) => <IpJourney userId={userId} />}
        </Tab.Screen>

        <Tab.Screen
          name="Chat"
          component={Chat}
          initialParams={{ userId, role }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}
