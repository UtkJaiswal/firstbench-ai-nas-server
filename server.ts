import express from 'express';
import connectDB from './src/db/connection';
import routes from './src/routes';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(
    cors({
      origin: ['http://localhost:3000',"https://firstbench-ai-react.vercel.app"],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);
app.use('', routes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});