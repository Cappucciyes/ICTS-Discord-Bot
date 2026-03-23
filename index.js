// 1. 주요 클래스 가져오기
const fs = require('fs')
const path = require('path')
const cron = require('node-cron')
const { Client, Events, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
const { db } = require("./components/db.js")
const { attendanceManager } = require("./components/attendanceManager.js")
const { weeklyProblemsManger } = require("./components/weeklyProblemsManager.js")
const { writeJSON, readJSON } = require("./utils/utilsIO.js")

// const { getJson, getRecentSolved, firstJoin, getNewlySolved } = require('./baekjoon.js');
require('dotenv').config();
const token = process.env.DISCORD_TOKEN;
const serverID = process.env.SERVER_ID;
const channelID = process.env.CHANNEL_ID
const userDataPath = process.env.USERS_DATA_DIR

let channel;

// 2. 클라이언트 객체 생성 (Guilds관련, 메시지관련 인텐트 추가)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.commands = new Collection();

const commandsFolder = process.env.COMMANDS_DIR
const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
// loading commands to the  client
for (const file of commandFiles) {
    const commandFilePath = commandsFolder + file

    const command = require(commandFilePath)

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command)
    } else {
        console.log(`[WARNING] The command at ${commandFilePath} is missing a required "data" or "execute" property.`)
    }
}

// once client is loaded
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    channel = client.channels.cache.get(serverID)
});

client.on(Events.InteractionCreate, (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        command.execute(interaction).catch((err) => { console.log(err.message) })
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
        } else {
            interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
        }
    }
})

// schedule to update user everyday
cron.schedule('59 59 23 * * *', () => {
    let updatingTime = new Date();
    let updatingTimeFixed = new Date(updatingTime.getFullYear(), updatingTime.getMonth(), updatingTime.getDate(), 23, 59, 59)
    let toUpdate = db.getAllUserID();

    client.channels.fetch(channelID).then((foundChannel) => {
        foundChannel.send({ content: updatingTime.toString() })
    })

    let loggerMessage = []

    Promise.all(toUpdate.map(userID => db.updateUser(userID, updatingTimeFixed)))
        .then((res) => {
            for (let userID of toUpdate) {
                let userData = db.getUserDataFromDB(userID);
                loggerMessage.push("refactor test : updating " + userID + `; solved ${userData['stat']['weeklySolvedCount']} problems`)
            }

            let message = loggerMessage.join('\n')
            return client.channels.fetch(channelID).then((foundChannel) => {
                foundChannel.send({ content: message })
            }).catch((err) => {
                console.log("failed to send daily Reports: " + err)
            })
        })
        .then((res) => {
            // on sundays, make reports and reset streak
            if (updatingTimeFixed.getDay() === 0) {
                //weekly attendance
                console.log("making weekly reports")
                let userList = db.getAllUserID();

                let weeklyAttendance = attendanceManager.getWeeklyAttendanceData()
                let weeklyAttendanceByHandle = userList.filter((user) => { return weeklyAttendance[user] })
                let weeklyAttendanceByName = []
                for (let handle of weeklyAttendanceByHandle) {
                    let userData = db.getUserDataFromDB(handle);
                    weeklyAttendanceByName.push(`${userData['startData']['name']}: 총 ${userData['stat']['weeklySolvedCount']} 문제`)
                }

                weeklyAttendanceByName.sort()
                let message = "refactor test : 이번 주 3문제 이상 푼 멤버들!\n" + weeklyAttendanceByName.join("\n") + "\n\n모두 수고하셨습니다!\n다음 주도 화이팅!"
                // make weekly solved count stuff here

                client.channels.fetch(channelID).then((foundChannel) => {
                    foundChannel.send({ content: message })
                }).catch((err) => {
                    console.log("failed to send weekly Reports: " + err)
                })

                // reset solve count
                for (let user of userList) {
                    console.log("resetting weeklySolvedCount: " + user)
                    let userData = db.getUserDataFromDB(user);
                    userData["stat"]["weeklySolvedCount"] = 0

                    writeJSON(userDataPath + `${user}.json`, userData);
                    attendanceManager.resetWeeklyAttendance(user);

                    let updatedUserData = db.getUserDataFromDB(user);
                    console.log(`updated solvedCount ${user}: ${updatedUserData["stat"]["weeklySolvedCount"]}`)
                }
            }
        })

}, {
    timezone: "Asia/Seoul"
});

// 5. 시크릿키(토큰)을 통해 봇 로그인 실행
client.login(token)