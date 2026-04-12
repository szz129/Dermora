import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  Moon,
  Camera,
  User,
  History,
} from "lucide-react-native";
import { useAuth } from "../../hooks/use-auth";
import { useSkincareStore } from "../../hooks/use-skincare-store-supabase";
import { router } from "expo-router";

const COLORS = {
  background: "#FFFBF5",
  primaryPink: "#FFB6C1",
  secondaryPink: "#FFE4E9",
  accentRed: "#E57373",
  textMain: "#4A3232",
  textSub: "#7D5A5A",
  white: "#FFFFFF",
};

const CONDITION_LABELS: Record<string, string> = {
  acne: "Acne",
  dark_spots: "Dark Spots",
  hyperpigmentation: "Hyperpigmentation",
  melasma: "Melasma",
  normal_skin: "Normal Skin",
  redness: "Redness",
};

export default function ProfileScreen() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { userProfile, skinAnalyses, getCurrentCyclePhase, getHealthScore } = useSkincareStore();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState<boolean>(true);

  const healthScore = getHealthScore();
  const currentPhase = getCurrentCyclePhase();

  const latestScan = skinAnalyses && skinAnalyses.length > 0 ? skinAnalyses[0] : null;
  const latestCondition = latestScan?.concerns?.[0] || null;
  const conditionLabel = latestCondition ? (CONDITION_LABELS[latestCondition] || latestCondition) : null;

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm("Are you sure you want to sign out?");
      if (confirm) {
        await signOut();
        router.replace("/login");
      }
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const { error } = await signOut();
          if (error) {
            Alert.alert("Error", "Failed to sign out.");
          } else {
            router.replace("/login");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <User color={COLORS.primaryPink} size={40} />
            </View>
            <TouchableOpacity style={styles.cameraIcon}>
              <Camera color="#FFF" size={14} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>
            {userProfile?.name || user?.user_metadata?.name || "User"}
          </Text>
          <Text style={styles.profileEmail}>{user?.email || ""}</Text>
        </View>

        {/* Skin Profile Card */}
        <View style={styles.skinProfileCard}>
          <View style={styles.skinProfileHeader}>
            <View style={styles.skinInfo}>
              <Text style={styles.cardTitle}>Skin Profile</Text>
              <View style={styles.badgeRow}>
                {conditionLabel ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{conditionLabel}</Text>
                  </View>
                ) : (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>No Scan Yet</Text>
                  </View>
                )}
              </View>
              <Text style={styles.skinAgeText}>
                {latestScan
                  ? `Last Scan: ${new Date(latestScan.date).toLocaleDateString()}`
                  : 'Scan to see your skin health'}
              </Text>
            </View>

            {/* Circular Health Score */}
            <View style={styles.healthCircle}>
              <Text style={styles.healthPercent}>{healthScore}%</Text>
              <Text style={styles.healthLabel}>Skin health</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Cycle Card */}
        <TouchableOpacity style={styles.menuItemCard} onPress={() => router.push("/cycle")}>
          <View style={styles.menuIconContainer}>
            <Moon color={COLORS.primaryPink} size={24} fill={COLORS.primaryPink} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>{currentPhase} Phase</Text>
            <Text style={styles.menuSubtitle}>Check your skin condition for this phase</Text>
          </View>
          <ChevronRight color="#CCC" size={20} />
        </TouchableOpacity>

        {/* Scanner History Section */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <History color={COLORS.textMain} size={20} />
            <Text style={styles.sectionTitle}>Scanner History</Text>
          </View>

          {skinAnalyses && skinAnalyses.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyList}>
              {skinAnalyses.map((scan) => (
                <TouchableOpacity key={scan.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{new Date(scan.date).toLocaleDateString()}</Text>
                    <Text style={styles.historyScore}>{scan.healthScore}%</Text>
                  </View>
                  <Text style={styles.historyType}>
                    {scan.concerns?.[0]
                      ? (CONDITION_LABELS[scan.concerns[0]] || scan.concerns[0])
                      : "Normal"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>Scan skin first</Text>
              <TouchableOpacity style={styles.scanNowBtn} onPress={() => router.push("/scanner")}>
                <Text style={styles.scanNowText}>Go to Scanner</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Settings List */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.simpleMenuItem} onPress={() => router.push("/questionnaire")}>
            <Text style={styles.simpleMenuText}>Edit quiz answers</Text>
            <ChevronRight color="#CCC" size={20} />
          </TouchableOpacity>

          <View style={styles.simpleMenuItem}>
            <Text style={styles.simpleMenuText}>Push Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#E0E0E0", true: COLORS.primaryPink }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleSignOut}
          disabled={authLoading}
        >
          <Text style={styles.logoutText}>{authLoading ? "Signing Out..." : "Log out"}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 120 },
  headerSection: { alignItems: "center", marginTop: 20, marginBottom: 20 },
  avatarContainer: { position: 'relative', marginBottom: 10 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 1, borderColor: COLORS.primaryPink,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#6D4C4C', width: 26, height: 26,
    borderRadius: 13, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  profileName: { fontSize: 22, fontWeight: "700", color: COLORS.textMain },
  profileEmail: { fontSize: 14, color: COLORS.textSub },
  skinProfileCard: {
    backgroundColor: COLORS.white, marginHorizontal: 20,
    padding: 20, borderRadius: 20, borderWidth: 1,
    borderColor: COLORS.primaryPink, marginBottom: 15,
  },
  skinProfileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skinInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textMain, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15,
    borderWidth: 1, borderColor: COLORS.primaryPink, backgroundColor: COLORS.white,
  },
  badgeText: { fontSize: 11, color: COLORS.primaryPink, fontWeight: '500' },
  skinAgeText: { fontSize: 14, color: COLORS.textSub, fontWeight: '500' },
  healthCircle: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 6,
    borderColor: COLORS.primaryPink, borderLeftColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center',
  },
  healthPercent: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  healthLabel: { fontSize: 8, color: COLORS.textSub, textAlign: 'center' },
  menuItemCard: {
    backgroundColor: COLORS.white, marginHorizontal: 20, padding: 16,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.secondaryPink, marginBottom: 15,
  },
  menuIconContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  menuTextContainer: { flex: 1, marginLeft: 10 },
  menuTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textMain },
  menuSubtitle: { fontSize: 12, color: COLORS.textSub },
  historySection: { marginHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textMain },
  historyList: { gap: 12, paddingRight: 20 },
  historyCard: {
    backgroundColor: COLORS.white, width: 140, padding: 15,
    borderRadius: 15, borderWidth: 1, borderColor: COLORS.secondaryPink,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyDate: { fontSize: 10, color: COLORS.textSub },
  historyScore: { fontSize: 12, fontWeight: '700', color: COLORS.accentRed },
  historyType: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },
  emptyHistory: { backgroundColor: COLORS.secondaryPink, padding: 20, borderRadius: 15, alignItems: 'center' },
  emptyHistoryText: { fontSize: 14, color: COLORS.textSub, marginBottom: 10 },
  scanNowBtn: { backgroundColor: COLORS.primaryPink, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  scanNowText: { fontSize: 12, color: COLORS.white, fontWeight: '700' },
  section: {
    backgroundColor: COLORS.white, marginHorizontal: 20, borderRadius: 20,
    paddingVertical: 5, borderWidth: 1, borderColor: COLORS.secondaryPink, marginBottom: 20,
  },
  simpleMenuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.background,
  },
  simpleMenuText: { fontSize: 16, fontWeight: "600", color: COLORS.textMain },
  logoutButton: { marginTop: 10, alignItems: "center" },
  logoutText: { fontSize: 16, fontWeight: "700", color: COLORS.primaryPink },
});