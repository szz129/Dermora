/**
 * API Helper Functions
 * 
 * Functions to interact with Supabase database tables
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { SkinAnalysis, CycleData, UserProfile } from '../hooks/use-skincare-store';

// ============================================
// DATA TRANSFORMATION HELPERS
// ============================================

/**
 * Transform database profile (snake_case) to frontend format (camelCase)
 */
function transformProfile(dbProfile: any): UserProfile {
  return {
    name: dbProfile.name || '',
    email: dbProfile.email || '',
    age: dbProfile.age || undefined,
    skinType: dbProfile.skin_type || undefined,
    concerns: dbProfile.concerns || [],
    currentProducts: dbProfile.current_products || [],
  };
}

/**
 * Transform database skin analysis (snake_case) to frontend format (camelCase)
 */
function transformSkinAnalysis(dbAnalysis: any): SkinAnalysis {
  return {
    id: dbAnalysis.id,
    date: dbAnalysis.date,
    skinType: dbAnalysis.skin_type || '',
    concerns: dbAnalysis.concerns || [],
    healthScore: dbAnalysis.health_score || 0,
    recommendations: dbAnalysis.recommendations || [],
    imageUri: dbAnalysis.image_url || undefined,
  };
}

/**
 * Transform database cycle data (snake_case) to frontend format (camelCase)
 */
function transformCycleData(dbCycle: any): CycleData {
  return {
    id: dbCycle.id,
    date: dbCycle.date,
    phase: dbCycle.phase as CycleData['phase'],
    symptoms: dbCycle.symptoms || [],
    skinCondition: dbCycle.skin_condition || '',
    notes: dbCycle.notes || undefined,
  };
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

/**
 * Get user profile
 */
export async function getProfile(userId: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    // Also get questionnaire answers
    const { data: questionnaireData } = await getQuestionnaireAnswers(userId);
    
    const profile = transformProfile(data);
    if (questionnaireData) {
      (profile as any).questionnaireAnswers = questionnaireData.answers;
      (profile as any).questionnaireCompletedAt = questionnaireData.completed_at;
    }
    
    return { data: profile, error: null };
  } catch (error: any) {
    console.error('Get profile error:', error);
    return { data: null, error };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        age: updates.age,
        skin_type: updates.skinType,
        concerns: updates.concerns,
        current_products: updates.currentProducts,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    const transformed = data ? transformProfile(data) : null;
    return { data: transformed, error: null };
  } catch (error: any) {
    console.error('Update profile error:', error);
    return { data: null, error };
  }
}

// ============================================
// QUESTIONNAIRE FUNCTIONS
// ============================================

/**
 * Save questionnaire answers
 */
export async function saveQuestionnaireAnswers(userId: string, answers: Record<string, any>) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    const { data, error } = await supabase
      .from('questionnaire_answers')
      .insert({
        user_id: userId,
        answers: answers,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Save questionnaire Supabase error:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }
    return { data, error: null };
  } catch (error: any) {
    console.error('Save questionnaire error:', error);
    return { data: null, error };
  }
}

// ============================================
// LLM PRODUCT RECOMMENDATIONS
// ============================================

/**
 * Send questionnaire answers to the dedicated LLM service to get suggested products
 */
