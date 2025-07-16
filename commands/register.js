const {SlashCommandBuilder, MessageFlags, PermissionsBitField } = require("discord.js")
const {registerUser} =require("./../db.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("add user to the system")
        .addStringOption(option =>
            option.setName("user_id")
                .setDescription("사용자 백준 아이디")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("user_name")
                .setDescription("사용자 이름")
                .setRequired(true)), 

    async execute(interaction) {
        const handle = interaction.options.getString("user_id");
        const name = interaction.options.getString("user_name");

        const interactionUser = await interaction.guild.members.fetch(interaction.user.id)

        if (interactionUser.permissions.has(PermissionsBitField.Flags.Administrator)) {
            await interaction.reply({ content: `${handle}님의 정보 저장 중...`, flags: MessageFlags.Ephemeral })
            registerUser(handle, name).then((res) => {
                if (res) {
                    interaction.followUp({ content: `${handle}님의 푼 문제 저장 완료`, flags: MessageFlags.Ephemeral });
                } else {
                    interaction.followUp({ content: `${handle}은 이미 등록하셨네요`, flags: MessageFlags.Ephemeral });
                }
            }).catch((err)=>{
                interaction.followUp({content:`문제 발생! 방장에게 간단한 상황설명과 에러 메세지를 보내주세요!\n error: ${err.message}`,flags: MessageFlags.Ephemeral })
            })
        } else {
            await interaction.reply({ content: "register 명령어의 권한이 없습니다!", flags: MessageFlags.Ephemeral })
        }

        
	}
};