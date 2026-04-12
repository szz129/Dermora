import React from "react";
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, SafeAreaView } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Clock, Lightbulb, Maximize, ChevronRight, Sun, Moon, Calendar } from "lucide-react-native";
import { router } from "expo-router";
import { useSkincareStore } from "../../hooks/use-skincare-store-supabase";
import { useAuth } from "../../hooks/use-auth";

const { width } = Dimensions.get("window");

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

const CYCLE_TIPS: Record<string, string> = {
  menstrual: "Use gentle, fragrance-free products today.",
  follicular: "Great time for vitamin C and brightening serums!",
  ovulation: "Skin is at its best — protect with SPF 50+.",
  luteal: "Watch for hormonal breakouts — use niacinamide.",
  unknown: "Track your cycle for personalised skin tips.",
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function HomeScreen() {
  const { userProfile, recommendations, getHealthScore, getCurrentCyclePhase, skinAnalyses, refreshRecommendations } = useSkincareStore();
  const { user } = useAuth();

  const skinHealth = getHealthScore() || 70;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (skinHealth / 100) * circumference;

  const currentPhase = getCurrentCyclePhase();
  const userName = userProfile?.name || user?.user_metadata?.name || "User";
  const isDay = new Date().getHours() > 6 && new Date().getHours() < 18;

  const latestScan = skinAnalyses && skinAnalyses.length > 0 ? skinAnalyses[0] : null;
  const latestCondition = latestScan?.concerns?.[0] || null;
  const conditionLabel = latestCondition ? (CONDITION_LABELS[latestCondition] || latestCondition) : null;

  const today = new Date();
  const todayDate = today.getDate();
  const todayDay = today.getDay();
  const currentMonth = MONTHS[today.getMonth()];
  const currentYear = today.getFullYear();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(todayDate - todayDay + i);
    return {
      day: DAYS_SHORT[d.getDay()].charAt(0),
      date: d.getDate(),
      isToday: d.getDate() === todayDate && d.getMonth() === today.getMonth(),
    };
  });

  const cycleTip = CYCLE_TIPS[currentPhase] || CYCLE_TIPS.unknown;
  useFocusEffect(
    useCallback(() => {
      refreshRecommendations();
    }, [])
  );
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topHeader}>
          <Text style={styles.greeting}>Hey {userName}!</Text>
          <Text style={styles.welcomeSub}>Let's check your skin today.</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Svg height="200" width="200" viewBox="0 0 200 200">
              <Circle cx="100" cy="100" r={radius} stroke="#FFF0F3" strokeWidth="15" fill="none" />
              <Circle cx="100" cy="100" r={radius} stroke={COLORS.primaryPink} strokeWidth="15" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="none" transform="rotate(-90 100 100)" />
            </Svg>
            <View style={styles.scoreTextContainer}>
              <Text style={styles.scoreNumber}>{skinHealth}%</Text>
              <Text style={styles.scoreLabel}>Skin health</Text>
            </View>
          </View>
        </View>

        <View style={styles.ageBadge}>
          <Text style={styles.ageText}>{conditionLabel ? `Detected: ${conditionLabel}` : "Scan to detect condition"}</Text>
        </View>

        <TouchableOpacity style={styles.rescanButton} onPress={() => router.push("/scanner")}>
          <Text style={styles.rescanText}>Tap to {latestScan ? "rescan" : "scan"}</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.routineHeader}>
            <Text style={styles.sectionTitle}>TODAY'S ROUTINE</Text>
            <View style={styles.routineIcon}>
              {isDay ? <Sun size={18} color={COLORS.accentRed} /> : <Moon size={18} color={COLORS.accentRed} />}
            </View>
          </View>
          <View style={[styles.routineCard, recommendations.length === 0 && { backgroundColor: '#F5F5F5' }]}>
            <View style={styles.routineList}>
              {recommendations.length > 0 ? (
                recommendations.slice(0, 4).map((rec, idx) => (
                <Text key={idx} style={styles.routineItem}>• {rec.product_name || rec.name}</Text>
              ))
              ) : (
                <Text style={[styles.routineItem, { opacity: 0.5 }]}>Complete quiz to see routine</Text>
              )}
            </View>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push("/products")}>
              <ChevronRight size={20} color={COLORS.textMain} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.calendarHeader}>
          <Calendar size={18} color={COLORS.textMain} style={{ marginRight: 8 }} />
          <Text style={styles.calendarTitle}>{currentMonth} {currentYear}</Text>
        </View>
        <View style={styles.calendarRow}>
          {weekDays.map((item, idx) => (
            <View key={idx} style={styles.calendarDayCol}>
              <Text style={styles.dayLabel}>{item.day}</Text>
              <View style={[styles.dayCircle, item.isToday && styles.selectedDay]}>
                <Text style={[styles.dayText, item.isToday && styles.selectedDayText]}>{item.date}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.periodBanner}>
          <Text style={styles.periodBannerText}>
            Your mood and skin are affected by the <Text style={{ fontWeight: 'bold' }}>{currentPhase}</Text> phase.
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push("/cycle")}>
            <Clock size={22} color={COLORS.accentRed} />
            <Text style={styles.actionItemText}>{currentPhase} Phase Tracking</Text>
          </TouchableOpacity>
          <View style={styles.actionItem}>
            <Lightbulb size={22} color={COLORS.accentRed} />
            <Text style={styles.actionItemText}>{cycleTip}</Text>
          </View>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push("/scanner")}>
            <Maximize size={22} color={COLORS.accentRed} />
            <Text style={styles.actionItemText}>See Scan's insights</Text>
            <ChevronRight size={20} color="#CCC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 150 },
  topHeader: { paddingHorizontal: 25, marginTop: 20, marginBottom: 10 },
  greeting: { fontSize: 28, fontWeight: '800', color: COLORS.textMain },
  welcomeSub: { fontSize: 16, color: COLORS.textSub, marginTop: 4 },
  progressSection: { alignItems: "center", justifyContent: "center", marginTop: 10, position: 'relative', width: '100%' },
  scoreTextContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  scoreNumber: { fontSize: 42, fontWeight: "700", color: COLORS.textMain },
  scoreLabel: { fontSize: 16, color: COLORS.textMain, fontWeight: '500' },
  ageBadge: { backgroundColor: "#FFF0F3", alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 15, marginTop: 20 },
  ageText: { fontSize: 16, color: COLORS.textMain, fontWeight: '600', textAlign: 'center' },
  rescanButton: { alignSelf: 'center', marginTop: 15, borderWidth: 1, borderColor: '#FADADD', paddingVertical: 6, paddingHorizontal: 15, borderRadius: 10 },
  rescanText: { color: COLORS.textMain, fontSize: 12 },
  section: { marginTop: 40, paddingHorizontal: 25 },
  routineHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textMain, textAlign: 'center', letterSpacing: 1 },
  routineIcon: { opacity: 0.8 },
  routineCard: { backgroundColor: COLORS.secondaryPink, borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routineList: { gap: 8, flex: 1 },
  routineItem: { fontSize: 16, color: COLORS.textMain, fontWeight: '500' },
  viewAllBtn: { padding: 5 },
  calendarHeader: { paddingHorizontal: 25, marginTop: 40, flexDirection: 'row', alignItems: 'center' },
  calendarTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textMain },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 10, marginTop: 15 },
  calendarDayCol: { alignItems: 'center', gap: 8 },
  dayLabel: { fontSize: 11, color: COLORS.textSub, fontWeight: '600' },
  dayCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.secondaryPink, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 13, color: COLORS.textMain, fontWeight: '600' },
  selectedDay: { backgroundColor: COLORS.accentRed },
  selectedDayText: { color: '#FFF' },
  periodBanner: { backgroundColor: COLORS.secondaryPink, marginHorizontal: 25, marginTop: 20, padding: 16, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#FADADD' },
  periodBannerText: { fontSize: 14, color: COLORS.textMain, textAlign: 'center', lineHeight: 20 },
  actionsContainer: { marginTop: 25, paddingHorizontal: 25, gap: 12 },
  actionItem: { backgroundColor: COLORS.white, padding: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  actionItemText: { flex: 1, marginLeft: 15, fontSize: 16, color: COLORS.textMain, fontWeight: '500' },
});