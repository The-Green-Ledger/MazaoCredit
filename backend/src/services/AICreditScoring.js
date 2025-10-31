// JS-based AI scoring service with OpenAI fallback and robust mock mode
const { OpenAI } = require('openai');
const { supabase } = require('../config/supabase');

class AICreditScoring {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyzeFarmerCredit(farmerData) {
    try {
      // If no OpenAI API key, use mock analysis
      if (!process.env.OPENAI_API_KEY) {
        return this.getMockCreditAnalysis(farmerData);
      }

      const prompt = this.buildCreditAnalysisPrompt(farmerData);

      // Chat completion with a domain-specific prompt (kept conservative)
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an agricultural finance expert. Analyze farmer data and provide credit scoring, loan eligibility, and financial recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      return this.parseCreditAnalysis(response.choices[0].message.content, farmerData);
    } catch (error) {
      console.error('AI Credit Analysis Error:', error);
      return this.getMockCreditAnalysis(farmerData);
    }
  }

  // Build a stable prompt summarizing the farmer context
  buildCreditAnalysisPrompt(farmerData) {
    const {
      farmData = {},
      financialData = {},
      productionData = {},
      locationData = {},
      historicalData = {}
    } = farmerData;

    return `
Analyze this farmer's creditworthiness and provide a detailed assessment:

FARM INFORMATION:
- Farm Size: ${farmData.farmSize || 'Not specified'}
- Farm Type: ${farmData.farmType || 'Not specified'}
- Years Farming: ${farmData.yearsExperience || 'Unknown'}
- Main Crops: ${farmData.mainCrops || 'Not specified'}
- Location: ${locationData.region || 'Unknown'}, ${locationData.country || 'Unknown'}

FINANCIAL INFORMATION:
- Annual Revenue: ${financialData.annualRevenue || 'Unknown'}
- Assets Value: ${financialData.assetsValue || 'Unknown'}
- Existing Debt: ${financialData.existingDebt || 'None'}
- Financial Readiness: ${financialData.financialReadiness || 0}/10

PRODUCTION DATA:
- Yield History: ${productionData.yieldHistory || 'No data'}
- Quality Scores: ${productionData.qualityScores || 'No data'}
- Market Prices: ${productionData.marketPrices || 'No data'}

HISTORICAL DATA:
- Payment History: ${historicalData.paymentHistory || 'No data'}
- Loan History: ${historicalData.loanHistory || 'No data'}
- Customer Reviews: ${historicalData.customerReviews || 'No data'}

Please provide:
1. Credit Score (0-100)
2. Loan Eligibility (Yes/No/Partial)
3. Recommended Loan Amount
4. Risk Assessment
5. Key Strengths
6. Key Weaknesses
7. Improvement Recommendations
8. Financial Readiness Score
9. Maximum Recommended Loan Amount
10. Interest Rate Recommendation
    `;
  }

  // Parse free-form model output into a structured credit analysis
  parseCreditAnalysis(aiResponse, farmerData) {
    // Parse AI response and extract structured data
    const lines = aiResponse.split('\n');
    const analysis = {
      creditScore: this.extractNumber(lines, 'Credit Score', 50),
      loanEligibility: this.extractEligibility(lines),
      recommendedLoanAmount: this.extractLoanAmount(lines),
      riskLevel: this.extractRiskLevel(lines),
      strengths: this.extractList(lines, 'Strengths'),
      weaknesses: this.extractList(lines, 'Weaknesses'),
      recommendations: this.extractList(lines, 'Recommendations'),
      financialReadiness: this.extractNumber(lines, 'Financial Readiness', 5),
      maxLoanAmount: this.extractMaxLoanAmount(lines, farmerData),
      interestRate: this.extractInterestRate(lines),
      analysisDate: new Date().toISOString()
    };

    return analysis;
  }

  extractNumber(lines, keyword, defaultValue) {
    for (const line of lines) {
      if (line.includes(keyword)) {
        const match = line.match(/(\d+)/);
        return match ? parseInt(match[1]) : defaultValue;
      }
    }
    return defaultValue;
  }

  extractEligibility(lines) {
    for (const line of lines) {
      if (line.includes('Loan Eligibility')) {
        if (line.includes('Yes')) return 'eligible';
        if (line.includes('No')) return 'not_eligible';
        if (line.includes('Partial')) return 'partially_eligible';
      }
    }
    return 'requires_review';
  }

  extractLoanAmount(lines) {
    for (const line of lines) {
      if (line.includes('Recommended Loan Amount') || line.includes('Loan Amount')) {
        const match = line.match(/\$?(\d+,?\d*)/);
        return match ? parseFloat(match[1].replace(',', '')) : 0;
      }
    }
    return 0;
  }

