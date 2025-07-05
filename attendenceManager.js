const { getWeeklyAttendanceData, getUserDataFromDB, setWeeklyAttendanceData } = require("./db")

let attendanceManager = {
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
    }
}

module.exports = {
    attendanceManager
}