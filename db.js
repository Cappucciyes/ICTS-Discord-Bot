const fs = require('fs');
require('dotenv').config();
const { getJson, getSolvedProblems, firstJoin, getNewlySolved, getUserData } = require('./baekjoon.js');
const DATABASE_DIR= process.env.DATABASE_DIR
const USERS_DATA_DIR=process.env.USERS_DATA_DIR

function readJSON(path) {
    console.log(path)
    const fileData = fs.readFileSync(path, "utf-8");
    const savedData = JSON.parse(fileData);
    return savedData;
}

function writeJSON(path, data){
    fs.writeFileSync(path, JSON.stringify(data,null, 4));
}

async function registerUser(userID) {
    let userDataPath = USERS_DATA_DIR + `${userID}.json`
    
    if (!fs.existsSync(userDataPath)) { 
        let today = (new Date()).toJSON();
        let userDataResponse = await getUserData(userID);

        let userData = {}
        userData = {}

        userData["startData"] = {
            "registerDate" : today,
            "solvedCount" : userDataResponse.solvedCount,
            "tier" : userDataResponse.tier
        };

        // register all problem solved by the user up until now
        let solvedProblems = await getSolvedProblems(userID) 
        userData["currentData"] = {}
        userData["currentData"]["lastUpdated"] = today
        userData["currentData"]["solved"] = solvedProblems 
        userData["currentData"]["solvedCount"] = userDataResponse["solvedCount"]
        userData["currentData"]["tier"] = userDataResponse["tier"] 
        userData["currentData"]["currentStreak"] = 0 

        writeJSON(userDataPath, userData)    
        return true
    } else {
        return false 
    }
}


async function udpateUser(userID) {
    let userDataPath = USERS_DATA_DIR + `${userID}.json`
    
    if (fs.existsSync(userDataPath)) { 
        let today = (new Date()).toJSON();
        let userDataResponse = await getUserData(userID);

        let userData = {}
        userData = {}

        userData["startData"] = {
            "registerDate" : today,
            "solvedCount" : userDataResponse.solvedCount,
            "tier" : userDataResponse.tier
        };

        // register all problem solved by the user up until now
        let solvedProblems = await getSolvedProblems(userID) 
        userData["currentData"] = {}
        userData["currentData"]["lastUpdated"] = today
        userData["currentData"]["solved"] = solvedProblems 
        userData["currentData"]["solvedCount"] = userDataResponse["solvedCount"]
        userData["currentData"]["tier"] = userDataResponse["tier"] 
        userData["currentData"]["currentStreak"] = 0 
        userData["currentData"]["weeklyCount"] = 0 

        writeJSON(userDataPath, userData)    
        return true
    } else {
        return false 
    }    
}


module.exports = {
    registerUser
}