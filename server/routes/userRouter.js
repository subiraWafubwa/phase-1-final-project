// Packages
require('dotenv').config() 
const express = require('express') 
const { v6: uuidv4 } = require('uuid') 
const fileSync = require('../fileSync') 
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Middlewares and Services
const auth = require('../middlewares/auth')
const otpService = require('../services/otp_service')
const fs = require('fs').promises;
const path = require('path');


// Initializations
const userRouter = express.Router()
const DB = process.env.DB
const secretKey = process.env.SECRET_KEY
const data = fileSync.readJSONFile(DB)

async function loadUsersData() {
    try {
        const filePath = path.join(__dirname, '../db.json'); 
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error loading user data:', error);
        throw error;
    }
}

async function saveUsersData(users) {
    try {
        const filePath = path.join(__dirname, '../db.json');
        const fileContent = JSON.stringify(users, null, 2);
        await fs.writeFile(filePath, fileContent, 'utf-8');
    } catch (error) {
        console.error('Error saving user data:', error);
        throw error;
    }
}

userRouter.put('/update-note/:noteId', async (req, res) => {
    const { noteId } = req.params;
    const { title, content, createdAt } = req.body;

    try {
        // Load all users data (assuming data is a representation of all users)
        const users = await loadUsersData();

        // Find the user who has the note
        let userFound = false;
        for (let user of users) {
            const note = user.data.notes.find(note => note._id === noteId);
            if (note) {
                userFound = true;

                // Update note fields
                note.title = title;
                note.content = content;
                note.createdAt = createdAt;

                // Save updated note
                await saveUsersData(users); // Implement this function to save your updated data
                return res.json({ message: 'Note updated successfully' });
            }
        }

        if (!userFound) {
            return res.status(404).json({ message: 'Note not found' });
        }

    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'An error occurred while updating the note' });
    }
});

// Endpoint to get all users
userRouter.get('/users', (req, res) => {
    try {
        res.json({"users": data}) 
    } catch (e) { 
        res.status(500).json({ error: e.message }) 
    }
})

//Get a specific user
userRouter.get('/users/:userID', (req, res) => {
    const id = req.params.userID;
    const user = data.find(user => user.userID === id)

    try {
        if(!user){
            return res.status(404).json({
                message: 'No user found'
            })
        }
    
        res.status(200).json({
            userData: User
        })
    } catch(err) {
        res.status(500).json({ error: err.message });
    }     
})

// Endpoint to retrieve user data
userRouter.get('/get-user-data', auth, async (req, res) => {
    try {
        const user = data.find(user => user.userID === req.user)
        res.json({token: req.token, ...user})

    } catch (e) {
        res.json({error: e.message})
    }
})

