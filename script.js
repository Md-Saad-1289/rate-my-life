/**
 * Rate My Life - Client-Side Bangla Lifestyle & Personality Quiz Engine
 * Vanilla JavaScript
 */

// Bangla Digit Converter
function toBanglaNum(num) {
  if (num === null || num === undefined) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, d => bnDigits[d]);
}

// 5 Categories Configuration
const CATEGORIES = [
  { id: 'ব্যক্তিত্ব', name: 'ব্যক্তিত্ব', color: '#4338ca' },
  { id: 'সামাজিকতা', name: 'সামাজিকতা', color: '#0d9488' },
  { id: 'জীবনযাপন', name: 'জীবনযাপন', color: '#d97706' },
  { id: 'উচ্চাকাঙ্ক্ষা', name: 'উচ্চাকাঙ্ক্ষা', color: '#7c3aed' },
  { id: 'আনন্দ', name: 'আনন্দ', color: '#e11d48' }
];

// App State
const state = {
  allQuestions: [],
  selectedQuestions: [],
  currentIndex: 0,
  answers: {}, // questionId -> optionObject
  result: null
};

// DOM Elements
const screens = {
  home: document.getElementById('screen-home'),
  quiz: document.getElementById('screen-quiz'),
  analyzing: document.getElementById('screen-analyzing'),
  report: document.getElementById('screen-report'),
  share: document.getElementById('screen-share')
};

const elements = {
  brandHomeLink: document.getElementById('brand-home-link'),
  startQuizBtn: document.getElementById('start-quiz-btn'),
  quizProgressLabel: document.getElementById('quiz-progress-label'),
  quizProgressFill: document.getElementById('quiz-progress-fill'),
  quizCategoryLabel: document.getElementById('quiz-category-label'),
  quizCategoryDot: document.getElementById('quiz-category-dot'),
  quizCategoryText: document.getElementById('quiz-category-text'),
  quizQuestionText: document.getElementById('quiz-question-text'),
  quizOptionsContainer: document.getElementById('quiz-options-container'),
  quizPrevBtn: document.getElementById('quiz-prev-btn'),
  analyzingStatusSub: document.getElementById('analyzing-status-sub'),
  reportOverallScore: document.getElementById('report-overall-score'),
  reportLifeType: document.getElementById('report-life-type'),
  reportLifeDesc: document.getElementById('report-life-desc'),
  reportCategoryBars: document.getElementById('report-category-bars'),
  reportFunStats: document.getElementById('report-fun-stats'),
  reportFinalMessage: document.getElementById('report-final-message'),
  goToShareBtn: document.getElementById('go-to-share-btn'),
  playAgainReportBtn: document.getElementById('play-again-report-btn'),
  shareCanvas: document.getElementById('share-result-canvas'),
  downloadImageBtn: document.getElementById('download-image-btn'),
  shareApiBtn: document.getElementById('share-api-btn'),
  playAgainShareBtn: document.getElementById('play-again-share-btn'),
  backToReportBtn: document.getElementById('back-to-report-btn'),
  toast: document.getElementById('app-toast')
};

