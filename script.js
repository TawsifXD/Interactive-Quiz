// Quiz Application State
let quizData = [];
let currentQuiz = 0;
let score = 0;
let startTime = Date.now();
let timer;
let selectedAnswer = null;

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const loadingEl = document.getElementById('loading');

// Setup elements
const categorySelect = document.getElementById('category');
const difficultySelect = document.getElementById('difficulty');
const amountSelect = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const startQuizBtn = document.getElementById('start-quiz');

// Quiz elements
const questionEl = document.getElementById('question');
const timerEl = document.getElementById('time');
const currentEl = document.getElementById('current');
const totalEl = document.getElementById('total');
const currentScoreEl = document.getElementById('current-score');
const categoryDisplayEl = document.getElementById('category-display');
const difficultyDisplayEl = document.getElementById('difficulty-display');
const multipleChoiceEl = document.getElementById('multiple-choice');
const trueFalseEl = document.getElementById('true-false');
const feedbackEl = document.getElementById('feedback');
const submitBtn = document.getElementById('submit');
const nextBtn = document.getElementById('next');
const newQuizBtn = document.getElementById('new-quiz');

// Answer elements
const answerEls = document.querySelectorAll('.answer');
const a_text = document.getElementById('a_text');
const b_text = document.getElementById('b_text');
const c_text = document.getElementById('c_text');
const d_text = document.getElementById('d_text');
const tfButtons = document.querySelectorAll('.tf-btn');

// Results elements
const finalScoreEl = document.getElementById('final-score');
const correctAnswersEl = document.getElementById('correct-answers');
const totalQuestionsEl = document.getElementById('total-questions');
const finalTimeEl = document.getElementById('final-time');
const performanceMessageEl = document.getElementById('performance-message');
const playAgainBtn = document.getElementById('play-again');
const newSettingsBtn = document.getElementById('new-settings');

// API Configuration
const API_BASE_URL = 'https://opentdb.com/api.php';

// Category mapping for display
const categoryNames = {
    '9': 'General Knowledge',
    '10': 'Books',
    '11': 'Film',
    '12': 'Music',
    '17': 'Science & Nature',
    '18': 'Computers',
    '19': 'Mathematics',
    '20': 'Mythology',
    '21': 'Sports',
    '22': 'Geography',
    '23': 'History',
    '24': 'Politics',
    '25': 'Art',
    '26': 'Celebrities',
    '27': 'Animals'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    showScreen('setup');
    setupEventListeners();
});

function setupEventListeners() {
    startQuizBtn.addEventListener('click', generateQuiz);
    submitBtn.addEventListener('click', submitAnswer);
    newQuizBtn.addEventListener('click', () => showScreen('setup'));
    playAgainBtn.addEventListener('click', () => generateQuizWithSameSettings());
    newSettingsBtn.addEventListener('click', () => showScreen('setup'));

    // True/False button listeners
    tfButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tfButtons.forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedAnswer = e.target.dataset.answer;
        });
    });

    // Multiple choice list item listeners
    const mcAnswers = document.querySelectorAll('#multiple-choice li');
    mcAnswers.forEach(item => {
        item.addEventListener('click', () => {
            mcAnswers.forEach(li => li.classList.remove('selected'));
            item.classList.add('selected');
            const radio = item.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                selectedAnswer = radio.id;
            }
        });
    });
}

function showScreen(screen) {
    setupScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden');
    
    switch(screen) {
        case 'setup':
            setupScreen.classList.remove('hidden');
            break;
        case 'quiz':
            quizScreen.classList.remove('hidden');
            break;
        case 'results':
            resultsScreen.classList.remove('hidden');
            break;
    }
}

async function generateQuiz() {
    const category = categorySelect.value;
    const difficulty = difficultySelect.value;
    const amount = amountSelect.value;
    const type = typeSelect.value;

    // Show loading
    startQuizBtn.style.display = 'none';
    loadingEl.classList.remove('hidden');

    try {
        const url = buildApiUrl(amount, category, difficulty, type);
        const response = await fetch(url);
        const data = await response.json();

        if (data.response_code === 0 && data.results.length > 0) {
            quizData = processQuizData(data.results);
            startQuiz();
        } else {
            throw new Error('No questions found for the selected criteria');
        }
    } catch (error) {
        showError('Failed to generate quiz. Please check your internet connection and try again.');
        console.error('Quiz generation error:', error);
    } finally {
        startQuizBtn.style.display = 'block';
        loadingEl.classList.add('hidden');
    }
}

function buildApiUrl(amount, category, difficulty, type) {
    let url = `${API_BASE_URL}?amount=${amount}`;
    if (category) url += `&category=${category}`;
    if (difficulty) url += `&difficulty=${difficulty}`;
    if (type) url += `&type=${type}`;
    return url;
}

