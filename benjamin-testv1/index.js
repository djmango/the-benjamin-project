//apis
console.log("getting apis...");
global.Commando = require('discord.js-commando'); //butts
global.Discord = require('discord.js');
global.path = require('path');
global.fs = require('fs');
global.request = require('request');
global.ai = require('apiai');
global.crashreporter = require('crashreporter');
global.mysql = require('mysql');
global.striptags = require('striptags');
global.dateFormat = require('dateformat');
global.prettyMs = require('pretty-ms');
global.ud = require('urban-dictionary');
global.startTime = process.hrtime();
//pull keys file
const keys = JSON.parse(fs.readFileSync('./keys/keys.json')); //read all keys
//keys
console.log("pulling keys...");
if (keys.isdev == "true") global.token = keys.testdiscordtoken; //test discord api key
else global.token = keys.discordtoken; //discord api key
global.apiai = ai(keys.apiaitoken); //api.ai api key
global.yt_api_key = keys.youtubetoken; //youtube api key
global.botsudoid = keys.botsudo; //bot sudo id
//debug setup
if (keys.isdev == "true") global.prefix = "b!!"
else global.prefix = "b!"
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
		['general', 'general commands'],
		['admin', 'administration commands'],
		['wiki', 'wiki commands']
	])
	.registerDefaultGroups()
	.registerDefaultCommands()
	.registerCommandsIn(path.join(__dirname, 'commands'));
//ready?
client.on('ready', () => {
	//login messages
	console.log(`Logged in as ${client.user.tag}!`);
	//server map
	global.servers = (`Servers:\n${client.guilds.map(g => g.name).join("\n")}`);
	console.log(`Servers:\n${client.guilds.map(g => g.name).join("\n")}`);
	//update presense
	let localUsers = client.users.array().length;
	let updatePres = setInterval(function () {
		let localUsers = client.users.array().length;
		client.user.setPresence({
			game: {
				name: `${prefix}help | ${localUsers} users | goo.gl/eHFDzv`,
				type: 0
			}
		});
	}, 60000);
	updatePres;
	//update admins
	let newGuilds = client.guilds.array();
	for (let i = 0; i < newGuilds.length; i++) {
		mysqlConnection.query(`select * from op where userId=${newGuilds[i].ownerID} and serverId=${newGuilds[i].id}`, function (error, results, fields) {
			if (error) throw error;
			if (!results[0]) { //if the owner is not an admin
				mysqlConnection.query(`insert into op (userId, username, serverId) values (${newGuilds[i].ownerID}, '${newGuilds[i].owner.user.username}', ${newGuilds[i].id})`, function (error, results, fields) {
					return console.log(`Succesfully added ${newGuilds[i].owner.user.username} from ${newGuilds[i].name} to the admin list!`);
				});
			}
		});
	}
});

client.on('guildCreate', (guild) => { //new guild setup
	console.log(`joined guild ${guild.name}, initializing new guild setup`);
	mysqlConnection.query(`INSERT INTO op (userId, username, serverId) VALUES ('${guild.ownerID}', '${guild.owner.displayName}', '${guild.id}');`, function (error, results, fields) {
		if (error) throw error;
	});
	let localUsers = client.users.array().length;
	client.user.setPresence({
		game: {
			name: `${prefix}help | ${localUsers} users | goo.gl/eHFDzv`,
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