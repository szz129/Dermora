import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import { QuestionnaireAnswers } from "../constants/questionnaire";

export interface SkinAnalysis {
  id: string;
  date: string;
  skinType: string | undefined;
  concerns: string[];
  healthScore: number;
  recommendations: string[];
  imageUri?: string;
}

export interface CycleData {
  id: string;
  date: string;
  phase: "menstrual" | "follicular" | "ovulation" | "luteal";
  symptoms: string[];
  skinCondition: string;
  notes?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  age?: number;
  skinType?: string;
  concerns: string[];
  currentProducts: string[];
  questionnaireAnswers?: QuestionnaireAnswers;
  questionnaireCompletedAt?: string;
}

export const [SkincareStoreProvider, useSkincareStore] = createContextHook(() => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Sarah Ahmed",
    email: "sarah.ahmed@email.com",
    age: 25,
    skinType: "Combination",
    concerns: ["Acne", "Dark Spots", "Large Pores"],
    currentProducts: ["Gentle Cleanser", "Vitamin C Serum", "Moisturizer"],
  });

  const [skinAnalyses, setSkinAnalyses] = useState<SkinAnalysis[]>([
    {
      id: "1",
      date: "2024-01-15",
      skinType: "Combination",
      concerns: ["Mild acne", "Slight dehydration", "Minor sun damage"],
      healthScore: 85,
      recommendations: [
        "Use gentle, oil-free cleanser twice daily",
        "Apply vitamin C serum in the morning",
        "Use retinol treatment 2-3 times per week",
        "Always apply SPF 30+ sunscreen",
      ],
    },
  ]);

  const [cycleData, setCycleData] = useState<CycleData[]>([
    {
      id: "1",
      date: "2024-01-15",
      phase: "luteal",
      symptoms: ["Oily skin", "Breakouts"],
      skinCondition: "More prone to acne",
    },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load data from AsyncStorage on initialization
  useEffect(() => {
    const loadData = async () => {
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
        console.error("Error loading data from AsyncStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save data to AsyncStorage when state changes
  const saveUserProfile = async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem("userProfile", JSON.stringify(profile));
      setUserProfile(profile);
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  };

  const addSkinAnalysis = async (analysis: Omit<SkinAnalysis, "id">) => {
    try {
      const newAnalysis: SkinAnalysis = {
        ...analysis,
        id: Date.now().toString(),
      };
      const updatedAnalyses = [newAnalysis, ...skinAnalyses];
      await AsyncStorage.setItem("skinAnalyses", JSON.stringify(updatedAnalyses));
      setSkinAnalyses(updatedAnalyses);
    } catch (error) {
      console.error("Error saving skin analysis:", error);
    }
  };

  const addCycleEntry = async (entry: Omit<CycleData, "id">) => {
    try {
      const newEntry: CycleData = {
        ...entry,
        id: Date.now().toString(),
      };
      const updatedCycleData = [newEntry, ...cycleData];
      await AsyncStorage.setItem("cycleData", JSON.stringify(updatedCycleData));
      setCycleData(updatedCycleData);
    } catch (error) {
      console.error("Error saving cycle data:", error);
    }
  };

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

  const saveQuestionnaireAnswers = async (answers: QuestionnaireAnswers) => {
    try {
      const updatedProfile: UserProfile = {
        ...userProfile,
        questionnaireAnswers: answers,
        questionnaireCompletedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem("userProfile", JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Error saving questionnaire answers:", error);
      throw error;
    }
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
  };
});