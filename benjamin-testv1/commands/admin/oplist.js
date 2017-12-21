const {
	Command
} = require('discord.js-commando');

module.exports = class SayCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'oplist',
			group: 'admin',
			memberName: 'oplist',
			description: 'Lists all users in the admin list for your server.',
			examples: ['oplist']
		});
	}
	async run(msg) {
		mysqlConnection.query(`select username from op where serverId=${msg.guild.id}`, function(error, results, fields) {
			if (error) throw error;
			let admins = "";
			for (var i in results) admins = admins + "\n" + results[i].username;
			return msg.channel.send(`Admins: ${admins}`);
		})
	}
};