// Switch active screen
function showScreen(screenName) {
  Object.keys(screens).forEach(key => {
    if (screens[key]) {
      screens[key].classList.toggle('active', key === screenName);
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show Toast feedback
function showToast(message) {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 2500);
}

// Shuffle array utility (Fisher-Yates)
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Load questions from questions.json
async function loadQuestions() {
  const candidateUrls = ['./questions.json', 'questions.json', '/questions.json'];
  for (const url of candidateUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        state.allQuestions = await response.json();
        console.log(`Loaded ${state.allQuestions.length} questions from ${url}`);
        return;
      }
    } catch (e) {
      // try next url
    }
  }
  console.error('All fetch attempts for questions.json failed.');
  showToast('প্রশ্ন লোড করতে সমস্যা হয়েছে। পৃষ্ঠা রিফ্রেশ করুন।');
}

// Start Quiz: pick exactly 3 from each category = 15 questions, randomized order
function startQuiz() {
  if (!state.allQuestions || state.allQuestions.length === 0) {
    showToast('প্রশ্ন লোড হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন...');
    return;
  }

  const selected = [];
  CATEGORIES.forEach(cat => {
    const catQuestions = state.allQuestions.filter(q => q.category === cat.id);
    const shuffledCat = shuffle(catQuestions);
    // Take exactly 3
    selected.push(...shuffledCat.slice(0, 3));
  });

  // Randomize the 15 questions order
  state.selectedQuestions = shuffle(selected);
  state.currentIndex = 0;
  state.answers = {};
  state.result = null;

  renderCurrentQuestion();
  showScreen('quiz');
}

// Render the current question
function renderCurrentQuestion() {
  const total = state.selectedQuestions.length;
  const currentQ = state.selectedQuestions[state.currentIndex];
  if (!currentQ) return;

  const currentNumberBn = toBanglaNum(state.currentIndex + 1);
  const totalNumberBn = toBanglaNum(total);

  // Update Progress
  elements.quizProgressLabel.textContent = `প্রশ্ন ${currentNumberBn} / ${totalNumberBn}`;
  const percent = ((state.currentIndex + 1) / total) * 100;
  elements.quizProgressFill.style.width = `${percent}%`;

  // Update Category Label & Dot color
  const catConfig = CATEGORIES.find(c => c.id === currentQ.category) || { color: '#4338ca' };
  elements.quizCategoryText.textContent = currentQ.category;
  elements.quizCategoryDot.style.backgroundColor = catConfig.color;

  // Update Question Title
  elements.quizQuestionText.textContent = currentQ.question;

  // Render Options
  elements.quizOptionsContainer.innerHTML = '';
  const currentAnswer = state.answers[currentQ.id];

  currentQ.options.forEach((opt, idx) => {
    const optBtn = document.createElement('button');
    optBtn.type = 'button';
    optBtn.className = 'option-btn';
    if (currentAnswer && currentAnswer.text === opt.text) {
      optBtn.classList.add('selected');
    }

    optBtn.innerHTML = `
      <span class="option-indicator" aria-hidden="true"></span>
      <span class="option-text">${opt.text}</span>
    `;

    optBtn.addEventListener('click', () => {
      selectOption(currentQ, opt, optBtn);
    });

    elements.quizOptionsContainer.appendChild(optBtn);
  });

  // Update Prev Button
  elements.quizPrevBtn.disabled = state.currentIndex === 0;
}

// Select an option with a brief smooth transition to next question
let optionDebounce = false;
function selectOption(question, option, btnElement) {
  if (optionDebounce) return;
  optionDebounce = true;

  // Save answer
  state.answers[question.id] = option;

  // Highlight selected button
  const allBtns = elements.quizOptionsContainer.querySelectorAll('.option-btn');
  allBtns.forEach(b => b.classList.remove('selected'));
  btnElement.classList.add('selected');

  // Slight delay for feedback, then advance
  setTimeout(() => {
    optionDebounce = false;
    if (state.currentIndex < state.selectedQuestions.length - 1) {
      state.currentIndex++;
      renderCurrentQuestion();
    } else {
      // Finished all 15 questions -> Go to Analyzing
      runAnalyzingFlow();
    }
  }, 220);
}

// Previous Question handler
function goToPreviousQuestion() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderCurrentQuestion();
  }
}

// Analyzing Flow
function runAnalyzingFlow() {
  showScreen('analyzing');

  const statusMessages = [
    'তোমার উত্তরগুলো সুবিন্যস্ত করা হচ্ছে...',
    'ব্যক্তিত্ব ও সামাজিক আচরণের সমীকরণ বিশ্লেষণ চলছে...',
    'জীবনযাপন ও আনন্দপ্রিয়তার স্কোর নির্ণয় হচ্ছে...',
    'তোমার ব্যক্তিগত লাইফ রিপোর্ট প্রস্তুত...'
  ];

  let step = 0;
  const interval = setInterval(() => {
    step++;
    if (step < statusMessages.length) {
      elements.analyzingStatusSub.textContent = statusMessages[step];
    } else {
      clearInterval(interval);
      calculateAndShowReport();
    }
  }, 480);
}

