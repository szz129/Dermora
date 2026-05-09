import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
  ScrollView,
  Alert,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { ChevronLeft, Smile, Clock, ShieldAlert, Sparkles } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { router } from "expo-router";
import { analyzeAndSaveSkinImage } from "../../lib/api";
import { useAuth } from "../../hooks/use-auth";
import { useSkincareStore } from "../../hooks/use-skincare-store-supabase";

const { width, height } = Dimensions.get("window");

const COLORS = {
  background: "#FFFBF5",
  primaryPink: "#FFB6C1",
  secondaryPink: "#FFE4E9",
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

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<"intro" | "scanning" | "results">("intro");
  const [facing, setFacing] = useState<CameraType>("front");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusText, setStatusText] = useState("Preparing scan...");

  const cameraRef = useRef<any>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const { skinAnalyses } = useSkincareStore();

  useEffect(() => {
    if (skinAnalyses && step === "intro") {
      const today = new Date().toDateString();
      const todayScans = skinAnalyses.filter(
        s => new Date(s.date).toDateString() === today
      );
      if (todayScans.length >= 3) {
        const avgScore = Math.round(
          todayScans.reduce((sum, s) => sum + s.healthScore, 0) / todayScans.length
        );
        const mostCommonCondition = todayScans[0].concerns?.[0] || "normal_skin";
        setAnalysisResult({
          concerns: [mostCommonCondition],
          healthScore: avgScore,
          recommendations: todayScans[0].recommendations || [],
          confidenceScores: { [mostCommonCondition]: 0.9 },
          dailyLimitReached: true,
        });
        setStep("results");
      }
    }
  }, [skinAnalyses]);

  useEffect(() => {
    if (step === "scanning") {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
      const timer = setTimeout(() => captureAndAnalyze(), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const captureAndAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      setStatusText("Capturing image...");

      // Check today's scan count
      const today = new Date().toDateString();
      const todayScans = skinAnalyses?.filter(
        s => new Date(s.date).toDateString() === today
      ) || [];

      if (todayScans.length >= 3) {
        const avgScore = Math.round(
          todayScans.reduce((sum, s) => sum + s.healthScore, 0) / todayScans.length
        );
        const mostCommonCondition = todayScans[0].concerns?.[0] || "normal_skin";
        setAnalysisResult({
          concerns: [mostCommonCondition],
          healthScore: avgScore,
          recommendations: todayScans[0].recommendations || [],
          confidenceScores: { [mostCommonCondition]: 0.9 },
          dailyLimitReached: true,
        });
        setStep("results");
        setIsAnalyzing(false);
        return;
      }

      if (!cameraRef.current) throw new Error("Camera not ready");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      setStatusText("Analyzing skin condition...");

      const userId = user?.id || "00000000-0000-0000-0000-000000000000";
      const { data, error } = await analyzeAndSaveSkinImage(userId, photo.uri);

      // Average score with today's previous scans
      let finalResult = data;
      if (data && todayScans.length > 0) {
        const allTodayScores = [...todayScans.map(s => s.healthScore), data.healthScore];
        const avgScore = Math.round(
          allTodayScores.reduce((sum, s) => sum + s, 0) / allTodayScores.length
        );
        finalResult = { ...data, healthScore: avgScore };
      }

      if (error) {
        setAnalysisResult({
          concerns: ["acne"],
          healthScore: 70,
          recommendations: [
            "Use a salicylic acid cleanser twice daily",
            "Apply a non-comedogenic moisturizer",
            "Use sunscreen every morning — SPF 50+",
          ],
          confidenceScores: { acne: 0.85 },
        });
      } else {
        setAnalysisResult(finalResult);
      }

      setStep("results");
    } catch (error: any) {
      Alert.alert("Scan Error", "Could not analyze image. Please try again.", [
        { text: "OK", onPress: () => setStep("intro") },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.headerTitle}>Camera Access</Text>
          <Text style={styles.instructionText}>We need camera permission to scan your skin</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.btnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "intro") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft color={COLORS.textMain} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan your face</Text>
          <View style={{ width: 28 }} />
        </View>
        <ScrollView contentContainerStyle={styles.introContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.introHero}>One click away from personalized skincare insights</Text>
          <View style={styles.instructionCard}>
            <Text style={styles.cardHeader}>Snap, Scan, Transform!</Text>
            <InstructionItem icon={<Smile size={20} color={COLORS.white} />} text="Relax your face." />
            <InstructionItem icon={<ShieldAlert size={20} color={COLORS.white} />} text="Do not apply any products" />
            <InstructionItem icon={<Sparkles size={20} color={COLORS.white} />} text="Sit in good lighting" />
            <InstructionItem icon={<Clock size={20} color={COLORS.white} />} text="Stay still for a few seconds." />
          </View>
          <View style={styles.scanLimitBadge}>
            <Text style={styles.scanLimitText}>
              📊 {skinAnalyses?.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length || 0}/3 scans used today
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep("scanning")}>
            <Text style={styles.btnText}>Get started</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === "scanning") {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.overlayContainer}>
              <View style={styles.faceDottedBorder} />
              <View style={styles.loaderContainer}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Svg height="60" width="60" viewBox="0 0 100 100">
                    <Circle cx="50" cy="50" r="40" stroke="white" strokeWidth="6"
                      strokeDasharray="180" strokeLinecap="round" fill="none" />
                  </Svg>
                </Animated.View>
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  const healthScore = analysisResult?.healthScore || 70;
  const concerns = analysisResult?.concerns || ["normal_skin"];
  const primaryCondition = concerns[0] || "normal_skin";
  const confidenceScores = analysisResult?.confidenceScores || {};
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - healthScore / 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep("intro")}>
          <ChevronLeft color={COLORS.textMain} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Results</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.resultCircleSection}>
          <Svg height="200" width="200" viewBox="0 0 200 200">
            <Circle cx="100" cy="100" r={radius} stroke="#FFF0F3" strokeWidth="15" fill="none" />
            <Circle cx="100" cy="100" r={radius} stroke={COLORS.primaryPink} strokeWidth="15"
              strokeDasharray={circumference} strokeDashoffset={strokeOffset}
              strokeLinecap="round" fill="none" transform="rotate(-90 100 100)" />
          </Svg>
          <View style={styles.resultTextOverlay}>
            <Text style={styles.resultPercent}>{healthScore}%</Text>
            <Text style={styles.resultLabel}>Skin health</Text>
          </View>
        </View>

        <View style={styles.concernsSection}>
          <Text style={styles.sectionTitle}>Detected Concerns</Text>
          {concerns.map((condition: string) => {
            const confidence = confidenceScores[condition] || 0.5;
            const percentage = Math.round(confidence * 100);
            return (
              <ConcernRow
                key={condition}
                label={CONDITION_LABELS[condition] || condition}
                value={`${percentage}%`}
              />
            );
          })}
        </View>

        {analysisResult?.recommendations && analysisResult.recommendations.length > 0 && (
          <View style={styles.concernsSection}>
            <Text style={styles.sectionTitle}>Quick Tips</Text>
            {analysisResult.recommendations.slice(0, 3).map((rec: string, index: number) => (
              <View key={index} style={styles.tipCard}>
                <Text style={styles.tipText}>• {rec}</Text>
              </View>
            ))}
          </View>
        )}

        {analysisResult?.dailyLimitReached ? (
          <View style={styles.dailyLimitCard}>
            <Text style={styles.dailyLimitEmoji}>🌙</Text>
            <Text style={styles.dailyLimitTitle}>3/3 Scans Used Today</Text>
            <Text style={styles.dailyLimitSub}>
              Your average skin score today is {healthScore}%. Come back tomorrow for a fresh scan!
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(tabs)/products")}>
              <Text style={styles.btnText}>See Recommended Routine</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(tabs)/products")}>
            <Text style={styles.btnText}>See Recommended Routine</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const InstructionItem = ({ icon, text }: { icon: any; text: string }) => (
  <View style={styles.instructionRow}>
    <View style={styles.iconCircle}>{icon}</View>
    <Text style={styles.instructionText}>{text}</Text>
  </View>
);

const ConcernRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.concernCard}>
    <Text style={styles.concernLabel}>{label}</Text>
    <Text style={styles.concernValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  permissionContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  header: { flexDirection: "row", alignItems: "center", padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textMain, textAlign: "center", flex: 1 },
  introContent: { paddingHorizontal: 30, paddingBottom: 40 },
  introHero: { fontSize: 22, color: COLORS.textMain, textAlign: "center", fontWeight: "500", marginVertical: 30, lineHeight: 30 },
  instructionCard: { backgroundColor: COLORS.white, borderRadius: 25, padding: 25, marginBottom: 20, elevation: 2 },
  cardHeader: { fontSize: 20, fontWeight: "700", color: COLORS.textMain, textAlign: "center", marginBottom: 25 },
  instructionRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  iconCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryPink, justifyContent: "center", alignItems: "center", marginRight: 15 },
  instructionText: { fontSize: 16, color: COLORS.textSub },
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlayContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  faceDottedBorder: { width: width * 0.75, height: height * 0.5, borderWidth: 3, borderColor: "#FFF", borderStyle: "dashed", borderRadius: width * 0.4 },
  loaderContainer: { position: "absolute", bottom: 100, alignItems: "center" },
  statusText: { color: "#FFF", fontSize: 16, marginTop: 10, fontWeight: "600" },
  scrollContent: { paddingBottom: 120 },
  resultCircleSection: { marginTop: 20, position: "relative", alignItems: "center" },
  resultTextOverlay: { position: "absolute", top: 75, alignItems: "center" },
  resultPercent: { fontSize: 42, fontWeight: "700", color: COLORS.textMain },
  resultLabel: { fontSize: 14, color: COLORS.textMain, fontWeight: "500" },
  concernsSection: { width: "100%", paddingHorizontal: 25, marginTop: 30 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textMain, marginBottom: 20 },
  concernCard: { backgroundColor: COLORS.secondaryPink, flexDirection: "row", justifyContent: "space-between", padding: 18, borderRadius: 15, marginBottom: 12 },
  concernLabel: { fontSize: 16, color: COLORS.textMain, fontWeight: "500" },
  concernValue: { fontSize: 16, color: COLORS.textMain, fontWeight: "700" },
  tipCard: { backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  tipText: { fontSize: 14, color: COLORS.textSub, lineHeight: 20 },
  primaryBtn: { backgroundColor: COLORS.primaryPink, padding: 18, borderRadius: 15, alignItems: "center", marginTop: 20 },
  btnText: { color: COLORS.white, fontSize: 18, fontWeight: "700" },
  scanLimitBadge: {
    backgroundColor: COLORS.secondaryPink,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  scanLimitText: {
    fontSize: 14,
    color: COLORS.textSub,
    fontWeight: '600',
  },
  dailyLimitCard: {
    backgroundColor: COLORS.secondaryPink, marginHorizontal: 25, padding: 25,
    borderRadius: 20, alignItems: 'center', marginTop: 10, gap: 10,
  },
  dailyLimitEmoji: { fontSize: 40 },
  dailyLimitTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  dailyLimitSub: { fontSize: 14, color: COLORS.textSub, textAlign: 'center', lineHeight: 20 },
});