//apis
console.log("getting apis...");
global.Commando = require('discord.js-commando');
global.Discord = require('discord.js');
global.path = require('path');
global.fs = require('fs');
global.request = require('request');
global.ai = require('apiai');
global.crashreporter = require('crashreporter');
global.mysql = require('mysql'); //rekt nerd
global.startTime = process.hrtime();
//pull keys file
const keys = JSON.parse(fs.readFileSync('./keys/keys.json')); //read all keys
//keys
console.log("pulling keys...");
global.token = keys.discordtoken; //discord api key
global.apiai = ai(keys.apiaitoken); //api.ai api key
global.yt_api_key = keys.youtubetoken; //youtube api key
global.botsudoid = keys.botsudo; //bot sudo id
//debug setup
if (keys.dev == "true") global.prefix = "m!!"
else global.prefix = "m!"

//vars
//prob nothing here for a while, everything is locally defined

//functions
console.log("initializing functions...");
//wow this is lonely

//connect to mysql server
console.log("connecting to mysql server..");
let db_config = ({
	host: keys.mysqlip,
	user: 'root',
	password: keys.mysql,
	database: 'testv1'
});

function handleDisconnect() {
	const keys = JSON.parse(fs.readFileSync('./keys/keys.json')); //read all keys
	global.mysqlConnection = mysql.createConnection(db_config); // Recreate the connection, since the old one cannot be reused.
	mysqlConnection.connect(function (err) { // The server is either down
		if (err) { // or restarting (takes a while sometimes).
			console.log('error when connecting to db:', err);
			setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
		} // to avoid a hot loop, and to allow our node script to
		// process asynchronous requests in the meantime.
		else {
			console.log("successfully connected to mysql server!");
		}
	});

	mysqlConnection.on('error', function (err) {
		console.log('db error', err);
		if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
			handleDisconnect(); // lost due to either server restart, or a
		} else { // connnection idle timeout (the wait_timeout
			throw err; // server variable configures this)
		}
	});
}

handleDisconnect();

//bot settings
console.log("configuring commando...");
//make client global
global.client = new Commando.Client({
	owner: botsudoid,
	commandPrefix: prefix,
	disableEveryone: true,
	unknownCommandResponse: false
});
global.discordClient = new Discord.Client();
//command groups
client.registry
	.registerDefaultTypes()
	.registerGroups([
		['general', 'general commands']
	])
	.registerDefaultGroups()
	.registerDefaultCommands()
	.registerCommandsIn(path.join(__dirname, 'commands'));
//ready?
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	global.servers = (`Servers:\n${client.guilds.map(g => g.name).join("\n")}`);
	console.log(`Servers:\n${client.guilds.map(g => g.name).join("\n")}`);
	let localUsers = client.users.array().length;
	let updatePres = setInterval(function () {
		let localUsers = client.users.array().length;
		client.user.setPresence({
			game: {
				name: `${prefix}help | ${localUsers} users | goo.gl/qoVTdx`,
				type: 0
			}
		});
	}, 60000);
	updatePres;
});

client.on('guildCreate', (guild) => { //new guild setup
	console.log(`joined guild ${guild.name}, initializing new guild setup`);
	mysqlConnection.query(`INSERT INTO op (userId, username, serverId)
VALUES ('${guild.ownerID}', '${guild.owner.displayName}', '${guild.id}');`, function (error, results, fields) {
		if (error) throw error;
	});
	let localUsers = client.users.array().length;
	client.user.setPresence({
		game: {
			name: `${prefix}help | ${localUsers} users | goo.gl/qoVTdx`,
			type: 0
		}
	});

});

//handlers for errors and disconnects
client.on('disconnect', function (event) {
	if (event.code != 1000) {
		console.log("Discord client disconnected with reason: " + event.reason + " (" + event.code + "). Attempting to reconnect in 6s...");
		setTimeout(function () {
			client.login(token);
		}, 6000);
	}
});

client.on('error', function (err) {
	console.log("Discord client error '" + err.code + "'. Attempting to reconnect in 6s...");
	client.destroy();
	setTimeout(function () {
		client.login(token);
	}, 6000);
});

process.on('rejectionHandled', (err) => {
	console.log(err);
	console.log("an error occurred. reconnecting...");
	client.destroy();
	setTimeout(function () {
		client.login(token);
	}, 2000);
});

process.on('exit', function () {
	mysqlConnection.end();
	client.destroy();
});

client.login(token);