function processQuizData(results) {
    return results.map(item => {
        const question = decodeHtml(item.question);
        const correctAnswer = decodeHtml(item.correct_answer);
        
        if (item.type === 'boolean') {
            return {
                question,
                type: 'boolean',
                correct_answer: correctAnswer.toLowerCase(),
                category: item.category,
                difficulty: item.difficulty
            };
        } else {
            const incorrectAnswers = item.incorrect_answers.map(answer => decodeHtml(answer));
            const allAnswers = [...incorrectAnswers, correctAnswer];
            
            // Shuffle answers
            for (let i = allAnswers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
            }
            
            const correctIndex = allAnswers.indexOf(correctAnswer);
            const correctLetter = ['a', 'b', 'c', 'd'][correctIndex];
            
            return {
                question,
                type: 'multiple',
                a: allAnswers[0] || '',
                b: allAnswers[1] || '',
                c: allAnswers[2] || '',
                d: allAnswers[3] || '',
                correct: correctLetter,
                category: item.category,
                difficulty: item.difficulty
            };
        }
    });
}

// Create a reusable textarea for HTML decoding
const txt = document.createElement('textarea');

function decodeHtml(html) {
    txt.innerHTML = html;
    return txt.value;
}

function startQuiz() {
    currentQuiz = 0;
    score = 0;
    startTime = Date.now();
    
    showScreen('quiz');
    totalEl.textContent = quizData.length;
    currentScoreEl.textContent = score;
    
    startTimer();
    loadQuestion();
}

function startTimer() {
    timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerEl.textContent = elapsed;
    }, 1000);
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

function loadQuestion() {
    if (currentQuiz >= quizData.length) {
        endQuiz();
        return;
    }

    const currentQuestion = quizData[currentQuiz];
    
    // Reset UI
    selectedAnswer = null;
    feedbackEl.classList.add('hidden');
    submitBtn.classList.remove('hidden');
    
    // Update question info
    questionEl.textContent = currentQuestion.question;
    currentEl.textContent = currentQuiz + 1;
    
    // Update meta information
    categoryDisplayEl.textContent = categoryNames[currentQuestion.category] || currentQuestion.category;
    difficultyDisplayEl.textContent = currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1);
    difficultyDisplayEl.className = `meta-tag difficulty-${currentQuestion.difficulty}`;
    
    // Show appropriate answer interface
    if (currentQuestion.type === 'boolean') {
        multipleChoiceEl.classList.add('hidden');
        trueFalseEl.classList.remove('hidden');
        tfButtons.forEach(btn => btn.classList.remove('selected'));
    } else {
        trueFalseEl.classList.add('hidden');
        multipleChoiceEl.classList.remove('hidden');
        
        // Load multiple choice answers
        a_text.textContent = currentQuestion.a;
        b_text.textContent = currentQuestion.b;
        c_text.textContent = currentQuestion.c;
        d_text.textContent = currentQuestion.d;
        
        // Reset radio buttons and remove the 'selected' class from all list items
        const mcAnswers = document.querySelectorAll('#multiple-choice li');
        mcAnswers.forEach(li => {
            li.classList.remove('selected');
            const radio = li.querySelector('input[type="radio"]');
            if (radio) radio.checked = false;
        });
    }
}

function submitAnswer() {
    if (!selectedAnswer) {
        showFeedback('Please select an answer!', 'error');
        return;
    }

    const currentQuestion = quizData[currentQuiz];
    let isCorrect = false;
    
    if (currentQuestion.type === 'boolean') {
        isCorrect = selectedAnswer === currentQuestion.correct_answer;
    } else {
        isCorrect = selectedAnswer === currentQuestion.correct;
    }
    
    if (isCorrect) {
        score++;
        currentScoreEl.textContent = score;
        showFeedback('✅ Correct!', 'correct');
    } else {
        const correctAnswerText = currentQuestion.type === 'boolean' 
            ? currentQuestion.correct_answer 
            : currentQuestion[currentQuestion.correct];
        showFeedback(`❌ Incorrect! The correct answer is: ${correctAnswerText}`, 'incorrect');
    }
    
    // Hide submit button and automatically move to the next question after a delay
    submitBtn.classList.add('hidden');
    setTimeout(() => {
        currentQuiz++;
        loadQuestion();
    }, 2000); // 2-second delay to show feedback
}

function nextQuestion() {
    currentQuiz++;
    loadQuestion();
}

function showFeedback(message, type) {
    feedbackEl.textContent = message;
    feedbackEl.className = `feedback ${type}`;
    feedbackEl.classList.remove('hidden');
}

function endQuiz() {
    stopTimer();
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const percentage = Math.round((score / quizData.length) * 100);
    
    // Update results screen
    finalScoreEl.textContent = percentage;
    correctAnswersEl.textContent = score;
    totalQuestionsEl.textContent = quizData.length;
    finalTimeEl.textContent = totalTime;
    
    // Performance message
    let message = '';
    if (percentage >= 90) {
        message = '🏆 Outstanding! You\'re a quiz master!';
    } else if (percentage >= 70) {
        message = '🎉 Great job! Well done!';
    } else if (percentage >= 50) {
        message = '👍 Good effort! Keep practicing!';
    } else {
        message = '💪 Don\'t give up! Try again to improve!';
    }
    performanceMessageEl.textContent = message;
    
    showScreen('results');
}

function generateQuizWithSameSettings() {
    showScreen('setup');
    setTimeout(() => generateQuiz(), 100);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    startQuizBtn.parentNode.insertBefore(errorDiv, startQuizBtn);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}