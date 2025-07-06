// 1. 주요 클래스 가져오기
const fs = require('fs')
const path = require('path')
const { Client, Events, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
// const { getJson, getRecentSolved, firstJoin, getNewlySolved } = require('./baekjoon.js');
const { registerUser, updateUser } = require("./db.js");
require('dotenv').config();
const token = process.env.DISCORD_TOKEN;
const serverID = process.env.SERVER_ID;

let channel

// 2. 클라이언트 객체 생성 (Guilds관련, 메시지관련 인텐트 추가)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ] 
});

// test to check if I can add custom function to Client Object
// client.testFunc = function (repeat) {
//         for (let i = 0 ; i < repeat; i ++)
//             console.log("hi")
//     }

// adding commands
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

// 5. 시크릿키(토큰)을 통해 봇 로그인 실행
client.login(token)


// function main() {
//     let discordBot = new DiscordBot();
// }