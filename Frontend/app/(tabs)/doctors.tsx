import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import {
  MapPin,
  Star,
  Phone,
  Clock,
  Search,
  Navigation,
  X,
  ChevronRight,
  Activity,
  CircleAlert,
  CircleCheck,
} from "lucide-react-native";

const COLORS = {
  background: "#FFFBF5",
  primaryPink: "#FFB6C1",
  secondaryPink: "#FFE4E9",
  accentRed: "#E57373",
  textMain: "#4A3232",
  textSub: "#7D5A5A",
  white: "#FFFFFF",
  green: "#4CAF50",
  lightGreen: "#E8F5E9",
  cardBorder: "#FADADD",
};

interface Dermatologist {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  distance: number; // km
  address: string;
  phone: string;
  availability: string;
  experience: string;
  consultationFee: string;
  services: string[];
  latitude: number;
  longitude: number;
}

const MOCK_DERMATOLOGISTS: Dermatologist[] = [
  {
    id: "1",
    name: "Dr. Ayesha Khan",
    specialty: "Dermatologist & Cosmetologist",
    rating: 4.8,
    reviews: 156,
    distance: 2.3,
    address: "Gulberg III, Lahore",
    phone: "+92 300 1234567",
    availability: "Available Today",
    experience: "12 years",
    consultationFee: "Rs. 2,500",
    services: ["Acne Treatment", "Anti-Aging", "Laser Therapy"],
    latitude: 31.5204,
    longitude: 74.3587,
  },
  {
    id: "2",
    name: "Dr. Muhammad Ali",
    specialty: "Dermatologist",
    rating: 4.6,
    reviews: 89,
    distance: 3.1,
    address: "DHA Phase 5, Lahore",
    phone: "+92 301 2345678",
    availability: "Next Available: Tomorrow",
    experience: "8 years",
    consultationFee: "Rs. 2,000",
    services: ["Skin Cancer Screening", "Psoriasis", "Eczema Care"],
    latitude: 31.4794,
    longitude: 74.4073,
  },
  {
    id: "3",
    name: "Dr. Fatima Sheikh",
    specialty: "Dermatologist & Aesthetic Medicine",
    rating: 4.9,
    reviews: 203,
    distance: 4.2,
    address: "Johar Town, Lahore",
    phone: "+92 302 3456789",
    availability: "Available Today",
    experience: "15 years",
    consultationFee: "Rs. 3,000",
    services: ["Botox", "Fillers", "Skin Rejuvenation", "Scar Treatment"],
    latitude: 31.4697,
    longitude: 74.3006,
  },
  {
    id: "4",
    name: "Dr. Hassan Ahmed",
    specialty: "Pediatric Dermatologist",
    rating: 4.7,
    reviews: 124,
    distance: 5.8,
    address: "Model Town, Lahore",
    phone: "+92 303 4567890",
    availability: "Next Available: 2 days",
    experience: "10 years",
    consultationFee: "Rs. 2,200",
    services: ["Pediatric Skin", "Birthmark Treatment", "Allergy Testing"],
    latitude: 31.4822,
    longitude: 74.3248,
  },
  {
    id: "5",
    name: "Dr. Zara Malik",
    specialty: "Dermatologist & Hair Specialist",
    rating: 4.5,
    reviews: 167,
    distance: 6.2,
    address: "Cantt, Lahore",
    phone: "+92 304 5678901",
    availability: "Available Today",
    experience: "9 years",
    consultationFee: "Rs. 2,300",
    services: ["Hair Loss Treatment", "Scalp Conditions", "Nail Disorders"],
    latitude: 31.5497,
    longitude: 74.3695,
  },
];

