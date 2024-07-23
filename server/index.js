require('dotenv').config() 
const express = require('express') 
const path = require('path')
const bodyParser = require('body-parser') 
const morgan = require('morgan') 
const userRouter = require('./routes/userRouter')
const cors = require('cors')

const app = express()

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, 'frontend')));

app.use(bodyParser.json()) 
app.use(morgan('dev'))
app.use(cors()) 

// Use the userRouter for /api routes
app.use('/api', userRouter) 

app.listen(process.env.PORT,  () => {
    console.log(`✅ Server is running`) 
}) 
