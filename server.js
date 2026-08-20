const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ===== IN-MEMORY DATABASE =====
// (No MongoDB needed - everything runs in memory)

const users = [];
let questions = [];
let progress = [];

// ===== SEED QUESTIONS =====
function seedQuestions() {
    questions = [
        {
            id: 1,
            number: 1,
            text: 'Which one of the following is NOT a property of Boolean Algebra?',
            options: ['a + b = b + a', "a . a' = 1", "a + a' = 1", 'a . b = b . a'],
            correct: 'B',
            topic: 'Boolean Algebra',
            difficulty: 'Easy',
            year: 2026,
            explanation: "a . a' = 0 (not 1). This is the Complement Law.",
            tips: 'AND with complement = 0, OR with complement = 1',
            resources: [{ title: 'Boolean Algebra Basics', url: 'https://youtu.be/M0R8TBNSYfM' }]
        },
        {
            id: 2,
            number: 2,
            text: "In 4-bit two's complement, which operation causes overflow?\nN1=1011, N2=1101, N3=1010, N4=1001",
            options: ['N1 + N2', 'N2 + N3', 'N3 - N4', 'N1 + N4'],
            correct: 'D',
            topic: 'Number Systems',
            difficulty: 'Medium',
            year: 2026,
            explanation: 'N1=-5, N4=-7, Sum=-12. Range is -8 to +7, overflow occurs!',
            tips: 'Two negatives giving positive = overflow',
            resources: [{ title: '2\'s Complement Overflow', url: 'https://youtu.be/JLjO6y6yspE' }]
        },
        {
            id: 3,
            number: 3,
            text: 'What is the minimal SOP form of F(A,B,C,D) = Σm(0,1,2,3,8,9,10,11)?',
            options: ["A' + B' + C' + D'", "B'", "A'B' + AB", "A'"],
            correct: 'B',
            topic: 'K-Maps',
            difficulty: 'Medium',
            year: 2026,
            explanation: 'All minterms share B\' in common. So F = B\'',
            tips: 'Common variable = reduced expression',
            resources: [{ title: 'K-Map Simplification', url: 'https://youtu.be/3WkPLUKwF1o' }]
        },
        {
            id: 4,
            number: 4,
            text: 'A 2-bit saturating counter uses D flip-flops. What are D₁ and D₀?',
            options: [
                'D₁ = P Q₁ + P̄Q₀ + Q₁Q₀, D₀ = P Q₀ + P̄Q₁ + Q₁Q̄₀',
                'D₁ = P̄ Q₁ + P̄Q₀ + Q₁Q₀, D₀ = P̄ Q̄₀ + P̄Q₁ + Q₁Q̄₀',
                'D₁ = P̄ Q̄₁ + P̄Q₀ + Q₁Q₀, D₀ = P̄ Q₀ + P̄Q₁ + Q₁Q̄₀',
                'D₁ = P Q̄₁ + P̄Q₀ + Q₁Q₀, D₀ = P Q̄₀ + P̄Q₁ + Q₁Q̄₀'
            ],
            correct: 'C',
            topic: 'Sequential Circuits',
            difficulty: 'Hard',
            year: 2026,
            explanation: 'For D flip-flops, D = Next State. Option C is correct.',
            tips: 'D flip-flop: next state = D input',
            resources: [{ title: 'Synchronous Counters', url: 'https://youtu.be/5pfdj0L-Nbw' }]
        },
        {
            id: 5,
            number: 5,
            text: 'In IEEE 754 single precision, which represents the largest number?',
            options: [
                'Sign:0, Exp:0111 1111, Mantissa:111...111',
                'Sign:0, Exp:1111 1110, Mantissa:111...111',
                'Sign:0, Exp:1111 1111, Mantissa:111...111',
                'Sign:0, Exp:0111 1111, Mantissa:000...000'
            ],
            correct: 'C',
            topic: 'IEEE 754',
            difficulty: 'Medium',
            year: 2024,
            explanation: 'Exponent 255 represents infinity (largest possible value)',
            tips: 'Exponent 255 = INF/NaN, 254 = max normal',
            resources: [{ title: 'IEEE 754 Standard', url: 'https://youtu.be/TxOVi7zQaHM' }]
        },
        {
            id: 6,
            number: 6,
            text: "What is the 2's complement of -15 in 8 bits?",
            options: ['11110001', '11110000', '10001111', '01110001'],
            correct: 'A',
            topic: 'Number Systems',
            difficulty: 'Easy',
            year: 2025,
            explanation: '15 = 00001111 → 1\'s = 11110000 → +1 = 11110001',
            tips: '2\'s complement = 1\'s complement + 1',
            resources: [{ title: '2\'s Complement Tutorial', url: 'https://youtu.be/4qH4unVtJkE' }]
        },
        {
            id: 7,
            number: 7,
            text: 'The hexadecimal of 1101 1010 1110 1111 is:',
            options: ['DAEF', 'DAFE', 'DEAF', 'DFAE'],
            correct: 'A',
            topic: 'Number Systems',
            difficulty: 'Easy',
            year: 2025,
            explanation: '1101=D, 1010=A, 1110=E, 1111=F → DAEF',
            tips: 'Group binary into 4 bits from right',
            resources: [{ title: 'Binary to Hex', url: 'https://youtu.be/QlG_EbZc_sY' }]
        },
        {
            id: 8,
            number: 8,
            text: 'The expression (A + B)(A + C) simplifies to:',
            options: ['A + BC', 'AB + AC', 'A + B + C', 'ABC'],
            correct: 'A',
            topic: 'Boolean Algebra',
            difficulty: 'Medium',
            year: 2025,
            explanation: '(A + B)(A + C) = A + BC (Distributive Law)',
            tips: 'Remember: (A+B)(A+C) = A + BC',
            resources: [{ title: 'Distributive Law', url: 'https://youtu.be/4t5tX-JjC-8' }]
        },
        {
            id: 9,
            number: 9,
            text: 'The complement of F = A\'B + AB\' is:',
            options: ["A'B' + AB", 'AB + A\'B\'', "A'B + AB'", '(A + B)(A\' + B\')'],
            correct: 'B',
            topic: 'Boolean Algebra',
            difficulty: 'Medium',
            year: 2024,
            explanation: 'F = A ⊕ B, so F\' = A ⊙ B = AB + A\'B\'',
            tips: 'Use De Morgan\'s Law',
            resources: [{ title: 'De Morgan\'s Law', url: 'https://youtu.be/0L0cH5_Nz9M' }]
        },
        {
            id: 10,
            number: 10,
            text: 'Which of the following is the Boolean function for a 2-to-1 MUX with select S?',
            options: ['S.A + S\'.B', 'S.A\' + S\'.B\'', 'S\'.A + S.B', 'S.A + S.B'],
            correct: 'A',
            topic: 'Multiplexers',
            difficulty: 'Medium',
            year: 2024,
            explanation: 'MUX output = S.A + S\'.B (when S=1, output A; S=0, output B)',
            tips: 'MUX selects one input based on select line',
            resources: [{ title: 'Multiplexers Explained', url: 'https://youtu.be/7qVhLEhR_fg' }]
        }
    ];
}

