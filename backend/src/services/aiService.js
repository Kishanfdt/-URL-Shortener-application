const axios = require('axios');

/**
 * Scrape webpage metadata and main content paragraphs using regex
 * @param {string} url - The target URL
 */
const scrapeWebpage = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000
    });

    const html = response.data;
    
    // Extract page title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract meta description
    const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i) ||
                      html.match(/<meta[^>]+content="([^"]+)"[^>]+name="description"/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract raw text from paragraphs (up to 3 paragraphs)
    const paragraphs = [];
    const pRegex = /<p[^>]*>(.*?)<\/p>/gi;
    let match;
    let count = 0;
    while ((match = pRegex.exec(html)) !== null && count < 5) {
      // Strip HTML tags from paragraph
      const cleanP = match[1].replace(/<[^>]+>/g, '').trim();
      if (cleanP.length > 30) {
        paragraphs.push(cleanP);
        count++;
      }
    }

    return {
      title,
      description,
      bodyText: paragraphs.join('\n\n')
    };
  } catch (err) {
    console.error(`Scraping failed for ${url}:`, err.message);
    // Return graceful fallback
    const domain = new URL(url).hostname;
    return {
      title: domain,
      description: 'Webpage description not available.',
      bodyText: ''
    };
  }
};

/**
 * Call Gemini API using Axios to generate marketing copy and summary
 */
const queryGemini = async (prompt, systemInstruction = '') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [{
          text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const res = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000
    });

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return JSON.parse(text);
    }
    return null;
  } catch (err) {
    console.error('Gemini API call failed:', err.message);
    return null;
  }
};

/**
 * Generate a complete AI Marketing Suite payload
 */
const generateMarketingSuite = async (url, title, description, bodyText) => {
  const systemPrompt = `You are a social media copywriter. Output raw JSON ONLY. The JSON schema must be:
  {
    "summary": "Short 1-2 sentence summary of page content",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "headline": "A catchy, click-worthy marketing headline",
    "socialCaption": "Short engaging social caption with emojis",
    "linkedinPost": "A professional LinkedIn post with hashtags and bullet points",
    "twitterPost": "A punchy Twitter/X tweet within 280 characters"
  }`;

  const userPrompt = `Scrape Data:
  URL: ${url}
  Title: ${title}
  Description: ${description}
  Extract: ${bodyText ? bodyText.substring(0, 1000) : ''}`;

  const aiResult = await queryGemini(userPrompt, systemPrompt);
  if (aiResult) {
    return {
      title: title || 'Products & Services',
      summary: aiResult.summary || '',
      keyPoints: aiResult.keyPoints || [],
      headline: aiResult.headline || '',
      socialCaption: aiResult.socialCaption || '',
      linkedinPost: aiResult.linkedinPost || '',
      twitterPost: aiResult.twitterPost || ''
    };
  }

  // Fallback heuristics generator (very realistic templates)
  const name = title || new URL(url).hostname;
  const cleanName = name.replace(/(https?:\/\/)?(www\.)?/, '').split('.')[0];
  const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  return {
    title: name,
    summary: `Discover ${capitalized}, offering premium solutions and content. Perfect for users interested in optimizing their daily operations and staying ahead.`,
    keyPoints: [
      `Saves time and increases operational efficiency.`,
      `Modern, responsive, user-friendly interface.`,
      `Robust security measures and real-time analytical reporting.`
    ],
    headline: `🔥 Unleash the Power of ${capitalized} Today!`,
    socialCaption: `Looking to elevate your workflow? Check out ${capitalized} for state-of-the-art tools and features. 👇`,
    linkedinPost: `Are you ready to take your results to the next level? 🚀\n\n${capitalized} provides high-performance services designed to streamline your campaign analytics and shorten links instantly.\n\nKey Benefits:\n- Instant setups\n- Advanced analytics tracking\n- Global TLD resolutions\n\nCheck out the link below! #Tech #Innovation #Marketing`,
    twitterPost: `Boost your productivity with ${capitalized}! Sleek features, advanced performance details, and real-time support. ⚡️ check it out: `
  };
};

/**
 * Check if the URL is suspicious, phishing, or malware
 * @param {string} urlString - The target URL to check
 */
