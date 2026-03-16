const { readJSON, writeJSON } = require("../utils/utilsIO");
const { eventHandler } = require("../utils/eventHandler.js")
const DATABASE_DIR = process.env.DATABASE_DIR
const { db } = require("./db.js")

class WeeklyProblemsManger {
    constructor() {
        this.weeklyProblemsSolvedCountPath = DATABASE_DIR + 'weeklyAttendance.json'
        this.weeklyProblems = []
        this.weeklyProblemsSolvedCount = readJSON(weeklyProblemsSolvedCountPath);
    }

    reassignWeeklyProblems(weeklyProblems) {
        this.weeklyProblems = weeklyProblems
        let users = db.getAllUserID();
        let weeklyProblemsSet = new Set(this.weeklyProblems)
        for (let user in users) {
            userData = db.getUserDataFromDB(user)

            if (userData === null) {
                console.log(`${user} does not exists`)
                continue;
            }
            userSolved = new Set(userData["currentData"]["solved"])
            currentSolvedCount = weeklyProblemsSet.intersection(userSolved).size

            this.weeklyProblemsSolvedCount[userData] = currentSolvedCount
        }
        this.saveWeeklyProblemsSolvedCount();
    }

    saveWeeklyProblemsSolvedCount() {
        writeJSON(this.weeklyProblemsSolvedCountPath, this.weeklyProblemsSolvedCount)
    }
}