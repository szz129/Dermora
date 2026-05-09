import { Tabs } from "expo-router";
import { Home, Maximize, Calendar, User, Smile, Stethoscope } from "lucide-react-native";
import React, { useRef, useEffect } from "react";
import { View, Animated, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS = [
  { name: "index", icon: Home, label: "Home" },
  { name: "scanner", icon: Maximize, label: "Scan" }, 
  { name: "cycle", icon: Calendar, label: "Cycle" },
  { name: "products", icon: Smile, label: "Products" }, 
  { name: "profile", icon: User, label: "Profile" },
];

const TAB_HEIGHT = 65;
const ICON_SIZE = 22;
const ACTIVE_COLOR = "#FFB6C1"; 
const INACTIVE_COLOR = "#4A3232"; 

export default function TabLayout() {
  const { width } = Dimensions.get("window");
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFBF5' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.1,
            shadowRadius: 15,
            height: TAB_HEIGHT,
            position: "absolute",
            bottom: Math.max(insets.bottom, 20), // Responsive bottom positioning
            left: 20,
            right: 20,
            borderRadius: TAB_HEIGHT / 2,
            paddingBottom: 0,
          },
          tabBarItemStyle: {
            height: TAB_HEIGHT,
            justifyContent: 'center',
            alignItems: 'center',
          },
        }}
      >
        {ICONS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.label,
              tabBarIcon: ({ focused }) => {
                const scale = useRef(new Animated.Value(focused ? 1.1 : 1)).current;

                useEffect(() => {
                  Animated.spring(scale, {
                    toValue: focused ? 1.1 : 1,
                    useNativeDriver: true,
                  }).start();
                }, [focused]);

                return (
                  <Animated.View
                    style={{
                      transform: [{ scale }],
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2,
                    }}
                  >
                    <tab.icon 
                      color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} 
                      size={ICON_SIZE} 
                      strokeWidth={focused ? 2.5 : 2}
                    />
                    {focused && (
                       <View style={styles.activeDot} />
                    )}
                  </Animated.View>
                );
              },
            }}
          />
        ))}
        <Tabs.Screen name="doctors" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    marginTop: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACTIVE_COLOR,
  },
});