export async function generateProductRecommendations(userId: string, answers: Record<string, any>) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    const LLM_SERVICE_URL = process.env.EXPO_PUBLIC_LLM_SERVICE_URL || 'http://localhost:8001';
    
    console.log("Sending answers to LLM at:", `${LLM_SERVICE_URL}/recommend-products`);
    
    // 1. Call custom external LLM service
    const response = await fetch(`${LLM_SERVICE_URL}/recommend-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, answers }),
    });

    if (!response.ok) {
      console.warn("LLM service is currently unavailable or returned an error.");
      // We can fallback to an empty array or fake data if the LLM isn't built yet
      return { data: [], error: new Error(`LLM Error: ${response.status}`) };
    }

    const jsonResponse = await response.json();
    const recommendations = jsonResponse.recommendations || [];
    console.log("LLM Service returned:", recommendations.length, "recommendations.");

    // 2. Insert recommended products into Supabase
    if (recommendations && recommendations.length > 0) {
      const inserts = recommendations.map((product: any) => ({
        user_id: userId,
        product_name: product.name,
        product_category: product.category,
        brand: product.brand,
        price_pkr: product.price_pkr,
        description: product.description, // New field
        reason: product.reason,
        priority: product.priority || 3,
      }));

      console.log("Saving to product_recommendations table for user:", userId);
      // Delete old recommendations first to avoid duplicates
      await supabase
        .from('product_recommendations')
        .delete()
        .eq('user_id', userId);

      const { data: dbData, error: dbError } = await supabase
        .from('product_recommendations')
        .insert(inserts)
        .select();

      if (dbError) {
        console.error("Supabase Save Error:", dbError.message);
        throw new Error(`Database Save Failed: ${dbError.message}`);
      }
      
      console.log("Recommendations saved successfully! ✅");
      return { data: dbData, error: null };
    }

    console.warn("LLM returned no recommendation array.");
    return { data: [], error: null };
  } catch (error: any) {
    console.error('CRITICAL: Generate Recommendations Error:', error.message || error);
    return { data: null, error };
  }
}

/**
 * Get latest product recommendations for a user
 */
export async function getLatestProductRecommendations(userId: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    const { data, error } = await supabase
      .from('product_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Get latest recommendations error:', error);
    return { data: null, error };
  }
}

/**
 * Get questionnaire answers
 */
export async function getQuestionnaireAnswers(userId: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    const { data, error } = await supabase
      .from('questionnaire_answers')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Get questionnaire error:', error);
    return { data: null, error };
  }
}

// ============================================
// SKIN ANALYSIS FUNCTIONS
// ============================================

/**
 * Save skin analysis result
 */
export async function saveSkinAnalysis(userId: string, analysis: Omit<SkinAnalysis, 'id'>) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    const { data, error } = await supabase
      .from('skin_analyses')
      .insert({
        user_id: userId,
        date: analysis.date,
        skin_type: analysis.skinType,
        concerns: analysis.concerns,
        health_score: analysis.healthScore,
        recommendations: analysis.recommendations,
        image_url: analysis.imageUri,
      })
      .select()
      .single();

    if (error) throw error;
    
    const transformed = data ? transformSkinAnalysis(data) : null;
    return { data: transformed, error: null };
  } catch (error: any) {
    console.error('Save skin analysis error:', error);
    return { data: null, error };
  }
}

/**
 * Get all skin analyses for a user
 */
export async function getSkinAnalyses(userId: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    const { data, error } = await supabase
      .from('skin_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    
    const transformed = data ? data.map(transformSkinAnalysis) : [];
    return { data: transformed, error: null };
  } catch (error: any) {
    console.error('Get skin analyses error:', error);
    return { data: null, error };
  }
}

/**
 * Get latest skin analysis
 */
export async function getLatestSkinAnalysis(userId: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    const { data, error } = await supabase
      .from('skin_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    
    const transformed = data ? transformSkinAnalysis(data) : null;
    return { data: transformed, error: null };
  } catch (error: any) {
    console.error('Get latest analysis error:', error);
    return { data: null, error };
  }
}

/**
 * Analyze skin image using AI service
 * Uploads image, analyzes with AI, and saves to database
 */
export async function analyzeAndSaveSkinImage(
  userId: string,
  imageUri: string
): Promise<{ data: SkinAnalysis | null; error: any }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    // Call Python AI service directly
    // For local development, use localhost or your machine's IP address
    // For mobile testing, use your computer's IP: http://192.168.1.100:8000
    const AI_SERVICE_URL = process.env.EXPO_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
    
    // Fetch image as blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Create form data
    const formData = new FormData();
    formData.append('file', blob, 'skin-scan.jpg');
    
    // Call Python AI service directly
    const aiResponse = await fetch(`${AI_SERVICE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });
    
    if (!aiResponse.ok) {
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }
    
    const aiResult = await aiResponse.json();
    
    // Upload image to Supabase Storage
    const fileName = `${userId}/${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('skin-scans')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    
    if (uploadError) {
      console.warn('Image upload failed:', uploadError);
    }
    
    // Get public URL
    let imageUrl = imageUri; // Fallback to original URI
    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from('skin-scans')
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }
    
    // Create analysis object
    const analysis: Omit<SkinAnalysis, 'id'> = {
      date: new Date().toISOString(),
      skinType: '',
      concerns: aiResult.detected_conditions || [],
      healthScore: aiResult.overall_health_score || 50,
      recommendations: aiResult.recommendations || [],
      imageUri: imageUrl,
    };
    
    // Save to database
    const { data: dbData, error: dbError } = await supabase
      .from('skin_analyses')
      .insert({
        user_id: userId,
        date: analysis.date,
        skin_type: analysis.skinType || null,
        concerns: analysis.concerns,
        health_score: analysis.healthScore,
        recommendations: analysis.recommendations,
        image_url: analysis.imageUri,
        ai_confidence: aiResult.confidence_scores || {},
      })
      .select()
      .single();
    
    if (dbError) throw dbError;
    
    const transformed = dbData ? transformSkinAnalysis(dbData) : null;
    return { data: transformed, error: null };
  } catch (error: any) {
    console.error('Analyze and save skin image error:', error);
    return { data: null, error };
  }
}

// ============================================
// CYCLE DATA FUNCTIONS
// ============================================

/**
 * Save cycle data entry
 */
export async function saveCycleData(userId: string, cycleEntry: Omit<CycleData, 'id'>) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    const { data, error } = await supabase
      .from('cycle_data')
      .upsert({
        user_id: userId,
        date: cycleEntry.date,
        phase: cycleEntry.phase,
        symptoms: cycleEntry.symptoms,
        skin_condition: cycleEntry.skinCondition,
        notes: cycleEntry.notes,
      }, {
        onConflict: 'user_id,date',
      })
      .select()
      .single();

    if (error) throw error;
    
    const transformed = data ? transformCycleData(data) : null;
    return { data: transformed, error: null };
  } catch (error: any) {
    console.error('Save cycle data error:', error);
    return { data: null, error };
  }
}

/**
 * Get cycle data for a user
 */
export async function getCycleData(userId: string, startDate?: string, endDate?: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    let query = supabase!
      .from('cycle_data')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    const transformed = data ? data.map(transformCycleData) : [];
    return { data: transformed, error: null };
  } catch (error: any) {
    console.error('Get cycle data error:', error);
    return { data: null, error };
  }
}

