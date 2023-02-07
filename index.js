const fs=require("fs");
const fetch=require("node-fetch");
const download = require('image-downloader');
const {JSDOM}=require("jsdom");
var kaProgramRegex=/\bhttps?:\/\/(?:www\.)?khanacademy\.org\/(?:cs|computer-programming)\/[a-z,\d,-]+\/\d{1,16}\b/ig;
const cleverbot=require("cleverbot-free");
var ml = require("ml-sentiment")();
const axios = require('axios');

let defaultGuild={
	"webhook":{
		"custom":false,
		"username":"Kestron-Tron",
		"avatar":"https://raw.githubusercontent.com/SMOMusic/Kestron-Tron/main/CyberBario.png"
	},
	"counting":{
		"channel":""
	},
	"starboard":{
		"active":false,
		"emote":"⭐",
		"threshold":3,
		"posted":{},
		"channel":null
	},
	"filter":{
		"badWords":[],
		"censor":true,
		"filter":false
	},
	"reactRoles":{
		"messageIds":[]
	},
	"stories":{
		"active":false,
		"channel":null,
		"announceChannel":null,
		"story":[],
		"lastContrib":"",
		"nextTurn":null,
		"authors":[],
		"banned":[]
	},
	"logs":{
		"log":false,
		"channel":null,
		"userJoins":false,
		"roleChanges":false,
		"msgDelete":false,
		"msgEdit":false,
		"channelCreate":false,
		"channelEdit":false,
		"userEdit":false,
		"serverEdit":false
	},
	"allocated":true,
	"prefix":"~"
};
let defaultMember={
	"names":[],
	"vc":{

	},
	"spamFilter":{

	},
	"allocated":true
};

let rac={
	board:[],
	lastPlayer:"Nobody",
	timePlayed:0,
	players:[],
	icons:"!@#$%^&*()_+=[]{};':`~,./<>?0123456789"
};
function getRACBoard(){
	let racChars="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let mess=[];
	let temp="  ";
	for(var i=0;i<rac.board.length;i++){
		mess.push(racChars[i]+" |"+rac.board[i].join("|")+"|");
		temp+=" "+racChars[i];
	}
	mess.unshift(temp);
	mess="Last Moved: <@"+rac.lastPlayer+"> "+(rac.timePlayed!==0?"<t:"+Math.round(rac.timePlayed/1000)+":R>":"")+"```\n"+mess.join("\n")+"```";
	mess+="\nPlayers: ";
	for(var i=0;i<rac.players.length;i++){
		mess+="\n<@"+rac.players[i]+">: `"+rac.icons[i]+"`";
	}
	return "**Rows & Columns**\n"+mess;
}
function readRACBoard(toRead){
	rac.lastPlayer=toRead.split("<@")[1].split(">")[0];
	try{
		rac.timePlayed=Math.round((+toRead.split("<t:")[1].split(":R>")[0])*1000);
	}
	catch(e){
		rac.timePlayed=0;
	}

	let board=toRead.split("```\n")[1].split("```")[0];
	let rows=board.split("\n");
	rac.rowsActive=rows[0].replaceAll(" ","");
	rows.splice(0,1);
	for(var i=0;i<rows.length;i++){
		rows[i]=rows[i].slice(3,rows[i].length);
		rows[i]=rows[i].replaceAll("|","");
		rows[i]=rows[i].split("");
	}
	rac.board=rows;

	let tmpPlayers=toRead.split("Players: \n")[1].split("<@");
	rac.players=[];
	for(var i=1;i<tmpPlayers.length;i++){
		rac.players.push(tmpPlayers[i].split(">")[0]);
	}
}
function scoreRows(game, char) {
	var score = 0;
	game.forEach(row => {
		var search = char.repeat(row.length);
		while (search.length>2 && row) {
			if (row.includes(search)) {
				row = row.substring(0, row.indexOf(search)) + row.substring(row.indexOf(search) + search.length);
				score += search.length-2;
			} else {
				search = search.substring(1);
			}
		}
	})
	return score;
}
function rotateGame(game) {
	var newGame = []
	for (var i = 0; i < game.length; i++) {
		var newCol = "";
		for (var j = 0; j < game.length; j++) {
			newCol += game[j][i];
		}
		newGame.push(newCol);
	}
	return newGame;
}
function score(game, char) {
	var score = scoreRows(game, char);
	score += scoreRows(rotateGame(game), char);
	return score;
}
function tallyRac(){
	let scores=[];/*
	let rowOn=0;
	for(var k=0;k<rac.players.length;k++){
		scores[k]=0;
		for(var i=0;i<rac.board.length;i++){
			rowOn=0;
			for(var j=0;j<rac.board[i].length;j++){
				if(rac.board[i][j]===rac.icons[k]){
					rowOn++;
				}
				else{
					if(rowOn>=3) scores[k]+=rowOn-2;
					rowOn=0;
				}
			}
		}
		for(var i=0;i<rac.board[0].length;i++){
			rowOn=0;
			for(var j=0;j<rac.board.length;j++){
				if(rac.board[j][i]===rac.icons[k]){
					rowOn++;
				}
				else{
					if(rowOn>=3) scores[k]+=rowOn-2;
					rowOn=0;
				}
			}
		}
	}*/
	for(var i=0;i<rac.players.length;i++){
		scores[i]=score(rac.board,rac.icons[i])
	}

	let mess=[];
	let temp="  ";
	let racChars="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	for(var i=0;i<rac.board.length;i++){
		mess.push(racChars[i]+" |"+rac.board[i].join("|")+"|");
		temp+=" "+racChars[i];
	}
	mess.unshift(temp);
	let tmpPlays=rac.players.slice(0);
	for(var i=scores.length-1;i>-1;i--){
		for(var j=scores.length-1;j>-1;j--){
			if(scores[j]>scores[i]){
				scores.splice(i,1);
				tmpPlays.splice(i,1);
				j=-1;
			}
		}
	}
	mess="Winner: <@"+tmpPlays.join(">, <@")+">```\n"+mess.join("\n")+"```";
	mess+="\nPlayers: ";
	for(var i=0;i<rac.players.length;i++){
		mess+="\n<@"+rac.players[i]+">: `"+rac.icons[i]+"`";
	}
	mess="**Rows & Columns**\n"+mess;
	return mess;
}
async function load(){
	await fetch("https://storage.kestron.repl.co/getFile?file=storage.json").then(d=>d.text()).then(d=>{
		fs.writeFileSync("./storage.json",d);
	});
}
load();
let storage=require("./storage.json");
async function save(){
	await fs.writeFileSync('./storage.json',JSON.stringify(storage));
	fs.readFile('./storage.json', 'utf-8', (err, data) => {
		axios.post('https://storage.kestron.repl.co/saveFile?path=storage.json&token='+process.env["pass"], {body:data});
	});
}
save();
function err(error){
	console.log(error);
}

const wyrUrl = 'https://would-you-rather.p.rapidapi.com/wyr/random';
const wyrOptions = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': '7bd6392ac6mshceb99882c34c39cp16b90cjsn985bc49d5ae1',
    'X-RapidAPI-Host': 'would-you-rather.p.rapidapi.com'
  }
};

const { Client, Collection, Intents, Message,MessageEmbed, WebhookClient,MessageActionRow,MessageButton,Modal} = require('discord.js');
const Discord = require('discord.js');
const { defaultMaxListeners } = require("stream");
const { channel } = require("diagnostics_channel");
const client = new Discord.Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION','ADMINISTRATOR','GUILD_MEMBER','CHANNEL','USER'],
    intents: Object.keys(Intents.FLAGS)
});
function callHome(cont){
	//client.users.cache.get("949401296404905995").send(cont);
}

