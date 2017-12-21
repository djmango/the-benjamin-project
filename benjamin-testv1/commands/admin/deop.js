const {
	Command
} = require('discord.js-commando');

module.exports = class SayCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'deop',
			group: 'admin',
			memberName: 'deop',
			description: 'Removes designated user from the admin list.',
			examples: ['deop @djmango']
		});
	}
	async run(msg) {
		let mentions = msg.mentions.users.array()[0];
		if (!mentions) return msg.reply('you must mention someone and not add any extra arguments!');
		mysqlConnection.query(`select * from op where userId=${msg.author.id} and serverId=${msg.guild.id}`, function (error, results, fields) {
			if (error) throw error;
			if (!results[0]) { //if it didnt work
				return msg.reply('You are not a bot admin.');
			}
			if (msg.author.id == botsudoid || msg.author.id == results[0].userId) { //if it did work
				mysqlConnection.query(`select * from op where userId=${mentions.id} and serverId=${msg.guild.id}`, function (error, results, fields) {
					if (error) throw error;
					if (!results[0]) { //if the user is not on the list
						return msg.reply(`${mentions.username} is not on the admin list!`);
					} else if (mentions.id == msg.guild.ownerID) {
						return msg.reply('You can not remove the server owner as admin!');
					}
					else { //if the user is on the list
						mysqlConnection.query(`delete from op where userId=${mentions.id}`, function (error, results, fields) {});
						return msg.reply(`Succesfully removed ${mentions.username} from the admin list!`);
					}
				});
			}
		});
	}
};