const token=process.env["token"];
async function gen(){
  const { SlashCommandBuilder } = require('@discordjs/builders');
  const {PermissionFlagsBits } = require("@discordjs/builders");
	const { ContextMenuCommandBuilder }=require("@discordjs/builders");
  const { REST } = require('@discordjs/rest');
  const { Routes } = require('discord-api-types/v9');
  let clientId="966167746243076136";
  
  const commands = [
		new SlashCommandBuilder().setName('ping').setDescription("Get the bot's latency"),
    new SlashCommandBuilder().setName('dne').setDescription("This ___ does not exist! (AI Generated)").addStringOption(option=>
      option.setName('type')
        .setDescription("What doesn't exist that you want to see?")
        .setRequired(true)
        .addChoices(
          {name:'Person',value:"person"},
          {name:"Cat",value:'cat'},
          {name:"Horse",value:"horse"},
          {name:"Artwork",value:"artwork"}
        )
    ),
		new SlashCommandBuilder().setName('meme').setDescription("Post a meme!").addIntegerOption(option=>
      option.setName('number')
        .setDescription("Specific number you would like to see")
        .setRequired(false)
    ),
    new ContextMenuCommandBuilder().setName('save_meme').setType(3),
    new SlashCommandBuilder().setName('wyr').setDescription("Generate a Would-you-Rather question!"),
    new SlashCommandBuilder().setName('define').setDescription("Define a word or phrase").addStringOption(option=>
      option.setName("what")
        .setDescription("What do you want to look up?")
        .setRequired(true)
    )
    .addBooleanOption(option=>
      option.setName('wiki')
        .setDescription("Use Wikipedia for the lookup?")
        .setRequired(false)
    ),
    new SlashCommandBuilder().setName('filter_config').setDescription("Change the configuration for the swear filter")
      .addBooleanOption(option=>
        option.setName('filter')
          .setDescription("Turn the filter on or off")
          .setRequired(true)
      )
      .addBooleanOption(option=>
        option.setName('censor')
          .setDescription("Should I remove the bad word from the message (true) or delete the whole thing (false)?")
          .setRequired(true)
      ),
    new SlashCommandBuilder().setName('view_filter').setDescription("View the current bad words for this server"),
    new SlashCommandBuilder().setName('no_swear').setDescription("Add a bad word to the filter")
        .addStringOption(option=>
          option.setName('bad_word')
          .setDescription('The word to filter')
          .setRequired(true)
        ),
    new SlashCommandBuilder().setName('re_swear').setDescription("Remove a word from the filter")
      .addStringOption(option=>
        option.setName('bad_word')
          .setDescription('The word to remove from the filter')
          .setRequired(true)
      ),
    new SlashCommandBuilder().setName('join_story').setDescription("Join the story authors"),
    new SlashCommandBuilder().setName('leave_story').setDescription("Leave the story authors"),
    new SlashCommandBuilder().setName('story_so_far').setDescription("Show the story so far"),
    new SlashCommandBuilder().setName('skip_story_turn').setDescription("Skips your story turn, or the current member's if an Admin"),
    new SlashCommandBuilder().setName('current_story_turn').setDescription("Shows who is up next in the story"),
    new SlashCommandBuilder().setName('list_story_authors').setDescription("List everyone signed up for the story game"),
    new SlashCommandBuilder().setName('story_config').setDescription("Configure Story Settings")
        .addBooleanOption(option=>
          option.setName('story_active')
            .setDescription("Do storytelling things?")
            .setRequired(true)
        )
        .addChannelOption(option=>
          option.setName('story_channel')
            .setDescription("Channel to post story updates in")
            .setRequired(true)
        )
        .addChannelOption(option=>
          option.setName('announcement_channel')
            .setDescription("Where to post things like who's turn is next")
            .setRequired(true)
        ),
    new SlashCommandBuilder().setName('moderate_story').setDescription("Take actions on the story members")
        .addStringOption(option=>
          option.setName("what_to_do")
          .setDescription("Choose an action to take")
          .setRequired(true)
          .addChoices(
            {name:"Kick Author",value:"kick"},
            {name:"Ban Author",value:"ban"},
            {name:"Unban Author",value:"unban"},
            {name:"Undo Submission",value:"undo"},
            {name:"Reset Story",value:"reset"}
          )
        )
        .addUserOption(option=>
          option.setName('who')
          .setDescription("Who to moderate? (Irrelevant to Undo/Reset)")
          .setRequired(true)
        ),
    new SlashCommandBuilder().setName('set_story_turn').setDescription("Change who's turn it is")
        .addUserOption(option=>
            option.setName('who')
              .setDescription("Who's turn do you want it to be?")
              .setRequired(true)
          ),
    new SlashCommandBuilder().setName('log_config').setDescription("Change the configuration for logs")
      .addBooleanOption(option=>
        option.setName('log')
          .setDescription("Do you want me to log events?")
          .setRequired(true)
      )
      .addChannelOption(option=>
        option.setName('channel')
          .setDescription("Which channel do you want me to log to?")
          .setRequired(true)
      )
      .addBooleanOption(option=>
        option.setName('user_joined')
          .setDescription("Let you know when someone joins or leaves the server?")
          .setRequired(false)
      )
      .addBooleanOption(option=>
        option.setName('role_added')
          .setDescription("Let you know when someone gets or loses a role?")
          .setRequired(false)
      )
      .addBooleanOption(option=>
        option.setName('message_deleted')
          .setDescription("Let you know when a message is deleted?")
          .setRequired(false)
      )
      .addBooleanOption(option=>
        option.setName('message_edited')
          .setDescription("Let you know when a message is edited?")
          .setRequired(false)
      )
      .addBooleanOption(option=>
        option.setName('channel_created')
          .setDescription("Let you know when a channel is created?")
          .setRequired(false)
      )
      .addBooleanOption(option=>
        option.setName('channel_edited')
          .setDescription("Let you know when a channel is edited?")
          .setRequired(false)
      )
      .addBooleanOption(option=>
        option.setName('user_edited')
          .setDescription("Let you know when someone changes their profile?")
          .setRequired(false)
      )
      .addBooleanOption(option=>
        option.setName('server_edited')
          .setDescription("Let you know when the server settings are changed?")
          .setRequired(false)
      ),
    new SlashCommandBuilder().setName('rac').setDescription("Play a game of Rows & Columns")
        .addBooleanOption(option=>
          option.setName('help')
            .setDescription("View help menu instead of playing?")
            .setRequired(false)
        )
        .addIntegerOption(option=>
          option.setName('start')
            .setDescription("How many rows do you want? (Max 25)")
            .setRequired(false)
        ),
    new SlashCommandBuilder().setName('starboard_config').setDescription('Configure Starboard')
        .addBooleanOption(option=>
          option.setName('active')
            .setDescription("Do starboard things?")
            .setRequired(true)
        )
        .addChannelOption(option=>
          option.setName('channel')
            .setDescription("Where do you want me to post starboard messages to?")
            .setRequired(true)
        )
        .addIntegerOption(option=>
          option.setName('threshold')
            .setDescription("How many stars must a message receive to be posted to starboard? (Default:3)")
            .setRequired(false)
        )
        .addStringOption(option=>
          option.setName('emoji')
            .setDescription("What emoji do you want people to react with? (Default: ⭐)")
            .setRequired(false)
        ),
      new SlashCommandBuilder().setName('translate').setDescription('Translation')
          .addStringOption(option=>
            option.setName('what')
              .setDescription("What do you want to translate?")
              .setRequired(true)
          )
          .addStringOption(option=>
            option.setName('language_to')
              .setDescription('Language to translate into? (Default: English)')
              .setRequired(false)
          )
          .addStringOption(option=>
            option.setName('language_from')
              .setDescription('Language it is in? (Default: Autodetect)')
              .setRequired(false)
          ),
      new ContextMenuCommandBuilder().setName('translateMessage').setType(3),
  ]
  	.map(command => command.toJSON());
  
  const rest = new REST({ version: '9' }).setToken("OTY2MTY3NzQ2MjQzMDc2MTM2.Gt0cQe.RpvAzVSJJDXgpl4whwCohctQKW6Ayb7n8a9hHg");
  
  await rest.put(
  	Routes.applicationCommands(clientId),
  	{ body: commands },
  )
  	.then(() => console.log('Successfully refreshed application commands.'))
  	.catch(console.error);
}
gen();