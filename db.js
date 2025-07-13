const fs = require('fs');
require('dotenv').config();
const {  getSolvedProblems, getUserData } = require('./baekjoon.js');
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

async function registerUser(userID, name) {
    let userDataPath = USERS_DATA_DIR + `${userID}.json`
    
    if (!fs.existsSync(userDataPath)) { 
        let today = new Date();

        // because streaks gets updated at least every 6:00AM by the system
        if (today.getHours() < 6){
            today.setDate(today.getDate() - 1) 
        }
        let lastUpdateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6);
        console.log(lastUpdateTime.toString())

        let userDataResponse = await getUserData(userID);

        let userData = {}
        userData = {}

        let solvedProblems = await getSolvedProblems(userID) 
        userData["startData"] = {
            "name" : name,
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
        userData["currentData"]["longestStreak"] = 0 

        userData["stat"] = {}
        userData["stat"]["lastSolvedDate"] = lastUpdateTime.toString();
        userData["stat"]["currentStreak"] = 0 
        userData["stat"]["weeklySolvedCount"] = 0 

        writeJSON(userDataPath, userData)
        // add to weeklyAttendance
        attendanceManager.addMember(userID)
        return true
    } else {
        return false 
    }
}


async function updateUser(userID, updateTime) {
    let userDataPath = USERS_DATA_DIR + `${userID}.json`
    if (fs.existsSync(userDataPath)) {
        // is in nested promise to avoid unnecessary API calls
        // plan to implement so it would only return "changed data" only.
        let result = getUserData(userID).then((userDataResponse)=> {
            let currentUserData = readJSON(userDataPath)
            
            // Avoid unnecessary API calls by only checking solvedCount first.
            // Only when "solvedCount" has increased, it will fetch list of every problem the user have ever solved and update data
            // else it won't update anything
            if (userDataResponse["solvedCount"] > currentUserData["currentData"]["solvedCount"]) {
                return getSolvedProblems(userID).then((allSolvedProblems) => {
                    console.log(updateTime)
                    let newSolvedProblems = allSolvedProblems.filter((problems)=> currentUserData["currentData"]["solved"].indexOf( problems ) < 0) // won't need this until achievements are implemented

                    // 1. update all solved questions

                    // 2. update weekly Solved
                    currentUserData["stat"]["weeklySolvedCount"] += userDataResponse["solvedCount"] - currentUserData["currentData"]["solvedCount"]
                    
                    currentUserData["currentData"]["solved"] = allSolvedProblems
                    currentUserData["currentData"]["solvedCount"] = userDataResponse["solvedCount"]
                    currentUserData["currentData"]["tier"] = userDataResponse["tier"]
                    // 3. update daily streak

                    let lastSolvedDate = new Date(currentUserData["stat"]["lastSolvedDate"])
                    let nextDay = new Date(currentUserData["stat"]["lastSolvedDate"])
                    let twoDaysLater = new Date(currentUserData["stat"]["lastSolvedDate"])

                    nextDay.setDate(lastSolvedDate.getDate() + 1)
                    twoDaysLater.setDate(lastSolvedDate.getDate() + 2)

                    if (nextDay <= updateTime && updateTime < twoDaysLater) {
                        currentUserData["stat"]["currentStreak"] += 1 
                    } else if (twoDaysLater <= updateTime) {
                        currentUserData["stat"]["currentStreak"] = 1 
                    }

                    let newDate = new Date(updateTime)
                    let lastUpdateTime = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());

                    currentUserData["stat"]["lastSolvedDate"] = lastUpdateTime.toString()
                    writeJSON(userDataPath, currentUserData)

                    // update attendance
                    // consider refractoring this part of code into observer-pattern-like design
                    attendanceManager.updateAttendance(userID)
                    console.log(`updated: ${userID}`)
                    return currentUserData
                })
            } else {
                let lastSolvedDate = new Date(currentUserData["stat"]["lastSolvedDate"])
                let nextDay = new Date(currentUserData["stat"]["lastSolvedDate"])
                let twoDaysLater = new Date(currentUserData["stat"]["lastSolvedDate"])
                nextDay.setDate(lastSolvedDate.getDate() + 1)
                twoDaysLater.setDate(lastSolvedDate.getDate() + 2)

                if (updateTime >= twoDaysLater) {
                    if (currentUserData["currentData"]["longestStreak"] < currentUserData["stat"]["currentStreak"] ) {
                        currentUserData["currentData"]["longestStreak"] = currentUserData["stat"]["currentStreak"]
                    }
                    currentUserData["stat"]["currentStreak"] = 0
                }

                writeJSON(userDataPath, currentUserData)
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

function getAllUserID() {
    let userDataPath = USERS_DATA_DIR;
    let userNameList = fs.readdirSync(userDataPath).filter(file=> file.endsWith('.json'));
    
    let result = []
    for (let file of userNameList) {
        let parsed = file.split(".")
        result.push(parsed[0])
    }

    return result
}

function getWeeklyAttendanceData() {
    let dataPath = DATABASE_DIR + 'weeklyAttendance.json'

    return readJSON(dataPath)
}
function setWeeklyAttendanceData(updatedInfo) {
    let dataPath = DATABASE_DIR + 'weeklyAttendance.json'
    writeJSON(dataPath, updatedInfo)
}

const attendanceManager = {
    readWeeklyAttendance : (userID)=> {
        let weeklyAttendance = getWeeklyAttendanceData() 
        return weeklyAttendance[userID]
    },
    updateAttendance : (userID)=> {
        let weeklyAttendance = getWeeklyAttendanceData() 

        if (!weeklyAttendance.hasOwnProperty(userID)) {
            console.error(`${userID} does not exists in weeklyAttendance`)
            return false
        } else if (!weeklyAttendance[userID]) {
            // get user Data
            let userData = getUserDataFromDB(userID);
            // check if weeklySolvedCount is more 3 or greater
            if(userData.stat.weeklySolvedCount >= 3) {
                weeklyAttendance[userID] = true

                setWeeklyAttendanceData(weeklyAttendance)
            } 
        } 

        return true
    },
    resetWeeklyAttendance : (userID) => {
        let weeklyAttendance = getWeeklyAttendanceData() 

        if (!weeklyAttendance.hasOwnProperty(userID)) {
            console.error(`${userID} does not exists in weeklyAttendance`)
            return false
        } else if (!weeklyAttendance[userID]) {
            weeklyAttendance[userID] = false 
            setWeeklyAttendanceData(weeklyAttendance) 
        } 

        return true   
    },
    addMember : (userID) => {
        let weeklyAttendance = getWeeklyAttendanceData() 

        if (weeklyAttendance.hasOwnProperty(userID)) {
            console.error(`${userID} already exists in weeklyAttendance`)
            return false
        } else {
            weeklyAttendance[userID] = false 
            setWeeklyAttendanceData(weeklyAttendance)
            return true
        } 
    }
}

module.exports = {
    registerUser,
    writeJSON,
    updateUser,
    getWeeklyAttendanceData,
    setWeeklyAttendanceData,
    getUserDataFromDB,
    getAllUserID,
    attendanceManager
}