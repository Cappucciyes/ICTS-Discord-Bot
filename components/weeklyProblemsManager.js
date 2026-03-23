const { readJSON, writeJSON } = require("../utils/utilsIO");
const { eventHandler } = require("../utils/eventHandler.js")
const EVENT_NAME = require("../" + process.env.EVENT_NAME_PATH);
const DATABASE_DIR = process.env.DATABASE_DIR
const { db } = require("./db.js")

class WeeklyProblemsManger {
    constructor() {
        this.weeklyProblemsSolvedCountPath = DATABASE_DIR + 'weeklyProblemsSolvedCount.json'
        this.weeklyProblemSet = new Set();
        this.weeklyProblemsSolvedCount = readJSON(this.weeklyProblemsSolvedCountPath);

        eventHandler.on(EVENT_NAME.PROBLEMS_WEEKLY_PROBLEMS_REASSIGNED, (newProblems) => {
            let problemSet = new Set(newProblems.newWeeklyQuestions)
            this.reassignWeeklyProblems(problemSet)
        })

        eventHandler.on(EVENT_NAME.USER_DELETED, (user) => {
            this.deleteUser(user.userID);
        })

        eventHandler.on(EVENT_NAME.USER_SOLVED_PROBLEM_UPDATED, (updatedUserData) => {
            console.log(`heard ${EVENT_NAME.USER_SOLVED_PROBLEM_UPDATED} from weeklyProblemsManger`)
            this.updateWeeklyProbleSolvedCountForSingleUser(updatedUserData.userID, updatedUserData.userData)
        })
    }

    reassignWeeklyProblems(weeklyProblems) {
        this.weeklyProblemSet = weeklyProblems
        let users = db.getAllUserID();
        for (let user of users) {
            let userData = db.getUserDataFromDB(user)

            if (userData === null) {
                console.log(`${user} does not exists`)
                continue;
            }

            let userSolved = new Set(userData["currentData"]["solved"])
            let currentSolvedCount = this.weeklyProblemSet.intersection(userSolved).size

            this.weeklyProblemsSolvedCount[user] = currentSolvedCount
            console.log(`finished counting ${user}: ${this.weeklyProblemsSolvedCount[user]}`)
        }
        this.saveWeeklyProblemsSolvedCount();
    }

    deleteUser(userID) {
        delete this.weeklyProblemsSolvedCount[userID];
        this.saveWeeklyProblemsSolvedCount();
    }

    saveWeeklyProblemsSolvedCount() {
        writeJSON(this.weeklyProblemsSolvedCountPath, this.weeklyProblemsSolvedCount)
    }

    updateWeeklyProbleSolvedCountForSingleUser(userID, userData) {
        let userSolved = new Set(userData["currentData"]["solved"])
        let currentSolvedCount = this.weeklyProblemSet.intersection(userSolved).size

        this.weeklyProblemsSolvedCount[userID] = currentSolvedCount
        this.saveWeeklyProblemsSolvedCount();
    }

    getWeeklyProblemSet() {
        return this.weeklyProblemSet
    }

    getWeeklyProblemsSolvedCount() {
        return this.weeklyProblemsSolvedCount
    }
}

const weeklyProblemsManger = new WeeklyProblemsManger()

module.exports = {
    weeklyProblemsManger
}