client.once("ready",()=>{
	console.log("3.0 Online");
	//callHome("Restarted at "+new Date().toString());
});
client.on("messageCreate",async msg=>{
	try{
	if(msg.author.bot){
		return;
	}
	let id="0";
	try{
		id=msg.guild.id;
	}
	catch(e){
		id="0";
	}
	try{
		if(!storage[id].allocated){
			storage[id]=defaultGuild;
		}
	}
	catch(e){
		storage[id]=defaultGuild;
	}
	function perms(perm,ret,me){
		let tof;
		if(id==="0"&&!me){
			if(ret){
				msg.reply("Whoops! Can't do that in DMs!");
			}
			return msg.member.id==="949401296404905995";
		}
		else if(id==="0"){
			msg.reply("Whoops! I can't do that in DMs!");
			return false;
		}
		if(perm!=="Kestron"){
			tof=msg.member.permissions.has(perm)||msg.member.id==="949401296404905995";
		}
		else{
			tof=msg.member.id==="949401296404905995";
		}
		if(ret&&!tof&&!me){
			msg.reply("Whoops! This command needs you to have the following permission: `"+perm+"`.");
		}
		if(me){
			try{
				tof=msg.guild.me.permissions.has(perm)||msg.guild.me.permissions.has("ADMINISTRATOR");
				if(ret&&!tof){
					msg.reply("Whoops! I don't have suifficient permissions for this action! I need the `"+perm+"` permission to do that.");
				}
			}
			catch(e){return false;}
		}
		return tof;
	}
	async function sendMsg(what,mimic){
		if(""+what===what) what={content:what};
		if(mimic){
			let color = msg.member.displayHexColor;
			
			what.avatarURL=msg.member.displayAvatarURL();
			what.username=msg.member.displayName;
			what.accent=color;

			if(perms("MANAGE_WEBHOOKS",false,true)){
				const webhooks = await msg.channel.fetchWebhooks();
				const webhook = webhooks.find(wh => wh.token);
				if (!webhook) {
					msg.channel.createWebhook('Kestron-Tron', {
						avatar: 'https://raw.githubusercontent.com/SMOMusic/Kestron-Tron/main/CyberBario.png',
					})
					msg.channel.send("Channel readied. Use the command again if the necessary info is not present.\n\n"+(what.content?what.content:what));
					return;
				}
				webhook.send(what);
			}
			else{
				msg.channel.send(what);
			}
		}
		else{
			if(storage[id].webhook.custom){

			}
			else{
				msg.channel.send(what);
			}
		}
	}

	if(id!=="0"/*&&!perms("MANAGE_MESSAGES",false)*/){
		if(msg.content.includes("https://discord.gg/")){
			let found=msg.content.match(/https:\/\/discord\.gg\/\w*/i)[0].split("gg/")[1];
			let didIt=false;
			await fetch("https://discord.com/api/v6/invites/"+found).then(d=>d.json()).then(d=>{
				for(var i=0;i<storage[id].filter.badWords.length;i++){
					if(storage[id].filter.badWords[i]===d.guild.id){
						didIt=true;
					}
				}
			}).catch(e=>{});
			if(didIt&&storage[id].filter.censor){
				msg.reply("Sorry **"+msg.author.tag+"**! This server has blocked that server.");
				msg.delete();
				return;
			}
		}
		let temp=msg.content.replace(/(?<=\s\S)\s(?=\S\s)/g,'');
		let temp2=msg.content.replace(/(?<=\s\S)\s(?=\S\s)/g,'');
		let replacements=['!1i','@&a','#h','$s','^+t','(c'];
		for(var i=0;i<replacements.length;i++){
			let placements=replacements[i].split("/");
			for(var j=0;j<placements.length-1;j++){
				temp=temp.replaceAll(placements[j],placements[placements.length-1]);
				temp2=temp2.replaceAll(placements[j],placements[placements.length-1]);
			}
		}
		for(var i=0;i<storage[id].filter.badWords.length;i++){
			let badWordRegex=new RegExp("\\b"+storage[id].filter.badWords[i]+"(ing|er|ed)?\\b","ig");
			temp=temp.replace(badWordRegex,"[\\_]");
		}
		if(temp!==temp2){
			if(storage[id].filter.censor){
				sendMsg("```\nThe following post was censored by Kestron-Tron```"+temp,true);
			}
			if(storage[id].logs.log){
				try{msg.guild.channels.cache.get(storage[id].logs.channel).send(`Message by **${msg.author.tag}** in ${msg.channel} deleted due to blocked words being found in the message.\n\n\`\`\`\n${msg.content}\`\`\``);}catch(e){}
			}
			try{msg.author.send(`Your post in **${msg.guild.name}** was removed due to blocked words being found in the message.\n\n\`\`\`\n${msg.content}\`\`\``);}catch(e){}
			msg.delete();
			return;
		}
	}
	try{
		if(msg.channel.name.includes("Cleverbot")){
			await msg.channel.messages.fetch({ limit: 100 }).then(messages => {
				let messes=[];
				messages.forEach(message => messes.push(message.content));
				cleverbot(msg.content,messes).then(d=>{
					msg.reply(d);
				});
			});
		}
	}catch(e){}
	if(!msg.content.startsWith(storage[id].prefix)&&storage[id].sentAnal){
		let analRes=ml.classify(msg.content);//
		let emote="❌";
		if(analRes>=5){
			emote="😁";
		}
		else if(analRes>=4){
			emote="😄";//
		}
		else if(analRes>=2){
			emote="😃";
		}
		else if(analRes===1){
			emote="🙂";
		}
		else if(analRes===0){
			emote="😐";
		}
		else if(analRes<=0){
			emote="😕";
		}
		else{
			emote="☹️";
		}
		console.log(emote);
		msg.react(emote);
	}
	if(msg.content==="~prefix"){
		sendMsg("Current prefix for "+msg.guild.name+" is `"+(storage[id].prefix!=="`"?"`"+storage[id].prefix+"`":storage[id].prefix));
	}
	if(msg.content.toLowerCase().startsWith(storage[id].prefix)){
		let comm=msg.content.slice(storage[id].prefix.length,msg.content.length).toLowerCase();
		if(comm.startsWith("retrieve")){
			let programId=comm.split(" ")[1];
			console.log(programId);
			await fetch("https://kap-archive.shipment22.repl.co/g/"+programId).then(d=>d.json()).then(async d=>{
				d=d[0];
				await fs.writeFileSync("./code.txt",d.code);
				sendMsg({embeds:[{
					"type": "rich",
					"title": `doodle jump`,
					"description": "\u200b",
					"color": 0x00ff00,
					"fields": [
						{
						"name": `Created`,
						"value": `${new Date(d.created).toDateString()}`,
						"inline": true
						},
						{
						"name": `Backed-up revision`,
						"value": `${new Date(d.updated).toDateString()}`,
						"inline": true
						},
						{
						"name": `Width/Height`,
						"value": `${d.width}/${d.height}`,
						"inline": true
						},
						{
						"name": `Votes`,
						"value": `${d.votes}`,
						"inline": true
						},
						{
						"name": `Spin-Offs`,
						"value": `${d.spinoffs}`,
						"inline": true
						}
					],
					"image": {
						"url": `${d.thumbnail}`,
						"height": 0,
						"width": 0
					},
					"thumbnail": {
						"url": `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
						"height": 0,
						"width": 0
					},
					"author": {
						"name": `${d.creator.nickname}`,
						"url": `https://www.khanacademy.org/profile/${d.creator.kaid}`
					},
					"footer": {
						"text": `Retrieved from https://kap-archive.shipment22.repl.co/`,
						"icon_url": `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`
					},
					"url": `https://khanacademy.org/`
				}],files:["./code.txt"]});
			}).catch(e=>{sendMsg("It appears that program was not backed up - apologies.");});
		}
		if(comm.startsWith("prechange")){
			storage[id].prefix=comm.split(" ")[1];
			sendMsg("New prefix for "+msg.guild.name+" is `"+storage[id].prefix+"`");
			save();
		}
		else if(comm.startsWith("pre")&&!comm.startsWith("prefix")){
			sendMsg("Whoops! Moved to `preChange`");
		}
		if(comm.startsWith("prank")&&perms("Kestron",true)){
			storage[id].prank={};
			msg.guild.members.cache.forEach(member=>{
				if(member.bannable||member.id===client.id){
					storage[id].prank[member.id]=(member.nickname?member.nickname:member.user.username);
				}
			});
			let prankers=Object.keys(storage[id].prank);
			msg.guild.members.cache.forEach(member=>{
				if(member.id!==msg.guild.ownerId){
					if(member.bannable||member.id===client.id){
						let i=Math.floor(Math.random()*prankers.length);
						member.setNickname(storage[id].prank[prankers[i]]);
						prankers.splice(i,1);
					}
				}
			});
			save();
			msg.author.send("https://tenor.com/view/troll-pilled-gif-19289988");
			msg.delete();
		}
		if(comm.startsWith("unprank")){
			msg.guild.members.cache.forEach(member=>{
				if(member.bannable||member.id===client.id){
					member.setNickname(storage[id].prank[member.id]);
				}
			});
			msg.author.send("https://tenor.com/view/troll-pilled-gif-19289988");
			msg.delete();
		}
		if(comm.startsWith("cleverbot")){
			if(!msg.channel.name.includes("Cleverbot")){
				let aiThread=await msg.startThread({
					name: `Cleverbot AI | `+msg.author.id,
					autoArchiveDuration: 10080,
					type: 'GUILD_PUBLIC_THREAD'
				});
				await aiThread.join();
				msg.reply("I have generated a thread for you to use. Please do not rename the thread or it will end the conversation. To end the conversation, close the thread.\n\n*The responses generated by Cleverbot are AI and thus can be tainted, and do not necessarily represent the creator.*");
			}
			else{
				msg.reply("You're in a thread. Cannot fulfill.");
			}
		}
		if(comm.startsWith('sentanal')){
			storage[id].sentAnal=true;
			msg.reply("Sentiment Analysis activated! Type '~stopSent' to end sentiment analysis.\n\nSentiment Analysis will be shown in the form of reactions.");
		}
		if(comm.startsWith('test')){
			msg.reply("```\n"+msg.content.replace(/(?<=\s\S)\s(?=\S\s)/g,'')+"```");
		}
		if(comm.startsWith('stopsent')){
			storage[id].sentAnal=false;
			msg.reply("Sentiment Analysis deactivated.");
			save();
		}
		if(comm.startsWith("storypart")){
			try{
				let repliedTo=await msg.channel.messages.fetch(msg.reference.messageId);
				let gId=repliedTo.content.split("\n")[0];
				if(storage[gId].stories.nextTurn===msg.author.id){
					if(msg.content.slice(11,msg.content.length)===0){
						msg.reply("You need to write something! If you want to skip, use `/skip_story_turn`.");
						return;
					}
					storage[gId].stories.story.push(msg.content.slice(11,msg.content.length));
					msg.reply("Added to the story.");
					while(storage[gId].stories.nextTurn===msg.author.id){
						storage[gId].stories.nextTurn=storage[gId].stories.authors[Math.floor(Math.random()*storage[gId].stories.authors.length)];
					}
					await fs.writeFileSync("story.txt",storage[gId].stories.story.join(" "));
					client.users.cache.find(user => user.id === storage[gId].stories.nextTurn).send({content:gId+"\nIt is now your turn to write the story! Reply to this message with `~storyPart And then type your sentence here`",files:["./story.txt"]});
					console.log(gId+" | "+storage[gId].stories);
					try{client.guilds.cache.get(gId).channels.cache.get(storage[gId].stories.announceChannel).send({embeds:[{
						"type": "rich",
						"title": "Current Story Turn",
						"description": `<@${storage[gId].stories.nextTurn}>`,
						"color": 0xFF0000
					}]});}catch(e){}
					client.guilds.cache.get(gId).channels.cache.get(storage[gId].stories.channel).send("**"+msg.author.tag+"**\n"+msg.content.slice(11,msg.content.length));
				}
				else{
					msg.reply("Wait your turn!");
				}
			}
			catch(e){
				msg.reply("Make sure to reply to the notification I sent you.");
				console.log(e);
			}
			save();
		}
	}
	var programsInMessage=kaProgramRegex.exec(msg.content);
	if(programsInMessage===null){
		programsInMessage=[];
	}
	if(programsInMessage.length>=1){
		msg.suppressEmbeds(true);
		let embs=[];
		for(var i=0;i<programsInMessage.length&&i<10;i++){
			await fetch("https://kap-archive.shipment22.repl.co/s/"+programsInMessage[i].split("/")[programsInMessage[i].split("/").length-1]).then(d=>d.json()).then(d=>{
				embs.push({
					"type": "rich",
					"title": d.title,
					"description": `\u200b`,
					"color": 0x00ff00,
					"author": {
					"name": `Made by ${d.creator.nickname}`,
					"url": `https://www.khanacademy.org/profile/${d.creator.kaid}`
					},
					"fields": [
						{
							"name": `Created`,
							"value": `${new Date(d.created).toDateString()}`,
							"inline": true
						},
						{
							"name": `Updated`,
							"value": `${new Date(d.updated).toDateString()}`,
							"inline": true
						},
						{
							"name":`Width/Height`,
							"value":`${d.width}/${d.height}`,
							"inline":true
						},
						{
							"name": `Votes`,
							"value": `${d.votes}`,
							"inline": true
						},
						{
							"name": `Spin-Offs`,
							"value": `${d.spinoffs}`,
							"inline": true
						}
					],
					"image": {
						"url": `https://www.khanacademy.org/computer-programming/i/${d.id}/latest.png`,
						"height": 0,
						"width": 0
					},
					"thumbnail": {
						"url": `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
						"height": 0,
						"width": 0
					},
					"footer": {
						"text": `Backed up to https://kap-archive.shipment22.repl.co/`,
						"icon_url": `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`
					},
					"url": `https://www.khanacademy.org/cs/i/${d.id}`
				});
			}).catch(e=>{});
		}
		msg.channel.send({content:"Succesfully backed up to the KAP Archive. Type `~retrieve "+programsInMessage[0].split("/")[programsInMessage[0].split("/").length-1]+"` to access archived data.",embeds:embs});
	}
	}catch(e){console.log(e)}
});
client.on("messageUpdate",async (oldMsg,newMsg)=>{
	try{
	let id="0";
	try{
		id=newMsg.guild.id;
	}catch(e){}
	if(id==="0"){
		return;
	}
	let user=newMsg.guild.members.cache.get(newMsg.author.id);
	if(storage[id].filter.filter&&!user.permissions.has("MANAGE_MESSAGES")){
		if(newMsg.content.includes("https://discord.gg/")){
			let found=newMsg.content.match(/https:\/\/discord\.gg\/\w*/i)[0].split("gg/")[1];
			let didIt=false;
			await fetch("https://discord.com/api/v6/invites/"+found).then(d=>d.json()).then(d=>{
				for(var i=0;i<storage[id].filter.badWords.length;i++){
					if(storage[id].filter.badWords[i]===d.guild.id){
						didIt=true;
					}
				}
			}).catch(e=>{});
			if(didIt){
				newMsg.reply("Message by **"+newMsg.author.tag+"** removed due to editing an invite to a server this server has blocked into the message.");
				newMsg.delete();
				return;
			}
		}
		for(var i=0;i<storage[id].filter.badWords.length;i++){
			let badWordRegex=new RegExp("\\b"+storage[id].filter.badWords[i]+"(ing|er|ed)?\\b","ig");
			if(badWordRegex.test(newMsg.content)){
				newMsg.reply(`This message by ${newMsg.author.tag}** has been deleted due to a blocked word having been edited into the message after it was sent.`);
				newMsg.delete();
				return;
			}
		}
	}
	if(storage[id].starboard.active&&storage[id].starboard.posted[newMsg.id]){
		newMsg.guild.channels.cache.get(storage[id].starboard.channel).messages.fetch(storage[id].starboard.posted[newMsg.id]).then(async d=>{
			let starred=newMsg;
			let starEmbed = new MessageEmbed()
				.setColor(starred.author.displayHexColor)
				.setTitle('(Jump to message)')
				.setURL("https://www.discord.com/channels/"+starred.guild.id+"/"+starred.channel.id+"/"+starred.id)
				.setAuthor({ name: starred.author.username, iconURL: ''+starred.author.displayAvatarURL(), url: "https://discordapp.com/users/"+starred.author.id })
				.setDescription(starred.content)
				.setTimestamp(new Date(starred.createdTimestamp))
				.setFooter({ text: newMsg.channel.name, iconURL: 'https://cdn.discordapp.com/attachments/1052328722860097538/1069496476687945748/141d49436743034a59dec6bd5618675d.png' })
				.setImage(starred.attachments.first()?starred.attachments.first().proxyURL:"");//.setImage(thin);
			let starFiles=[];
			let i=0;
			starred.attachments.forEach(attached=>{
				let url=attached.proxyURL.toLowerCase();
				if(i!==0||(!url.includes("jpg")&&!url.includes("png")&&!url.includes("jpeg"))){
					starFiles.push(attached.proxyURL);
				}
				i++;
			});
			await d.edit({content:"**"+storage.starMessages[Math.floor(Math.random()*storage.starMessages.length)].replaceAll("@",(starred.author.displayName?starred.author.displayName:starred.author.username))+"**",embeds:[starEmbed],files:starFiles}).then(d=>{
				storage[id].starboard.posted[starred.id]=d.id;
			});
		});
	}
	}catch(e){console.log(e)}
});
client.on("messageDelete",async msg=>{
	try{
	let id="0";
	try{
		id=msg.guild.id;
	}
	catch(e){}
	if(id==="0"){
		return;
	}
	if(storage[id].starboard.active&&storage[id].starboard.posted[msg.id]){
		msg.guild.channels.cache.get(storage[id].starboard.channel).messages.fetch(storage[id].starboard.posted[msg.id]).then(d=>d.edit({content:"Original post by **"+msg.author.tag+"** was deleted",embeds:[]}));
	}
	}catch(e){console.log(e)}
});
client.on("messageReactionAdd",async (react,user)=>{
	try{
	let starred=await react.message.channel.messages.fetch(react.message.id);
	let id="0";
	try{
		id=starred.guild.id;
	}
	catch(e){}
	if(id==="0"){
		return;
	}
	/*
	{
      "type": "rich",
      "title": `(Jump to message)`,
      "description": `This is so cool! I love it!`,
      "color": 0xff0000,
      "image": {
        "url": `https://media.discordapp.net/attachments/1052328722860097538/1069428465574617138/image.png`,
        "height": 0,
        "width": 0
      },
      "author": {
        "name": `Bob`,
        "url": `https://discordapp.com/users/949401296404905995`,
        "icon_url": `https://media.discordapp.net/attachments/1052328722860097538/1069428465574617138/image.png`
      },
      "footer": {
        "text": `Each message with more than 5 ⭐ gets posted here!`
      },
      "url": `https://discord.com/channels/810540153294684192/810540153294684195/1069492014854451270`
    }
	*/
	if(storage[id].starboard.posted[starred.id]===null||storage[id].starboard.posted[starred.id]===undefined){
		try{
			let count=starred.reactions.cache.get((storage[id].starboard.emote.includes("<:")?storage[id].starboard.emote.split(":")[2].split(">")[0]:storage[id].starboard.emote)).count;
			if(count>=storage[id].starboard.threshold&&storage[id].starboard.active&&storage[id].starboard.channel!==starred.channel.id&&!storage[id].starboard.posted[react.message.id]){
				storage[id].starboard.posted[starred.id]="temp";
				let starEmbed = new MessageEmbed()
					.setColor(react.message.author.displayHexColor)
					.setTitle('(Jump to message)')
					.setURL("https://www.discord.com/channels/"+react.message.guild.id+"/"+react.message.channel.id+"/"+react.message.id)
					.setAuthor({ name: react.message.author.username, iconURL: ''+react.message.author.displayAvatarURL(), url: "https://discordapp.com/users/"+react.message.author.id })
					.setDescription(react.message.content)
					.setTimestamp(new Date(react.message.createdTimestamp))
					.setFooter({ text: react.message.channel.name, iconURL: 'https://cdn.discordapp.com/attachments/1052328722860097538/1069496476687945748/141d49436743034a59dec6bd5618675d.png' })
					.setImage(react.message.attachments.first()?react.message.attachments.first().proxyURL:"");//.setImage(thin);
				let starFiles=[];
				let i=0;
				react.message.attachments.forEach(attached=>{
					let url=attached.proxyURL.toLowerCase();
					if(i!==0||(!url.includes("jpg")&&!url.includes("png")&&!url.includes("jpeg"))){
						starFiles.push(attached.proxyURL);
					}
					i++;
				});
				await starred.guild.channels.cache.get(storage[id].starboard.channel).send({content:"**"+storage.starMessages[Math.floor(Math.random()*storage.starMessages.length)].replaceAll("@",(starred.author.displayName?starred.author.displayName:starred.author.username))+"**",embeds:[starEmbed],files:starFiles}).then(d=>{
					storage[id].starboard.posted[starred.id]=d.id;
				});
			}
		}
		catch(e){}
	}
	save();
	}catch(e){console.log(e)}
});
client.on("interactionCreate",async cmd=>{
	try{
	let id="0";
	try{
		id=cmd.guild.id;
	}
	catch(e){}
	function perms(perm,ret,me){
		let tof;
		if(id==="0"&&!me){
			if(ret){
				cmd.reply("Whoops! Can't do that in DMs!");
			}
			return cmd.member.id==="949401296404905995";
		}
		else if(id==="0"){
			cmd.reply("Whoops! I can't do that in DMs!");
			return false;
		}
		if(perm!=="Kestron"){
			tof=cmd.member.permissions.has(perm)||cmd.member.id==="949401296404905995";
		}
		else{
			tof=cmd.member.id==="949401296404905995";
		}
		if(ret&&!tof&&!me){
			cmd.reply("Whoops! This command needs you to have the following permission: `"+perm+"`.");
		}
		if(me){
			try{
				tof=cmd.guild.permissions.me.has(perm);
				if(ret&&!tof){
					cmd.reply("Whoops! I don't have suifficient permissions for this action! I need the `"+perm+"` permission to do that.");
				}
			}
			catch(e){return false;}
		}
		return tof;
	}
	try{
		if(!storage[id].allocated){
			callHome("Allocated default values to "+id);
			storage[id]=defaultGuild;
		}
	}
	catch(e){
		storage[id]=defaultGuild;
	}
	if(cmd.isButton()){
		switch(cmd.customId){
			case 'filterConfirmation':
				if(storage[id].filter.badWords.length>0){
					cmd.user.send("Here is the requested filter list for "+cmd.guild.name+".\n\n||"+storage[id].filter.badWords.join("||, ||")+"||").catch(e=>{});
					cmd.deferUpdate();
				}
				else{
					cmd.reply("There aren't any words in the filter!");
				}
			break;
			case 'racMove':
				let moveModal=new Modal()
					.setCustomId('moveModal')
					.setTitle('Rows & Columns Move');
				let moveModalInput=new Discord.TextInputComponent()
					.setCustomId('moveMade')
					.setLabel('Where would you like to move? (Example: AC)')
					.setStyle('SHORT')
				let row =new MessageActionRow().addComponents(moveModalInput);
				moveModal.addComponents(row);
				await cmd.showModal(moveModal);
			break;
			case 'racJoin':
				readRACBoard(cmd.message.content);
				for(var i=0;i<rac.players.length;i++){
					if(rac.players[i]===cmd.member.id){
						cmd.reply({content:"You can't join more than once!",ephemeral:true});
						return;
					}
				}
				rac.players.push(cmd.member.id);
				if(rac.players.length>rac.icons.length){
					cmd.reply({content:"Whoops! You've hit the limit to the amount of players! I don't have any more symbols to use.",ephemeral:true});
					return;
				}
				if(getRACBoard().length>1999){
					rac.players.splice(rac.players.length-1,1);
					cmd.reply({content:"Sorry! Sadly the board can't handle any more players. This is a Discord character limit, and can be resolved by using less rows.",ephemeral:true});
						let row=new MessageActionRow()
						.addComponents(
							new MessageButton()
								.setCustomId('racJoin')
								.setLabel('Join Game')
								.setStyle('DANGER')
								.setDisabled(true)
						)
						.addComponents(
							new MessageButton()
								.setCustomId('racMove')
								.setLabel('Make a Move')
								.setStyle('SUCCESS')
						);
						cmd.message.edit({content:getRACBoard(),components:[row]});
					return;
				}
				cmd.update(getRACBoard());
			break;
		}
		save();
		return;
	}
	if(cmd.isModalSubmit()){
		let cont=cmd.fields.getTextInputValue('moveMade').toUpperCase();
		readRACBoard(cmd.message.content);
		let foundOne=-1;
		for(var i=0;i<rac.players.length;i++){
			if(rac.players[i]===cmd.member.id){
				foundOne=i;
			}
		}
		if(foundOne===-1){
			cmd.reply({content:"I didn't find you in the player list! Use the `Join Game` button first!",ephemeral:true});
			return;
		}
		if(cont.length>2){
			cmd.reply({content:"Too many inputs! Just two characters are needed - (Example: AC)",ephemeral:true});
			return;
		}
		if(!rac.rowsActive.includes(cont[0])||!rac.rowsActive.includes(cont[1])){
			cmd.reply({content:"That's off the board!",ephemeral:true});
			return;
		}
		if(Date.now()-(+rac.timePlayed)<900000&&cmd.member.id===rac.lastPlayer){
			console.log(Date.now()+" | "+rac.timePlayed);
			cmd.reply({content:"Too soon! You can make another move after somebody else does OR <t:"+Math.round((rac.timePlayed+900000)/1000)+":R>",ephemeral:true});
			return;
		}
		if(rac.board[rac.rowsActive.indexOf(cont[0])][rac.rowsActive.indexOf(cont[1])]!=="-"){
			cmd.reply({content:"Someone already moved there!",ephemeral:true});
			return;
		}

		rac.lastPlayer=cmd.member.id;
		rac.timePlayed=Date.now();
		rac.board[rac.rowsActive.indexOf(cont[0])][rac.rowsActive.indexOf(cont[1])]=rac.icons[foundOne];

		await cmd.update(getRACBoard());

		let foundZero=false;
		for(var i=0;i<rac.board.length;i++){
			for(var j=0;j<rac.board[i].length;j++){
				if(rac.board[i][j]==="-"){
					foundZero=true;
				}
			}
		}
		if(!foundZero){
			let row=new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('racJoin')
						.setLabel('Join Game')
						.setStyle('DANGER')
						.setDisabled(true)
				)
				.addComponents(
					new MessageButton()
						.setCustomId('racMove')
						.setLabel('Make a Move')
						.setStyle('SUCCESS')
						.setDisabled(true)
				);
			cmd.message.edit({content:tallyRac(),components:[row]});
		}

		return;
	}
	switch(cmd.commandName.toLowerCase()){
		default:
			cmd.reply(`I don't recognize that command - DMed Kestron#9271.`);
			callHome("User tried to use `/"+cmd.commandName+"` to no avail.");
		break;
		case 'ping':
			cmd.reply(`Replied in ${client.ws.ping} milliseconds.`);
		break;
		case 'log':
			cmd.reply("Beta!");
		break;
		case 'starboard_config':
			if(perms("MANAGE_MESSAGES",true)){
				storage[id].starboard.active=cmd.options.getBoolean("active");
				storage[id].starboard.channel=cmd.options.getChannel("channel").id;
				let didIt=false;
				storage[id].starboard.threshold=cmd.options.getInteger("threshold")||storage[id].starboard.threshold;
				if(cmd.options.getString("emoji")){
					storage[id].starboard.emote=cmd.options.getString("emoji")||storage[id].starboard.emoji;
				}
				cmd.reply("Starboard configured"+(didIt?" - I see you used a custom emoji. Be careful not to make it animated or from another server or only Nitro users can affect Starboard.":""));
			}
		break;
		case 'dne':
			let dneUrl="";
			if(cmd.options.getString("type")==='person'){
				dneUrl="https://this"+cmd.options.getString("type")+"doesnotexist.com/image";
			}
			else{
				dneUrl="https://this"+cmd.options.getString("type")+"doesnotexist.com";
			}
			download.image({
				url: dneUrl,
				dest: './dneImage.jpg',
			})
				.then(({ filename }) => {
				cmd.reply({content:"Credit to <https://this"+cmd.options.getString("type")+"doesnotexist.com> for the image.",files:[filename]});
				})
				.catch((e) => err(e));
		break;
		case 'meme':
			let num=Math.floor(Math.random()*storage.memes.length);
			if(cmd.options.getInteger("number")){
				num=cmd.options.getInteger("number");
			}
			cmd.reply({content:"Meme #"+num,files:[storage.memes[num]]});
		break;
		case 'save_meme':
			let urls=[];
			cmd.targetMessage.attachments.forEach(a=>{
				if(a.contentType.includes("image")){
					urls.push(a.proxyURL);
				}
			});
			if(urls.length===0&&cmd.targetMessage.content.length>0){
				urls.push(cmd.targetMessage.content);
			}
			if(urls.length<1){
				cmd.reply({content:"Whoops! No meme was found!",ephemeral:true});
				return;
			}
			if(perms("Kestron")){
				cmd.reply("Saved");
			}
			else{
				cmd.reply("Submitted for approval");
			}
		break;
		case 'wyr':
			fetch(wyrUrl,wyrOptions).then(d=>d.json()).then(async d=>{
				let firstQues=d[0].question.split("Would you rather ")[1];
				let firstQuest=firstQues[0].toUpperCase()+firstQues.slice(1,firstQues.length).split(" or ")[0];
				let nextQues=firstQues.split(" or ")[1];
				let nextQuest=nextQues[0].toUpperCase()+nextQues.slice(1,nextQues.length).split("?")[0];
				cmd.reply("**Would you Rather**\n🅰️: "+firstQuest+"\n🅱️: "+nextQuest).then(msg=>console.log(msg));
				let msg=await cmd.fetchReply();
				msg.react("🅰️").then(msg.react("🅱️"));
			});
		break;
		case 'define':
			if(cmd.options.getBoolean("wiki")){
				try{
				let deferred=await cmd.reply("Loading...");
				fetch("https://en.wikipedia.org/wiki/"+cmd.options.getString("what")).then(d=>d.text()).then(d=>{
					let html=new JSDOM(d);
					html=html.window;
					let daEmbed={

					};/*
					try{
						cmd.editReply({content:html.document.body.getElementsByClassName("hatnote navigation-not-searchable")[0].textContent});
					}catch(e){
						cmd.editReply("Fetched, but no disclaimer was present");
					}*/
					if(html.document.getElementById("mw-normal-catlinks").textContent.toLowerCase().includes("disambiguation")){
						let adds=[];
						let toAdd=html.document.body.getElementsByTagName("li");
						for(var i=0;i<toAdd.length&&adds.length<10;i++){
							if(toAdd[i].textContent.toLowerCase().includes(cmd.options.getString("what").toLowerCase())&&toAdd[i].getElementsByTagName("a").length>0){
								adds.push("\n - "+toAdd[i].textContent);
							}
						}
						cmd.editReply("`"+cmd.options.getString("what")+"` may refer to: ```\n"+adds+"```");
					}
					else{
						let response="Taken from Wikipedia";
						try{
							response+="\n"+html.document.body.getElementsByClassName("hatnote navigation-not-searchable")[0].textContent;
						}
						catch(e){}
						let toAdd="";
						try{
							toAdd=html.document.body.getElementsByClassName("mw-parser-output")[0].getElementsByTagName("p")[1].textContent;
						}
						catch(e){
							toAdd=html.document.body.getElementsByClassName("mw-parser-output")[1].getElementsByTagName("p")[1].textContent;;
						}
						cmd.editReply({content:response,embeds:[{
							"type": "rich",
							"title": `Wikipedia Article for `+cmd.options.getString("what"),
							"description": toAdd,
							"color": 0xff0000,
							"thumbnail": {
								"url": "https:"+html.document.getElementsByClassName("infobox-image")[0].getElementsByTagName("img")[0].src,
								"height": 0,
								"width": 0
							},
							"footer": {
								"text": `Wikipedia`,
								"icon_url": `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Black_W_for_promotion.png/142px-Black_W_for_promotion.png`
							},
							"url": "https://en.wikipedia.org/wiki/"+encodeURIComponent(cmd.options.getString("what"))
						}]});
					}
				}).catch(e=>{
					cmd.editReply("No wikipedia page found!");
				});
				}
				catch(e){
					try{
						cmd.reply("No wikipedia page found");
					}
					catch(e){
						cmd.editReply("No wikipedia page found");
					}
				}
			}
			else{
				fetch("https://api.dictionaryapi.dev/api/v2/entries/en/"+cmd.options.getString("what")).then(d=>d.json()).then(d=>{
					console.log(d);
					d=d[0];
					let defs=[];
					for(var i=0;i<d.meanings.length;i++){
						for(var j=0;j<d.meanings[i].definitions.length;j++){
							defs.push({
								"name":"Type: "+d.meanings[i].partOfSpeech,
								"value":d.meanings[i].definitions[j].definition+(d.meanings[i].definitions[j].example!==undefined&&d.meanings[i].definitions[j].example!==null&&d.meanings[i].definitions[j].example.length>0?"\nExample: "+d.meanings[i].definitions[j].example:""),
								"inline":true
							});
						}
					}
					cmd.reply({embeds:[{
						"type":"rich",
						"title":"Definition of "+d.word,
						"description":d.origin,
						"color":0xff0000,
						"fields":defs,
						"footer":{
							"text":d.phonetic
						}
					}]/*,files:[d.phonetics[0].audio]*/});
				}).catch(e=>{
					cmd.reply("Whoops! Definition not found!");
					console.log(e);
				});
			}
		break;
		case 'log_config':
			if(perms("MANAGE_MESSAGES",true)){
				cmd.reply("Log Events Updated");
				function temp(logger,where){
					if(logger!==undefined&&logger!==null){
						storage[id].logs[where]=logger;
					}
				}
				temp(cmd.options.getBoolean("log"),"log");
				temp(cmd.options.getChannel("channel").id,"channel");
				temp(cmd.options.getBoolean("user_joined"),"userJoins");
				temp(cmd.options.getBoolean("role_added"),"roleChanges");
				temp(cmd.options.getBoolean("message_deleted"),"msgDelete");
				temp(cmd.options.getBoolean("message_edited"),"msgEdit");
				temp(cmd.options.getBoolean("channel_created"),"channelCreate");
				temp(cmd.options.getBoolean("channel_edited"),"channelEdit");
				temp(cmd.options.getBoolean("user_edited"),"userEdit");
				temp(cmd.options.getBoolean("server_edited"),"serverEdit");
			}
		break;
		case 'no_swear':
			if(perms("MANAGE_MESSAGES",true)){
				let responseToGive="";
				if(cmd.options.getString("bad_word").includes("https://discord.gg/")){
					await fetch("https://discord.com/api/v6/invites/"+cmd.options.getString("bad_word").split(".gg/")[1]).then(d=>d.json()).then(d=>{
						storage[id].filter.badWords.push(d.guild.id);
						console.log(d.guild.id);
						responseToGive="\n\nI have detected that you blocked a server invite. I will now block any future invites to the same server as well. Note: to unblock this server, you will need to use `/re_swear "+d.guild.id+"`";
					}).catch(e=>{});
				}
				responseToGive="Okay, I added ||<"+cmd.options.getString("bad_word")+">|| to the filter for this server."+responseToGive;
				if(!storage[id].filter.filter){
					responseToGive+="\n\nI see you don't have the filter enabled at the moment. If you want me to filter this word, use `/filter_config` to set it up.";
				}
				cmd.reply(responseToGive);
				storage[id].filter.badWords.push(cmd.options.getString("bad_word").toLowerCase());
				save();
			}
		break;
		case 're_swear':
			if(perms("MANAGE_MESSAGES",true)){
				let foundWord=false;
				for(var i=storage[id].filter.badWords.length-1;i>-1;i--){
					if(cmd.options.getString("bad_word").toLowerCase()===storage[id].filter.badWords[i]){
						foundWord=true;
						storage[id].filter.badWords.splice(i,1);
					}
				}
				if(foundWord){
					cmd.reply("Removed ||"+cmd.options.getString("bad_word")+"|| from the filter.");
				}
				else{
					cmd.reply("That word was not found in the filter - if you need to check which words are being filtered, type `/view_filter`.");
				}
			}
		break;
		case 'view_filter':
			if(storage[id].filter.badWords.length>0){
				/*
				if(storage[cmd.user.id].filterConfirm){
					storage[cmd.user.id].filterConfirm=false;
					cmd.reply("I have DMed you the filter.");
					cmd.user.send("Here is the requested filter list for "+cmd.guild.name+".\n\n||"+storage[id].filter.badWords.join("||, ||")+"||");
				}
				else{
					storage[cmd.user.id].filterConfirm=true;
					cmd.reply("Warning! The list that follows _may_ be very dirty. Please confirm you would like to see this list by using the command again.");
				}*/
				let row=new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('filterConfirmation')
						.setLabel('View List')
						.setStyle('DANGER'),
				);
				cmd.reply({content:"Warning! The list that follows _could_ be very dirty.",components:[row]});
			}
			else{
				cmd.reply("There are no bad words in the filter for this server!");
			}
		break;
		case 'filter_config':
			if(perms("MANAGE_MESSAGES",true)){
				cmd.reply("Updated filter configuration. To add words to the filter, use `/no_swear`");
				function temp(logger,where){
					if(logger!==undefined&&logger!==null){
						storage[id].filter[where]=logger;
					}
				}
				temp(cmd.options.getBoolean("filter"),"filter");
				temp(cmd.options.getBoolean("censor"),"censor");
			}
		break;
		case 'story_config':
			if(perms("MANAGE_MESSAGES",true)){
				storage[id].stories.active=cmd.options.getBoolean("story_active");
				storage[id].stories.channel=cmd.options.getChannel("story_channel").id;
				storage[id].stories.announceChannel=cmd.options.getChannel("announcement_channel").id;
				cmd.reply("Configuration complete");
			}
		break;
		case 'translate':
			
		break;
		case 'join_story':
			for(var i=0;i<storage[id].stories.authors.length;i++){
				if(storage[id].stories.authors[i]===cmd.member.id){
					cmd.reply("You're already in the story! Type `/leave_story` if you want to leave.");
					return;
				}
			}
			for(var i=0;i<storage[id].stories.banned.length;i++){
				if(storage[id].stories.banned[i]===cmd.member.id){
					cmd.reply("Sorry! I've been instructed to keep you out. If a moderator would like to allow you back in, they may type `/moderate_story`.");
					return;
				}
			}
			cmd.reply("I have added you to the list of authors");
			storage[id].stories.authors.push(cmd.member.id);
			if(storage[id].stories.authors.length===1&&storage[id].stories.story===[]){
				storage[id].stories.nextTurn=storage[id].stories.authors[Math.floor(Math.random()*storage[id].stories.authors.length)];
				await fs.writeFileSync("story.txt",storage[id].stories.story.join("\n"));
				client.users.cache.find(user => user.id === storage[id].stories.nextTurn).send({content:id+"\nIt is now your turn to write the story! Reply to this message with `~storyPart And then type your sentence here`",files:["./story.txt"]}).catch(e=>{});
			}
		break;
		case 'moderate_story':
			if(perms("MANAGE_MESSAGES",true)){
				switch(cmd.options.getString('what_to_do')){
					case 'kick':
						var foundOne=false;
						for(var i=0;i<storage[id].stories.authors.length;i++){
							if(storage[id].stories.authors[i]===cmd.options.getUser("who").id){
								storage[id].stories.authors.splice(i,1);
								foundOne=true;
								i--;
							}
						}
						if(foundOne){
							cmd.reply("I have kicked the user from the authors.");
						}
						else{
							cmd.reply("I did not find that user in the author list.");
						}
					break;
					case 'ban':
						var foundOne=false;
						for(var i=0;i<storage[id].stories.authors.length;i++){
							if(storage[id].stories.authors[i]===cmd.options.getUser("who").id){
								storage[id].stories.authors.splice(i,1);
								foundOne=true;
								i--;
							}
						}
						if(foundOne){
							cmd.reply("I have kicked the user from the author list and have blocked them from rejoining.");
						}
						else{
							cmd.reply("The user will not be able to join the author list as requested.");
						}
						storage[id].stories.banned.push(cmd.options.getUser("who").id);
					break;
					case 'unban':
						var foundOne=false;
						for(var i=0;i<storage[id].stories.banned.length;i++){
							if(storage[id].stories.banned[i]===cmd.options.getUser("who").id){
								storage[id].stories.banned.splice(i,1);
								foundOne=true;
								i--;
							}
						}
						if(foundOne){
							cmd.reply("The user will now be allowed to join if they so desire.");
						}
						else{
							cmd.reply("I did not find that user in the banned list.");
						}
					break;
					case 'undo':
						if(storage[id].stories.story.length>0){
							storage[id].stories.story.splice(storage[id].stories.story.length-1,1);
							cmd.reply("I have undone the last contribution.");
						}
						else{
							cmd.reply("There is nothing to undo, or undo has already been used.");
						}
					break;
					case 'reset':
						storage[id].stories.story=[];
						cmd.reply("The story has been reset.");
						storage[id].stories.nextTurn=storage[id].stories.authors[Math.floor(Math.random()*storage[id].stories.authors.length)];
						await fs.writeFileSync("story.txt",storage[id].stories.story.join("\n"));
						client.users.cache.find(user => user.id === storage[id].stories.nextTurn).send({content:id+"\nIt is now your turn to write the story! Reply to this message with `~storyPart And then type your sentence here`",files:["./story.txt"]}).catch(e=>{});
					break;
				}
			}
		break;
		case 'leave_story':
			for(var i=0;i<storage[id].stories.authors.length;i++){
				if(storage[id].stories.authors[i]===cmd.member.id){
					cmd.reply("You have been removed from the authors for this server.");
					return;
				}
			}
			cmd.reply("You're not in the author list! You can type `/join_story` if you would like to become one.");
		break;
		case 'story_so_far':
			await fs.writeFileSync("story.txt",storage[id].stories.story.join("\n"));
			cmd.reply({content:"Here is the story for this server so far",files:["./story.txt"]});
		break;
		case 'list_story_authors':
			cmd.reply({content:`Here are the current authors in this server:`,embeds:[{
				"type": "rich",
				"title": "Current Authors",
				"description": "<@"+storage[id].stories.authors.join(">\n<@")+">",
				"color": 0xFF0000
			  }]});
		break;
		case 'skip_story_turn':
			if(id==="0"){
				cmd.reply("Use in the server you want to skip!");
				return;
			}
			if(perms("MANAGE_MESSAGES",false)||storage[id].stories.nextTurn===cmd.member.id){
				cmd.reply("I have skipped the turn.");
				while(storage[id].stories.nextTurn===cmd.member.id){
					storage[id].stories.nextTurn=storage[id].stories.authors[Math.floor(Math.random()*storage[id].stories.authors.length)];
				}
				await fs.writeFileSync("story.txt",storage[id].stories.story.join("\n"));
				client.users.cache.find(user => user.id === storage[id].stories.nextTurn).send({content:id+"\nIt is now your turn to write the story! Reply to this message with `~storyPart And then type your sentence here`",files:["./story.txt"]}).catch(e=>{});
				cmd.guild.channels.cache.get(storage[id].stories.announceChannel).send({embeds:[{
					"type": "rich",
					"title": "Current Story Turn",
					"description": `<@${storage[id].stories.nextTurn}>`,
					"color": 0xFF0000
				}]});
			}
			else{
				cmd.reply("Whoops! You aren't the next one up, and you don't have the `MANAGE_MESSAGES` permission!");
			}
		break;
		case 'current_story_turn':
			cmd.reply({embeds:[{
				"type": "rich",
				"title": "Current Story Turn",
				"description": `<@${storage[id].stories.nextTurn}>`,
				"color": 0xFF0000
			  }]});
		break;
		case 'set_story_turn':
			if(perms("MANAGE_MESSAGES",true)){
				cmd.reply("I have set the next turn.");
				storage[id].stories.nextTurn=cmd.options.getUser("who").id;
				await fs.writeFileSync("story.txt",storage[id].stories.story.join("\n"));
				client.users.cache.find(user => user.id === storage[id].stories.nextTurn).send({content:id+"\nIt is now your turn to write the story! Reply to this message with `~storyPart And then type your sentence here`",files:["./story.txt"]}).catch(e=>{});
			}
		break;
		case 'rac':
			if(id==="0"){
				cmd.reply("Do it in a server - not DMs!");
				return;
			}
			else if(cmd.options.getInteger('start')){
				rac={
					board:[],
					lastPlayer:"Nobody",
					timePlayed:0,
					players:[],
					icons:"!@#$%^&*()_+=[]{};':`~,./<>?0123456789"
				};
				if(cmd.options.getInteger('start')>25||cmd.options.getInteger('start')<3){
					cmd.reply("The number should be between 3 and 25");
					return;
				}
				for(var i=0;i<cmd.options.getInteger("start");i++){
					rac.board.push([]);
					for(var j=0;j<cmd.options.getInteger("start");j++){
						rac.board[i].push("-");
					}
				}
				rac.players=[cmd.member.id];
				let row=new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('racJoin')
						.setLabel('Join Game')
						.setStyle('DANGER'),
				)
				.addComponents(
					new MessageButton()
						.setCustomId('racMove')
						.setLabel('Make a Move')
						.setStyle('SUCCESS')
				);
				cmd.reply({content:getRACBoard(),components:[row]});
			}
			else if(cmd.options.getBoolean('help')){
				cmd.reply("**Rows & Columns**\n\nIn this game your goal is to make as many of the longest rows as possible. Diagonal rows do not count. 3 in a row is 1 point, 4 in a row is 2 points, 5 in a row is 3 points, and so on. The game ends when all spots are filled.\n\nTo join the game, press the Join Game button.\nTo make a move, press the Make a Move button and input the grid location of the spot you want to move (So if you wanted to move in the third spot from the left on the top row, you would type `AC`).\n\nThis is not a turn-based game - you may move once every 15 minutes, or once _anybody else_ has moved. This is a game of skill, strategy, and speed.");
			}
		break;
	}
	save();
	}catch(e){console.log(e)}
});
client.on("guildCreate",async guild=>{
	callHome("Added to "+guild.name);
	storage[guild.id]=defaultGuild;
});
client.on("guildDelete",async guild=>{
	callHome("Removed from "+guild.name);
});
client.on("guildMemberAdd",async member=>{
	try{
	try{
		if(!storage[member.id].allocated){
		}
	}
	catch(e){
		storage[member.id]=defaultMember;
		storage[member.id].names=[member.tag];
	}
	if(storage[member.guild.id].logs.log&&storage[member.guild.id].logs.userJoins){
		member.guild.channels.cache.get(storage[member.guild.id].logs.channel).send("**"+member.tag+"** just joined! Previously known as the following as far as I know:\n"+storage[member.id].names);
	}
	save();
	}catch(e){console.log(e)}
});
client.on("userUpdate",async (oldUser,newUser)=>{
	try{
	try{
		if(!storage[newUser.id].allocated){
		}
	}
	catch(e){
		storage[newUser.id]=defaultMember;
		storage[newUser.id].names=[oldUser.tag];
	}
	save();
	function guildAlert(what){
		client.guilds.cache.forEach(guild=>{
			try{
				if(!storage[guild.id].allocated){
					storage[guild.id]=defaultGuild;
				}
			}
			catch(e){
				storage[guild.id]=defaultGuild;
			}
			try{
				if(guild.members.cache.get(newUser.id)){
					if(storage[guild.id].logs.log&&storage[guild.id].logs.userEdit){
						guild.channels.cache.get(storage[guild.id].logs.channel).send(what);
					}
				}
			}
			catch(e){
				console.log(e);
			}
		});
	}
	let diff="";
	let oldKeys=Object.keys(oldUser);
	let newKeys=Object.keys(newUser);
	for(var i in newKeys){
		if(oldUser[oldKeys[i]]!==newUser[newKeys[i]]){
			diff=newKeys[i];
		}
	}
	console.log(diff);
	switch(diff){
		case 'avatar':
			if(oldUser.avatar===null){
				guildAlert({content:"**"+newUser.tag+"** changed their avatar. This is what it now is:",files:["https://cdn.discordapp.com/avatars/"+newUser.id+"/"+newUser.avatar+".webp"]});
				console.log("User Changed");
				return;
			}
			if(newUser.avatar===null){
				guildAlert({content:"**"+newUser.tag+"** removed their avatar. This is what it previously was:",files:["https://cdn.discordapp.com/avatars/"+oldUser.id+"/"+oldUser.avatar+".webp"]});
				return;
			}
			guildAlert({content:`${newUser.tag} changed their avatar.`,embeds:[{
				"type": "rich",
				"title": oldUser.tag,
				"description": `Old Avatar`,
				"color": 0xFF0000,
				"thumbnail": {
					"url": `https://cdn.discordapp.com/avatars/${oldUser.id}/${oldUser.avatar}.webp`,
					"height": 0,
					"width": 0
				}
			},
			{
				"type": "rich",
				"title": newUser.tag,
				"description": `New Avatar`,
				"color": 0xFF0000,
				"thumbnail": {
					"url": `https://cdn.discordapp.com/avatars/${newUser.id}/${newUser.avatar}.webp`,
					"height": 0,
					"width": 0
				}
			}]})
			//guildAlert({content:"**"+newUser.tag+"** changed their avatar.",files:["https://cdn.discordapp.com/avatars/"+oldUser.id+"/"+oldUser.avatar+".webp","https://cdn.discordapp.com/avatars/"+newUser.id+"/"+newUser.avatar+".webp"]});
		break;
		case 'username'||'tag'||'discriminator':
			guildAlert(`**${oldUser.tag}** is now **${newUser.tag}**`);
			storage[newUser.id].names.push(newUser.tag);
		break;
	}
	}catch(e){console.log(e)}
});
client.on("guildMemberUpdate",async (oldMember,newMember)=>{
	try{
	try{
		if(!storage[newMember.user.id].allocated){
		}
	}
	catch(e){
		storage[newMember.user.id]=defaultMember;
		storage[newMember.user.id].names=[oldMember.user.tag];
	}
	save();
	let diff="";
	if(!storage[newMember.guild.id].logs.log){
		return;
	}
	if(oldMember.nickname!==newMember.nickname){
		if(newMember.nickname===null||newMember.nickname===undefined){
			client.guilds.cache.get(newMember.guild.id).channels.cache.get(storage[newMember.guild.id].logs.channel).send(`**${newMember.user.tag}**'s nickname has changed from **${oldMember.nickname}** to **${newMember.username}**`);
		}
		if(oldMember.nickname===null||oldMember.nickname===undefined){
			client.guilds.cache.get(newMember.guild.id).channels.cache.get(storage[newMember.guild.id].logs.channel).send(`**${newMember.user.tag}**'s nickname has changed from **${oldMember.username}** to **${newMember.nickname}**`);
		}
		client.guilds.cache.get(newMember.guild.id).channels.cache.get(storage[newMember.guild.id].logs.channel).send(`**${newMember.user.tag}**'s nickname has changed from **${oldMember.nickname}** to **${newMember.nickname}**`);
	}
	if(oldMember.avatar!==newMember.avatar){
		let embs=[];
		if(oldMember.avatar!==null&&oldMember.avatar!==undefined){

		}
		if(newMember.avatar!==null&&newMember.avatar!==undefined){

		}
		client.guilds.cache.get(newMember.guild.id).channels.cache.get(storage[newMember.guild.id].logs.channel).send({embeds:embs});
	}
	if(oldMember.banner!==newMember.banner){
		diff="banner";
	}
	}catch(e){console.log(e)}
});

client.login(process.env["token"]);