import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Search, MapPin, Star, Phone, Clock } from "lucide-react-native";

const PRIMARY_DARK = "#4B2A80"; // background
const SECONDARY_PURPLE = "#6F4EAA"; // cards
const ACCENT_RED = "#FF3860"; // highlights/buttons
const LIGHT_TEXT = "#FFFFFF";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  distance: string;
  address: string;
  phone: string;
  availability: string;
  experience: string;
  consultationFee: string;
}

export default function DoctorsScreen() {
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const doctors: Doctor[] = [
    {
      id: "1",
      name: "Dr. Ayesha Khan",
      specialty: "Dermatologist & Cosmetologist",
      rating: 4.8,
      reviews: 156,
      distance: "2.3 km",
      address: "Gulberg III, Lahore",
      phone: "+92 300 1234567",
      availability: "Available Today",
      experience: "12 years",
      consultationFee: "Rs. 2,500",
    },
    {
      id: "2",
      name: "Dr. Muhammad Ali",
      specialty: "Dermatologist",
      rating: 4.6,
      reviews: 89,
      distance: "3.1 km",
      address: "DHA Phase 5, Lahore",
      phone: "+92 301 2345678",
      availability: "Next Available: Tomorrow",
      experience: "8 years",
      consultationFee: "Rs. 2,000",
    },
    {
      id: "3",
      name: "Dr. Fatima Sheikh",
      specialty: "Dermatologist & Aesthetic Medicine",
      rating: 4.9,
      reviews: 203,
      distance: "4.2 km",
      address: "Johar Town, Lahore",
      phone: "+92 302 3456789",
      availability: "Available Today",
      experience: "15 years",
      consultationFee: "Rs. 3,000",
    },
    {
      id: "4",
      name: "Dr. Hassan Ahmed",
      specialty: "Pediatric Dermatologist",
      rating: 4.7,
      reviews: 124,
      distance: "5.8 km",
      address: "Model Town, Lahore",
      phone: "+92 303 4567890",
      availability: "Next Available: 2 days",
      experience: "10 years",
      consultationFee: "Rs. 2,200",
    },
  ];

  const filters = [
    { key: "all", label: "All" },
    { key: "available", label: "Available Today" },
    { key: "top-rated", label: "Top Rated" },
  ];

  const filteredDoctors = doctors.filter((doc) => {
    const matchSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    switch (selectedFilter) {
      case "available":
        return doc.availability.includes("Available Today");
      case "top-rated":
        return doc.rating >= 4.8;
      default:
        return true;
    }
  });

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        color={i < Math.floor(rating) ? "#FFD700" : "#E0E0E0"}
        fill={i < Math.floor(rating) ? "#FFD700" : "transparent"}
      />
    ));

  const cardPadding = Math.max(12, width * 0.03);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#8A2BE2", PRIMARY_DARK]} style={styles.topHeader}>
        <Text style={styles.title}>Dermora</Text>
        <Text style={styles.subtitle}>Find Dermatologists Near You</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterBtn,
                selectedFilter === f.key && { backgroundColor: ACCENT_RED, borderColor: ACCENT_RED },
              ]}
              onPress={() => setSelectedFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === f.key && { color: LIGHT_TEXT },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Doctors List */}
        <View style={{ paddingHorizontal: 16 }}>
          {filteredDoctors.map((doc) => (
            <View key={doc.id} style={[styles.card, { padding: cardPadding }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.doctorName}>{doc.name}</Text>
                <Text style={styles.doctorSpecialty}>{doc.specialty}</Text>
                <Text style={styles.experience}>{doc.experience} experience</Text>
              </View>

              <View style={styles.ratingRow}>
                {renderStars(doc.rating)}
                <Text style={styles.ratingText}>{doc.rating}</Text>
              </View>

              <View style={styles.detailRow}>
                <MapPin color={LIGHT_TEXT} size={16} />
                <Text style={styles.detailText}>
                  {doc.address} • {doc.distance}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Clock color={LIGHT_TEXT} size={16} />
                <Text
                  style={[
                    styles.detailText,
                    doc.availability.includes("Available Today") && { color: "#4CAF50" },
                  ]}
                >
                  {doc.availability}
                </Text>
              </View>

              <View style={styles.footer}>
                <View>
                  <Text style={styles.consultLabel}>Consultation Fee</Text>
                  <Text style={styles.consultFee}>{doc.consultationFee}</Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.callBtn}>
                    <Phone color={LIGHT_TEXT} size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bookBtn}>
                    <Text style={styles.bookText}>Book Appointment</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PRIMARY_DARK,
  },
  topHeader: {
    paddingTop: 30,
    paddingBottom: 26,
    alignItems: "center",
  },
  title: {
    fontWeight: "700",
    fontSize: 20,
    color: LIGHT_TEXT,
  },
  subtitle: {
    fontWeight: "600",
    fontSize: 16,
    color: LIGHT_TEXT,
    opacity: 0.85,
  },
  filters: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  filterBtn: {
    backgroundColor: SECONDARY_PURPLE,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: PRIMARY_DARK,
  },
  filterText: {
    color: LIGHT_TEXT,
    fontWeight: "600",
  },
  card: {
    backgroundColor: SECONDARY_PURPLE,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  cardHeader: {
    marginBottom: 8,
  },
  doctorName: {
    color: LIGHT_TEXT,
    fontWeight: "700",
    fontSize: 16,
  },
  doctorSpecialty: {
    color: LIGHT_TEXT,
    opacity: 0.85,
    fontSize: 14,
    marginVertical: 2,
  },
  experience: {
    color: LIGHT_TEXT,
    opacity: 0.75,
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  ratingText: {
    color: LIGHT_TEXT,
    marginLeft: 6,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    color: LIGHT_TEXT,
    marginLeft: 6,
    opacity: 0.85,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  consultLabel: {
    color: LIGHT_TEXT,
    opacity: 0.85,
    fontSize: 12,
  },
  consultFee: {
    color: LIGHT_TEXT,
    fontWeight: "700",
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  callBtn: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  bookBtn: {
    backgroundColor: ACCENT_RED,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bookText: {
    color: LIGHT_TEXT,
    fontWeight: "700",
  },
});