// Calculate scores, life type, and fun statistics
function calculateAndShowReport() {
  const answeredList = state.selectedQuestions.map(q => ({
    question: q,
    selectedOption: state.answers[q.id] || q.options[0]
  }));

  // Overall Score: sum of 15 questions (max 150) converted to 100
  let totalScoreRaw = 0;
  const catScoresRaw = {
    'ব্যক্তিত্ব': 0,
    'সামাজিকতা': 0,
    'জীবনযাপন': 0,
    'উচ্চাকাঙ্ক্ষা': 0,
    'আনন্দ': 0
  };

  // Trait accumulators
  const traitSums = {
    overthinking: { sum: 0, count: 0 },
    procrastination: { sum: 0, count: 0 },
    social_battery: { sum: 0, count: 0 },
    audacity: { sum: 0, count: 0 },
    fun_loving: { sum: 0, count: 0 }
  };

  answeredList.forEach(({ question, selectedOption }) => {
    const score = selectedOption.score || 5;
    totalScoreRaw += score;
    if (catScoresRaw[question.category] !== undefined) {
      catScoresRaw[question.category] += score;
    }

    // Trait points
    if (selectedOption.traits) {
      Object.keys(selectedOption.traits).forEach(traitKey => {
        if (traitSums[traitKey] !== undefined) {
          traitSums[traitKey].sum += selectedOption.traits[traitKey];
          traitSums[traitKey].count++;
        }
      });
    }
  });

  // Category percentages: each category has 3 questions = max 30 points
  const categoryPercentages = {};
  CATEGORIES.forEach(cat => {
    const raw = catScoresRaw[cat.id] || 0;
    const pct = Math.min(100, Math.max(10, Math.round((raw / 30) * 100)));
    categoryPercentages[cat.id] = pct;
  });

  // Overall score out of 100 (raw out of 150)
  const overallScore = Math.min(100, Math.max(15, Math.round((totalScoreRaw / 150) * 100)));

  // Fun statistics: scaled to 0-100%
  const funStats = {
    'অতিরিক্ত ভাবনা': calculateTraitPercentage(traitSums.overthinking, 45),
    'কাজ ফেলে রাখা': calculateTraitPercentage(traitSums.procrastination, 40),
    'সামাজিক ব্যাটারি': calculateTraitPercentage(traitSums.social_battery, 65),
    'দুঃসাহস': calculateTraitPercentage(traitSums.audacity, 60),
    'আনন্দপ্রিয়তা': calculateTraitPercentage(traitSums.fun_loving, 75)
  };

  // Determine Bangla Life Type and personalized description
  const { lifeType, description, finalAdvice } = determineLifeType(overallScore, categoryPercentages, funStats);

  // Store in state
  state.result = {
    overallScore,
    categoryPercentages,
    lifeType,
    description,
    finalAdvice,
    funStats
  };

  // Render on Report Screen
  renderReportScreen(state.result);
  showScreen('report');
}

function calculateTraitPercentage(traitObj, fallback) {
  if (traitObj.count > 0) {
    const avg = traitObj.sum / traitObj.count; // scale 1-10
    return Math.min(98, Math.max(15, Math.round(avg * 10)));
  }
  return fallback;
}

