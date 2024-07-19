const fs = require('fs') 

// Helper function to read and write JSON file
const readJSONFile = (filePath) => {
    return JSON.parse(fs.readFileSync(filePath)) 
} 
  
const writeJSONFile = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2)) 
} 

module.exports = {
    readJSONFile, writeJSONFile
}