import { Tabs } from "expo-router";
import { Home, Maximize, Calendar, User, Smile, Stethoscope } from "lucide-react-native";
import React, { useRef, useEffect } from "react";
import { View, Animated, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS = [
  { name: "index", icon: Home, label: "Home" },
  { name: "scanner", icon: Maximize, label: "Scan" }, 
  { name: "cycle", icon: Calendar, label: "Cycle" },
  { name: "doctors", icon: Stethoscope, label: "Doctors" },
  { name: "products", icon: Smile, label: "Products" }, 
  { name: "profile", icon: User, label: "Profile" },
];

const TAB_HEIGHT = 64;
const ICON_SIZE = 24;
const ACTIVE_COLOR = "#FFB6C1"; 
const INACTIVE_COLOR = "#7D5A5A"; 

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
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            borderTopWidth: 0,
            elevation: 25,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 15,
            height: TAB_HEIGHT + Math.max(insets.bottom, 16), 
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: Math.max(insets.bottom, 16),
            paddingHorizontal: 20,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          },
          tabBarItemStyle: {
            height: TAB_HEIGHT,
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
                      height: TAB_HEIGHT,
                      width: '100%',
                    }}
                  >
                    <tab.icon 
                      color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} 
                      size={ICON_SIZE} 
                      strokeWidth={focused ? 2.5 : 2}
                    />
                    {focused && <View style={styles.activeDot} />}
                  </Animated.View>
                );
              },
            }}
          />
        ))}
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
    position: 'absolute',
    bottom: 8,
  },
});