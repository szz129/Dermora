/**
 * Skincare Store with Supabase Integration
 * 
 * This is an enhanced version that uses Supabase when available,
 * and falls back to AsyncStorage when Supabase is not configured.
 */

import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import { QuestionnaireAnswers } from "../constants/questionnaire";
import { isSupabaseConfigured } from "../lib/supabase";
import * as api from "../lib/api";
import type { SkinAnalysis, CycleData, UserProfile } from "./use-skincare-store";
import { useAuth } from "./use-auth";

// Test user ID (for testing without auth - fallback only)
const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";

export const [SkincareStoreProvider, useSkincareStore] = createContextHook(() => {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    email: "",
    age: undefined,
    skinType: undefined,
    concerns: [],
    currentProducts: [],
  });

  const [skinAnalyses, setSkinAnalyses] = useState<SkinAnalysis[]>([]);
  const [cycleData, setCycleData] = useState<CycleData[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
<<<<<<< HEAD
  const [cycleStatus, setCycleStatus] = useState<any>(null);
=======
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [useSupabase, setUseSupabase] = useState(isSupabaseConfigured);

  // Load data on initialization and when userId changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (useSupabase && isSupabaseConfigured && userId) {
          // Load from Supabase with authenticated user
          await loadFromSupabase(userId);
        } else {
          // Load from AsyncStorage
          await loadFromAsyncStorage();
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // Fallback to AsyncStorage if Supabase fails
        if (useSupabase) {
          console.log("Falling back to AsyncStorage");
          setUseSupabase(false);
          await loadFromAsyncStorage();
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Load recommendations
  const refreshRecommendations = async () => {
    if (!useSupabase || !isSupabaseConfigured || !userId) return;
    try {
      const { data: recData, error: recError } = await api.getLatestProductRecommendations(userId);
      if (!recError && recData) {
        setRecommendations(recData);
      }
    } catch (error) {
      console.error("Error refreshing recommendations:", error);
    }
  };

<<<<<<< HEAD
  const refreshCycleStatus = async () => {
    if (!userId) return;
    try {
      const LLM_URL = process.env.EXPO_PUBLIC_LLM_SERVICE_URL || 'http://localhost:8001';
      const res = await fetch(`${LLM_URL}/cycle/status/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCycleStatus(data);
        // Auto-refresh products if phase changed
        const lastPhase = cycleStatus?.current_phase;
        if (lastPhase && lastPhase !== data.current_phase) {
          console.log(`Phase changed: ${lastPhase} → ${data.current_phase}, refreshing recommendations...`);
          await refreshRecommendations();
        }
      }
    } catch (e) {
      console.warn('Cycle status fetch failed:', e);
    }
  };

=======
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
  const loadFromSupabase = async (currentUserId: string) => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await api.getProfile(currentUserId);
      if (!profileError && profileData) {
        setUserProfile(profileData);
      } else if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist yet, create default
        setUserProfile({
          name: user?.user_metadata?.name || user?.email?.split('@')[0] || "",
          email: user?.email || "",
          age: undefined,
          skinType: undefined,
          concerns: [],
          currentProducts: [],
        });
      }

      // Load skin analyses
      const { data: analysesData, error: analysesError } = await api.getSkinAnalyses(currentUserId);
      if (!analysesError && analysesData) {
        setSkinAnalyses(analysesData);
      } else {
        setSkinAnalyses([]);
      }

      // Load cycle data
      const { data: cycleDataResult, error: cycleError } = await api.getCycleData(currentUserId);
      if (!cycleError && cycleDataResult) {
        setCycleData(cycleDataResult);
      } else {
        setCycleData([]);
      }

      // Load recommendations
      await refreshRecommendations();
    } catch (error) {
      console.error("Error loading from Supabase:", error);
      throw error;
    }
<<<<<<< HEAD
    await refreshCycleStatus();
=======
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
  };

  // Load from AsyncStorage
  const loadFromAsyncStorage = async () => {
    try {
      const [profileData, analysesData, cycleDataStored] = await Promise.all([
        AsyncStorage.getItem("userProfile"),
        AsyncStorage.getItem("skinAnalyses"),
        AsyncStorage.getItem("cycleData"),
      ]);

      if (profileData) {
        setUserProfile(JSON.parse(profileData));
      }
      if (analysesData) {
        setSkinAnalyses(JSON.parse(analysesData));
      }
      if (cycleDataStored) {
        setCycleData(JSON.parse(cycleDataStored));
      }
    } catch (error) {
      console.error("Error loading from AsyncStorage:", error);
    }
  };

  // Save user profile
  const saveUserProfile = async (profile: UserProfile) => {
    try {
      if (useSupabase && isSupabaseConfigured && userId) {
        const { error } = await api.updateProfile(userId, profile);
        if (error) throw error;
      } else {
        await AsyncStorage.setItem("userProfile", JSON.stringify(profile));
      }
      setUserProfile(profile);
    } catch (error) {
      console.error("Error saving user profile:", error);
      // Fallback to AsyncStorage
      await AsyncStorage.setItem("userProfile", JSON.stringify(profile));
      setUserProfile(profile);
    }
  };

  // Add skin analysis
  const addSkinAnalysis = async (analysis: Omit<SkinAnalysis, "id">) => {
    try {
      const newAnalysis: SkinAnalysis = {
        ...analysis,
        id: Date.now().toString(),
      };

      if (useSupabase && isSupabaseConfigured && userId) {
        const { data, error } = await api.saveSkinAnalysis(userId, analysis);
        if (!error && data) {
          newAnalysis.id = data.id;
          setSkinAnalyses([data, ...skinAnalyses]);
        } else {
          throw error;
        }
      } else {
        const updatedAnalyses = [newAnalysis, ...skinAnalyses];
        await AsyncStorage.setItem("skinAnalyses", JSON.stringify(updatedAnalyses));
        setSkinAnalyses(updatedAnalyses);
      }
    } catch (error) {
      console.error("Error saving skin analysis:", error);
      // Fallback to AsyncStorage
      const newAnalysis: SkinAnalysis = {
        ...analysis,
        id: Date.now().toString(),
      };
      const updatedAnalyses = [newAnalysis, ...skinAnalyses];
      await AsyncStorage.setItem("skinAnalyses", JSON.stringify(updatedAnalyses));
      setSkinAnalyses(updatedAnalyses);
    }
  };

  // Add cycle entry
  const addCycleEntry = async (entry: Omit<CycleData, "id">) => {
    try {
      // PROPER DATE FORMATTING: Ensure YYYY-MM-DD for Supabase
      const dateObj = new Date(entry.date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      const normalizedEntry = { ...entry, date: formattedDate };

      if (useSupabase && isSupabaseConfigured && userId) {
        console.log("Saving cycle entry to Supabase:", normalizedEntry);
        const { data, error } = await api.saveCycleData(userId, normalizedEntry);
        if (!error && data) {
          // Update local state
          const existingIndex = cycleData.findIndex(c => c.date === formattedDate);
          if (existingIndex >= 0) {
            const updated = [...cycleData];
            updated[existingIndex] = data;
            setCycleData(updated);
          } else {
            setCycleData([data, ...cycleData]);
          }
          console.log("Cycle data saved successfully! ✅");
        } else if (error) {
          console.error("Supabase Save Error:", error.message);
          throw error;
        }
      } else {
        const newEntry: CycleData = {
          ...normalizedEntry,
          id: Date.now().toString(),
        };
        const updatedCycleData = [newEntry, ...cycleData];
        await AsyncStorage.setItem("cycleData", JSON.stringify(updatedCycleData));
        setCycleData(updatedCycleData);
      }
    } catch (error: any) {
      console.error("Error saving cycle data:", error?.message || error);
      // Fallback
      const newEntry: CycleData = {
        ...entry,
        id: Date.now().toString(),
      };
      setCycleData([newEntry, ...cycleData]);
    }
  };

  // Save questionnaire answers
  const saveQuestionnaireAnswers = async (answers: QuestionnaireAnswers) => {
    try {
      const updatedProfile: UserProfile = {
        ...userProfile,
        questionnaireAnswers: answers,
        questionnaireCompletedAt: new Date().toISOString(),
      };

      if (useSupabase && isSupabaseConfigured) {
        if (!userId) throw new Error("Authentication required to save profile.");
        
        const { error } = await api.saveQuestionnaireAnswers(userId, answers);
        if (error) {
          throw new Error(error.message || "Failed to save to Supabase. Check your connection or account status.");
        }

        // Fire and Forget (or await for immediate result) the LLM Product Recommendation logic
        console.log("Answers saved, generating recommendations via LLM...");
        await api.generateProductRecommendations(userId, answers).catch(err => {
          console.warn("LLM service is currently unavailable.", err);
        });

        // Pull the latest recommendations immediately after LLM finishes
        await refreshRecommendations();

      } else {
        await AsyncStorage.setItem("userProfile", JSON.stringify(updatedProfile));
      }

      setUserProfile(updatedProfile);
    } catch (error: any) {
      console.error("Error saving questionnaire answers:", error);
      // Removed silent fallback! We must throw the error so the UI handles it properly.
      throw new Error(error.message || "Failed to save questionnaire. Please try again.");
    }
  };

  // Helper functions
  const getLatestAnalysis = (): SkinAnalysis | null => {
    return skinAnalyses.length > 0 ? skinAnalyses[0] : null;
  };

  const getCurrentCyclePhase = (): string => {
    if (cycleData.length === 0) return "Unknown";
    return cycleData[0].phase;
  };

  const getHealthScore = (): number => {
    const latest = getLatestAnalysis();
    return latest ? latest.healthScore : 0;
  };

  return {
    userProfile,
    skinAnalyses,
    cycleData,
    isLoading,
    saveUserProfile,
    addSkinAnalysis,
    addCycleEntry,
    getLatestAnalysis,
    getCurrentCyclePhase,
    getHealthScore,
    saveQuestionnaireAnswers,
<<<<<<< HEAD
    refreshRecommendations,
    useSupabase, 
    recommendations, 
    cycleStatus,
    refreshCycleStatus,
=======
    refreshRecommendations, // NEW
    useSupabase, 
    recommendations, 
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
  };
});

