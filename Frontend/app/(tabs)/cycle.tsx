import React, { useState, useEffect } from "react";
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
    } finally {
      setIsSaving(false);
    }
  };

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
        </ScrollView>
      </SafeAreaView>
    );
  }

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 120 },
  
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
});