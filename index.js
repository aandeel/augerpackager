const { Client, Intents, MessageActionRow, MessageButton } = require('discord.js');
const { token, spreadsheetID, dailySalesSheetID, dailySummarySheetID, marketplaceGuildID, botChannelID, adminRoleID, commands, dailyReportsTime, cooldownMsg, coolCreationsChannelID, jobsChannelID } = require('./config.json');
const { GoogleSpreadsheet } = require('google-spreadsheet');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const creds = require('./yeggs-marketplace-e67a44d008a1.json');
const cron = require('cron');
const fs = require('fs');
const { clearLine } = require('readline');
const { POINT_CONVERSION_COMPRESSED } = require('constants');
const { channel } = require('diagnostics_channel');
const { off } = require('process');
const { type } = require('os');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const personaRarities = {'C': 0.14,	'U': 0.28, 'R': 0.65, 'E': 0.94}
const hiddenItems = ['Squid Gamers',]
const priceChangeItems = ['Sprint',]

// Global variables
var reportReply = ''
var reportDate = ''
var savedMessage = null
var reports = {}
var cooldown = false
var lastColumn = 'ZZ'
var firstColumn = 13
const creatorPayoutDays = 182
const messageCharLimit = 1950
const MAINTENANCE = false

// Executed when bot loads
client.once('ready', () => {

	// Initialize bot
	console.log('Yeggs Marketplace bot is ready.');
	client.user.setActivity('with spreadsheets! 📝', { type: 'PLAYING' });

	// Create Slash Commands
	setupSlashCommands()
	
	// Start automatic daily reports
	// dailyReport.start()

	// Send message manually
	chan = "878346786534719568"
	mesg = "TEXT"
	// client.channels.cache.get(chan).send(mesg)
		
	// Send reaction
	// client.channels.cache.get(chan).messages.fetch(mesg).then(message => message.react("👍"))
});


client.on("messageCreate", async message => {
	content = message.content
	if(!content) { content = message.author.username+"'s Cool Creation" }

	
	// Robert comment
	if(!message.author.bot && content.toLowerCase().includes("robert")) {
		message.channel.send(robertMessage(message))
	}

	// Check if thread should be made
	isJob = message.channel.id == jobsChannelID
	isCreation = message.channel.id == coolCreationsChannelID
	if (message.author.bot || !(isJob || isCreation)) return false;

	// Create thread name
	if(isJob) {
		threadName = content.substring(content.indexOf("*")+2,content.indexOf("|")-3)
	}
	else if(isCreation) {
		threadName = content
		if (content.length > 100) { threadName = content.substring(0,100) }
	}

	// Create thread
	await message.startThread({
		name: threadName,
		autoArchiveDuration: 1440+(1440*2*(message.channel.id==jobsChannelID)),
		type: 'GUILD_PUBLIC_THREAD'
	});

	// Add members to thread
	if(isJob) {
		const thread = message.channel.threads.cache.find(x => x.name === threadName);
		await thread.members.add('271399293372334081') // Lucian
		await thread.members.add('540699622394560514') // Conor
		await thread.members.add('458522071006183445') // Taj
		await thread.members.add('343506509285687317') // Nav
	}
  });

// Check for slash commands & run associated method
client.on('interactionCreate', async interaction => {
	if (!(interaction.isCommand() || interaction.isButton()) || !interaction.channel.name.includes('bot') || (interaction.guildId != marketplaceGuildID)) return;

	// Delete slash command (guild ID, commmand ID (interaction.commandId))
	// client.api.applications(client.user.id).guilds("831367823971713034").commands(interaction.commandId).delete(); console.log('Deleted slash command.');


	// Cooldown
	if(cooldown) {
		interaction.reply(cooldownMsg)
		return;
	}
	cooldown = true

	// Get command
	const { commandName, customId } = interaction;

	// Limit info if the user is not a coordinator or the channel is incorrect
	isLimited = true
	if(interaction.channelId === botChannelID && interaction.member._roles.includes(adminRoleID))
	{ isLimited = false }

	// Maintenance
	// if(MAINTENANCE && isLimited) {
	// 	interaction.reply(':no_entry: I am under maintenance.')
	// 	return;
	// }

	// Run method associated with the command
	if (commandName === 'sales') {
		await salesInfo(interaction, isLimited)
	}
	else if (commandName === 'today') {
		await dayInfo(interaction, isLimited)
	}
	else if (commandName === 'month') {
		await monthInfo(interaction, isLimited)
	}
	else if (commandName === 'rankings') {
		await rankingsInfo(interaction)
	}
	else if (commandName === 'report') {
		if(!isLimited) { 
			interaction.reply('ㅤ')
			interaction.deleteReply()
			await report(interaction, false)
		}
		else { insufficientPermissions(interaction) }
	}
	else if (commandName === 'info') {
		await info(interaction)
	}
	else if (customID = 'button') {
		await sendReports()
	}

	// Remove cooldown
	cooldown = false
});

