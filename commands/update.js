const {SlashCommandBuilder, MessageFlags} = require("discord.js")
const {updateUser, attendanceManager} =require("./../db.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("update")
        .setDescription("update user data in the system")
        .addStringOption(option =>
            option.setName("user_id")
                .setDescription("사용자 백준 아이디")
                .setRequired(true)),

    async execute(interaction) {
        const handle = interaction.options.getString("user_id");
        await interaction.reply({ content: `${handle}님의 정보 갱신 중...`, flags: MessageFlags.Ephemeral })
        updateUser(handle).then((res) => {
            if (res) {
                interaction.followUp(`${handle}님의 정보 갱신 완료!\n 이번 주 ${res["stat"]["weeklySolvedCount"]}문제를 푸셨습니다!\n 총 ${res["currentData"]["solvedCount"]} 문제를 푸셨습니다!`);
            } else {
                interaction.followUp({ content: `${handle}은 이미 등록하셨네요`, flags: MessageFlags.Ephemeral });
            }
        }).catch((err)=>{
            interaction.followUp({content:`갱신 중 문제 발생! 방장에게 간단한 상황설명과 에러 메세지를 보내주세요!\n error: ${err.message}`,flags: MessageFlags.Ephemeral })
        })
	}
};