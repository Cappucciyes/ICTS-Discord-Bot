const {writeJSON, readJSON} = require("../utils/utilsIO.js")
const {eventHandler }= require("../utils/eventHandler.js")
const DATABASE_DIR= process.env.DATABASE_DIR
const USERS_DATA_DIR=process.env.USERS_DATA_DIR

class AttendanceManager {
    constructor () {
        this.attendancePath = DATABASE_DIR + 'weeklyAttendance.json'        
        
        eventHandler.on("user:added", (newUser) => {
            let userID = newUser.userID;

            let weeklyAttendance = this.getWeeklyAttendanceData() 

            if (weeklyAttendance.hasOwnProperty(userID)) {
                console.error(`${userID} already exists in weeklyAttendance`)
                return false
            } else {
                weeklyAttendance[userID] = false 
                this.setWeeklyAttendanceData(weeklyAttendance)
                return true
            } 
        })

        eventHandler.on("user:solvedProblemUpdated", (args) => {
            //implement
            console.log("heard event user:solvedProblemUpdated")
            let userData = args.userData
            let userID = args.userID

            this.updateAttendance(userID, userData)
        })
    }

    // changing data

    resetWeeklyAttendance (userID) {
        let weeklyAttendance = this.getWeeklyAttendanceData() 

        if (!weeklyAttendance.hasOwnProperty(userID)) {
            console.error(`${userID} does not exists in weeklyAttendance`)
            return false
        } else if (weeklyAttendance[userID]) {
            weeklyAttendance[userID] = false 
            this.setWeeklyAttendanceData(weeklyAttendance) 
        } 

        return true   
    } 

    updateAttendance(userID, userData) {
        let weeklyAttendance = this.getWeeklyAttendanceData() 

        if (!weeklyAttendance.hasOwnProperty(userID)) {
            console.error(`${userID} does not exists in weeklyAttendance`)
            return false
        } else if (!weeklyAttendance[userID]) {
            // check if weeklySolvedCount is more 3 or greater
            if(userData.stat.weeklySolvedCount >= 3) {
                weeklyAttendance[userID] = true

                this.setWeeklyAttendanceData(weeklyAttendance)
            } 
        } 

        return true
    }

    setWeeklyAttendanceData(updatedInfo) {
        writeJSON(this.attendancePath, updatedInfo)
    }

    // reading and getting data

    getWeeklyAttendanceData() {
        return readJSON(this.attendancePath)
    }

    readWeeklyAttendance(userID) {
        let weeklyAttendance = this.getWeeklyAttendanceData() 
        return weeklyAttendance[userID]
    }
}

let attendanceManager = new AttendanceManager();

module.exports = {
    attendanceManager
}