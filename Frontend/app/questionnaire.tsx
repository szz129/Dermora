import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { QUESTIONNAIRE, QuestionnaireAnswers, Question } from "../constants/questionnaire";
import { useSkincareStore } from "../hooks/use-skincare-store-supabase";

const SECTION_HEADERS: Record<number, string> = {
  0: "About You",
  1: "Your Skin",
  2: "Your Skin",
  3: "Your Skin",
  4: "Your Skin",
  5: "Your Skin",
  6: "Your Skin",
  7: "Your Products",
  8: "Your Products",
  9: "Your Lifestyle",
  10: "Your Lifestyle",
  11: "Your Lifestyle",
  12: "Your Lifestyle",
  13: "Your Lifestyle",
  14: "Your Lifestyle",
  15: "Your Lifestyle",
  16: "Makeup & Products",
  17: "Makeup & Products",
  18: "Budget",
  19: "Budget",
  20: "Health & Safety",
  21: "Your Goals",
  22: "Your Goals",
  23: "Your Goals",
  24: "Final Notes",
};

export default function QuestionnaireScreen() {
  const { saveQuestionnaireAnswers, userProfile } = useSkincareStore();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if ((userProfile as any)?.questionnaireAnswers) {
      setAnswers((userProfile as any).questionnaireAnswers);
    }
  }, [userProfile]);

  const currentQuestion = QUESTIONNAIRE[currentStep];
  const currentProgress = Math.round(((currentStep + 1) / QUESTIONNAIRE.length) * 100);
  const currentSection = SECTION_HEADERS[currentStep] || "";

  const handleAnswer = (questionId: string, value: string) => {
    const question = QUESTIONNAIRE.find((q) => q.id === questionId);
    if (!question) return;
    if (question.type === "multiple") {
      const currentAnswers = (answers[questionId] as string[]) || [];
      const newAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter((v) => v !== value)
        : [...currentAnswers, value];
      setAnswers({ ...answers, [questionId]: newAnswers });
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers({ ...answers, [questionId]: text });
  };

  const isAnswered = (question: Question): boolean => {
    const answer = answers[question.id];
    if (question.type === "text") return true;
    if (question.type === "multiple") return Array.isArray(answer) && answer.length > 0;
    return !!answer;
  };

  const handleNext = () => {
    if (currentStep < QUESTIONNAIRE.length - 1) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await saveQuestionnaireAnswers(answers);
      if (Platform.OS === 'web') {
        window.alert("Success! Your profile is ready!");
        router.replace("/(tabs)/products");
      } else {
        Alert.alert("Success", "Your profile is ready!", [
          { text: "View Products", onPress: () => router.replace("/(tabs)/products") },
        ]);
      }
    } catch (error: any) {
      const msg = error.message || "Failed to submit. Please try again.";
      if (Platform.OS === 'web') {
        window.alert("Error: " + msg);
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionOptions = () => {
    if (currentQuestion.type === "text") {
      return (
        <TextInput
          style={[styles.textInput, Platform.OS === 'web' ? { outline: 'none' } as any : {}]}
          placeholder="Type your answer here..."
          placeholderTextColor="#FF9DB5"
          multiline
          underlineColorAndroid="transparent"
          value={(answers[currentQuestion.id] as string) || ""}
          onChangeText={(text) => handleTextAnswer(currentQuestion.id, text)}
        />
      );
    }

    return (
      <View style={styles.optionsContainer}>
        {currentQuestion.options?.map((option) => {
          const selectedAnswers = (answers[currentQuestion.id] as string[]) || [];
          const isSelected = currentQuestion.type === "multiple"
            ? selectedAnswers.includes(option.value)
            : answers[currentQuestion.id] === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
              onPress={() => handleAnswer(currentQuestion.id, option.value)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.progressHeader}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${currentProgress}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{currentProgress}%</Text>
      </View>

      <TouchableOpacity onPress={handlePrevious} style={[styles.backBtn, currentStep === 0 && { opacity: 0 }]}>
        <ChevronLeft color="#4A3232" size={24} />
      </TouchableOpacity>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentSection ? (
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{currentSection}</Text>
          </View>
        ) : null}

        <Text style={styles.questionTitle}>{currentQuestion.question}</Text>
        <Text style={styles.questionSub}>
          Identifying your {currentQuestion.category.toLowerCase()} will help us offer more effective recommendations.
        </Text>

        {renderQuestionOptions()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep === QUESTIONNAIRE.length - 1 ? (
          <TouchableOpacity
            style={[styles.continueButton, (!isAnswered(currentQuestion) || isSubmitting) && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={!isAnswered(currentQuestion) || isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.continueButtonText}>Submit</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.continueButton, !isAnswered(currentQuestion) && styles.disabledBtn]}
            onPress={handleNext}
            disabled={!isAnswered(currentQuestion)}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFBF5",
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFB6C1",
    borderRadius: 3,
  },
  progressLabel: {
    marginLeft: 10,
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  backBtn: {
    paddingHorizontal: 25,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
  },
  sectionBadge: {
    alignSelf: 'center',
    backgroundColor: "#FFE4E9",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 5,
  },
  sectionBadgeText: {
    fontSize: 13,
    color: "#FF9DB5",
    fontWeight: "700",
  },
  questionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#4A3232",
    textAlign: "center",
    marginTop: 15,
  },
  questionSub: {
    fontSize: 14,
    color: "#7D5A5A",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 35,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
    paddingBottom: 40,
  },
  optionButton: {
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 0,
  },
  optionButtonSelected: {
    backgroundColor: "#FFE4E9",
    borderWidth: 0,
  },
  optionText: {
    fontSize: 16,
    color: "#FF9DB5",
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#FF9DB5",
    fontWeight: "700",
  },
  textInput: {
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 20,
    borderRadius: 15,
    fontSize: 16,
    color: "#4A3232",
    minHeight: 60,
    textAlignVertical: "top",
    borderWidth: 0,
  },
  footer: {
    padding: 25,
  },
  continueButton: {
    backgroundColor: "#FFB6C1",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  disabledBtn: {
    opacity: 0.5,
  },
});