require('dotenv').config();
const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require("discord.js")
const { eventHandler } = require("../utils/eventHandler.js");
const EVENT_NAME = require("../" + process.env.EVENT_NAME_PATH);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reassign-weekly-problem")
        .setDescription("reassign weekly problems")
        .addStringOption(option =>
            option.setName("problems")
                .setDescription("list of space-separated integers")
                .setRequired(true)),

    async execute(interaction) {
        let input = interaction.options.getString(`problems`)
        console.log(input)
        const interactionUser = await interaction.guild.members.fetch(interaction.user.id)

        //only allows when user entering command is an admin
        if (interactionUser.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const regex = /^\d+(\s+\d+)*$/;
            if (input.trim() === "") {
                await interaction.reply({ content: `비어있는 문자열입니다\n`, flags: MessageFlags.Ephemeral })
                console.log("empty String");
            } else if (!regex.test(input.trim())) {
                await interaction.reply({
                    content: `올바르지 않은 문자열입니다 (list of space-separated integers)\n`,
                    flags: MessageFlags.Ephemeral
                })
                console.log("wrong string");
            } else {
                await interaction.reply({ content: `이번주 문제들:\n`, flags: MessageFlags.Ephemeral })
                let newWeeklyQuestions = new Set(input.split(' ').map(Number));
                let infoString = []
                for (let problem_i of newWeeklyQuestions) infoString.push(problem_i.toString());
                await interaction.followUp({ content: infoString.join('\n'), flags: MessageFlags.Ephemeral })

                eventHandler.emit(EVENT_NAME.PROBLEMS_WEEKLY_PROBLEMS_REASSIGNED, {
                    newWeeklyQuestions: newWeeklyQuestions
                })
            }
        } else {
            await interaction.reply({ content: "reassign-weekly-problems 명령어의 권한이 없습니다!", flags: MessageFlags.Ephemeral })
        }
    }
};