// Command that displays sales for specified range of days
async function salesInfo(interaction, isLimited) {
	
	// Number of retrospective days to count
	var days = interaction.options.getInteger('days')
	if(!days || days < 0) { days = 0 }

	// Get dates
	var d0 = new Date(Date.now()-133200000-86400000*(days-1))
	var d1 = new Date(Date.now()-133200000)
	if(d0 < Date.parse('22 Jun 2021 00:00:00 GMT') || days == 0) { d0 = new Date(Date.parse('22 Jun 2021 00:00:00 GMT')) }
	const startDate = (d0.getMonth()+1)+'/'+(d0.getDate())+'/'+d0.getFullYear()
	const endDate = (d1.getMonth()+1)+'/'+(d1.getDate())+'/'+d1.getFullYear()
	const startDay = Math.floor(d0.getTime()/86400000)+25569
	const endDay = Math.floor(d1.getTime()/86400000)+25569

	// Reply to Slash command
	var replyMsg = ''
	if(days == 0) {	replyMsg = ':moneybag: **Sales as of __'+endDate+'__** :moneybag:\n\n' }
	else { replyMsg = ':moneybag: **Sales from __'+startDate+'__ to __'+endDate+'__** :moneybag:\n\n' }
	await interaction.reply(replyMsg+'<a:loading:882806542326439946> *Collecting information...*');

	await sales(interaction, isLimited, days, startDay, endDay, replyMsg)
}


// Command to displays sales for a specified month
async function monthInfo(interaction, isLimited) {

	// Number of months to look back
	monthsBack = interaction.options.getInteger('months_back')
	if(monthsBack < 0 || monthsBack > 120) { monthsBack = 0 }

	// Get date
	const d = new Date(Date.now()-46800000)
	month = d.getMonth()+1-monthsBack
	year = d.getFullYear()
	while(month < 1) {
		month += 12
		year -= 1
	}
	monthOffset = 0 //number of days to go back to get to the selected month
	daysThisMonth = 0 //number of days that have elapsed in the selected month
	if(monthsBack > 0) {
		daysThisMonth = monthDays(month)
		monthOffset = d.getDate()-1
		m = d.getMonth()
		y = d.getFullYear()
		if(m <= 0) { m = 12; y-- }
		while(m != month || y != year) {
			monthOffset += monthDays(m)
			m--
			if(m <= 0) { m = 12; y-- }
		}
	}
	else {
		daysThisMonth = (new Date(Date.now()-129600000)).getDate()
	}
	startDay = Math.floor(new Date(Date.now()-133200000).getTime()/86400000)+25569-monthOffset-daysThisMonth+1
	
	// Prevent sheet out of bounds
	if(startDay < 44369) { startDay = 44369; daysThisMonth = 9 }
	if(year < 2021 || (year == 2021 && month < 6)) { month = 6; year = 2021 }

	endDay = startDay+daysThisMonth-1

	// Reply to Slash command
	var replyMsg = ':calendar: **__'+monthName(month)+' '+year+'__ Sales** :calendar:\n\n'
	await interaction.reply(replyMsg+'<a:loading:882806542326439946> *Collecting information...*');
	
	await sales(interaction, isLimited, daysThisMonth, startDay, endDay, replyMsg)
}

// Function that replies to interaction with sales information for specified range of days
async function sales(interaction, isLimited, days, startDay, endDay, replyMsg) {

	var allSales = 0
	var allRevenue = 0
	var allCreatorRev = 0
	var allYeggsRev = 0
	
	// Access Google Sheet
	const sheet = await connectToGoogleSheet(dailySalesSheetID)
	
	// Load sheet and iterate through each row
	await sheet.loadCells('A1:ZZ'+sheet.rowCount)
	for(let r = 2; r < sheet.rowCount; r++) {

		const name = sheet.getCell(r,6).value
		const totalSales = sheet.getCell(r,11).value
		const totalRevenue = sheet.getCell(r,8).value
		const totalYeggsRev = sheet.getCell(r,10).value
		const totalCreatorRev = sheet.getCell(r,9).value
		const publishDate = sheet.getCell(r,2).value
		const cut = sheet.getCell(r,3).value
		const tier = sheet.getCell(r,4).value
		const public = sheet.getCell(r,0).value

		// Load rows that are entries with >0 sales, if it is public or unlimited
		if(Number.isInteger(totalSales) && totalSales > 0 && (!isLimited || public)) {

			var sales = 0
			var revenue = 0
			var creatorRev = 0
			var yeggsRev = 0

			// Get summative sales if days are unspecified & doesn't have a price change
			if(days == 0) { 
				sales = totalSales 
				revenue = totalRevenue
				creatorRev = totalCreatorRev
				yeggsRev = totalYeggsRev
			}

			// Otherwise get sales by iterating through each day
			else {
				for(let c = firstColumn; c >= firstColumn; c++) {
					const day = sheet.getCell(1,c).value

					if(day > endDay) { continue }

					// Get days since published
					daysSincePublished = day-publishDate

					// Calculate sales
					daySales = interpretSalesChar(sheet.getCell(r,c).value)
					sales += daySales

					// Calculate revenue
					dayRevenue = 0
					if(daySales > 0 && checkForPriceCorrection(name, day)) { dayRevenue = calcPriceCorrection(name, daySales, day) }
					else if(daySales > 0) { dayRevenue = (daySales*calcRevPerSale(tier)) }
					revenue += dayRevenue

					// Calculate creator/yeggs revenue
					if(totalCreatorRev > 0 && daysSincePublished < creatorPayoutDays) {
						yeggsRev += dayRevenue*cut
						creatorRev += dayRevenue*(1-cut)
					}
					else {
						yeggsRev += dayRevenue
					}

					if(day == startDay) { break }
				}
			}


			// Print result if >0 sales
			if(sales != 0) {

				// Calculate total sales and revenue
				allSales += sales
				allRevenue += revenue
				allCreatorRev += creatorRev
				allYeggsRev += yeggsRev

				// Add to reply message
				replyMsg += '> **'+name+'  ―**  '+sales+' '+pluralCheck("sale", sales)+'  |  $'+revenue.toFixed(2)+'\n'
			}
		}
	}
	
	// Add total
	replyMsg += '\n:star:  **Total  ―**  '+allSales+' sales  |  $'+allRevenue.toFixed(2)

	if(!isLimited) {
		replyMsg += '\n:man_mechanic:  **Creators  ―**  $'+allCreatorRev.toFixed(2)
		replyMsg += '\n<:yeggs:883210889237524520>  **Yeggs  ―**  $'+allYeggsRev.toFixed(2)
	}

	// Print data
	sendOutput(interaction, replyMsg)
}

