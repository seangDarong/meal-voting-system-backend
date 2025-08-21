import app from './app';
import dotenv from 'dotenv';
dotenv.config();

const PORT = +process.env.PORT! || 3000;
const backUrl = process.env.BACKEND_URL + ':' + PORT || '/';
app.listen(PORT, '0.0.0.0',() => {
    console.log(`Server running on port ${PORT} at ${backUrl}`);
});