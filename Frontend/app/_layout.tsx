import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Platform } from 'react-native';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = 'button, a, input, textarea, select, * { outline: none !important; -webkit-tap-highlight-color: transparent !important; }';
  document.head.appendChild(style);
}
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, StyleSheet } from "react-native";
// Use Supabase store if available, falls back to AsyncStorage
import { SkincareStoreProvider } from "../hooks/use-skincare-store-supabase";
import { AuthProvider, useAuth } from "../hooks/use-auth";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Theme Constants
const COLORS = {
  primary: '#FFB6C1',
  background: '#FFFBF5',
  textMain: '#4A3232',
};

function RootLayoutNav() {
  const { isAuthenticated, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;

    // Use string[] to avoid strict tuple type errors with new routes
    const routeSegments = segments as string[];
    const inAuthGroup = routeSegments[0] === 'login' || routeSegments[0] === 'signup' || routeSegments[0] === 'onboarding' || routeSegments.length === 0;

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect unauthenticated users trying to access protected routes
      router.replace('/onboarding');
    } else if (isAuthenticated && (inAuthGroup || routeSegments[0] === 'onboarding')) {
      // Redirect authenticated users trying to access auth/onboarding pages
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, initializing, segments]);

  return (
    <Stack 
      screenOptions={{ 
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.textMain,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false, // Cleaner look matching Figma
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Questionnaire is usually shown with a header, styled to match theme */}
      <Stack.Screen 
        name="questionnaire" 
        options={{ 
          headerShown: false, // Set to false if you are using the custom header in the file
          title: "Skin Profile" 
        }} 
      />
    </Stack>
  );
}

function AppContent() {
  const { initializing } = useAuth();

  useEffect(() => {
    if (!initializing) {
      SplashScreen.hideAsync();
    }
  }, [initializing]);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        {/* ActivityIndicator color changed to match Primary Pink */}
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SkincareStoreProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </SkincareStoreProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background, // Changed from #FAFAFA to Cream
  },
});