// Life Type Matrix based on scores
function determineLifeType(overallScore, catPct, funStats) {
  // Find top categories
  const sortedCats = Object.entries(catPct).sort((a, b) => b[1] - a[1]);
  const top1 = sortedCats[0][0];
  const top2 = sortedCats[1][0];

  let lifeType = 'ভারসাম্যপূর্ণ সাধক';
  let description = 'তোমার জীবনের বিভিন্ন দিকের মধ্যে এক চমৎকার ভারসাম্য রয়েছে। তুমি বাস্তববাদী অথচ আনন্দময় জীবনযাপনে বিশ্বাসী।';
  let finalAdvice = 'জীবনের প্রতিটি দিনকে নিজের মতো করে উপভোগ করো। ভারসাম্য বজায় রাখাই তোমার সবচেয়ে বড় শক্তি।';

  if (top1 === 'উচ্চাকাঙ্ক্ষা' && top2 === 'ব্যক্তিত্ব') {
    lifeType = 'আত্মবিশ্বাসী স্বপ্নদ্রষ্টা';
    description = 'তোমার লক্ষ্য সুনির্দিষ্ট এবং ব্যক্তিত্ব অত্যন্ত দৃঢ়। যেকোনো প্রতিকূলতার মধ্যেও নিজের যোগ্যতায় তুমি পথ তৈরি করে নিতে পারো।';
    finalAdvice = 'কাজের পাশাপাশি নিজেকে বিশ্রাম দিতে ভুলো না। সাফল্য আসবেই!';
  } else if (top1 === 'আনন্দ' && top2 === 'সামাজিকতা') {
    lifeType = 'প্রাণবন্ত আড্ডাবাজ';
    description = 'তুমি যেকোনো পরিবেশকে মুহূর্তেই হাসিখুশি ও উৎসবমুখর করে তুলতে পারো। বন্ধুদের আড্ডায় তোমার উপস্থিতি মানেই আনন্দের পূর্ণ গ্যারান্টি।';
    finalAdvice = 'তোমার প্রাণশক্তি অমূল্য। নিজের ভেতরের এই অনাবিল নিষ্পাপ আনন্দকে সবসময় বাঁচিয়ে রেখো।';
  } else if (top1 === 'জীবনযাপন' && top2 === 'আনন্দ') {
    lifeType = 'শান্তিকামী মুক্তমনা';
    description = 'অহেতুক জটিলতা বা প্রতিযোগিতায় তুমি নেই। সহজ-সরল জীবন, নিজের স্বাচ্ছন্দ্য আর শান্তির মধ্যেই তোমার আসল সুখ।';
    finalAdvice = 'শান্ত থাকা বড় গুণ, তবে মাঝে মাঝে নতুন কোনো চ্যালেঞ্জ গ্রহণ করতে পারো।';
  } else if (top1 === 'ব্যক্তিত্ব' && (funStats['দুঃসাহস'] || 50) > 70) {
    lifeType = 'নির্ভীক পথপ্রদর্শক';
    description = 'তুমি স্পষ্টভাষী এবং নিজের নীতিতে অবিচল। ভিড়ের বিপরীতে গিয়ে নিজের মতো করে সিদ্ধান্ত নেওয়ার অনন্য সাহস তোমার আছে।';
    finalAdvice = 'তোমার সততা ও স্পষ্টবাদিতাই তোমার আসল পরিচয়। পথচলা থামিয়ো না!';
  } else if (top1 === 'সামাজিকতা' && top2 === 'উচ্চাকাঙ্ক্ষা') {
    lifeType = 'সমাজমনস্ক দলনেতা';
    description = 'মানুষের সাথে দ্রুত সম্পর্ক গড়ে তোলা এবং সবাইকে নিয়ে সামনে এগিয়ে চলাই তোমার স্বভাবজাত গুণ।';
    finalAdvice = 'সবার খেয়াল রাখার পাশাপাশি নিজের ব্যক্তিগত যত্ন নিতেও ভুলো না।';
  } else if (top1 === 'আনন্দ') {
    lifeType = 'সহজ-সরল আনন্দসন্ধানী';
    description = 'জীবনের ছোট ছোট প্রাপ্তিতেই তোমার আসল তৃপ্তি। এক কাপ গরম চা, বৃষ্টি কিংবা প্রিয় গান দিয়েই তুমি দিনকে সুন্দর করে নিতে পারো।';
    finalAdvice = 'তোমার মনের এই নির্মল আনন্দ ধরে রাখাই আজকের পৃথিবীতে সবচেয়ে বড় সার্থকতা।';
  } else if (overallScore >= 85) {
    lifeType = 'পরিপক্ক জীবনশিল্পী';
    description = 'ব্যক্তিত্ব, কাজ, সামাজিকতা ও আনন্দের মেলবন্ধনে তুমি জীবনের এক অনন্য আর্ট তৈরি করেছ। তোমার আত্মবিশ্বাস প্রশংসনীয়।';
    finalAdvice = 'নিজের এই ইতিবাচক দৃষ্টিভঙ্গি চারপাশের মানুষের মাঝেও ছড়িয়ে দাও!';
  } else if ((funStats['অতিরিক্ত ভাবনা'] || 0) > 75) {
    lifeType = 'গভীর চিন্তাশীল অনুভবী';
    description = 'তুমি বিষয়গুলো খুব গভীরভাবে পর্যবেক্ষণ করো। মানুষের মনের কথা বুঝতে পারার গভীর সংবেদনশীলতা তোমার রয়েছে।';
    finalAdvice = 'সবকিছু নিজের নিয়ন্ত্রণে রাখার চেষ্টা না করে কিছু জিনিস সময়ের ওপর ছেড়ে দাও। মন শান্ত থাকবে।';
  }

  return { lifeType, description, finalAdvice };
}