// ===== MIDDLEWARE =====
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// ===== AUTH ROUTES =====
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            id: users.length + 1,
            name,
            email,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date()
        };
        users.push(user);

        // Create token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== QUESTION ROUTES =====
app.get('/api/questions', authenticate, (req, res) => {
    // Get user's answered questions
    const userProgress = progress.filter(p => p.userId === req.user.id);
    const answeredIds = userProgress.map(p => p.questionId);

    // Get unanswered questions
    const unanswered = questions.filter(q => !answeredIds.includes(q.id));

    // If all answered, return random questions for review
    if (unanswered.length === 0) {
        const shuffled = [...questions].sort(() => 0.5 - Math.random());
        return res.json({
            questions: shuffled.slice(0, 5),
            total: questions.length,
            completed: answeredIds.length,
            message: 'All questions completed! Here are some for review.'
        });
    }

    // Return 5 random unanswered questions
    const shuffled = [...unanswered].sort(() => 0.5 - Math.random());
    const nextQuestions = shuffled.slice(0, 5);

    res.json({
        questions: nextQuestions,
        total: questions.length,
        completed: answeredIds.length
    });
});

app.post('/api/questions/answer', authenticate, (req, res) => {
    try {
        const { questionId, selectedOption, timeSpent } = req.body;
        const userId = req.user.id;

        const question = questions.find(q => q.id === questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        const isCorrect = selectedOption === question.correct;

        // Save progress
        const existing = progress.find(p => p.userId === userId && p.questionId === questionId);

        if (existing) {
            existing.attempts.push({
                selectedOption,
                isCorrect,
                timeSpent,
                timestamp: new Date()
            });
            existing.totalAttempts++;
            if (isCorrect) existing.correctAttempts++;
            existing.lastAttempted = new Date();
        } else {
            progress.push({
                userId,
                questionId,
                attempts: [{
                    selectedOption,
                    isCorrect,
                    timeSpent,
                    timestamp: new Date()
                }],
                totalAttempts: 1,
                correctAttempts: isCorrect ? 1 : 0,
                lastAttempted: new Date(),
                needsReview: !isCorrect
            });
        }

        // Calculate stats
        const userProgress = progress.filter(p => p.userId === userId);
        const totalAttempted = userProgress.length;
        const totalCorrect = userProgress.filter(p => p.correctAttempts > 0).length;

        res.json({
            isCorrect,
            correctAnswer: question.correct,
            explanation: question.explanation,
            tips: question.tips,
            resources: question.resources,
            stats: {
                totalAttempted,
                totalCorrect,
                accuracy: totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0,
                totalQuestions: questions.length
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== PROGRESS ROUTES =====
app.get('/api/progress/stats', authenticate, (req, res) => {
    try {
        const userId = req.user.id;
        const userProgress = progress.filter(p => p.userId === userId);

        // Topic-wise stats
        const topicStats = {};
        userProgress.forEach(p => {
            const q = questions.find(q => q.id === p.questionId);
            if (q) {
                if (!topicStats[q.topic]) {
                    topicStats[q.topic] = { total: 0, correct: 0 };
                }
                topicStats[q.topic].total++;
                if (p.correctAttempts > 0) topicStats[q.topic].correct++;
            }
        });

        // Find weak topics (< 60% accuracy)
        const weakTopics = Object.entries(topicStats)
            .map(([topic, data]) => ({
                topic,
                accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
                total: data.total
            }))
            .filter(t => t.accuracy < 60)
            .sort((a, b) => a.accuracy - b.accuracy);

        res.json({
            totalAttempted: userProgress.length,
            totalCorrect: userProgress.filter(p => p.correctAttempts > 0).length,
            weakTopics: weakTopics.slice(0, 3),
            recentActivity: userProgress.slice(-5).map(p => {
                const q = questions.find(q => q.id === p.questionId);
                return {
                    questionId: p.questionId,
                    text: q ? q.text.substring(0, 50) + '...' : 'Unknown',
                    correct: p.correctAttempts > 0,
                    lastAttempted: p.lastAttempted
                };
            })
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ADMIN ROUTES =====
app.post('/api/admin/questions', authenticate, (req, res) => {
    try {
        // Check if user is admin
        const user = users.find(u => u.id === req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { text, options, correct, topic, difficulty, explanation } = req.body;

        const newQuestion = {
            id: questions.length + 1,
            number: questions.length + 1,
            text,
            options,
            correct,
            topic,
            difficulty,
            year: 2024,
            explanation,
            tips: '',
            resources: []
        };

        questions.push(newQuestion);
        res.status(201).json({ question: newQuestion, message: 'Question added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== SEED DATA =====
seedQuestions();

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 ${questions.length} questions loaded`);
    console.log(`👤 ${users.length} users registered`);
    console.log('📊 Press Ctrl+C to stop');
});
