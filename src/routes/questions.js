const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const stringSimilarity = require('string-similarity');
const natural = require('natural'); // npm i natural

// Configure natural language processing
const tokenizer = new natural.WordTokenizer();
natural.PorterStemmer.attach();

// Enhanced answer checking with semantic analysis
router.post('/:id/check', async (req, res) => {
  try {
    const { userAnswer } = req.body;
    const q = await Question.findById(req.params.id);

    if (!q) return res.status(404).json({ error: 'Question not found' });
    if (!userAnswer) return res.status(400).json({ error: 'Answer is required' });

    const analysis = await analyzeAnswer(userAnswer, q);
    
    res.json({
      success: true,
      percent: analysis.finalScore,
      feedback: analysis.feedback,
      keywordsMatched: analysis.matchedKeywords.length,
      totalKeywords: q.keywords.length,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      detailedFeedback: analysis.detailedFeedback,
      confidence: analysis.confidence
    });
  } catch (err) {
    console.error('Answer checking error:', err);
    res.status(500).json({ error: 'Error checking answer. Please try again.' });
  }
});

// Enhanced answer analysis function
async function analyzeAnswer(userAnswer, question) {
  const user = userAnswer.toLowerCase().trim();
  const sample = (question.answer || '').toLowerCase();
  const keywords = question.keywords || [];
  
  // 1. Keyword-based analysis (more flexible)
  const keywordResults = analyzeKeywords(user, keywords);
  
  // 2. Semantic similarity
  const similarityResults = analyzeSimilarity(user, sample);
  
  // 3. Content coverage analysis
  const coverageResults = analyzeContentCoverage(user, sample, keywords);
  
  // 4. Structure and completeness analysis
  const structureResults = analyzeStructure(user, sample);
  
  // Calculate final score with weighted components
  const finalScore = calculateFinalScore(
    keywordResults, 
    similarityResults, 
    coverageResults, 
    structureResults
  );
  
  // Generate comprehensive feedback
  const feedback = generateFeedback(
    finalScore, 
    keywordResults, 
    coverageResults, 
    structureResults
  );
  
  return {
    finalScore: Math.round(finalScore),
    feedback: feedback.summary,
    detailedFeedback: feedback.detailed,
    matchedKeywords: keywordResults.matched,
    missingKeywords: keywordResults.missing,
    confidence: finalScore >= 70 ? 'high' : finalScore >= 40 ? 'medium' : 'low'
  };
}

// More flexible keyword analysis
function analyzeKeywords(userAnswer, keywords) {
  const userTokens = userAnswer.tokenizeAndStem();
  const keywordStems = keywords.map(kw => kw.toLowerCase().tokenizeAndStem().join(' '));
  
  const matched = [];
  const missing = [];
  
  keywordStems.forEach((stemmedKeyword, index) => {
    // Check for exact match or partial match
    const hasExactMatch = userTokens.some(token => 
      stringSimilarity.compareTwoStrings(token, stemmedKeyword) > 0.8
    );
    
    // Check for semantic match using synonyms or related terms
    const hasSemanticMatch = checkSemanticMatch(userAnswer, keywords[index]);
    
    if (hasExactMatch || hasSemanticMatch) {
      matched.push(keywords[index]);
    } else {
      missing.push(keywords[index]);
    }
  });
  
  const score = keywords.length > 0 ? matched.length / keywords.length : 0;
  
  return { matched, missing, score };
}

// Semantic matching using concept groups
function checkSemanticMatch(userAnswer, keyword) {
  const conceptGroups = {
    'hooks': ['hooks', 'useState', 'useEffect', 'useContext', 'custom hooks'],
    'virtual dom': ['virtual dom', 'vdom', 'reconciliation', 'diffing'],
    'state management': ['state', 'useState', 'redux', 'context', 'stateful'],
    'components': ['components', 'functional', 'class', 'jsx'],
    'performance': ['performance', 'optimization', 'memo', 'useMemo', 'useCallback'],
    'flexbox': ['flexbox', 'flex', 'flex container', 'flex item'],
    'css grid': ['css grid', 'grid', 'grid template', 'grid area'],
    'responsive': ['responsive', 'media queries', 'breakpoints', 'mobile'],
    'rest': ['rest', 'restful', 'http methods', 'endpoints'],
    'graphql': ['graphql', 'query', 'mutation', 'schema'],
    'rate limiting': ['rate limiting', 'throttling', 'api limits', '429'],
    'sql': ['sql', 'query', 'database', 'select', 'join'],
    'window functions': ['window functions', 'over', 'partition by', 'rank'],
    'bias variance': ['bias', 'variance', 'overfitting', 'underfitting'],
    'regularization': ['regularization', 'l1', 'l2', 'lasso', 'ridge'],
    'cross validation': ['cross validation', 'k-fold', 'train test split']
  };
  
  const lowerKeyword = keyword.toLowerCase();
  const lowerUserAnswer = userAnswer.toLowerCase();
  
  // Check if keyword belongs to any concept group
  for (const [concept, relatedTerms] of Object.entries(conceptGroups)) {
    if (relatedTerms.includes(lowerKeyword)) {
      // Check if any related term is mentioned
      return relatedTerms.some(term => lowerUserAnswer.includes(term));
    }
  }
  
  return false;
}

