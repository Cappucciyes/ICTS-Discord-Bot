const fs = require('fs');
const { writeJSON, readJSON } = require("../utils/utilsIO.js")

require('dotenv').config();
const { getSolvedProblems, getUserData } = require('../utils/baekjoon.js');
const { eventHandler } = require('../utils/eventHandler.js');

class DB {
    constructor() {
        this.DATABASE_DIR = process.env.DATABASE_DIR
        this.USERS_DATA_DIR = process.env.USERS_DATA_DIR
    }

    async registerUser(userID, name) {
        let userDataPath = this.USERS_DATA_DIR + `${userID}.json`

        if (!fs.existsSync(userDataPath)) {
            let today = new Date();
            let lastUpdateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            let userDataResponse = await getUserData(userID);
            let userData = {}
            userData = {}

            let solvedProblems = await getSolvedProblems(userID)
            userData["startData"] = {
                "name": name,
                "registerDate": today,
                "solvedCount": userDataResponse.solvedCount,
                "tier": userDataResponse.tier,
                "solved": solvedProblems
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
            // every class that has to do something when a new user is added is going to get userID
            eventHandler.emit("user:added", { userID: userID })
            return true
        } else {
            return false
        }
    }

    async updateUser(userID, updateTime) {
        let userDataPath = this.USERS_DATA_DIR + `${userID}.json`
        if (fs.existsSync(userDataPath)) {
            // is in nested promise to avoid unnecessary API calls
            // plan to implement so it would only return "changed data" only.
            let result = getUserData(userID).then((userDataResponse) => {
                let currentUserData = readJSON(userDataPath)

                // Avoid unnecessary API calls by only checking solvedCount first.
                // Only when "solvedCount" has increased, it will fetch list of every problem the user have ever solved and update data
                // else it won't update anything
                if (userDataResponse["solvedCount"] > currentUserData["currentData"]["solvedCount"]) {
                    return getSolvedProblems(userID).then((allSolvedProblems) => {
                        console.log(updateTime)

                        // won't need this until achievements are implemented
                        let newSolvedProblems = allSolvedProblems.filter((problems) => currentUserData["currentData"]["solved"].indexOf(problems) < 0)

                        // 1. update all solved questions and weekly Solved
                        currentUserData["stat"]["weeklySolvedCount"] += userDataResponse["solvedCount"] - currentUserData["currentData"]["solvedCount"]

                        currentUserData["currentData"]["solved"] = allSolvedProblems
                        currentUserData["currentData"]["solvedCount"] = userDataResponse["solvedCount"]
                        currentUserData["currentData"]["tier"] = userDataResponse["tier"]

                        // 2. update daily streak
                        let lastSolvedDate = new Date(currentUserData["stat"]["lastSolvedDate"])
                        let nextDay = new Date(currentUserData["stat"]["lastSolvedDate"])
                        let twoDaysLater = new Date(currentUserData["stat"]["lastSolvedDate"])

                        nextDay.setDate(lastSolvedDate.getDate() + 1)
                        twoDaysLater.setDate(lastSolvedDate.getDate() + 2)

                        if (nextDay <= updateTime && updateTime < twoDaysLater) {
                            currentUserData["stat"]["currentStreak"] += 1

                            if (currentUserData["stat"]["currentStreak"] > currentUserData["currentData"]["longestStreak"]) {
                                console.log("updating streak")
                                currentUserData["currentData"]["longestStreak"] = currentUserData["stat"]["currentStreak"]
                            }

                        } else if (twoDaysLater <= updateTime) {
                            currentUserData["stat"]["currentStreak"] = 1
                        }

                        let newDate = new Date(updateTime)
                        let lastUpdateTime = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());

                        currentUserData["stat"]["lastSolvedDate"] = lastUpdateTime.toString()
                        writeJSON(userDataPath, currentUserData)

                        // let all classes that needs to do something when we detect user solved new problems 
                        // as of right now, only update attendance
                        eventHandler.emit("user:solvedProblemUpdated", {
                            userID: userID,
                            userData: currentUserData
                        })
                        return currentUserData

                    })
                } else {
                    let lastSolvedDate = new Date(currentUserData["stat"]["lastSolvedDate"])
                    let nextDay = new Date(currentUserData["stat"]["lastSolvedDate"])
                    let twoDaysLater = new Date(currentUserData["stat"]["lastSolvedDate"])
                    nextDay.setDate(lastSolvedDate.getDate() + 1)
                    twoDaysLater.setDate(lastSolvedDate.getDate() + 2)

                    if (updateTime >= twoDaysLater) {
                        if (currentUserData["currentData"]["longestStreak"] < currentUserData["stat"]["currentStreak"]) {
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

    getUserDataFromDB(userID) {
        let userDataPath = this.USERS_DATA_DIR + `${userID}.json`

        if (fs.existsSync(userDataPath)) {
            return readJSON(userDataPath)
        } else {
            return null
        }
    }

    getAllUserID() {
        let userDataPath = this.USERS_DATA_DIR;
        let userNameList = fs.readdirSync(userDataPath).filter(file => file.endsWith('.json'));

        let result = []
        for (let file of userNameList) {
            let parsed = file.split(".")
            result.push(parsed[0])
        }

        return result
    }

    async deleteUser(userID) {
        let userDataPath = this.USERS_DATA_DIR + `${userID}.json`

        if (fs.existsSync(userDataPath)) {
            fs.unlinkSync(userDataPath)
            eventHandler.emit("user:deleted", { userID: userID })
            return true
        } else {
            console.error(`${userID} does not exist already!`)
            return false
        }
    }
}

const db = new DB();

module.exports = {
    db
}