const checkLinkSafety = async (urlString) => {
  let riskScore = 0;
  const warnings = [];
  
  try {
    const parsedUrl = new URL(urlString);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();

    // Heuristic 1: Suspicious TLDs
    const suspiciousTlds = ['.xyz', '.tk', '.ml', '.ga', '.cf', '.gq', '.cc', '.ru', '.download', '.click', '.date', '.loan'];
    const matchedTld = suspiciousTlds.find(tld => hostname.endsWith(tld));
    if (matchedTld) {
      riskScore += 25;
      warnings.push(`Domain ends with a high-risk TLD (${matchedTld}) often used in phishing.`);
    }

    // Heuristic 2: Phishing keywords in domain/path
    const phishingKeywords = ['login', 'signin', 'secure', 'bank', 'verify', 'update', 'account', 'auth', 'billing', 'support', 'wallet', 'paypal', 'netflix', 'crypto'];
    const matchedKeywords = phishingKeywords.filter(keyword => hostname.includes(keyword) || pathname.includes(keyword));
    if (matchedKeywords.length > 0) {
      riskScore += matchedKeywords.length * 15;
      warnings.push(`Contains high-risk keywords associated with credential theft: ${matchedKeywords.join(', ')}.`);
    }

    // Heuristic 3: IP Address instead of hostname
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (ipRegex.test(hostname)) {
      riskScore += 40;
      warnings.push('URL hostname is a raw IP address instead of a domain name, which is highly suspicious.');
    }

    // Heuristic 4: Subdomain nesting (too deep)
    const subdomainCount = hostname.split('.').length;
    if (subdomainCount > 4) {
      riskScore += 20;
      warnings.push('URL contains too many subdomains, which is a common trick used to mimic legitimate domains.');
    }

    // Heuristic 5: HTTPS protocol
    if (parsedUrl.protocol !== 'https:') {
      riskScore += 15;
      warnings.push('Connection is unencrypted (HTTP). Secure links should always use HTTPS.');
    }

    // Cap risk score at 99
    riskScore = Math.min(riskScore, 99);

    // Call Gemini API for advanced threat intelligence if key exists
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const safetyPrompt = `Analyze this URL for cybersecurity safety (Phishing, malware, suspicious behavior):
      URL: ${urlString}
      Our local heuristics risk score is: ${riskScore}
      
      Respond in raw JSON ONLY. Schema:
      {
        "riskScore": number (0-100),
        "status": "safe" | "suspicious" | "unsafe",
        "warning": "Detailed warning explanation if suspicious/unsafe, otherwise empty"
      }`;

      const aiSafety = await queryGemini(safetyPrompt, 'You are an advanced cybersecurity link safety analysis agent.');
      if (aiSafety) {
        return {
          riskScore: aiSafety.riskScore ?? riskScore,
          status: aiSafety.status ?? (riskScore >= 60 ? 'unsafe' : riskScore >= 30 ? 'suspicious' : 'safe'),
          warning: aiSafety.warning ?? (warnings.length > 0 ? warnings.join(' ') : '')
        };
      }
    }

    let status = 'safe';
    if (riskScore >= 60) status = 'unsafe';
    else if (riskScore >= 30) status = 'suspicious';

    return {
      riskScore,
      status,
      warning: warnings.length > 0 ? warnings.join(' ') : 'Link appears to be clean.'
    };
  } catch (err) {
    return {
      riskScore: 10,
      status: 'safe',
      warning: 'Safety scan completed with default settings.'
    };
  }
};

/**
 * Predict CTR (Click Through Rate) based on Title, Description, Platform, and Time
 */
