import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Mail } from "lucide-react-native";

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FFD1DC", "#FFFBF5", "#FFE4C4"]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>
              derm<Text style={styles.logoCircle}>o</Text>ra
            </Text>
          </View>

          <View style={styles.bottomSection}>
            <Text style={styles.tagline}>Your skin journey start here!</Text>

            <TouchableOpacity
              style={styles.emailButton}
              onPress={() => router.push("/signup")}
            >
              <Mail size={20} color="#000" style={styles.buttonIcon} />
              <Text style={styles.emailButtonText}>Sign Up with Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => {}}
            >
              <Image
                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Sign Up with Google</Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.loginLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
  },
  logoContainer: {
    marginTop: 100,
  },
  logoText: {
    fontSize: 64,
    fontWeight: "300",
    color: "#E57373", // Soft reddish-pink
    letterSpacing: -2,
  },
  logoCircle: {
    color: "#FFF",
    fontWeight: "900",
  },
  bottomSection: {
    width: "100%",
    paddingHorizontal: 30,
    alignItems: "center",
    marginBottom: 40,
  },
  tagline: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4A3232",
    marginBottom: 40,
    textAlign: "center",
  },
  emailButton: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    width: "100%",
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 10,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A3232",
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    width: "100%",
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A3232",
  },
  loginContainer: {
    flexDirection: "row",
  },
  loginText: {
    color: "#7D5A5A",
    fontSize: 14,
  },
  loginLink: {
    color: "#4A3232",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
