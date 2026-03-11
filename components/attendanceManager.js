const { writeJSON, readJSON } = require("../utils/utilsIO.js")
const { eventHandler } = require("../utils/eventHandler.js")
const DATABASE_DIR = process.env.DATABASE_DIR
const USERS_DATA_DIR = process.env.USERS_DATA_DIR

class AttendanceManager {
    constructor() {
        this.attendancePath = DATABASE_DIR + 'weeklyAttendance.json'
        this.attendanceData = readJSON(this.attendancePath)

        eventHandler.on("user:added", (newUser) => {
            let userID = newUser.userID;

            if (this.attendanceData.hasOwnProperty(userID)) {
                console.error(`${userID} already exists in weeklyAttendance`)
                return false
            } else {
                this.attendanceData[userID] = false
                this.setWeeklyAttendanceData(this.attendanceData)
                return true
            }
        })

        eventHandler.on("user:deleted", (deletedUser) => {
            let userID = deletedUser.userID;

            if (this.attendanceData.hasOwnProperty(userID)) {
                return this.deleteUser(userID)
            } else {
                console.error(`${userID} does not exist in weeklyAttendance`)
                return false
            }
        })

        eventHandler.on("user:solvedProblemUpdated", (args) => {
            console.log("heard event user:solvedProblemUpdated")
            let userData = args.userData
            let userID = args.userID

            this.updateAttendance(userID, userData)
        })
    }

    // changing data
    // WIP
    resetWeeklyAttendance(userID) {
        console.log("resetting weeklyAttendance: " + userID)

        if (!this.attendanceData.hasOwnProperty(userID)) {
            console.error(`${userID} does not exists in weeklyAttendance`)
            return false
        } else if (this.attendanceData[userID]) {
            this.attendanceData[userID] = false
            this.setWeeklyAttendanceData(this.attendanceData)
        }

        return true
    }

    updateAttendance(userID, userData) {
        if (!this.attendanceData.hasOwnProperty(userID)) {
            console.error(`${userID} does not exists in weeklyAttendance`)
            return false
        } else if (!this.attendanceData[userID]) {
            // check if weeklySolvedCount is more 3 or greater
            if (userData.stat.weeklySolvedCount >= 3) {
                this.attendanceData[userID] = true
                this.setWeeklyAttendanceData(this.attendanceData)
            }
        }

        return true
    }

    setWeeklyAttendanceData(updatedInfo) {
        writeJSON(this.attendancePath, updatedInfo)
    }

    // reading and getting data

    getWeeklyAttendanceData() {
        return this.attendanceData
    }

    deleteUser(userID) {
        if (this.attendanceData.hasOwnProperty(userID)) {
            console.log(`deleting ${userID}`)

            delete this.attendanceData[userID]
            this.setWeeklyAttendanceData(this.attendanceData)
            return true;
        } else {
            console.error(`${userID} does not exists in attendence`)
            return false
        }
    }
}

let attendanceManager = new AttendanceManager();

module.exports = {
    attendanceManager
}