  extractMaxLoanAmount(lines, farmerData) {
    const baseAmount = this.extractLoanAmount(lines);
    const farmSize = parseFloat(farmerData.farmData?.farmSize) || 1;
    const revenue = parseFloat(farmerData.financialData?.annualRevenue) || 0;
    
    // Calculate max loan based on farm size and revenue
    const calculatedMax = Math.min(
      farmSize * 1000, // $1000 per acre/hectare
      revenue * 0.5    // 50% of annual revenue
    );
    
    return baseAmount > 0 ? Math.max(baseAmount, calculatedMax) : calculatedMax;
  }

  extractRiskLevel(lines) {
    for (const line of lines) {
      if (line.includes('Risk') || line.includes('risk')) {
        if (line.includes('High') || line.includes('high')) return 'high';
        if (line.includes('Medium') || line.includes('medium')) return 'medium';
        if (line.includes('Low') || line.includes('low')) return 'low';
      }
    }
    return 'medium';
  }

  extractInterestRate(lines) {
    for (const line of lines) {
      if (line.includes('Interest Rate')) {
        const match = line.match(/(\d+\.?\d*)%/);
        return match ? parseFloat(match[1]) : 8.5;
      }
    }
    return 8.5; // Default interest rate
  }

  extractList(lines, keyword) {
    const items = [];
    let foundSection = false;
    
    for (const line of lines) {
      if (line.includes(keyword)) {
        foundSection = true;
        continue;
      }
      
      if (foundSection) {
        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          items.push(line.trim().substring(1).trim());
        } else if (line.trim() === '') {
          break;
        }
      }
    }
    
    return items.length > 0 ? items : [`No ${keyword.toLowerCase()} identified`];
  }

  // Deterministic mock scoring using simple heuristics for local/dev
  getMockCreditAnalysis(farmerData) {
    const farmSize = parseFloat(farmerData.farmData?.farmSize) || 1;
    const revenue = parseFloat(farmerData.financialData?.annualRevenue) || 0;
    const experience = parseInt(farmerData.farmData?.yearsExperience) || 1;
    
    // Calculate mock scores based on farmer data
    const baseScore = Math.min(80 + (experience * 2) + (revenue > 0 ? 10 : 0), 95);
    const financialReadiness = Math.min(Math.floor((revenue / 10000) * 10), 10);
    const maxLoan = Math.min(farmSize * 800, revenue * 0.6);
    
    return {
      creditScore: baseScore,
      loanEligibility: baseScore > 60 ? 'eligible' : 'requires_review',
      recommendedLoanAmount: maxLoan * 0.7,
      riskLevel: baseScore > 80 ? 'low' : baseScore > 60 ? 'medium' : 'high',
      strengths: [
        'Agricultural experience',
        'Stable farming operation',
        revenue > 0 ? 'Existing revenue stream' : 'Potential for growth'
      ],
      weaknesses: [
        revenue === 0 ? 'No established revenue' : 'Limited financial history',
        'Dependent on seasonal factors'
      ],
      recommendations: [
        'Maintain consistent production records',
        'Diversify crop selection',
        'Build relationship with local markets'
      ],
      financialReadiness,
      maxLoanAmount: maxLoan,
      interestRate: baseScore > 80 ? 6.5 : baseScore > 60 ? 8.5 : 12.0,
      analysisDate: new Date().toISOString(),
      isMockData: true
    };
  }

  // Update credit score based on new transaction data
  // Example: re-score a user after a new transaction
  async updateCreditScore(userId, transactionData) {
    try {
      // Get current user data
      const { data: user } = await supabase
        .from('users')
        .select('profile')
        .eq('id', userId)
        .single();

      if (!user) throw new Error('User not found');

      const updatedData = {
        ...user.profile,
        transactionHistory: [
          ...(user.profile.transactionHistory || []),
          transactionData
        ]
      };

      // Re-analyze with updated data
      const newAnalysis = await this.analyzeFarmerCredit(updatedData);

      // Update user profile
      await supabase
        .from('users')
        .update({
          profile: {
            ...user.profile,
            creditScore: newAnalysis.creditScore,
            creditAnalysis: newAnalysis,
            lastCreditUpdate: new Date().toISOString()
          }
        })
        .eq('id', userId);

      return newAnalysis;
    } catch (error) {
      console.error('Credit score update error:', error);
      throw error;
    }
  }
}

module.exports = new AICreditScoring();
