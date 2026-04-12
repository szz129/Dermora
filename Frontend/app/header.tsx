import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function Header({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.textContainer}>
        {title && <Text style={styles.greetingText}>{title}</Text>}
        {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
      </View>
      <Image
        // Path preserved from your working version
        source={require("./(tabs)/logo.png")} 
        style={styles.logoImage}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 25,
    paddingTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: 'transparent',
  },
  textContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4A3232", // New brand brown
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 14,
    color: "#7D5A5A", // New soft subtext color
    marginTop: 2,
    lineHeight: 18,
  },
  logoImage: {
    width: 60,
    height: 60,
    marginLeft: 15,
  },
});