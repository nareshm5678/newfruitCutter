import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));
app.use('/src', express.static(join(__dirname, 'src')));
app.use('/src/images', express.static(join(__dirname, 'src', 'images')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fruitCutter')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: true
    },
    collegeName: {
        type: String,
        required: true
    },
    scores: [{
        score: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

const User = mongoose.model('User', userSchema);

// API Routes
app.post('/api/login', async (req, res) => {
    try {
        const { studentName, collegeName } = req.body;
        
        if (!studentName || !collegeName) {
            return res.status(400).send('Student name and college name are required');
        }

        // Find existing user
        let user = await User.findOne({ 
            studentName: studentName.toLowerCase(),
            collegeName: collegeName.toLowerCase()
        });
        
        if (!user) {
            // Create new user
            user = new User({
                studentName: studentName.toLowerCase(),
                collegeName: collegeName.toLowerCase(),
                scores: []
            });
            await user.save();
        }
        
        res.json({ 
            success: true,
            userId: user._id,
            studentName: user.studentName,
            collegeName: user.collegeName
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Error processing login. Please try again.');
    }
});

app.post('/api/score', async (req, res) => {
    try {
        const { userId, score } = req.body;
        
        if (!userId || score === undefined) {
            return res.status(400).send('User ID and score are required');
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        user.scores.push({ score });
        await user.save();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Score update error:', error);
        res.status(500).send('Error updating score');
    }
});

// Add this new endpoint for leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await User.aggregate([
            // Unwind the scores array to work with individual scores
            { $unwind: '$scores' },
            // Group by user to get their highest score
            {
                $group: {
                    _id: '$_id',
                    studentName: { $first: '$studentName' },
                    collegeName: { $first: '$collegeName' },
                    score: { $max: '$scores.score' }
                }
            },
            // Sort by score in descending order
            { $sort: { score: -1 } },
            // Limit to top 5
            { $limit: 5 },
            // Project the fields we want to return
            {
                $project: {
                    _id: 0,
                    studentName: { $toUpper: '$studentName' },
                    collegeName: 1,
                    score: 1
                }
            }
        ]);
        
        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).send('Error fetching leaderboard');
    }
});

app.get('/leaderboard', async (req, res) => {
    try {
        const topPlayers = await User.find({})
            .sort({ highScore: -1 })
            .limit(10)
            .select('studentName collegeName scores -_id');
        res.json(topPlayers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(join(__dirname, 'game.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
