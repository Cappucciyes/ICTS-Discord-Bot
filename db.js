const fs = require('fs');
require('dotenv').config();
const { getJson, getSolvedProblems, firstJoin, getNewlySolved, getUserData: getUserDataFromDB } = require('./baekjoon.js');
const { error } = require('console');
const DATABASE_DIR= process.env.DATABASE_DIR
const USERS_DATA_DIR=process.env.USERS_DATA_DIR

function readJSON(path) {
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
        let userDataResponse = await getUserDataFromDB(userID);

        let userData = {}
        userData = {}

        let solvedProblems = await getSolvedProblems(userID) 
        userData["startData"] = {
            "registerDate" : today,
            "solvedCount" : userDataResponse.solvedCount,
            "tier" : userDataResponse.tier,
            "solved" : solvedProblems
        };

        // register all problem solved by the user up until now
        userData["currentData"] = {}
        userData["currentData"]["solved"] = solvedProblems 
        userData["currentData"]["solvedCount"] = userDataResponse["solvedCount"]
        userData["currentData"]["tier"] = userDataResponse["tier"] 

        userData["stat"] = {}
        userData["stat"]["lastUpdated"] = today
        userData["stat"]["currentStreak"] = 0 
        userData["stat"]["weeklySolvedCount"] = 0 

        writeJSON(userDataPath, userData)


        // add to weeklyAttendance
        return true
    } else {
        return false 
    }
}


async function updateUser(userID) {
    let userDataPath = USERS_DATA_DIR + `${userID}.json`
    if (fs.existsSync(userDataPath)) {
        // is in nested promise to avoid unnecessary API calls
        // plan to implement so it would only return "changed data" only.
        let result = getUserDataFromDB(userID).then((userDataResponse)=> {
            let currentUserData = readJSON(userDataPath)
            
            // Avoid unnecessary API calls by only checking solvedCount first.
            // Only when "solvedCount" has increased, it will fetch list of every problem the user have ever solved and update data
            // else it won't update anything
            if (userDataResponse["solvedCount"] > currentUserData["currentData"]["solvedCount"]) {
                return getSolvedProblems(userID).then((allSolvedProblems) => {
                    let today = (new Date()).toJSON();
                    let newSolvedProblems = allSolvedProblems.filter((problems)=> currentUserData["currentData"]["solved"].indexOf( problems ) < 0) // won't need this until achievements are implemented


                    currentUserData["stat"]["lastUpdated"] = today
                    currentUserData["stat"]["currentStreak"] += 1 
                    currentUserData["stat"]["weeklySolvedCount"] =  userDataResponse["solvedCount"] - currentUserData["currentData"]["solvedCount"]

                    currentUserData["currentData"]["solved"] = allSolvedProblems
                    currentUserData["currentData"]["solvedCount"] = userDataResponse["solvedCount"]
                    currentUserData["currentData"]["tier"] = userDataResponse["tier"]

                    writeJSON(userDataPath, currentUserData)
                    return currentUserData
                })
            } else {
                return currentUserData
            }
        }) 

        return result
    } else {
        throw Error(`${userID} is not a registered member`) 
    }
}

function getUserDataFromDB(userID) { 
    let userDataPath = USERS_DATA_DIR + `${userID}.json`

    if (fs.existsSync(userDataPath)) {
        return readJSON(userDataPath) 
    } else {
        return null
    }
}

function getWeeklyAttendanceData() {
    let dataPath = DATABASE_DIR + 'weeklyAttendance.json'

    return readJSON(dataPath)
}
function setWeeklyAttendanceData(updatedInfo) {
    let dataPath = DATABASE_DIR + 'weeklyAttendance.json'
    writeJSON(dataPath, updatedInfo)
}

module.exports = {
    registerUser,
    updateUser,
    getWeeklyAttendanceData,
    setWeeklyAttendanceData,
    getUserDataFromDB
}