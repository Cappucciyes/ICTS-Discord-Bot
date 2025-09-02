const {SlashCommandBuilder, MessageFlags, PermissionsBitField} = require("discord.js")
const {db} = require("../components/db.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("log_user_info")
        .setDescription("logs currently saved user information")
        .addStringOption(option =>
            option.setName("user_id")
                .setDescription("사용자 백준 아이디")
                .setRequired(false)
        ),

    async execute(interaction) {
        const handle = interaction.options.getString("user_id") ?? db.getAllUserID();

        const interactionUser = await interaction.guild.members.fetch(interaction.user.id)

        //only allows when user entering command is an admin
        if (interactionUser.permissions.has(PermissionsBitField.Flags.Administrator)) {
            // if user inputted specific userID
            if (typeof handle === "string") {
                await interaction.reply({ content: `${handle}님의 정보:`, flags: MessageFlags.Ephemeral })
                let userData = db.getUserDataFromDB(handle)

                let infoString = []
                try{
                    if (userData) {
                        for (let [key, value] of Object.entries(userData["currentData"])) {
                            if (key == 'solved') continue
                            infoString.push(`${key}: ${value}`)
                        }
                        infoString.push(`${weeklySolved}: ${userData["stat"]["weeklySolvedCount"]}`)

                        await interaction.followUp({content: infoString.join('\n')})
                    } else {
                        await interaction.followUp({ content: `${handle}의 정보가 없어요!`, flags: MessageFlags.Ephemeral });
                    }
                }
                catch (err) {
                    interaction.followUp({content:`문제 발생! 방장에게 간단한 상황설명과 에러 메세지를 보내주세요!\n error: ${err.message}`,flags: MessageFlags.Ephemeral })
                }

            // if something went wrong, I would suspect tha `handle` section would be left blank
            } else if (typeof handle === "undefined") {
                await interaction.reply({ content: "userInfo 명령어 중 입력값에 문제가 생겼습니다", flags: MessageFlags.Ephemeral })

            // if nothing went wrong and user didn't input anything, then there would be a list of all users saved in `handle`
            } else if (typeof handle === "object") {
                
                await interaction.reply({ content: `모든 멤버의 정보`, flags: MessageFlags.Ephemeral })
                
                let infoString = [];
                for (let userID of handle) {
                    infoString.push(`\n${userID}님의 정보:`) 
                    let userData = db.getUserDataFromDB(userID)
                    try {
                        if (userData) {
                            for (let [key, value] of Object.entries(userData["currentData"])) {
                                if (key == 'solved') continue
                                infoString.push(`${key}: ${value}`)
                            }
                            infoString.push(`${weeklySolved}: ${userData["stat"]["weeklySolvedCount"]}`)
                            
                        } else {
                            await interaction.followUp({ content: `${userID}의 정보가 없어요!`, flags: MessageFlags.Ephemeral });
                        }
                    } catch (err){
                        interaction.followUp({content:`문제 발생! 방장에게 간단한 상황설명과 에러 메세지를 보내주세요!\n error: ${err.message}`,flags: MessageFlags.Ephemeral })
                    }
                }

                await interaction.followUp({content: infoString.join('\n')})
            }

        } else {
            await interaction.reply({ content: "update 명령어의 권한이 없습니다!", flags: MessageFlags.Ephemeral })
        }
	}
};