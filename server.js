const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const cors = require('cors');
const fs = require('fs'); // ADD THIS LINE: Require the file system module
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // Vercel ignores this PORT

// Middleware
app.use(cors());
app.use(express.json());
// Assuming you're using a 'public' folder for static assets
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
let db;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set. ❗');
    process.exit(1); 
}

// Connect to MongoDB
MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(client => {
    console.log('Connected to MongoDB');
    db = client.db('smartdustbin');
    initializeSampleData();
})
.catch(error => {
    console.error('MongoDB connection error:', error);
});

// Initialize sample data
async function initializeSampleData() {
    try {
        const collection = db.collection('dustbins');
        const count = await collection.countDocuments();
        if (count === 0) {
            console.log('Initializing sample dustbin data...');
            const sampleDustbins = [
                { id: 'dustbin_001', name: 'Central Park Entrance', address: '1 Central Park West, New York, NY 10023', latitude: 40.7829, longitude: -73.9654, fillPercentage: 25, type: 'General Waste', capacity: 'Large', lastUpdated: new Date(), status: 'active' },
                { id: 'dustbin_002', name: 'Times Square North', address: '1560 Broadway, New York, NY 10036', latitude: 40.7580, longitude: -73.9855, fillPercentage: 78, type: 'Mixed Waste', capacity: 'Standard', lastUpdated: new Date(), status: 'active' },
                { id: 'dustbin_003', name: 'Brooklyn Bridge Park', address: '334 Furman St, Brooklyn, NY 11201', latitude: 40.7023, longitude: -73.9969, fillPercentage: 45, type: 'Recyclable', capacity: 'Large', lastUpdated: new Date(), status: 'active' },
                { id: 'dustbin_004', name: 'High Line Park', address: 'High Line, New York, NY 10011', latitude: 40.7480, longitude: -74.0048, fillPercentage: 12, type: 'General Waste', capacity: 'Standard', lastUpdated: new Date(), status: 'active' },
                { id: 'dustbin_005', name: 'Washington Square Park', address: 'Washington Square Park, New York, NY 10012', latitude: 40.7308, longitude: -73.9973, fillPercentage: 89, type: 'General Waste', capacity: 'Standard', lastUpdated: new Date(), status: 'active' },
                { id: 'dustbin_006', name: 'Bryant Park', address: '1065 6th Ave, New York, NY 10018', latitude: 40.7536, longitude: -73.9832, fillPercentage: 34, type: 'Mixed Waste', capacity: 'Large', lastUpdated: new Date(), status: 'active' },
                { id: 'dustbin_007', name: 'Madison Square Garden', address: '4 Pennsylvania Plaza, New York, NY 10001', latitude: 40.7505, longitude: -73.9934, fillPercentage: 67, type: 'General Waste', capacity: 'Standard', lastUpdated: new Date(), status: 'active' },
                { id: 'dustbin_008', name: 'Union Square', address: 'Union Square, New York, NY 10003', latitude: 40.7359, longitude: -73.9911, fillPercentage: 15, type: 'Recyclable', capacity: 'Large', lastUpdated: new Date(), status: 'active' },
                { id: 'dustbin_009', name: 'Flatiron Building', address: '175 5th Ave, New York, NY 10010', latitude: 40.7411, longitude: -73.9897, fillPercentage: 52, type: 'General Waste', capacity: 'Standard', lastUpdated: new Date(), status: 'active' },
                { id: 'dustbin_010', name: 'Chelsea Market', address: '75 9th Ave, New York, NY 10011', latitude: 40.7420, longitude: -74.0064, fillPercentage: 91, type: 'Mixed Waste', capacity: 'Large', lastUpdated: new Date(), status: 'active' },
                { id: 'dustbin_011', name: 'Statue of Liberty Ferry', address: 'Battery Park, New York, NY 10004', latitude: 40.7033, longitude: -74.0170, fillPercentage: 28, type: 'General Waste', capacity: 'Standard', lastUpdated: new Date(), status: 'active' },
                { id: 'dustbin_012', name: 'One World Trade Center', address: '285 Fulton St, New York, NY 10007', latitude: 40.7127, longitude: -74.0134, fillPercentage: 73, type: 'General Waste', capacity: 'Large', lastUpdated: new Date(), status: 'active' }
            ];
            await collection.insertMany(sampleDustbins);
            console.log('Sample data inserted successfully');
        }
    } catch (error) {
        console.error('Error initializing sample data:', error);
    }
}

