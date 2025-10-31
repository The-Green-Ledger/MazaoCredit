const AICreditScoring = require('./AICreditScoring');

// Simple in-memory store for demo/mock mode
const inMemoryStore = {
  profilesByUserId: new Map(),
  creditAnalysisByUserId: new Map(),
};

const AIModelIntegration = {
  async predictCreditScore(farmerData, userId) {
    const analysis = await AICreditScoring.analyzeFarmerCredit(farmerData);
    if (userId) {
      inMemoryStore.creditAnalysisByUserId.set(userId, analysis);
    }
    return analysis;
  },

  async analyzeProductQuality(productData) {
    // Placeholder for future product quality model
    return {
      qualityScore: 85,
      issues: ['Minor size variance'],
      recommendations: ['Standardize sorting process', 'Improve packaging consistency'],
      analysisDate: new Date().toISOString(),
    };
  },

  saveProfile(userId, profile) {
    if (!userId) return;
    inMemoryStore.profilesByUserId.set(userId, profile);
  },

  getProfile(userId) {
    return inMemoryStore.profilesByUserId.get(userId);
  },

  getCreditAnalysis(userId) {
    return inMemoryStore.creditAnalysisByUserId.get(userId);
  }
};

// Expose a setter for external persistence of computed analysis
AIModelIntegration.setCreditAnalysis = function(userId, analysis) {
  if (!userId || !analysis) return;
  inMemoryStore.creditAnalysisByUserId.set(userId, analysis);
};

module.exports = AIModelIntegration;


