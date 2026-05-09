import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from "react-native";
import { Calendar as CalendarIcon, Activity, Droplets, Smile, Thermometer, Edit2 } from "lucide-react-native";
=======
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  Alert 
} from "react-native";
import { ChevronLeft, Calendar as CalendarIcon, Activity, Droplets, Smile, Thermometer } from "lucide-react-native";
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
import { useSkincareStore } from "../../hooks/use-skincare-store-supabase";

const COLORS = {
  background: "#FFFBF5",
  primaryPink: "#FFB6C1",
  secondaryPink: "#FFE4E9",
  accentRed: "#E57373",
  textMain: "#4A3232",
  textSub: "#7D5A5A",
  white: "#FFFFFF",
  follicular: "#B3E5FC",
  ovulation: "#B2DFDB",
  luteal: "#C8E6C9",
<<<<<<< HEAD
  warning: "#FFF3E0",
  warningIcon: "#FFE0B2",
};

const PHASES = [
  { id: "menstrual", label: "Menstrual", color: COLORS.primaryPink, icon: Droplets },
  { id: "follicular", label: "Follicular", color: COLORS.follicular, icon: Activity },
  { id: "ovulation", label: "Ovulation", color: COLORS.ovulation, icon: Thermometer },
  { id: "luteal", label: "Luteal", color: COLORS.luteal, icon: Smile },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];