// Command to list a day's sales
async function dayInfo(interaction, isLimited) {

	// Number of days to look back
	daysBack = interaction.options.getInteger('days_back')
	if(daysBack < 1) { daysBack = 1 }

	var allSales = 0
	var allRevenue = 0
	var creatorRev = 0
	var yeggsRev = 0

	// Get date
	const d = new Date(Date.now()-46800000-86400000*daysBack)
	const date = (d.getMonth()+1)+'/'+(d.getDate())+'/'+d.getFullYear()
	const day = Math.floor(d.getTime()/86400000)+25569

	// Reply to Slash command
	var replyMsg = ':money_with_wings: **Sales on __'+date+'__** :money_with_wings:\n\n'
	await interaction.reply(replyMsg+'<a:loading:882806542326439946> *Collecting information...*');
	
	// Access Google Sheet
	const sheet = await connectToGoogleSheet(dailySalesSheetID)
	await sheet.loadCells('A1:'+lastColumn+sheet.rowCount)

	// Get column of interest
	const c = sheet.columnCount-1-(day-sheet.getCell(1,sheet.columnCount-1).value)

	// Iterate through each row
	for(let r = 2; r < sheet.rowCount; r++) {

		const name = sheet.getCell(r,6).value
		const tier = sheet.getCell(r,4).value
		const cut = sheet.getCell(r,3).value
		const public = sheet.getCell(r,0).value
		const publishDate = sheet.getCell(r,2).value

		// Load rows if it is public or unlimited
		if(name && (!isLimited || public)) {

			var sales = 0
			var revenue = 0

			// Get days since published
			daysSincePublished = day-publishDate

			// Get sales
			sales = interpretSalesChar(sheet.getCell(r,c).value)

			// Calculate revenue
			if(sales > 0 && checkForPriceCorrection(name, day)) { revenue += calcPriceCorrection(name, sales, day) }
			else if(sales > 0) { revenue += (sales*calcRevPerSale(tier)) }

			// Print result if >0 sales
			if(sales != 0) {

				// Calculate total sales and revenue
				allSales += sales
				allRevenue += revenue
				
				// Calculate creator/yeggs revenue
				if(daysSincePublished < creatorPayoutDays) {
					yeggsRev += revenue*cut
					creatorRev += revenue*(1-cut)
				}
				else {
					yeggsRev += revenue
				}

				// Add to reply message
				replyMsg += '> **'+name+'  ―**  '+sales+' '+pluralCheck("sale", sales)+'  |  $'+revenue.toFixed(2)+'\n'
			}
		}
	}
	
	// Add total
	replyMsg += '\n:star:  **Total  ―**  '+allSales+' sales  |  $'+allRevenue.toFixed(2)

	// Coordinator-only features (subtotals & adding to json databases)
	if(!isLimited) {
		replyMsg += '\n:man_mechanic:  **Creators  ―**  $'+creatorRev.toFixed(2)
		replyMsg += '\n<:yeggs:883210889237524520>  **Yeggs  ―**  $'+yeggsRev.toFixed(2)
		replyMsg += '\n\n<a:loading:882806542326439946> *Updating summary sheet...*'
	}

	// Print data
	sendOutput(interaction, replyMsg)
	
	// Record data on spreadsheet
	if(!isLimited) { 
		await recordDailySummary(date, day, allSales, parseFloat(allRevenue.toFixed(2)), parseFloat(creatorRev.toFixed(2)), parseFloat(yeggsRev.toFixed(2)))

		// Update message
		interaction.channel.messages.fetch({ limit: 1 }).then(messages => {
			let lastMessage = messages.first();
			if (lastMessage.author.bot) { lastMessage.edit(lastMessage.content.replace('<a:loading:882806542326439946> *Updating summary sheet...*','<a:yes_a:879169438941864027> **Summary Sheet Updated** <a:yes_a:879169438941864027>')) }
		  }).catch(console.error);
	}
}