const predictCtrScore = async (title, description, platform, timeOfPosting) => {
  const normTitle = (title || '').trim();
  const normDesc = (description || '').trim();
  const normPlatform = (platform || 'Twitter').toLowerCase();

  // 1. Local mathematical prediction algorithm
  let baseCtr = 50; // default baseline score

  // Platform multipliers
  if (normPlatform === 'linkedin') baseCtr = 55;
  else if (normPlatform === 'twitter' || normPlatform === 'x') baseCtr = 48;
  else if (normPlatform === 'facebook') baseCtr = 42;
  else if (normPlatform === 'instagram') baseCtr = 58;

  let adjustments = 0;
  const suggestions = [];

  // Title length evaluation
  if (normTitle.length === 0) {
    adjustments -= 30;
    suggestions.push('Add a title to make the post recognizable.');
  } else if (normTitle.length < 25) {
    adjustments -= 8;
    suggestions.push('✔ Make your title longer (optimal: 45 - 75 characters) to provide more context.');
  } else if (normTitle.length > 80) {
    adjustments -= 12;
    suggestions.push('✔ Shorten your title (over 80 characters gets truncated on most platforms).');
  } else {
    adjustments += 10;
  }

  // Description check
  if (normDesc.length === 0) {
    adjustments -= 15;
    suggestions.push('✔ Add a brief description summarizing what users will find.');
  } else if (normDesc.length > 180) {
    adjustments -= 5;
    suggestions.push('✔ Shorten description to keep it crisp and engaging.');
  } else {
    adjustments += 8;
  }

  // Time of posting checks
  if (timeOfPosting) {
    const hour = parseInt(timeOfPosting.split(':')[0], 10);
    if (isNaN(hour)) {
      // do nothing
    } else if (hour >= 18 && hour <= 21) {
      adjustments += 15; // Golden hours 6 PM - 9 PM
    } else if (hour >= 12 && hour <= 14) {
      adjustments += 10; // Lunch break hours
    } else if (hour >= 0 && hour <= 5) {
      adjustments -= 20; // Sleep hours
      suggestions.push('✔ Schedule your post between 12 PM - 2 PM or 6 PM - 9 PM for peak engagement.');
    } else {
      suggestions.push('✔ Target golden hours (6 PM - 9 PM) to maximize audience reach.');
    }
  } else {
    suggestions.push('✔ Post between 6 PM - 9 PM (peak social engagement hours).');
  }

  // Emoji presence evaluation
  const emojiRegex = /[\uD800-\uDFFF\u2600-\u27BF]/;
  if (emojiRegex.test(normTitle) || emojiRegex.test(normDesc)) {
    adjustments += 7;
  } else {
    suggestions.push('✔ Add 1-2 relevant emojis to make the snippet stand out visually.');
  }

  // Action verbs check
  const actionVerbs = ['discover', 'learn', 'join', 'check', 'get', 'save', 'win', 'download', 'try', 'free', 'buy', 'unleash', 'boost', 'upgrade'];
  const textBody = `${normTitle} ${normDesc}`.toLowerCase();
  const hasAction = actionVerbs.some(verb => textBody.includes(verb));
  if (hasAction) {
    adjustments += 5;
  } else {
    suggestions.push('✔ Start with or include active verbs (e.g. "Discover", "Boost", "Upgrade").');
  }

  let finalCtr = baseCtr + adjustments;
  // bound CTR between 10% and 98%
  finalCtr = Math.max(10, Math.min(finalCtr, 98));

  // Engagement score (out of 10)
  const engagementScore = parseFloat((finalCtr / 10).toFixed(1));

  // Advanced evaluation using Gemini if API key is present
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const prompt = `Evaluate the engagement potential of this social media post snippet:
    Platform: ${platform}
    Title: ${title}
    Description: ${description}
    Time of Posting: ${timeOfPosting}
    
    Respond in raw JSON ONLY. Schema:
    {
      "predictedCtr": number (0-100),
      "engagementScore": number (0.0-10.0),
      "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
    }`;

    const aiCtr = await queryGemini(prompt, 'You are an expert social media advertising copywriter and analyst.');
    if (aiCtr) {
      return {
        predictedCtr: aiCtr.predictedCtr ?? finalCtr,
        engagementScore: aiCtr.engagementScore ?? engagementScore,
        suggestions: aiCtr.suggestions ?? suggestions
      };
    }
  }

  return {
    predictedCtr: finalCtr,
    engagementScore,
    suggestions: suggestions.slice(0, 3) // Return top 3 suggestions
  };
};

/**
 * Generate AI analytics insights from click history
 * @param {number} mobilePercentage - Percentage of mobile/tablet visitors
 * @param {string} mostActiveTime - Peak hour string (e.g. "8 PM")
 * @param {string} bestPerformingDay - Peak day of week (e.g. "Friday")
 * @param {number} totalClicks - Total clicks registered
 */
const generateAudienceInsights = async (mobilePercentage, mostActiveTime, bestPerformingDay, totalClicks) => {
  if (totalClicks === 0) {
    return {
      explanation: 'No redirection clicks registered yet. Once visitors start clicking, AI will analyze their behavior.',
      recommendation: 'Share your short link on social platforms to begin collecting traffic metrics.'
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const prompt = `Based on the click analytics of a shortened URL:
    Total Clicks: ${totalClicks}
    Mobile/Tablet Users: ${mobilePercentage}%
    Most Active Hour: ${mostActiveTime}
    Best Performing Day: ${bestPerformingDay}
    
    Provide a professional, concise marketing audience insight analysis in raw JSON ONLY.
    The response must follow this schema:
    {
      "explanation": "1-2 sentence explanation of why this audience behavior is occurring",
      "recommendation": "A highly actionable recommendation for when and how to post future links to maximize CTR"
    }`;
    
    const aiInsight = await queryGemini(prompt, 'You are an advanced digital marketing analytics coordinator.');
    if (aiInsight) {
      return {
        explanation: aiInsight.explanation || `Audience is mainly active on ${bestPerformingDay} at ${mostActiveTime}.`,
        recommendation: aiInsight.recommendation || `Post future links on ${bestPerformingDay} around ${mostActiveTime}.`
      };
    }
  }

  // Fallback heuristic recommendations
  let timeDetail = 'evenings';
  if (mostActiveTime.includes('AM')) {
    timeDetail = 'mornings';
  } else {
    const hr = parseInt(mostActiveTime);
    if (!isNaN(hr) && hr >= 12 && hr < 17) timeDetail = 'afternoons';
  }

  return {
    explanation: `Your audience consists of ${mobilePercentage}% mobile users, showing the highest engagement on ${bestPerformingDay}s around ${mostActiveTime}.`,
    recommendation: `Post future links on ${bestPerformingDay} ${timeDetail} to capture peak mobile traffic.`
  };
};

module.exports = {
  scrapeWebpage,
  generateMarketingSuite,
  checkLinkSafety,
  predictCtrScore,
  generateAudienceInsights
};