export default function CycleScreen() {
  const { addCycleEntry, cycleData, cycleStatus, refreshCycleStatus } = useSkincareStore();

  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [showEditLogger, setShowEditLogger] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Date picker state
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const isFirstTimeUser = !cycleData || cycleData.length === 0;

  useEffect(() => {
    refreshCycleStatus();
  }, []);

  const handleSaveLastPeriod = async () => {
    setIsSaving(true);
    try {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${selectedDay.toString().padStart(2, "0")}`;
      await addCycleEntry({
        date: dateStr,
        phase: "menstrual",
        symptoms: [],
        skinCondition: "Sensitive",
      });
      await refreshCycleStatus();
      setShowFirstTimeSetup(false);
      setShowEditLogger(false);
      if (Platform.OS !== "web") {
        Alert.alert("✅ Done!", "Your cycle has been set up. We'll predict your phases automatically.");
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS !== "web") Alert.alert("Error", "Failed to save. Please try again.");
=======
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PHASES = [
  { id: 'menstrual', label: 'Menstrual', color: COLORS.primaryPink, icon: Droplets },
  { id: 'follicular', label: 'Follicular', color: COLORS.follicular, icon: Activity },
  { id: 'ovulation', label: 'Ovulation', color: COLORS.ovulation, icon: Thermometer },
  { id: 'luteal', label: 'Luteal', color: COLORS.luteal, icon: Smile },
];

const SYMPTOMS = ["Acne", "Cramps", "Bloating", "Headache", "Mood Swings", "Sensitivity", "Dryness"];

export default function CycleScreen() {
  const { addCycleEntry, cycleData } = useSkincareStore();
  const [showLogger, setShowLogger] = useState(false);
  
  // Logger State
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPhase, setSelectedPhase] = useState('menstrual');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSavePeriod = async () => {
    setIsSaving(true);
    try {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
      
      await addCycleEntry({
        date: dateStr,
        phase: selectedPhase as any,
        symptoms: selectedSymptoms,
        skinCondition: selectedSymptoms.includes("Acne") ? "Acne-prone" : "Sensitive",
      });

      if (Platform.OS !== 'web') {
        Alert.alert("Success", "Cycle data logged successfully!");
      }
      setShowLogger(false);
      // Reset symptoms for next log
      setSelectedSymptoms([]);
    } catch (err) {
      console.error(err);
      if (Platform.OS !== 'web') {
        Alert.alert("Error", "Failed to save cycle data.");
      }
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    } finally {
      setIsSaving(false);
    }
  };

<<<<<<< HEAD
  // ── Date Picker UI (shared between first-time and edit) ───────────────────
  const renderDatePicker = (title: string, subtitle: string) => (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.setupScroll}>
        <Text style={styles.setupTitle}>{title}</Text>
        <Text style={styles.setupSubtitle}>{subtitle}</Text>

        {/* Month */}
        <Text style={styles.pickerLabel}>Month</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
          {MONTHS.map((m, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => { setSelectedMonth(idx); setSelectedDay(1); }}
              style={[styles.pickerChip, selectedMonth === idx && styles.pickerChipActive]}
            >
              <Text style={[styles.pickerChipText, selectedMonth === idx && styles.pickerChipTextActive]}>
                {m.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Day */}
        <Text style={styles.pickerLabel}>Day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
          {Array.from({ length: DAYS_IN_MONTH[selectedMonth] }, (_, i) => i + 1).map(d => (
            <TouchableOpacity
              key={d}
              onPress={() => setSelectedDay(d)}
              style={[styles.pickerChip, selectedDay === d && styles.pickerChipActive]}
            >
              <Text style={[styles.pickerChipText, selectedDay === d && styles.pickerChipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Year */}
        <Text style={styles.pickerLabel}>Year</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
          {[2025, 2026].map(y => (
            <TouchableOpacity
              key={y}
              onPress={() => setSelectedYear(y)}
              style={[styles.pickerChip, selectedYear === y && styles.pickerChipActive]}
            >
              <Text style={[styles.pickerChipText, selectedYear === y && styles.pickerChipTextActive]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected date preview */}
        <View style={styles.datePreview}>
          <Text style={styles.datePreviewText}>
            📅 {selectedDay} {MONTHS[selectedMonth]} {selectedYear}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
          onPress={handleSaveLastPeriod}
          disabled={isSaving}
        >
          <Text style={styles.saveBtnText}>{isSaving ? "Saving..." : "Save & Predict My Cycle"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => { setShowFirstTimeSetup(false); setShowEditLogger(false); }}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );

  // ── First time setup screen ───────────────────────────────────────────────
  if (isFirstTimeUser && showFirstTimeSetup) {
    return renderDatePicker(
      "When did your last period start?",
      "We'll use this to predict your current phase, next period date, and personalise your skincare routine."
    );
  }

  // ── Edit logger ───────────────────────────────────────────────────────────
  if (showEditLogger) {
    return renderDatePicker(
      "Update Last Period Date",
      "Enter the start date of your most recent period to recalculate your cycle."
    );
  }

  // ── First time user — no data yet ─────────────────────────────────────────
  if (isFirstTimeUser) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.setupScroll}>
          <Text style={styles.setupTitle}>Cycle Tracker</Text>
          <Text style={styles.setupSubtitle}>
            Track your menstrual cycle to get personalised skin predictions and phase-aware product recommendations.
          </Text>

          <View style={styles.phasePreviewGrid}>
            {PHASES.map(p => (
              <View key={p.id} style={[styles.phasePreviewCard, { borderColor: p.color }]}>
                <p.icon color={p.color} size={28} />
                <Text style={styles.phasePreviewLabel}>{p.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={() => setShowFirstTimeSetup(true)}>
            <CalendarIcon color="#FFF" size={20} />
            <Text style={styles.saveBtnText}>  Set Up My Cycle</Text>
          </TouchableOpacity>
=======
  // Helper to get entry for a specific day
  const getEntryForDay = (day: number) => {
    const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return cycleData.find(d => d.date === dateStr);
  };

  if (showLogger) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.loggerScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.loggerHeader}>
            <TouchableOpacity onPress={() => setShowLogger(false)} style={styles.iconBtn}>
              <ChevronLeft color={COLORS.textMain} size={28} />
            </TouchableOpacity>
            <Text style={styles.loggerTitle}>Log Cycle</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Date Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date</Text>
            <View style={styles.dateRow}>
               <View style={styles.dateBox}>
                 <Text style={styles.dateLabel}>Day</Text>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <TouchableOpacity 
                        key={d} 
                        onPress={() => setSelectedDay(d)}
                        style={[styles.miniBtn, selectedDay === d && styles.miniBtnActive]}
                      >
                        <Text style={[styles.miniBtnText, selectedDay === d && styles.miniBtnTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                 </ScrollView>
               </View>
            </View>
          </View>

          {/* Phase Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Current Phase</Text>
            <View style={styles.phaseGrid}>
              {PHASES.map((p) => (
                <TouchableOpacity 
                  key={p.id} 
                  onPress={() => setSelectedPhase(p.id)}
                  style={[
                    styles.phaseItem, 
                    selectedPhase === p.id && { borderColor: p.color, backgroundColor: p.color + '20' }
                  ]}
                >
                  <p.icon color={selectedPhase === p.id ? p.color : COLORS.textSub} size={24} />
                  <Text style={[styles.phaseLabel, selectedPhase === p.id && { color: COLORS.textMain, fontWeight: '700' }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Symptoms Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>How are you feeling?</Text>
            <View style={styles.chipContainer}>
              {SYMPTOMS.map((s) => (
                <TouchableOpacity 
                  key={s} 
                  onPress={() => toggleSymptom(s)}
                  style={[styles.chip, selectedSymptoms.includes(s) && styles.chipActive]}
                >
                  <Text style={[styles.chipText, selectedSymptoms.includes(s) && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveBtnFull, isSaving && { opacity: 0.7 }]} 
            onPress={handleSavePeriod}
            disabled={isSaving}
          >
            <Text style={styles.saveBtnTextFull}>{isSaving ? "Saving..." : "Log Entry"}</Text>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
        </ScrollView>
      </SafeAreaView>
    );
  }

<<<<<<< HEAD
  // ── Main dashboard (returning user) ──────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Cycle Tracker</Text>
            <Text style={styles.headerSub}>
              {cycleStatus?.current_phase
                ? `${cycleStatus.current_phase.charAt(0).toUpperCase() + cycleStatus.current_phase.slice(1)} Phase`
                : "Calculating..."}
            </Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditLogger(true)}>
            <Edit2 color={COLORS.primaryPink} size={18} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {cycleStatus && cycleStatus.has_data ? (
          <>
            {/* Current phase card */}
            <View style={styles.phaseCard}>
              <View style={styles.phaseCardLeft}>
                <Text style={styles.phaseCardDay}>Day {cycleStatus.cycle_day}</Text>
                <Text style={styles.phaseCardPhase}>
                  {cycleStatus.current_phase.charAt(0).toUpperCase() + cycleStatus.current_phase.slice(1)} Phase
                </Text>
                <Text style={styles.phaseCardCycle}>of {cycleStatus.cycle_length}-day cycle</Text>
              </View>
              <View style={styles.phaseCardRight}>
                <Text style={styles.nextPeriodLabel}>Next Period</Text>
                <Text style={styles.nextPeriodDays}>
                  {cycleStatus.days_until_period === 0
                    ? "Today"
                    : cycleStatus.days_until_period === 1
                    ? "Tomorrow"
                    : `In ${cycleStatus.days_until_period} days`}
                </Text>
                <Text style={styles.nextPeriodDate}>{cycleStatus.next_period_date}</Text>
              </View>
            </View>

            {/* Skin tip card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconBox}>
                <Droplets color={COLORS.primaryPink} size={24} />
              </View>
              <View style={styles.infoTextBox}>
                <Text style={styles.infoTitle}>Today's Skin Tip</Text>
                <Text style={styles.infoSubtitle}>{cycleStatus.skin_tip}</Text>
              </View>
            </View>

            {/* Warning card if exists */}
            {cycleStatus.skin_warning && (
              <View style={[styles.infoCard, { backgroundColor: COLORS.warning }]}>
                <View style={[styles.infoIconBox, { backgroundColor: COLORS.warningIcon }]}>
                  <Thermometer color="#FF9800" size={24} />
                </View>
                <View style={styles.infoTextBox}>
                  <Text style={styles.infoTitle}>Watch Out</Text>
                  <Text style={styles.infoSubtitle}>{cycleStatus.skin_warning}</Text>
                </View>
              </View>
            )}

            {/* 7-day forecast */}
            <Text style={styles.forecastTitle}>7-Day Skin Forecast</Text>
            <View style={styles.forecastRow}>
              {cycleStatus.seven_day_forecast.map((day: any, idx: number) => {
                const phaseInfo = PHASES.find(p => p.id === day.phase);
                return (
                  <View key={idx} style={[styles.forecastCard, day.is_today && styles.forecastCardToday]}>
                    <Text style={styles.forecastDay}>{day.day_label}</Text>
                    <View style={[styles.forecastDot, { backgroundColor: phaseInfo?.color || COLORS.primaryPink }]} />
                    <Text style={styles.forecastPhase}>{day.phase.slice(0, 3).toUpperCase()}</Text>
                    {day.is_today && <Text style={styles.forecastToday}>TODAY</Text>}
                  </View>
                );
              })}
            </View>

            {/* Phase legend */}
            <View style={styles.legendRow}>
              {PHASES.map(p => (
                <View key={p.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: p.color }]} />
                  <Text style={styles.legendText}>{p.label}</Text>
                </View>
              ))}
            </View>

            {/* Calendar grid showing logged days */}
            <Text style={styles.forecastTitle}>This Month</Text>
            <View style={styles.calendarContainer}>
              <View style={styles.grid}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                  const today = new Date();
                  const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
                  const entry = cycleData.find(c => c.date === dateStr);
                  const phaseInfo = entry ? PHASES.find(p => p.id === entry.phase) : null;
                  const isToday = d === today.getDate();
                  return (
                    <View key={d} style={styles.dayWrapper}>
                      <View style={[
                        styles.dayCircle,
                        phaseInfo && { backgroundColor: phaseInfo.color },
                        isToday && !phaseInfo && styles.dayCircleToday
                      ]}>
                        <Text style={[styles.dayText, (phaseInfo || isToday) && { color: "#FFF" }]}>{d}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <CalendarIcon color={COLORS.primaryPink} size={24} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoTitle}>Calculating your cycle...</Text>
              <Text style={styles.infoSubtitle}>This may take a moment.</Text>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
=======
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mainHeader}>
          <View>
            <Text style={styles.greetingHeader}>Cycle Tracker</Text>
            <Text style={styles.dateSubheader}>{MONTHS[selectedMonth]} {selectedYear}</Text>
          </View>
          <TouchableOpacity style={styles.calendarIconBtn}>
            <CalendarIcon color={COLORS.primaryPink} size={24} />
          </TouchableOpacity>
        </View>
        
        {/* Modern Calendar Grid */}
        <View style={styles.calendarContainer}>
          <View style={styles.grid}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
              const entry = getEntryForDay(d);
              const phaseInfo = entry ? PHASES.find(p => p.id === entry.phase) : null;
              
              return (
                <View key={d} style={styles.dayWrapper}>
                  <View 
                    style={[
                      styles.dayCircle, 
                      phaseInfo && { backgroundColor: phaseInfo.color }
                    ]}
                  >
                    <Text style={[styles.dayText, phaseInfo && { color: '#FFF' }]}>{d}</Text>
                  </View>
                  {entry && <View style={styles.dotIndicator} />}
                </View>
              );
            })}
          </View>
          
          <TouchableOpacity style={styles.logBtn} onPress={() => setShowLogger(true)}>
            <Text style={styles.logBtnText}>+ Log Data</Text>
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          {PHASES.map(p => (
            <View key={p.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: p.color }]} />
              <Text style={styles.legendText}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* Phase Info Section */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <Droplets color={COLORS.primaryPink} size={24} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={styles.infoTitle}>Menstrual Nutrition</Text>
            <Text style={styles.infoSubtitle}>Increase iron-rich foods like spinach and lentils to maintain energy levels.</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: '#F0F4FF' }]}>
          <View style={[styles.infoIconBox, { backgroundColor: '#E1E9FF' }]}>
            <Thermometer color="#5C89FF" size={24} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={styles.infoTitle}>Skin Sensitivity</Text>
            <Text style={styles.infoSubtitle}>Your skin may be more reactive today. Use fragrance-free products.</Text>
          </View>
        </View>
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 120 },
<<<<<<< HEAD
  setupScroll: { padding: 25, paddingBottom: 120 },

  // Setup / first time
  setupTitle: { fontSize: 28, fontWeight: "800", color: COLORS.textMain, marginTop: 20, marginBottom: 10 },
  setupSubtitle: { fontSize: 15, color: COLORS.textSub, lineHeight: 22, marginBottom: 30 },

  phasePreviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 30 },
  phasePreviewCard: {
    width: "47%", padding: 18, borderRadius: 20, borderWidth: 2,
    alignItems: "center", gap: 8, backgroundColor: COLORS.white
  },
  phasePreviewLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textMain },

  // Date picker
  pickerLabel: { fontSize: 16, fontWeight: "700", color: COLORS.textMain, marginTop: 20, marginBottom: 10 },
  pickerRow: { marginBottom: 5 },
  pickerChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: "#F0E5E5", marginRight: 8
  },
  pickerChipActive: { backgroundColor: COLORS.primaryPink, borderColor: COLORS.primaryPink },
  pickerChipText: { fontSize: 14, fontWeight: "600", color: COLORS.textSub },
  pickerChipTextActive: { color: "#FFF" },

  datePreview: {
    backgroundColor: COLORS.secondaryPink, padding: 16,
    borderRadius: 15, alignItems: "center", marginTop: 20
  },
  datePreviewText: { fontSize: 16, fontWeight: "700", color: COLORS.textMain },

  saveBtn: {
    backgroundColor: COLORS.primaryPink, padding: 18, borderRadius: 20,
    alignItems: "center", marginTop: 25, flexDirection: "row", justifyContent: "center",
    shadowColor: COLORS.primaryPink, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  saveBtnText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  cancelBtn: { alignItems: "center", marginTop: 15 },
  cancelBtnText: { color: COLORS.textSub, fontSize: 15, fontWeight: "600" },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: COLORS.textMain },
  headerSub: { fontSize: 15, color: COLORS.textSub, fontWeight: "500", marginTop: 2 },
  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: "#F0E5E5"
  },
  editBtnText: { color: COLORS.primaryPink, fontWeight: "700", fontSize: 14 },

  // Phase card
  phaseCard: {
    backgroundColor: COLORS.primaryPink, borderRadius: 25, padding: 22,
    flexDirection: "row", justifyContent: "space-between", marginBottom: 15
  },
  phaseCardLeft: { gap: 4 },
  phaseCardDay: { fontSize: 38, fontWeight: "900", color: "#FFF" },
  phaseCardPhase: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  phaseCardCycle: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  phaseCardRight: { alignItems: "flex-end", justifyContent: "center", gap: 4 },
  nextPeriodLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  nextPeriodDays: { fontSize: 18, fontWeight: "800", color: "#FFF" },
  nextPeriodDate: { fontSize: 12, color: "rgba(255,255,255,0.7)" },

  // Info cards
  infoCard: {
    backgroundColor: COLORS.secondaryPink, borderRadius: 25, padding: 20,
    marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 15
  },
  infoIconBox: {
    width: 50, height: 50, borderRadius: 18,
    backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center"
  },
  infoTextBox: { flex: 1 },
  infoTitle: { fontWeight: "700", color: COLORS.textMain, fontSize: 15, marginBottom: 3 },
  infoSubtitle: { fontSize: 13, color: COLORS.textSub, lineHeight: 18 },

  // Forecast
  forecastTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textMain, marginTop: 20, marginBottom: 2 },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  forecastCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 6,
    flex: 1,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "#F0E5E5",
  },
  forecastCardToday: { borderColor: COLORS.primaryPink, borderWidth: 2 },
  forecastDay: { fontSize: 11, fontWeight: "700", color: COLORS.textSub },
  forecastDot: { width: 10, height: 10, borderRadius: 5, marginVertical: 5 },
  forecastPhase: { fontSize: 9, fontWeight: "600", color: COLORS.textMain },
  forecastToday: { fontSize: 8, color: COLORS.primaryPink, fontWeight: "800", marginTop: 2 },

  // Legend
  legendRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 15 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSub, fontWeight: "500" },

  // Calendar
  calendarContainer: {
    backgroundColor: COLORS.white, borderRadius: 25, padding: 15,
    marginTop: 12, borderWidth: 1, borderColor: "#F0E5E5"
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  dayWrapper: { alignItems: "center", margin: 3 },
  dayCircle: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center", backgroundColor: "#F9F9F9"
  },
  dayCircleToday: { backgroundColor: COLORS.accentRed },
  dayText: { fontWeight: "700", fontSize: 13, color: COLORS.textMain },
=======
  
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  greetingHeader: { fontSize: 28, fontWeight: '800', color: COLORS.textMain },
  dateSubheader: { fontSize: 16, color: COLORS.textSub, fontWeight: '500' },
  calendarIconBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E5E5',
  },

  calendarContainer: { 
    backgroundColor: COLORS.white, 
    borderRadius: 30, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#F0E5E5',
    shadowColor: "#000", 
    shadowOpacity: 0.03, 
    shadowRadius: 15, 
    elevation: 3 
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  dayWrapper: { alignItems: 'center', margin: 4 },
  dayCircle: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F9F9F9'
  },
  dayText: { fontWeight: '700', fontSize: 14, color: COLORS.textMain },
  dotIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primaryPink, marginTop: 2 },

  logBtn: { 
    backgroundColor: COLORS.primaryPink, 
    paddingVertical: 14, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginTop: 20,
    shadowColor: COLORS.primaryPink,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  logBtnText: { color: "#FFF", fontWeight: '700', fontSize: 16 },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSub, fontWeight: '500' },

  infoCard: { 
    backgroundColor: COLORS.secondaryPink, 
    borderRadius: 25, 
    padding: 20, 
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  infoIconBox: { 
    width: 50, 
    height: 50, 
    borderRadius: 18, 
    backgroundColor: COLORS.white, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  infoTextBox: { flex: 1 },
  infoTitle: { fontWeight: '700', color: COLORS.textMain, fontSize: 16, marginBottom: 4 },
  infoSubtitle: { fontSize: 13, color: COLORS.textSub, lineHeight: 18 },

  // Logger Styles
  loggerScroll: { flex: 1 },
  loggerHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20 
  },
  iconBtn: { padding: 5 },
  loggerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textMain },
  
  section: { paddingHorizontal: 25, marginBottom: 30 },
  sectionLabel: { fontSize: 18, fontWeight: '700', color: COLORS.textMain, marginBottom: 15 },
  
  dateRow: { marginBottom: 10 },
  dateBox: { backgroundColor: COLORS.white, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#F0E5E5' },
  dateLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSub, marginBottom: 10 },
  
  miniBtn: { 
    width: 45, 
    height: 45, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10,
    backgroundColor: '#F9F9F9'
  },
  miniBtnActive: { backgroundColor: COLORS.primaryPink },
  miniBtnText: { color: COLORS.textMain, fontWeight: '700' },
  miniBtnTextActive: { color: '#FFF' },

  phaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  phaseItem: { 
    width: '48%', 
    padding: 15, 
    borderRadius: 18, 
    borderWidth: 2, 
    borderColor: '#F0E5E5', 
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white
  },
  phaseLabel: { fontSize: 13, color: COLORS.textSub, fontWeight: '500' },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 15, 
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F0E5E5'
  },
  chipActive: { backgroundColor: COLORS.primaryPink, borderColor: COLORS.primaryPink },
  chipText: { color: COLORS.textSub, fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: '#FFF' },

  saveBtnFull: { 
    backgroundColor: COLORS.primaryPink, 
    marginHorizontal: 25, 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center',
    shadowColor: COLORS.primaryPink,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  saveBtnTextFull: { color: '#FFF', fontSize: 18, fontWeight: '800' },
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
});