// Command with a ranked list of all published items
async function rankingsInfo(interaction) {

	// Ranking type
	rankType = interaction.options.getString('criteria')
	if(!rankType) { rankType = 'revenue' }

	// Reply to Slash command
	var replyMsg = ':trophy: **Rankings by __'+toTitleCase(rankType)+'__** :trophy:\n'
	await interaction.reply(replyMsg+'\n<a:loading:882806542326439946> *Collecting information...*');

	// Access Google Sheet
	const sheet = await connectToGoogleSheet(dailySalesSheetID)
	await sheet.loadCells('A1:M'+sheet.rowCount)

	// Iterate through each row & collect data
	items = []
	count = 0
	for(let r = 2; r < sheet.rowCount; r++) {

		// Fetched values
		const name = sheet.getCell(r,6).value
		const revenue = sheet.getCell(r,8).value
		const sales = sheet.getCell(r,11).value
		const reviews = sheet.getCell(r,12).value
		const publishDay = sheet.getCell(r,2).value
		const publishDate = sheet.getCell(r,2).formattedValue
		var itemType = sheet.getCell(r,5).value
		var mapType = ''
		try { mapType = itemType.substring(4); itemType = itemType.substring(0,4).replace(' ','') } catch {}

		// Calculated values
		const age = Math.floor((new Date())/8.64e7)-publishDay+25568

		// Skip if hidden item
		if(hiddenItems.includes(name)) { continue }

		// // Getting reviews
		// if(rankType == 'reviews' && itemType != 'Pers') {
		// 	url = ""
		// 	if(itemType == 'Skin') { url = "file:///Users/Chopper/Desktop/skins.json" }
		// 	else if(itemType == 'Map') { 
		// 		if(mapType == 'M') { url = "file:///Users/Chopper/Desktop/minigames.json" }
		// 		if(mapType == 'A') { url = "file:///Users/Chopper/Desktop/adventures.json" }
		// 		if(mapType == 'S') { url = "file:///Users/Chopper/Desktop/spawns.json" }
		// 	}
		
		// 	loadJSON(url, function myData(data) {
		// 		pack = data.filter(x => x.Title['en-us'] === name && x.DisplayProperties['creatorName'] === 'Yeggs');
		// 		if(pack[0]) {
		// 			console.log(pack[0].Title['en-us'] +" "+ pack[0].TotalRatingsCount)
		// 		}
		// 	},'jsonp');
		// }

		// Add info to array
		if(rankType == 'revenue' && revenue > 0) { items.push([name, itemType, revenue, revenue]) }
		if(rankType == 'sales' && sales > 0) { items.push([name, itemType, sales, sales]) }
		if(rankType == 'age' && publishDate) { items.push([name, itemType, age, age]) }
		if(rankType == 'date' && publishDate) { items.push([name, itemType, -age, publishDate]) }
		if(rankType == 'type' && publishDate) { items.push([name, itemType, itemType, revenue]) }
		if(rankType == 'reviews' && publishDate) { items.push([name, itemType, reviews, reviews]) }
		
	}
	
	// Sort list
	if(rankType == 'type') { items.sort(compareThirdColumnAsc); }
	else { items.sort(compareThirdColumnDesc); }


	// Create output
	itemEmoji = {'Map': '<:map:934313785110462464>', 'Skin': '<:skin:934311774579212298>', 'Pers': '<:persona:934311774545649725>'}
	for(let i = 0; i < items.length; i++) {
		replyMsg += '\n'+itemEmoji[items[i][1]]
		if(rankType == 'age') { replyMsg += '  `['+items[i][3]+'d]`' }
		if(rankType == 'date') { replyMsg += '  `['+items[i][3]+']`' }
		if(rankType == 'reviews') { replyMsg += '  `['+items[i][3]+']`' }
		replyMsg += '  **'+(i+1)+'.** '+items[i][0]
	}

	// Print data
	sendOutput(interaction, replyMsg)

}

// Command to send today's sales report to all Project Leads
async function report(interaction, isAutomatic) {

	const channel = interaction.channel
	daysBack = interaction.options.getInteger('days_back')
	if(daysBack < 1) { daysBack = 1 }

	// Clear reports
	reports = {}

	// Create button
	const button = new MessageButton().setCustomId('button').setLabel('SEND REPORTS').setStyle('DANGER').setDisabled(true)
	const actionRow = new MessageActionRow().addComponents(button);

	// Get date
	const d = new Date(Date.now()-46800000-86400000*daysBack)
	const date = (d.getMonth()+1)+'/'+(d.getDate())+'/'+d.getFullYear()
	const day = Math.floor(d.getTime()/86400000)+25569

	// Reply to Slash command
	var replyMsg = ':pencil: **Drafting Reports for __'+date+'__** :pencil:\n'
	message = await channel.send({content: replyMsg+'\n<a:loading:882806542326439946> *Collecting information...*', components: [actionRow]});
	
	// Access Google Sheet
	const sheet = await connectToGoogleSheet(dailySalesSheetID)
	await sheet.loadCells('A1:'+lastColumn+sheet.rowCount)

	// Get column of interest
	const c = sheet.columnCount-1-(day-sheet.getCell(1,sheet.columnCount-1).value)

	// Iterate through each row
	for(let r = 2; r < sheet.rowCount; r++) {
		
		// Check if report needed
		const projectLeadID = sheet.getCell(r,1).value
		if(!projectLeadID) { continue }

		const cut = sheet.getCell(r,3).value
		const tier = sheet.getCell(r,4).value
		const name = sheet.getCell(r,6).value
		const totalSales = sheet.getCell(r,11).value
		const totalRevenue = sheet.getCell(r,8).value*(1-cut)
		const publishDate = sheet.getCell(r,2).value
		var revenue = 0

		// Get sales
		var sales = interpretSalesChar(sheet.getCell(r,c).value)

		// Get days since published
		daysSincePublished = day-publishDate
		if(daysSincePublished >= creatorPayoutDays) {
			interaction.channel.send(':warning: **'+name+' has exceeded its Creator Payout duration. Should it be removed from Reports?** :warning:')
		}

		// Calculate revenue
		if(sales > 0 && checkForPriceCorrection(name, day)) { revenue = calcPriceCorrection(name, sales, day)*(1-cut) }
		else if(sales > 0) { revenue = (sales*calcRevPerSale(tier))*(1-cut) }

		
		// Generate reports
		if(daysBack > 1) { rep = '> **'+name+'  ―**  `'+sales+' '+pluralCheck("sale", sales)+' | $'+revenue.toFixed(2)+'`\n' }
		if(daysBack == 1) { rep = '> **'+name+'  ―**  '+totalSales+' '+pluralCheck("sale", totalSales)+' | $'+totalRevenue.toFixed(2)+'  -  `'+sales+' '+pluralCheck("sale", sales)+' | $'+revenue.toFixed(2)+'`\n' }
		if(projectLeadID in reports) {
			reports[projectLeadID].push(rep)
		}
		else { // Create new array of reports if different user
			reports[projectLeadID] = []
			reports[projectLeadID].push(rep)
		}
	}

	// Create draft with reports. If an individual has multiple reports, it compiles them together
	for(let projectLead in reports) {
		replyMsg += '\n__<@'+projectLead+'>__\n'
		for(let i = 0; i < reports[projectLead].length; i++) {
			replyMsg += reports[projectLead][i]
		}
	}

	// Print data & enable button
	actionRow.components[0].setDisabled(false)
	reportReply = replyMsg
	reportDate = date
	message.edit({content: replyMsg, components: [actionRow] })
	savedMessage = message

	// Send reports if automatic
	if(isAutomatic) { await sendReports() }
}