// Routes
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to load page' });
        }
        
        // ADD THIS LINE: Replace the placeholder with the environment variable
        const modifiedHtml = data.replace('GOOGLE_MAPS_API_KEY', process.env.GOOGLE_MAPS_API_KEY);
        
        res.send(modifiedHtml);
    });
});

// Get all dustbins
app.get('/api/dustbins', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        const collection = db.collection('dustbins');
        const dustbins = await collection.find({ status: 'active' }).toArray();
        res.json(dustbins);
    } catch (error) {
        console.error('Error fetching dustbins:', error);
        res.status(500).json({ error: 'Failed to fetch dustbins' });
    }
});

// Get dustbin by ID
app.get('/api/dustbins/:id', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        const collection = db.collection('dustbins');
        const dustbin = await collection.findOne({ id: req.params.id });
        if (!dustbin) {
            return res.status(404).json({ error: 'Dustbin not found' });
        }
        res.json(dustbin);
    } catch (error) {
        console.error('Error fetching dustbin:', error);
        res.status(500).json({ error: 'Failed to fetch dustbin' });
    }
});

// Get dustbins within a radius
app.get('/api/dustbins/nearby/:lat/:lng/:radius', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        const { lat, lng, radius } = req.params;
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius);
        const collection = db.collection('dustbins');
        const dustbins = await collection.find({ status: 'active' }).toArray();
        const nearbyDustbins = dustbins.filter(dustbin => {
            const distance = calculateDistance(
                latitude, longitude,
                dustbin.latitude, dustbin.longitude
            );
            return distance <= radiusKm;
        });
        nearbyDustbins.sort((a, b) => {
            const distanceA = calculateDistance(latitude, longitude, a.latitude, a.longitude);
            const distanceB = calculateDistance(latitude, longitude, b.latitude, b.longitude);
            return distanceA - distanceB;
        });
        res.json(nearbyDustbins);
    } catch (error) {
        console.error('Error fetching nearby dustbins:', error);
        res.status(500).json({ error: 'Failed to fetch nearby dustbins' });
    }
});

// Update dustbin fill level
app.put('/api/dustbins/:id/fill-level', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        const { fillPercentage } = req.body;
        if (fillPercentage < 0 || fillPercentage > 100) {
            return res.status(400).json({ error: 'Fill percentage must be between 0 and 100' });
        }
        const collection = db.collection('dustbins');
        const result = await collection.updateOne(
            { id: req.params.id },
            { $set: { fillPercentage: fillPercentage, lastUpdated: new Date() } }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Dustbin not found' });
        }
        res.json({ message: 'Fill level updated successfully' });
    } catch (error) {
        console.error('Error updating fill level:', error);
        res.status(500).json({ error: 'Failed to update fill level' });
    }
});

// Report an issue with a dustbin
app.post('/api/dustbins/:id/report', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        const { issue, description } = req.body;
        const report = {
            dustbinId: req.params.id,
            issue: issue,
            description: description,
            reportedAt: new Date(),
            status: 'open'
        };
        const collection = db.collection('reports');
        await collection.insertOne(report);
        res.json({ message: 'Issue reported successfully' });
    } catch (error) {
        console.error('Error reporting issue:', error);
        res.status(500).json({ error: 'Failed to report issue' });
    }
});

// Add a new dustbin (admin endpoint)
app.post('/api/dustbins', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        const { name, address, latitude, longitude, type, capacity } = req.body;
        if (!name || !address || !latitude || !longitude) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const dustbin = {
            id: `dustbin_${Date.now()}`,
            name,
            address,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            fillPercentage: 0,
            type: type || 'General Waste',
            capacity: capacity || 'Standard',
            lastUpdated: new Date(),
            status: 'active'
        };
        const collection = db.collection('dustbins');
        await collection.insertOne(dustbin);
        res.status(201).json(dustbin);
    } catch (error) {
        console.error('Error adding dustbin:', error);
        res.status(500).json({ error: 'Failed to add dustbin' });
    }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        const collection = db.collection('dustbins');
        const dustbins = await collection.find({ status: 'active' }).toArray();
        const stats = {
            total: dustbins.length,
            empty: dustbins.filter(d => d.fillPercentage <= 25).length,
            low: dustbins.filter(d => d.fillPercentage > 25 && d.fillPercentage <= 50).length,
            medium: dustbins.filter(d => d.fillPercentage > 50 && d.fillPercentage <= 75).length,
            high: dustbins.filter(d => d.fillPercentage > 75).length,
            averageFillLevel: dustbins.length > 0 ? dustbins.reduce((sum, d) => sum + d.fillPercentage, 0) / dustbins.length : 0
        };
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Utility function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// EXPORT THE EXPRESS APP
module.exports = app;