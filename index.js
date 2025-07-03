// 1. 주요 클래스 가져오기
const { Client, Events, GatewayIntentBits } = require('discord.js');
// const { getJson, getRecentSolved, firstJoin, getNewlySolved } = require('./baekjoon.js');
const { registerUser } = require("./db.js")
require('dotenv').config();
// console.log(process.env)
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

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    channel = client.channels.cache.get(serverID)
});

// 4. 누군가 ping을 작성하면 pong으로 답장한다.
client.on('messageCreate', (message) => {
    if (message.content.startsWith("/register")) {
        const parts = message.content.split(" ");
        if (parts.length < 2) {
            return message.reply("백준 ID를 입력해주세요. 예: `/register rlatjwls3333`");
        }
        const handle = parts[1]

        message.reply(`${handle}님의 정보 저장 중...`);
        registerUser(handle).then((res) => {
            if (res) {
                message.reply(`${handle}님의 푼 문제 저장 완료`);
            } else {
                message.reply(`${handle}은 이미 등록하셨네요`);
            }
        }).catch((err)=>{
            message.reply("문제 발생! 방장에게 간단한 상황설명과 에러 메세지를 보내주세요!")
            message.reply("error: " + err.message);
        })
    }

    if (message.content.startsWith("/update")) {
        const parts = message.content.split(" ");
        if (parts.length < 2) {
            return message.reply("백준 ID를 입력해주세요. 예: `/message rlatjwls3333`");
        }
        const handle = parts[1];

        message.reply(`${handle}님의 문제 풀이 기록 저장 중...`);
        getNewlySolved(handle).then((res) => {
            message.reply(`${handle}님의 푼 문제 저장 완료`);
        }).catch((err) => {
            console.log("갱신 실패: ")
            console.log(err.message)
        })
    }
})

// 5. 시크릿키(토큰)을 통해 봇 로그인 실행
client.login(token)