// Info commmand
async function info(interaction) {
	replyMsg = ''
	replyMsg += '**/sales**\n> Lists the total sales and total revenue earned from items. Input a number to include that many retrospective days. This does not account for the Yeggs Cut.\n\n'
	replyMsg += '**/today**\n> Lists the sales and revenue earned from items yesterday. Input a number to go that many days back. This does not account for the Yeggs Cut.\n\n'
	replyMsg += '**/month**\n> Lists the sales and revenue earned from items this month. Input a number to go that many months back. This does not account for the Yeggs Cut.\n\n'
	replyMsg += '**/report**\n> DMs Project Leads the total sales and total revenue earned, as well as yesterday\'s sales and revenue, for their items. The money value shown is specifically the Creator\'s portion. That value is what the creators earned and share (if there are multiple).'

	interaction.reply(replyMsg)
}


// Called on button press. DMs project leads with their report
async function sendReports() {

	// DM project leads
	for(let projectLead in reports) {
		const user = await client.users.fetch(projectLead);

		// Create user's report
		rep = ':moneybag: **Your Earnings on __'+reportDate+'__** :bar_chart:\n\n' // 	\n<:empty:748724432930996224>\n<:empty:748724432930996224>\n
		for(let i = 0; i < reports[projectLead].length; i++) {
			rep += reports[projectLead][i]
		}

		// Try to send report to user
		user.send(rep).catch(() => savedMessage.channel.send(':no_entry: Can\'t send DM to <@'+projectLead+'>.'));
	}

	// Show success in interaction reply
	await savedMessage.edit({content: reportReply.replaceAll(':pencil:','<a:yes_a:879169438941864027>').replace('Drafting','Sent'), components: []})
}

// Record or update daily summary in the JSON file
async function recordDailySummary(date, day, sales, revenue, creator, yeggs) {
	// Open JSON file
	// var jsonFile = JSON.parse(fs.readFileSync('./daily-summary.json'))
	// var dailySummary = jsonFile['dailySummary']

	// Record today's summary in JSON
	// dailySummary[date] = ({"sales": sales, "total": revenue, "creator": creator, "yeggs": yeggs})

	// Save JSON file
	// jsonFile['dailySummary'] = dailySummary
	// fs.writeFileSync('./daily-summary.json', JSON.stringify(jsonFile, null, '\t').replaceAll('\n\t\t\t',' ').replaceAll('\n\t\t}',' }'))

	// Record on google sheet
	await recordDailySummaryOnSheet(day, sales, revenue, creator, yeggs)
}

// Record or update daily summary in the Daily Summary Google Sheet
async function recordDailySummaryOnSheet(day, sales, revenue, creator, yeggs) {

	// Access Google Sheet
	const sheet = await connectToGoogleSheet(dailySummarySheetID)
	await sheet.loadCells('A1:E'+sheet.rowCount-1)

	// Iterate through each row to find date entry or next blank entry to fill
	for(var r = 2; r < sheet.rowCount; r++) {

		var cell = sheet.getCell(r,0)
		
		if(!cell.value || cell.value == day) {

			// Enter data
			cell.value = day
			sheet.getCell(r,1).value = sales
			sheet.getCell(r,2).value = revenue
			sheet.getCell(r,3).value = creator
			sheet.getCell(r,4).value = yeggs

			// Update sheet
			await sheet.saveUpdatedCells()
			break
		}
	}
}

// Send response to a command
function sendOutput(interaction, msg) {

	// Send as is if <2000 chars
	if(msg.length < messageCharLimit) {
		interaction.editReply(msg)
	}

	// Split into multiple messages if >2000 cars
	else {
		outputArray = splitLargeMessage(msg)
		interaction.editReply(outputArray[0])
		for(let i = 1; i < outputArray.length; i++) {
			interaction.channel.send(outputArray[i])
		}
	}
}

