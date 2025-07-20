// 1. 주요 클래스 가져오기
const fs = require('fs')
const path = require('path')
const cron = require('node-cron')
const { Client, Events, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
const { getAllUserID, updateUser, getUserDataFromDB, writeJSON, getWeeklyAttendanceData } = require('./db');
// const { getJson, getRecentSolved, firstJoin, getNewlySolved } = require('./baekjoon.js');
require('dotenv').config();
const token = process.env.DISCORD_TOKEN;
const serverID = process.env.SERVER_ID;
const channelID = process.env.CHANNEL_ID

let channel

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
const commandFiles = fs.readdirSync(commandsFolder).filter(file=> file.endsWith('.js'));

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

client.on(Events.InteractionCreate, (interaction)=> {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		command.execute(interaction).catch((err)=>{console.log(err.message)})
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}



})

// schedule to update user everyday at 6AM
cron.schedule('59 59 23 * * *', () => {
    let updatingTime = new Date();
    let updatingTimeFixed = new Date(updatingTime.getFullYear(), updatingTime.getMonth(), updatingTime.getDate(), 23, 59, 59)
    let toUpdate = getAllUserID();
    for (let userID of toUpdate) {
        console.log(`updating ${userID}\n`)
        updateUser(userID, updatingTimeFixed)
    }

    // on sundays, make reports and reset streak
    if (updatingTime.getDay() === 0) { 
        //weekly attendance
        let userList = getAllUserID();
        let userDataPath = process.env.USERS_DATA_DIR

        let weeklyAttendance = getWeeklyAttendanceData()
        let weeklyAttendanceByHandle = userList.filter((user) => {return weeklyAttendance[user]})
        let weeklyAttendanceByName= []
        for (let handle of weeklyAttendanceByHandle) {
            let userData = getUserDataFromDB(handle);
            weeklyAttendanceByName.push(`${userData['startData']['name']}: 총 ${userData['stat']['weeklySolvedCount']} 문제`)
        }

        weeklyAttendanceByName.sort()
        let message = "이번 주 3문제 이상 푼 멤버들!\n" + weeklyAttendanceByName.join("\n") + "\n\n모두 수고하셨습니다!\n다음 주도 화이팅!"

        client.channels.fetch(channelID).then((foundChannel)=>{
            foundChannel.send({content: message})
        }).catch((err) => {
            console.log("failed to send weekly Reports: " + err)
        })
 
        for (let user of userList) {
            let userData = getUserDataFromDB(user);
            userData["stat"]["weeklySolvedCount"] = 0

            writeJSON(userDataPath + `${user}.json`, userData);
        }
    }
}, {
    timezone: "Asia/Seoul"
});


// 5. 시크릿키(토큰)을 통해 봇 로그인 실행
client.login(token)

