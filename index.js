// 1. 주요 클래스 가져오기
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { getJson, getRecentSolved, firstJoin, getNewlySolved } = require('./baekjoon.js');
require('dotenv').config();
const token = process.env.DISCORD_TOKEN;
const serverID = process.env.SERVER_ID;

let updateUser = true;
let currentActiveUser = {}

let inter;
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
    if (message.content.startsWith('/최근푼')) {
        message.reply('bbbb');

    }

    if (message.content.startsWith("/모두확인")) {
        checkAllUser();
    }


    if (message.content.startsWith("/등록")) {
        const parts = message.content.split(" ");
        if (parts.length < 2) {
            return message.reply("백준 ID를 입력해주세요. 예: `/message rlatjwls3333`");
        }
        const handle = parts[1];

        userRegister(handle);
        message.reply(`${handle}님의 문제 풀이 기록 저장 중...`);
        message.reply(`${handle}님의 푼 문제 저장 완료`);
    }

    if (message.content.startsWith("/갱신")) {
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

    if (message.content == "말해봐") {
        inter = setInterval(() => {
            channel.send('안녕? 테스트 메시지야!');
        }, 1000);
    }

    if (message.content == "그만") {
        clearInterval(inter);
    }
})

// 5. 시크릿키(토큰)을 통해 봇 로그인 실행
client.login(token)


function checkAllUser() {
    if (updateUser) {
        currentActiveUser = getJson();
        updateUser = false
    }

    for (let user in currentActiveUser) {
        const recent = getRecentSolved(user);

        recent.then((res) => {
            if (recent === '') {
                reject(new Error());
            }

            let msg = '최근 푼 문제 : \n';
            for (const problem of res) {
                msg += `• [${problem.rank}] ${problem.title} (${problem.url})\n`;
            }

            channel.send(msg);
        }).catch((err) => {
            channel.send("제대로된 핸들을 입력하세요")
        })
    }
}

function userRegister(handle) {
    firstJoin(handle).then((res) => {
        console.log(res)
        channel.send(`Welcome: ${handle}`)
    })
}