// Route to check for existing username
userRouter.get('/check-username/:username',async (req, res) => {
    const username  = req.params;

    try {
        const existingUsername = await data.some(user => user.username === username);
        res.json({ exists: existingUsername });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to check for existing username
userRouter.get('/check-email/:email', (req, res) => {
    const { email } = req.params.email;

    try {
        const existingEmail = data.some(user => user.email === email);
        res.json({ exists: existingEmail });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to sign up a new user
userRouter.post('/signup', async (req, res) => {
    try {
        const { name, username, email, gender, password } = req.body

        // Validate required fields
        if (!name || name.trim() === "") {
            return res.status(400).json({ message: 'Name is required' })
        }
        if (!username || username.trim() === "") {
            return res.status(400).json({ message: 'Username is required' })
        }
        if (!email || email.trim() === "") {
            return res.status(400).json({ message: 'Email is required' })
        }
        if (!password || password.trim() === "") {
            return res.status(400).json({ message: 'Password is required' })
        }
        if (!gender || gender.trim() === "") {
            return res.status(400).json({ message: 'Please select the gender' })
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password should be more than 8 characters',
            })
        }

        // Check if email is already taken
        const existingEmail = data.some(user => user.email === email)
        if(existingEmail){
            return res.status(400).json({
                message: 'This email already exists. Log in instead'
            })
        }
  
        // Check if username is already taken
        const existingUsername = data.some(user => user.username === username) 
        if (existingUsername) {
            return res.status(400).json({ 
                message: 'This username already exists' 
            }) 
        }

        // Ensure gender is either male, female, non-binary or rather not say only
        const allowedGenders = ['male', 'female', 'non-binary', 'rather not say']
        if (!allowedGenders.includes(gender.toLowerCase())) {
            return res.status(500).json({ 
                message: `Incorrect gender` 
            })
        }

        // Create a hashed password
        const hashedPassword = await bcrypt.hash(password, 8)

        const newUser = {
            userID: uuidv4(),
            name,
            username,
            email,
            password: hashedPassword,
            gender,
            data: {
                notes: [],
            }
        } 
  
        data.push(newUser) 
        fileSync.writeJSONFile(DB, data) 
  
        res.status(201).json({
          status: "User Created",
          createdUser: newUser
        }) 
    } catch (e) {
        console.log(e) 
        res.status(500).json({ error: e.message }) 
    }
})

//Endpoint to log in a user
userRouter.post('/login', async (req, res) => {
    try {
        const {email, username, password} = req.body

        // Validate required fields
        if ((!username || username.trim() === "") && (!email || email.trim() === "")) {
            return res
                .status(400)
                .json({ message: 'Username or email is required' })
        }
        if (!password || password.trim() === "") {
            return res
                .status(400)
                .json({ message: 'Password is required' })
        }

        const user = data.find(user => user.username === username || user.email === email)

        // Handle non-existing users
        if(!user){
            return res
                .status(400)
                .json({message: 'This user does not exist. Sign up instead'})
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res
                .status(400)
                .json({'message': 'Incorrect password'})
        }

        const token = jwt.sign({id: user.userID}, secretKey, {expiresIn: '7d'})
        res.json({
            status : "Logged in successfully!",
            token: token,
            user : user
        })        
    } catch(e){
        return res
            .status(500)
            .json({error : e.message})
    }
})

//Endpoint to edit profile data
userRouter.patch('/edit-profile/:userID', (req, res) => {
    const userID = req.params.userID
    const newUsername = req.body.username

    // Find the user by userID
    const userIndex = data.findIndex(user => user.userID === userID);
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Handle existing username if username has been added
    if(newUsername){
        const usernameExists = data.some(user => user.username === newUsername && user.userID !== userID);
        if (usernameExists) {
            return res.status(400).json({ message: 'Username is already taken' });
        }
    }

    // Update user data based on req.body (assuming req.body contains fields to update)
    const updatedUser = {
        ...data[userIndex],
        ...req.body
    };

    // Update the user in the array
    data[userIndex] = updatedUser

    // Write updated data back to db.json
    fileSync.writeJSONFile(DB, data)

    res.json({ message: 'User profile updated successfully', user: updatedUser })
})

//Endpoint to delete a user
userRouter.delete('/delete-user/:userID', (req, res) => {
    const id = req.params.userID
    
    // Find the index of the user with the specified userID
    const userIndex = data.findIndex(user => user.userID === id)

    // If user not found, return a 404 error
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Remove the user from the array
    data.splice(userIndex, 1);

    // Write the updated data back to db.json
    fileSync.writeJSONFile(DB, data);

    // Send a success response
    res.json({ message: 'User deleted successfully' })
})

// Endpoint to send the otp
userRouter.post('/send-otp', (req, res) => {
    otpService.sendOTP(req.body, (error, results) => {
        if(error){
            return res.status(400).send({
                message: "error",
                data: error,
            })
        }
        return res.status(200).send({
            message: "Success",
            data: results,
        })
    })
})

//Endpoint to verify the otp
userRouter.post('/verify-otp', (req, res) => {
    otpService.verifyOTP(req.body, (error, results) => {
        if(error){
            return res.status(400).send({
                message: "error",
                data: error,
            })
        }
        return res.status(200).send({
            message: "Success",
            data: results,
        })
    })
})

userRouter.post('/post-notes', (req, res) => {
    const { userID, note } = req.body;

    try {
        // Find the user by userID
        const user = data.find(user => user.userID === userID);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add the note to the user's notes
        user.data.notes.push(note);

        // Save the updated data to db.json
        fileSync.writeJSONFile(DB, data);

        res.status(201).json({ message: 'Note saved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

userRouter.get('/user-id/:email', (req, res) => {
    const { email } = req.params;

    try {
        // Find user by email
        const user = data.find(user => user.email === email);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the user ID
        res.json({ userID: user.userID });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

userRouter.get('/user-notes/:email', (req, res) => {
    const { email } = req.params;

    try {
        // Find user by email
        const user = data.find(user => user.email === email);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the user's notes
        res.json({ notes: user.data.notes });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Updating user data
userRouter.put('/update-note/:noteId', async (req, res) => {
    const { noteId } = req.params;
    const { title, content, createdAt } = req.body;

    try {
        // Load all users data (assuming data is a representation of all users)
        const users = await loadUsersData(); // Implement this function to load your data

        // Find the user who has the note
        let userFound = false;
        for (let user of users) {
            const note = user.data.notes.find(note => note._id === noteId);
            if (note) {
                userFound = true;

                // Update note fields
                note.title = title;
                note.content = content;
                note.createdAt = createdAt;

                // Save updated note
                await saveUsersData(users); // Implement this function to save your updated data
                return res.json({ message: 'Note updated successfully' });
            }
        }

        if (!userFound) {
            return res.status(404).json({ message: 'Note not found' });
        }

    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: `An error occurred while updating the note : ${error}`  });
    }
});

module.exports = userRouter 