// Render Report Screen
function renderReportScreen(result) {
  elements.reportOverallScore.textContent = toBanglaNum(result.overallScore);
  elements.reportLifeType.textContent = result.lifeType;
  elements.reportLifeDesc.textContent = result.description;
  elements.reportFinalMessage.textContent = result.finalAdvice;

  // Render Category Bars
  elements.reportCategoryBars.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const pct = result.categoryPercentages[cat.id] || 50;
    const barItem = document.createElement('div');
    barItem.className = 'cat-bar-item';
    barItem.innerHTML = `
      <div class="cat-bar-header">
        <span class="cat-bar-name">${cat.name}</span>
        <span class="cat-bar-percent">${toBanglaNum(pct)}%</span>
      </div>
      <div class="cat-bar-track">
        <div class="cat-bar-fill" style="width: 0%; background-color: ${cat.color}"></div>
      </div>
    `;
    elements.reportCategoryBars.appendChild(barItem);

    // Animate width
    setTimeout(() => {
      const fill = barItem.querySelector('.cat-bar-fill');
      if (fill) fill.style.width = `${pct}%`;
    }, 100);
  });

  // Render Fun Stats
  elements.reportFunStats.innerHTML = '';
  Object.entries(result.funStats).forEach(([statName, val]) => {
    const statBox = document.createElement('div');
    statBox.className = 'fun-stat-box';
    statBox.innerHTML = `
      <span class="fun-stat-label">${statName}</span>
      <span class="fun-stat-val">${toBanglaNum(val)}%</span>
    `;
    elements.reportFunStats.appendChild(statBox);
  });
}

// ==========================================================================
// Canvas Generation for Shareable Image
// ==========================================================================

