import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ApiManager from '@/controllers/api-manager';
import DatabaseManager from '@/controllers/database-manager';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const startServer = async () => {
    try {
        await DatabaseManager.getInstance().connect();
        
        app.use(ApiManager.getInstance().getRouter());
        
        app.listen(PORT, () => {
            console.log(`EMS Scraper server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();