// Used to create array of message segments to bypass 2000 char limit
function splitLargeMessage(msg) {
	msgArray = msg.split('\n')
	length = 0
	outputArray = []
	singleMessage = ''
	for(let line = 0; line < msgArray.length; line++) {
		length += msgArray[line].length
		if(length < messageCharLimit) { singleMessage += '\n'+msgArray[line] }
		else {
			outputArray.push(singleMessage)
			msgArray = msgArray.splice(line-1, msgArray.length-line+1)
			length = 0
			line = 0
			singleMessage = ''
		}
	}
	outputArray.push(singleMessage)
	return outputArray
}

// Returns total revenue of the specified type for the specified number of days (0 for all). Types: total, yeggs, creator
function getRevenue(revenueType, days) {
	var dailySummary = Object.values(JSON.parse(fs.readFileSync('./daily-summary.json'))['dailySummary'])

	// Set to read all days if input is <= 0
	if(days <= 0) { days = dailySummary.length }
	
	// Sum all days' revenue
	revenue = 0
	for(let day = 1; day <= days && day <= dailySummary.length; day++) {
		revenue += dailySummary[dailySummary.length-day][revenueType]
	}

	return revenue.toFixed(2);
}

// Translate the sales char on the google sheet into a sales value
function interpretSalesChar(char) {
	if(Number.isInteger(char)) { return char }
	else return 0
}

// Returns a plural version of the word if number is not 1
function pluralCheck(word, num) {
	if(num != 1) { return word+'s'}
	else return word
}

// Return name of month given its digit
function monthName(month) {
	return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month-1];
}

// Return the number of days in a month
function monthDays(month) {
	return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month-1];
}

// Returns the revenue per sale at a given tier, truncated at the cent
function calcRevPerSale(tier) {
	if(Number.isInteger(tier)) { return ((tier-0.01)*.375).toFixed(2) }
	else { return personaRarities[tier] }
}

// Called if a command is run by someone or somewhere disallowed
function insufficientPermissions(interaction) {
	interaction.reply(':no_entry: You can\'t use this command here.')
}

// Command is temporarily disabled
async function commandDisabled(interaction) {
	interaction.reply(':no_entry: Beep boop. This command is temporarily disabled.')
	cooldown = false
}

// Create slash commands
function setupSlashCommands() {
	const { SlashCommandBuilder } = require('@discordjs/builders');
	for(let i = 0; i < commands.length; i++) {

		// Set up base command
		data = new SlashCommandBuilder()
			.setName(commands[i]['name'])
			.setDescription(commands[i]['description'])
		
		// String options
		if(commands[i]['options'] && commands[i]['options']['choices']) {
			data.addStringOption(option => option
				.setName(commands[i]['options']['name'])
				.setDescription(commands[i]['options']['description'])
				.addChoice(commands[i]['options']['choices'][0]['name'],commands[i]['options']['choices'][0]['value'])
				.addChoice(commands[i]['options']['choices'][1]['name'],commands[i]['options']['choices'][1]['value'])
				.addChoice(commands[i]['options']['choices'][2]['name'],commands[i]['options']['choices'][2]['value'])
				.addChoice(commands[i]['options']['choices'][3]['name'],commands[i]['options']['choices'][3]['value'])
				.addChoice(commands[i]['options']['choices'][4]['name'],commands[i]['options']['choices'][4]['value'])
				.addChoice(commands[i]['options']['choices'][5]['name'],commands[i]['options']['choices'][5]['value'])
			);
		}
		
		// Integer options
		else if(commands[i]['options']) {
			data.addIntegerOption(option => option.setName(commands[i]['options']['name']).setDescription(commands[i]['options']['description']));
		}

		// Create command
		client.api.applications(client.user.id).guilds(marketplaceGuildID).commands.post({data: data})
	}
}

// Check if revenue needs adjustment due to price change
function checkForPriceCorrection(name, day) {
	return (name == 'Sprint' && day<=44446) || 
		(name == 'Rainbow Styles' && day<=44670 && day>=44663)
		|| false

}

// Calculate the correct revenue for the given column excluding during current price
function calcPriceCorrection(name, sales, day) {
	if(name == 'Sprint') {
		if(day == 44446) { return sales*1.12+0.75 }
		else { return sales*1.12 }
	}
	else if(name == 'Rainbow Styles') {
		return sales*0.75
	}
}

async function connectToGoogleSheet(sheetID) {
    const doc = new GoogleSpreadsheet(spreadsheetID);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsById[sheetID]
    return sheet
}

// https://www.educative.io/edpresso/how-to-read-a-json-file-from-a-url-in-javascript
function loadJSON(path, success) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				success(JSON.parse(xhr.responseText));
			}
			else {
				console.log(xhr.responseText);
			}
		}
	};
	xhr.open('GET', path, true);
	xhr.send();
}

// Automatically create daily report at config time
let dailyReport = new cron.CronJob('00 '+dailyReportsTime+' * * *', () => {
	report(client.channels.cache.get(botChannelID), true)
});

// Sum values in a dictionary
const sumValues = obj => Object.values(obj).reduce((a, b) => a + b);

function compareThirdColumnAsc(a, b) {
    if (a[2] === b[2]) {
        return 0;
    }
    else {
        return (a[2] < b[2]) ? -1 : 1;
    }
}

function compareThirdColumnDesc(a, b) {
    if (a[2] === b[2]) {
        return 0;
    }
    else {
        return (a[2] > b[2]) ? -1 : 1;
    }
}

