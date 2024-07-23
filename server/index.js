require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const userRouter = require('./routes/userRouter');
const cors = require('cors');

const app = express();

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, 'frontend')));

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());

// Use the userRouter for /api routes
app.use('/api', userRouter);

// Listen on a specific IP address and port
const host = 'https://subnote-github-io-server.onrender.com'; // Change to your desired IP address if needed

app.listen(host, () => {
    console.log(`✅ Server is running on ${host}`);
});