function getDistanceFromLatLon(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

type FilterKey = "all" | "available" | "top-rated" | "nearest";
type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "error";

export default function DoctorsScreen() {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [doctors, setDoctors] = useState<Dermatologist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("nearest");
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for location icon
  useEffect(() => {
    if (locationStatus === "requesting") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [locationStatus]);

  const requestLocation = useCallback(async () => {
    setLocationStatus("requesting");
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationStatus("denied");
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setLocationStatus("granted");

      // Reverse geocode for display
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo.length > 0) {
          const g = geo[0];
          setLocationAddress([g.district || g.subregion, g.city].filter(Boolean).join(", "));
        }
      } catch {}

      // Calculate real distances from user's location
      const updated = MOCK_DERMATOLOGISTS.map((d) => ({
        ...d,
        distance: getDistanceFromLatLon(latitude, longitude, d.latitude, d.longitude),
      })).sort((a, b) => a.distance - b.distance);

      setDoctors(updated);
    } catch (e) {
      setLocationStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  const openSettings = () => {
    if (Platform.OS === "ios") Linking.openURL("app-settings:");
    else Linking.openSettings();
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: "nearest", label: "Nearest" },
    { key: "all", label: "All" },
    { key: "available", label: "Available Today" },
    { key: "top-rated", label: "Top Rated" },
  ];

  const filteredDoctors = doctors
    .filter((doc) => {
      const q = searchQuery.toLowerCase();
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        doc.address.toLowerCase().includes(q)
      );
    })
    .filter((doc) => {
      if (selectedFilter === "available") return doc.availability.includes("Available Today");
      if (selectedFilter === "top-rated") return doc.rating >= 4.8;
      return true;
    })
    .sort((a, b) => {
      if (selectedFilter === "nearest") return a.distance - b.distance;
      if (selectedFilter === "top-rated") return b.rating - a.rating;
      return 0;
    });

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={13}
        color={i < Math.floor(rating) ? "#F4A261" : "#E0CCCC"}
        fill={i < Math.floor(rating) ? "#F4A261" : "transparent"}
      />
    ));

  const handleCall = (phone: string, name: string) => {
    const tel = `tel:${phone.replace(/\s/g, "")}`;
    Alert.alert(`Call ${name}`, phone, [
      { text: "Cancel", style: "cancel" },
      { text: "Call", onPress: () => Linking.openURL(tel) },
    ]);
  };

  // ─── Location Permission Screen ──────────────────────────────────────────────
  if (locationStatus === "idle") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionScreen}>
          <View style={styles.permissionIconWrapper}>
            <View style={styles.permissionIconBg}>
              <MapPin color={COLORS.accentRed} size={48} />
            </View>
          </View>
          <Text style={styles.permissionTitle}>Find Dermatologists Near You</Text>
          <Text style={styles.permissionDesc}>
            Enable your location so Dermora can show you the closest skin specialists, sorted by distance.
          </Text>
          <View style={styles.permissionFeatures}>
            {["Doctors sorted by distance", "Real-time availability", "One-tap call & booking"].map((f, i) => (
              <View key={i} style={styles.permissionFeatureRow}>
                <CircleCheck size={16} color={COLORS.green} />
                <Text style={styles.permissionFeatureText}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.enableBtn} onPress={requestLocation}>
            <Navigation size={18} color={COLORS.white} />
            <Text style={styles.enableBtnText}>Enable Location</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setLocationStatus("granted"); setDoctors(MOCK_DERMATOLOGISTS); }}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (locationStatus === "requesting") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionScreen}>
          <Animated.View style={[styles.permissionIconBg, { transform: [{ scale: pulseAnim }] }]}>
            <Navigation color={COLORS.accentRed} size={44} />
          </Animated.View>
          <Text style={styles.permissionTitle}>Getting Your Location…</Text>
          <Text style={styles.permissionDesc}>Please wait while we find dermatologists near you.</Text>
          <ActivityIndicator color={COLORS.accentRed} size="large" style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  if (locationStatus === "denied") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionScreen}>
          <View style={[styles.permissionIconBg, { backgroundColor: "#FFF3F3" }]}>
            <CircleAlert color={COLORS.accentRed} size={44} />
          </View>
          <Text style={styles.permissionTitle}>Location Access Denied</Text>
          <Text style={styles.permissionDesc}>
            Dermora needs location permission to show nearby dermatologists. Please enable it in Settings.
          </Text>
          <TouchableOpacity style={styles.enableBtn} onPress={openSettings}>
            <Text style={styles.enableBtnText}>Open Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setLocationStatus("granted"); setDoctors(MOCK_DERMATOLOGISTS); }}>
            <Text style={styles.skipText}>Continue without location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main Doctors List ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Dermatologists</Text>
            {locationAddress ? (
              <View style={styles.locationRow}>
                <MapPin size={12} color={COLORS.accentRed} />
                <Text style={styles.locationText}>{locationAddress}</Text>
              </View>
            ) : (
              <Text style={styles.locationText}>Near you</Text>
            )}
          </View>
          <TouchableOpacity style={styles.refreshLocBtn} onPress={requestLocation}>
            <Navigation size={16} color={COLORS.accentRed} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={16} color={COLORS.textSub} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, specialty…"
            placeholderTextColor={COLORS.textSub}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color={COLORS.textSub} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, selectedFilter === f.key && styles.filterChipActive]}
            onPress={() => setSelectedFilter(f.key)}
          >
            <Text style={[styles.filterChipText, selectedFilter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <View style={styles.resultsRow}>
        <Activity size={14} color={COLORS.textSub} />
        <Text style={styles.resultsText}>{filteredDoctors.length} specialists found</Text>
      </View>

      {/* Doctors List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={COLORS.accentRed} size="large" style={{ marginTop: 60 }} />
        ) : filteredDoctors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No results found</Text>
            <Text style={styles.emptyStateDesc}>Try adjusting your filters or search query.</Text>
          </View>
        ) : (
          filteredDoctors.map((doc) => (
            <View key={doc.id} style={styles.card}>
              {/* Card Header */}
              <View style={styles.cardTop}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{doc.name.split(" ")[1]?.[0] || "D"}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <Text style={styles.docSpecialty}>{doc.specialty}</Text>
                  <View style={styles.ratingRow}>
                    {renderStars(doc.rating)}
                    <Text style={styles.ratingText}>{doc.rating}</Text>
                    <Text style={styles.reviewsText}>({doc.reviews})</Text>
                  </View>
                </View>
                <View style={styles.distanceBadge}>
                  <MapPin size={10} color={COLORS.accentRed} />
                  <Text style={styles.distanceText}>{doc.distance} km</Text>
                </View>
              </View>

              {/* Info Row */}
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Clock size={13} color={COLORS.textSub} />
                  <Text
                    style={[
                      styles.infoText,
                      doc.availability.includes("Available Today") && { color: COLORS.green, fontWeight: "700" as const },
                    ]}
                  >
                    {doc.availability}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Activity size={13} color={COLORS.textSub} />
                  <Text style={styles.infoText}>{doc.experience} exp.</Text>
                </View>
              </View>

              {/* Address */}
              <View style={styles.addressRow}>
                <MapPin size={13} color={COLORS.textSub} />
                <Text style={styles.addressText}>{doc.address}</Text>
              </View>

              {/* Services */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {doc.services.map((s, i) => (
                  <View key={i} style={styles.serviceTag}>
                    <Text style={styles.serviceTagText}>{s}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.feeLabel}>Consultation</Text>
                  <Text style={styles.feeValue}>{doc.consultationFee}</Text>
                </View>
                <View style={styles.actionBtns}>
                  <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(doc.phone, doc.name)}>
                    <Phone size={15} color={COLORS.green} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bookBtn}>
                    <Text style={styles.bookBtnText}>Book</Text>
                    <ChevronRight size={14} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Permission screens
  permissionScreen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  permissionIconWrapper: { marginBottom: 28 },
  permissionIconBg: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "#FFF0F3", alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primaryPink, shadowOpacity: 0.3, shadowRadius: 20, elevation: 6,
  },
  permissionTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textMain, textAlign: "center", marginBottom: 12 },
  permissionDesc: { fontSize: 15, color: COLORS.textSub, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  permissionFeatures: { alignSelf: "stretch", marginBottom: 32, gap: 12 },
  permissionFeatureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  permissionFeatureText: { fontSize: 14, color: COLORS.textMain, fontWeight: "500" },
  enableBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.accentRed, paddingVertical: 16, paddingHorizontal: 40,
    borderRadius: 18, marginBottom: 16, width: "100%", justifyContent: "center",
    shadowColor: COLORS.accentRed, shadowOpacity: 0.35, shadowRadius: 12, elevation: 5,
  },
  enableBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 16 },
  skipText: { color: COLORS.textSub, fontSize: 14, textDecorationLine: "underline" },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: COLORS.textMain },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  locationText: { fontSize: 13, color: COLORS.textSub },
  refreshLocBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.secondaryPink, alignItems: "center", justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.white, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textMain },

  // Filters
  filterRow: { marginTop: 12, marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  filterChipActive: { backgroundColor: COLORS.accentRed, borderColor: COLORS.accentRed },
  filterChipText: { fontSize: 13, fontWeight: "600", color: COLORS.textSub },
  filterChipTextActive: { color: COLORS.white },

  // Results
  resultsRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, marginVertical: 10 },
  resultsText: { fontSize: 13, color: COLORS.textSub },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 140 },

  // Empty
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyStateTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textMain, marginBottom: 6 },
  emptyStateDesc: { fontSize: 14, color: COLORS.textSub, textAlign: "center" },

  // Card
  card: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.secondaryPink, alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { fontSize: 20, fontWeight: "800", color: COLORS.accentRed },
  docName: { fontSize: 16, fontWeight: "800", color: COLORS.textMain },
  docSpecialty: { fontSize: 12, color: COLORS.textSub, marginTop: 2, marginBottom: 5 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 12, fontWeight: "700", color: COLORS.textMain, marginLeft: 2 },
  reviewsText: { fontSize: 11, color: COLORS.textSub },
  distanceBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#FFF0F3", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  distanceText: { fontSize: 11, fontWeight: "700", color: COLORS.accentRed },
  infoRow: { flexDirection: "row", gap: 16, marginBottom: 8 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontSize: 12, color: COLORS.textSub },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  addressText: { fontSize: 12, color: COLORS.textSub, flex: 1 },
  serviceTag: {
    backgroundColor: COLORS.secondaryPink, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, marginRight: 6,
  },
  serviceTagText: { fontSize: 11, color: COLORS.accentRed, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.secondaryPink,
  },
  feeLabel: { fontSize: 11, color: COLORS.textSub },
  feeValue: { fontSize: 15, fontWeight: "800", color: COLORS.textMain },
  actionBtns: { flexDirection: "row", gap: 8, alignItems: "center" },
  callBtn: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.green,
    alignItems: "center", justifyContent: "center", backgroundColor: COLORS.lightGreen,
  },
  bookBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.accentRed, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    shadowColor: COLORS.accentRed, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  bookBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
});