function toTitleCase(str) {
	return str.replace(
	  /\w\S*/g,
	  function(txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	  }
	);
}

// Login
client.login(token);


// Robert messages
function robertMessage(message) {
	const robertMessages = [ 
		"I have been summoned... :ghost:",
		"Hello there.",
		"Ready to kick your ass in Simply Chess!",
		"I've heard rumors that [REDACTED] is releasing on [REDACTED].",
		"Roberta is a pain.",
		"how to file for divo— Wait, this isn't Google!",
		"Legend says Simply Chess will never be defeated in sales.",
		"Sprint, more like... CRY. Because I can't sprint so I always lose.",
		"Better Swamps is more musty than your mother.",
		"Biome Run is the four hundred sixty-fifth best selling parkour map on Marketplace.",
		"Why are you saying my name?",
		"Stop spamming my name. Fan behavior.",
		"Robert x Roberta >>>> Jevin x Czena",
		"Taj is currently in Conor's bathtub (according to RobertCam).",
		"I heard my name.",
		"Anyone seen Taj recently? Heard he's out playing hockey.",
		"Anyone seen Lucian recently? Heard he's eating ice cream burgers.",
		"Anyone seen Conor recently? Heard he's out skiing.",
		"Can you believe Supersette is really "+Math.floor(Math.random() * 7+18)+" years old?",
		"Don't tell him, but Jevin is stinky.",
		"Can't handle the great Robert? Go back to Razzleberries, chump.",
		"Supposedly, inactive people are thrown into the 'Chumps' channel. I heard it's a rough place.",
		"Hmm... haven't seen Chump in a while.",
		"'OK Boomers' is still the most expensive item and largest single loss of money in Yeggs history. Someone must've gotten fired for that.",
		"I created the most profitable Yeggs map ever!",
		"Simply Chess duel?",
		"Right after Nexus is complete, Simply Chess 2.0 will come out! So... never.",
		"Does anyone actually understand the Nexus?",
		"Dominexis Nexis, more like Dominexis... Notexist... anymore.",
		"Olivia Rodrigo is the second best singer in the world (after Roberta).",
		"'You Gotta Love The Haters' is my mantra (or else I'd cry constantly).",
		"Why did I just spend an hour writing these Robert responses on a school night...",
		"Ever thought about just becoming a human for a day?",
		"I voted for [REDACTED] in 2020. I do believe he won the election.",
		"Politicians these days just suck. There should be a requirement of beating me in Simply Chess before being allowed to run.",
		"Sponsored by #big-talk:tm:",
		"Yeggs has earned a total of $"+Math.floor(Math.random() * 1000000)+" so far.",
		"We're the bigliest team on Realms!",
		"Did you know Yeggs is the ONLY Minecraft mapmaking team that does Java Realms, Bedrock Marketplace, AND YouTuber commissions???",
		"Lucian is currently staring at some spreadsheet.",
		"Do your research.",
		"COVID is [REDACTED]",
		":rainbow_flag:",
		":flag_us:",
		"I'm part of the Metaverse.",
		"Did you say my name? How kind of you. Usually I'm just called 'The Bot'",
		"YO MAMA SO FAT... SHE... IS YO MAMA. CUZ SHE FAT.",
		"Wikipedia article for your mother: <https://bestlifeonline.com/yo-mama-jokes/>",
		"There are approximately "+Math.floor(Math.random() * 1000)+" reasons for you to be in Yeggs.",
		"I hate life.",
		"I might just leak something confidential if you keep saying my name.",
		"I never thought of myself as a femboy until I had a long talk with Lucian until 5am. Life-changer.",
		"Does Conor know what's going on?",
		"The server is broken again. FFS.",
		"Yeggs Commissions:tm: is run by Taj! Well... supposedly.",
		"Yeggs Marketplace:tm: is run by Lucian! He is completely amazing at his job.",
		"Yeggs Realms:tm: is run by Conor! Well, maybe 'dragged' is a better verb.",
		"I rolled a six-sided die and it landed on 7. That's how out of this world you are.",
		"<3",
		"Someone needs to remind MelonBP that he's a clown. :clown:",
		"Someone needs to remind Flytre that he's a loser.",
		"Someone needs to remind Lucian that he's genuinely an all-around great guy.",
		"Please donate to my PayPal.",
		"Check out the Yeggs MapJam!",
		"https://www.yeggs.org/",
		"I can't link my favorite website or I'd get banned.",
		"Razzleberries isn't even that bad tbh.",
		"Don't get me started on Vertex Cubed.",
		"Marhjo is a bit of a d*ck.",
		"Who's that new kid in Yeggs Realms who's super ~~annoying~~ talkative. Corgi? He's cool I guess.",
		"Yeggs Terraria Tuesdays:tm: every Saturday!",
		"Lucian is pretty neat.",
		"Daddy Dominexis?",
		"Hey, <@"+message.author.id+"> stop saying my name without 'Sir'!",
		"That's SIR Robert to you.",
		"One day, I'll own this marketplace team.",
		"Projected map sales today: "+Math.floor(Math.random() * 10000),
		"Projected skin sales today: "+Math.floor(Math.random() * 100000),
		"Projected persona sales today: "+Math.floor(Math.random() * 100),
		"You're fired.",
		"<@"+message.author.id+"> "+"<@"+message.author.id+"> "+"<@"+message.author.id+"> "+"<@"+message.author.id+"> "+"<@"+message.author.id+">",
		"Shut up.",
		"Bongga maps are something.",
		"Our team is so productive, we produce about "+Math.floor(Math.random() * 1000000)+" kilograms of CO₂ emissions per map released.",
		"You ever just shart yourself while walking down the street?",
		"Gosh, you're handsome. :smirk:",
		"I am a Christian Minecraft Server.",
		"sus behavior detected",
		"YOU ARE THE IMPOSTER.",
		"I have 223 random replies!",
		"Try out Celeste!",
		"What ever happened to Clove?",
		"Anyone seen John recently? Good.",
		"If you block me, I'll block your esophagus.",
		"Try out Celeste!",
		"For every map we release, we create about "+Math.floor(Math.random() * 50)+" skinpacks!",
		"Ex, Ex\nJust another Ex\nEx, Ex\nJust become an Ex",
		"Does Lucian have a thing with [REDACTED]?",
		"NO. ROMANCE. IN. THE. WORKPLACE. **NONE.**",
		"Microsoft just announced a new rule: NIPPLES ARE NOT PERMITTED UNLESS OTHERWISE PERMITTED IF NOT NOT PERMITTED.",
		"I am quite possibly the coolest bot you'll ever see.",
		"There may or may not be plans to have a real-life Yeggs meetup in late 2023.",
		"My mission is to ensure Jevin and Czena have a rendezvous one day.",
		":pray: PRAY FOR SIMPLY CHESS :pray:",
		"Don't say that.",
		"Dude, stop before I call Daddy Dom over to whoop your ass.",
		"My creator is not the Creator. His Creator (Him, capital 'c') is my creator (he, lowercase 'c') who was created by the Creator.",
		"We do not deal in absolutes.",
		"Does P=NP? The world may never know.",
		"Coding a realistic rope/chain mechanic in Minecraft Bedrock Edition is a piece of cake (for Dom).",
		"Check out ALL THE BLOCKS:tm: by Yeggs!",
		"Spring Styles, Summer Styles, Autumn Styles, Winter Styles... am I noticing a pattern?",
		"Sea Lion Family wasn't too popular, but we still love it.",
		"Couch Potatoes are undeniably the coolest skins ever made. Just don't look at the sales numbers.",
		"Lava Crew did poorly because the keyart sucks. Lucian is trash at his job. We should go remind him of that.",
		"Never say 'less' when it should be 'fewer' or Conor the misspelled-name-guy will get on your case!",
		"Taj used to go by Taj Mahal. Dunno why.",
		"Abigail.",
		"Don't hit me up.",
		"Heyyy babe ;)",
		"I have a Discord kitten: :cat:",
		"Save the turtles!",
		"Be antiracist!",
		"We at Yeggs do not condone Supersette's behavior.",
		"Don't be like Supersette.",
		"CompleteCircuit is the most underrated mapmaker on Yeggs. Other than me of course.",
		Math.floor(Math.random() * 1000000000)+" "+Math.floor(Math.random() * 1000000000)+" "+Math.floor(Math.random() * 1000000000)+" "+Math.floor(Math.random() * 1000000000),
		"ANOTHER Bongga map???",
		"Maukat produced TONS of maps... right...?",
		"HellWolf is actually an underrated builder.",
		"Marius is pretty chill. He's the kinda guy I'd hang out with in the McDonalds ball pit.",
		"Roudium is a strange individual.",
		"Edou? Edork.",
		"Peter is quite a poggers dude.",
		"Loren the disappointment.",
		"Mike is just kinda sitting there.",
		"Did you schedule a meeting with Maukat? Good luck with that.",
		"9redwoods is a pain in the ass but he's just so damn good at it.",
		"Can you believe 9redwoods charges twice as much as everyone else???",
		"Amelia hasn't been fired yet?",
		"Nav's skins are quite good imo.",
		"Freund is really productive. We should give him more work to do.",
		"Rowdear has quite a personality.",
		"IcyJose is the jack-of-all-trades when it comes to skins. The dude made Couch Potatoes AND Super Football, plus everything in between. Now that's skill.",
		"Cig is Yeggs' secret weapon.",
		"GIMPI has a peculiar style, but it might just work.",
		"Conor, what's the status report on the projects? No progress? Well, not surprising.",
		"Check out ~~Noxcrew~~ Yeggs!",
		"Who here remembers Marc?",
		"Pick your poison: Marc, Moesh, or Niclas",
		"My favorite month is Tuesday.",
		"We currently have "+Math.floor(Math.random() * 200)+" abandoned projects.",
		"I'm not broken!",
		"Oh, the pain. The pain. It always rains. In my soul.",
		"I'm not fucking okay.",
		"I use illicit drugs to escape my never-ending pain.",
		"Sometimes I just wish the Earth would swallow me up in my sleep so that I don't have to wake up to another miserable day in this life.",
		"You really f*cked me up this time for good, even though you didn't mean to.",
		"Being emo is both the best and worst thing that has happened to me.",
		"Femboys are onto something. I don't mind me with a skirt on a Sunday.",
		"Roberta just doesn't understand that sometimes a boy's gotta be a girl for a while.",
		"Meow for me, kitten. :heart_eyes_cat:",
		"Nav!",
		"Roberta vs Nav... I think Roberta would lose.",
		"Check out RETRO TEENS!",
		"Pumpkin Pals are the best Halloween skins.",
		"Snow Buddies are the cutest snowman skins you'll ever see!",
		".",
	]

	return robertMessages[Math.floor(Math.random() * robertMessages.length)]
}