// Improved similarity analysis
function analyzeSimilarity(userAnswer, sampleAnswer) {
  if (!sampleAnswer) return { score: 0 };
  
  // Basic string similarity
  const basicSimilarity = stringSimilarity.compareTwoStrings(userAnswer, sampleAnswer);
  
  // Token-based similarity
  const userTokens = userAnswer.split(/\s+/);
  const sampleTokens = sampleAnswer.split(/\s+/);
  const commonTokens = userTokens.filter(token => 
    sampleTokens.some(st => stringSimilarity.compareTwoStrings(token, st) > 0.7)
  );
  
  const tokenSimilarity = sampleTokens.length > 0 ? commonTokens.length / sampleTokens.length : 0;
  
  // Use the higher of the two similarity scores
  const score = Math.max(basicSimilarity, tokenSimilarity * 0.8);
  
  return { score };
}

// Content coverage analysis
function analyzeContentCoverage(userAnswer, sampleAnswer, keywords) {
  if (!sampleAnswer) return { score: 0 };
  
  const sampleSentences = sampleAnswer.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const userSentences = userAnswer.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sampleSentences.length === 0) return { score: 0 };
  
  let coveredSentences = 0;
  
  sampleSentences.forEach(sampleSentence => {
    const sampleTokens = sampleSentence.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    const hasCoverage = sampleTokens.some(token => 
      userAnswer.toLowerCase().includes(token) && 
      token.length > 3 // Only consider meaningful words
    );
    
    if (hasCoverage) coveredSentences++;
  });
  
  const score = sampleSentences.length > 0 ? coveredSentences / sampleSentences.length : 0;
  
  return { score, covered: coveredSentences, total: sampleSentences.length };
}

// Structure and completeness analysis
function analyzeStructure(userAnswer, sampleAnswer) {
  const userLength = userAnswer.split(/\s+/).length;
  const sampleLength = sampleAnswer ? sampleAnswer.split(/\s+/).length : 50;
  
  // Length adequacy (not too short, not required to be as long as sample)
  const lengthScore = Math.min(1, userLength / Math.max(sampleLength * 0.3, 20));
  
  // Check for answer structure (presence of multiple points)
  const hasMultiplePoints = (userAnswer.match(/[.!?]/g) || []).length >= 1;
  const structureScore = hasMultiplePoints ? 0.8 : 0.4;
  
  return { score: (lengthScore + structureScore) / 2 };
}

// Calculate final score with balanced weights
function calculateFinalScore(keywordResults, similarityResults, coverageResults, structureResults) {
  const weights = {
    keywords: 0.4,    // Most important - conceptual understanding
    similarity: 0.2,  // Less important - exact wording
    coverage: 0.3,    // Important - content completeness
    structure: 0.1    // Least important - formatting
  };
  
  const weightedScore = 
    (keywordResults.score * weights.keywords) +
    (similarityResults.score * weights.similarity) +
    (coverageResults.score * weights.coverage) +
    (structureResults.score * weights.structure);
  
  return Math.min(100, weightedScore * 100);
}

// Generate comprehensive feedback
function generateFeedback(score, keywordResults, coverageResults, structureResults) {
  let summary = '';
  const detailed = [];
  
  if (score >= 90) {
    summary = `Excellent! (${score}%) You demonstrated comprehensive understanding of all key concepts.`;
    detailed.push('✅ Excellent coverage of all major concepts');
    detailed.push('✅ Clear and well-structured explanation');
  } else if (score >= 70) {
    summary = `Good job! (${score}%) You covered the main concepts well but missed some details.`;
    detailed.push('✅ Good understanding of core concepts');
    if (keywordResults.missing.length > 0) {
      detailed.push(`📝 Consider mentioning: ${keywordResults.missing.slice(0, 3).join(', ')}`);
    }
  } else if (score >= 50) {
    summary = `Fair attempt (${score}%). You have the basic idea but need to expand on key points.`;
    detailed.push('✅ Basic understanding present');
    if (keywordResults.missing.length > 0) {
      detailed.push(`📝 Important concepts missing: ${keywordResults.missing.slice(0, 5).join(', ')}`);
    }
  } else {
    summary = `Needs improvement (${score}%). Review the key concepts and try again.`;
    detailed.push('📚 Review the fundamental concepts');
    if (keywordResults.matched.length > 0) {
      detailed.push(`✅ Good start with: ${keywordResults.matched.join(', ')}`);
    }
    if (keywordResults.missing.length > 0) {
      detailed.push(`📝 Focus on: ${keywordResults.missing.slice(0, 5).join(', ')}`);
    }
  }
  
  // Add specific suggestions
  if (coverageResults.covered < coverageResults.total * 0.5) {
    detailed.push('💡 Try to cover more aspects of the topic in your answer');
  }
  
  if (structureResults.score < 0.6) {
    detailed.push('📝 Structure your answer with clear points and examples');
  }
  
  return { summary, detailed };
}

// ... rest of your existing routes remain the same
module.exports = router;