function drawCanvasCard(result) {
  const canvas = elements.shareCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // High resolution: 1080 x 1350 (4:5 vertical card)
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;

  // 1. Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, W, H);

  // 2. Main Card Body
  const cardX = 60;
  const cardY = 60;
  const cardW = W - 120;
  const cardH = H - 120;
  const cardRadius = 36;

  // Card Shadow & Fill
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();
  ctx.restore();

  // Subtle Border
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.stroke();

  // 3. Header: Brand Name
  ctx.fillStyle = '#4338ca';
  ctx.font = 'bold 44px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Rate My Life', W / 2, cardY + 80);

  // Subtitle
  ctx.fillStyle = '#64748b';
  ctx.font = '500 28px "Hind Siliguri", sans-serif';
  ctx.fillText('জীবন ও ব্যক্তিত্বের মূল্যায়ন রিপোর্ট', W / 2, cardY + 125);

  // Decorative Hairline
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 60, cardY + 160);
  ctx.lineTo(cardX + cardW - 60, cardY + 160);
  ctx.stroke();

  // 4. Large Overall Score Display
  const scoreY = cardY + 295;
  ctx.fillStyle = '#4338ca';
  ctx.font = '800 130px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(toBanglaNum(result.overallScore), W / 2, scoreY);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 34px "Hind Siliguri", sans-serif';
  ctx.fillText('/ ১০০', W / 2, scoreY + 48);

  // 5. Life Type Badge
  const lifeTypeY = scoreY + 120;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 50px "Hind Siliguri", sans-serif';
  ctx.fillText(result.lifeType, W / 2, lifeTypeY);

  // Description text (wrapped)
  ctx.fillStyle = '#64748b';
  ctx.font = '400 28px "Hind Siliguri", sans-serif';
  wrapText(ctx, result.description, W / 2, lifeTypeY + 50, cardW - 140, 42);

  // Hairline
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
  ctx.beginPath();
  ctx.moveTo(cardX + 60, cardY + 590);
  ctx.lineTo(cardX + cardW - 60, cardY + 590);
  ctx.stroke();

  // 6. 5 Category Bars
  let barStartY = cardY + 650;
  const barWidth = cardW - 140;
  const barX = cardX + 70;

  CATEGORIES.forEach(cat => {
    const pct = result.categoryPercentages[cat.id] || 50;

    // Category Label & Percentage
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 28px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(cat.name, barX, barStartY);

    ctx.fillStyle = '#475569';
    ctx.font = '600 28px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${toBanglaNum(pct)}%`, barX + barWidth, barStartY);

    // Track
    const trackY = barStartY + 14;
    const trackHeight = 16;
    ctx.fillStyle = '#f1f5f9';
    drawRoundedRect(ctx, barX, trackY, barWidth, trackHeight, 8);
    ctx.fill();

    // Fill
    const fillWidth = Math.max(16, (barWidth * pct) / 100);
    ctx.fillStyle = cat.color;
    drawRoundedRect(ctx, barX, trackY, fillWidth, trackHeight, 8);
    ctx.fill();

    barStartY += 68;
  });

  // 7. Fun Stats Snippet Box (Bottom area)
  const statsBoxY = cardY + 1020;
  const statsBoxW = cardW - 120;
  const statsBoxX = cardX + 60;
  const statsBoxH = 110;

  ctx.fillStyle = '#f8fafc';
  drawRoundedRect(ctx, statsBoxX, statsBoxY, statsBoxW, statsBoxH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, statsBoxX, statsBoxY, statsBoxW, statsBoxH, 20);
  ctx.stroke();

  // 2 Fun Stat Highlights
  const stat1Name = 'সামাজিক ব্যাটারি';
  const stat1Val = `${toBanglaNum(result.funStats[stat1Name] || 65)}%`;
  const stat2Name = 'আনন্দপ্রিয়তা';
  const stat2Val = `${toBanglaNum(result.funStats[stat2Name] || 75)}%`;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '500 24px "Hind Siliguri", sans-serif';
  ctx.fillText(stat1Name, statsBoxX + (statsBoxW / 4), statsBoxY + 44);
  ctx.fillText(stat2Name, statsBoxX + (statsBoxW * 3 / 4), statsBoxY + 44);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px "Hind Siliguri", sans-serif';
  ctx.fillText(stat1Val, statsBoxX + (statsBoxW / 4), statsBoxY + 86);
  ctx.fillText(stat2Val, statsBoxX + (statsBoxW * 3 / 4), statsBoxY + 86);

  // Vertical divider between stats
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(statsBoxX + statsBoxW / 2, statsBoxY + 20);
  ctx.lineTo(statsBoxX + statsBoxW / 2, statsBoxY + statsBoxH - 20);
  ctx.stroke();

  // 8. Footer Brand Watermark
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 24px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Rate My Life • তোমার স্কোর জানতে ভিজিট করো', W / 2, cardY + cardH - 35);
}

