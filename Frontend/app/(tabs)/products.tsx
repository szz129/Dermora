import { useAuth } from "../../hooks/use-auth";
import { supabase } from '../../lib/supabase';
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Platform,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Sparkles, ClipboardList, RefreshCw, ChevronLeft } from "lucide-react-native";
import { useSkincareStore } from "../../hooks/use-skincare-store-supabase";

// Fallback image for products that don't have one in the LLM response
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=200&auto=format&fit=crop";

export default function ProductsScreen() {
  const router = useRouter();
  const { recommendations, refreshRecommendations, userProfile, isLoading: storeLoading } = useSkincareStore();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [catalogImages, setCatalogImages] = useState<Record<string, any>>({});
  
  const hasQuestionnaire = !!userProfile?.questionnaireAnswers;

// Check if backend is reachable
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const LLM_SERVICE_URL = process.env.EXPO_PUBLIC_LLM_SERVICE_URL || 'http://localhost:8001';
        const res = await fetch(`${LLM_SERVICE_URL}/`, { method: 'GET' });
        if (res.ok) setBackendStatus('online');
        else setBackendStatus('offline');
      } catch (err) {
        setBackendStatus('offline');
      }
    };
    checkStatus();
  }, []);

  // Load product images from catalog
  useEffect(() => {
    const loadImages = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('product_catalog')
        .select('name, image_url, product_url');
      if (data) {
        const map: Record<string, any> = {};
        data.forEach((p: any) => { map[p.name.toLowerCase()] = p; });
        setCatalogImages(map);
      }
    };
    loadImages();
  }, []);

  const onRefresh = async () => {
  setIsRefreshing(true);
  try {
    const answers = (userProfile as any)?.questionnaireAnswers;
    if (!answers) {
      if (Platform.OS === 'web') window.alert("Please complete the questionnaire first.");
      else Alert.alert("No Profile", "Please complete the questionnaire first.");
      setIsRefreshing(false);
      return;
    }
    const uid = user?.id || '00000000-0000-0000-0000-000000000000';
    const { generateProductRecommendations } = await import('../../lib/api');
    await generateProductRecommendations(uid, answers);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refreshRecommendations();
  } catch (err: any) {
    console.error("Refresh Error:", err);
    if (Platform.OS === 'web') {
      window.alert("Error: " + (err.message || "Cannot reach AI server."));
    } else {
      Alert.alert("Connection Failed", "Unable to reach the AI server.");
    }
  }
  setIsRefreshing(false);
};

  const renderProductCard = (item: any) => {
    const catalogItem = catalogImages[(item.product_name || item.name || '').toLowerCase()];
    const imageUrl = catalogItem?.image_url || item.image_url || FALLBACK_IMAGE;
    const productUrl = catalogItem?.product_url || item.product_url;

    return (
      <View key={item.id || item.name} style={styles.productCard}>
        <Text style={styles.brandName}>{item.brand || "Dermora Recommended"}</Text>
        
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.productImage} 
          resizeMode="contain" 
        />

        <Text style={styles.productName}>{item.product_name || item.name || "Skincare Product"}</Text>
        <Text style={styles.productCategory}>{item.product_category || item.category || "General"}</Text>
        
        {item.description && (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <Text style={styles.productPrice}>Rs. {item.price_pkr || item.price}</Text>

        {item.reason && (
          <View style={styles.whyRecommendedBox}>
            <Text style={styles.whyTitle}>Why Recommended?</Text>
            <Text style={styles.whyText}>{item.reason}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.buyBtn} onPress={() => {
          if (productUrl && Platform.OS === 'web') window.open(productUrl, '_blank');
        }}>
          <Text style={styles.buyBtnText}>BUY NOW</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="#4A3232" size={28} />
        </TouchableOpacity>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Text style={styles.headerTitle}>Your Routine</Text>
          <View style={[
            styles.statusDot, 
            { backgroundColor: backendStatus === 'online' ? '#4CAF50' : backendStatus === 'offline' ? '#F44336' : '#FFC107' }
          ]} />
        </View>
        <TouchableOpacity onPress={onRefresh} disabled={isRefreshing || storeLoading}>
          <RefreshCw color="#FFB6C1" size={22} style={isRefreshing ? { opacity: 0.5 } : {}} />
        </TouchableOpacity>
      </View>

      {!hasQuestionnaire ? (
        <View style={styles.emptyState}>
          <ClipboardList color="#FFB6C1" size={60} />
          <Text style={styles.emptyTitle}>Personalize Your Routine</Text>
          <TouchableOpacity 
            style={styles.mainActionBtn} 
            onPress={() => router.push("/questionnaire")}
          >
            <Sparkles color="#FFF" size={20} />
            <Text style={styles.mainActionText}>Start Questionnaire</Text>
          </TouchableOpacity>
        </View>
      ) : (storeLoading && recommendations.length === 0) ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color="#FFB6C1" />
          <Text style={styles.loadingText}>Analyzing your skin...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#FFB6C1"]} />
          }
        >
          {recommendations.length > 0 ? (
            recommendations.map((item) => renderProductCard(item))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No recommendations yet.</Text>
              <Text style={[styles.loadingText, { marginBottom: 20 }]}>
                Your AI routine might be still calculating or there was a connection issue.
              </Text>
              <TouchableOpacity 
                style={styles.mainActionBtn} 
                onPress={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw color="#FFF" size={20} />
                <Text style={styles.mainActionText}>Get AI Recommendations</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.retakeBtn} 
            onPress={() => router.push("/questionnaire")}
          >
            <Text style={styles.retakeText}>Retake Questionnaire</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20 
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#4A3232' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  scrollContent: { paddingBottom: 120 },
  
  productCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  brandName: { fontSize: 13, color: '#7D5A5A', marginBottom: 15, letterSpacing: 1 },
  productImage: { width: 200, height: 200, marginBottom: 15 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#1A365D', textAlign: 'center' },
  productCategory: { fontSize: 14, color: '#1A365D70', marginTop: 2 },
  productDescription: { 
    fontSize: 13, 
    color: '#7D5A5A', 
    textAlign: 'center', 
    paddingHorizontal: 10, 
    marginTop: 8, 
    lineHeight: 18,
    fontStyle: 'italic'
  },
  productPrice: { fontSize: 18, fontWeight: '700', color: '#4A3232', marginVertical: 12 },
  
  whyRecommendedBox: {
    backgroundColor: '#FFFBF5',
    width: '100%',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFE4E9',
    marginTop: 10
  },
  whyTitle: { fontSize: 14, fontWeight: 'bold', color: '#4A3232', marginBottom: 5 },
  whyText: { fontSize: 13, color: '#7D5A5A', lineHeight: 18 },
  
  buyBtn: { backgroundColor: '#FFB6C1', width: '100%', padding: 18, borderRadius: 15, marginTop: 20, alignItems: 'center' },
  buyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A3232', marginTop: 20, textAlign: 'center' },
  mainActionBtn: { flexDirection: 'row', backgroundColor: '#FFB6C1', padding: 18, borderRadius: 15, marginTop: 25, alignItems: 'center', gap: 10 },
  mainActionText: { color: '#FFF', fontWeight: 'bold' },

  loadingArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#7D5A5A', textAlign: 'center' },

  retakeBtn: { alignSelf: 'center', marginTop: 10, marginBottom: 30 },
  retakeText: { color: '#FFB6C1', fontWeight: '600', textDecorationLine: 'underline' }
});