// Canvas Rounded Rectangle helper
function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// Canvas Text Wrap helper
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}

// Download image action
function downloadShareImage() {
  const canvas = elements.shareCanvas;
  if (!canvas) return;

  try {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `rate-my-life-${state.result ? state.result.overallScore : 'score'}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('ছবি সফলভাবে ডাউনলোড হয়েছে!');
  } catch (err) {
    console.error('Download error:', err);
    showToast('ছবি ডাউনলোডে সমস্যা হয়েছে।');
  }
}

// Share Action (Web Share API or clipboard copy fallback)
async function shareResult() {
  if (!state.result) return;
  const canvas = elements.shareCanvas;
  const shareText = `আমার Rate My Life স্কোর: ${toBanglaNum(state.result.overallScore)} / ১০০!\nলাইফ টাইপ: "${state.result.lifeType}".\nতুমি তোমার জীবনের আসল স্কোর জানতে কুইজটি দিয়ে দেখো!`;

  // Try Web Share API with File
  if (navigator.share) {
    try {
      if (canvas && canvas.toBlob) {
        canvas.toBlob(async blob => {
          if (blob) {
            const file = new File([blob], 'rate-my-life-result.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  title: 'Rate My Life',
                  text: shareText,
                  files: [file]
                });
                showToast('ফলাফল শেয়ার করা হয়েছে!');
                return;
              } catch (e) {
                // User may have cancelled or file sharing unsupported
              }
            }
          }
          // Fallback to text sharing via navigator.share
          try {
            await navigator.share({
              title: 'Rate My Life',
              text: shareText,
              url: window.location.href
            });
            showToast('শেয়ার সফল হয়েছে!');
          } catch (e) {
            copyShareText(shareText);
          }
        }, 'image/png');
        return;
      }
    } catch (err) {
      console.warn('Share error, falling back to clipboard:', err);
    }
  }

  // Fallback: Copy text to clipboard
  copyShareText(shareText);
}

function copyShareText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text + '\n' + window.location.href).then(() => {
      showToast('ফলাফল এবং লিংক ক্লিপবোর্ডে কপি করা হয়েছে!');
    }).catch(() => {
      showToast('কপি করতে সমস্যা হয়েছে।');
    });
  } else {
    showToast('শেয়ার অপশন এই ব্রাউজারে উপলব্ধ নয়।');
  }
}

// Setup Event Listeners
function setupEvents() {
  // Brand header click -> Back to Home
  elements.brandHomeLink.addEventListener('click', e => {
    e.preventDefault();
    if (state.currentIndex > 0 && !state.result) {
      if (confirm('তুমি কি কুইজ ছেড়ে মূল পাতায় ফিরে যেতে চাও?')) {
        showScreen('home');
      }
    } else {
      showScreen('home');
    }
  });

  // Start Quiz
  elements.startQuizBtn.addEventListener('click', () => {
    startQuiz();
  });

  // Quiz Back Button
  elements.quizPrevBtn.addEventListener('click', () => {
    goToPreviousQuestion();
  });

  // Report: Go to Share Card
  elements.goToShareBtn.addEventListener('click', async () => {
    showScreen('share');
    // Ensure fonts are loaded before drawing canvas
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    if (state.result) {
      drawCanvasCard(state.result);
    }
  });

  // Report: Play Again
  elements.playAgainReportBtn.addEventListener('click', () => {
    startQuiz();
  });

  // Share Screen: Download Image
  elements.downloadImageBtn.addEventListener('click', () => {
    downloadShareImage();
  });

  // Share Screen: Web Share
  elements.shareApiBtn.addEventListener('click', () => {
    shareResult();
  });

  // Share Screen: Play Again
  elements.playAgainShareBtn.addEventListener('click', () => {
    startQuiz();
  });

  // Share Screen: Back to Report
  elements.backToReportBtn.addEventListener('click', () => {
    showScreen('report');
  });
}

// Initialize Application
async function init() {
  setupEvents();
  await loadQuestions();
}

// Start
init();
