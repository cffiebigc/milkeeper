var Botkit = require('botkit')
var milkDate = new Date('1990-01-01');
var request = require('request');
var cheerio = require('cheerio');

// Expect a SLACK_TOKEN environment variable
var slackToken = process.env.SLACK_TOKEN
if (!slackToken) {
    console.error('SLACK_TOKEN is required!')
    process.exit(1)
}

var controller = Botkit.slackbot()
var bot = controller.spawn({
    token: slackToken
})

bot.startRTM(function(err, bot, payload) {
    if (err) {
        throw new Error('Could not connect to Slack')
    }
})

controller.on('bot_channel_join', function(bot, message) {
    bot.reply(message, "I'm here!")
})

controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'cow',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello, if you need help just type @milkeeper `help` / `ayuda`');
        }
    });
});

controller.hears(['hello', 'hi'], ['direct_message'], function(bot, message) {
    bot.reply(message, 'Hello.')
    bot.reply(message, 'It\'s nice to talk to you directly.')
})

controller.hears('.*', ['mention'], function(bot, message) {
    bot.reply(message, 'You really do care about me. :heart:')
})

controller.hears(['help', 'ayuda'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot.reply(message, 'Take it easy, usage:\n' +
        '-@milkeeper `i changed the milk today` / `cambie la leche hoy`\n' +
        '-@milkeeper `i changed the milk at [yyyy-mm-dd]` / `cambie la leche el [yyyy-mm-dd]`\n' +
        '-@milkeeper `how is the milk?` / `como esta la leche?`  or just `milk` / `leche`\n');
});

controller.hears(['changed the milk at (.*)', 'cambie la leche el (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    milkDate = new Date(message.match[1]);
    var diff = Math.floor((Date.parse(new Date()) - Date.parse(milkDate)) / 86400000);
    if (milkDate == 'Invalid Date')
        bot.reply(message, 'Hey! please give me a valid date ');
    else if (diff < 0)
        bot.reply(message, 'Hey! nice try smartass! today is ' + new Date().toDateString());
    else {
        milkDate.setTime(milkDate.getTime() + milkDate.getTimezoneOffset() * 60 * 1000);
        bot.reply(message, 'Great. Milk changed at ' + milkDate.toDateString());
    }
});

controller.hears(['changed the milk today', 'cambie la leche hoy'], 'direct_message,direct_mention,mention', function(bot, message) {
    milkDate = new Date();
    bot.reply(message, 'Great. Milk changed at ' + milkDate.toDateString());
});

controller.hears(['milk', 'leche'], 'direct_message,direct_mention,mention', function(bot, message) {
    var diff = Math.floor((Date.parse(new Date()) - Date.parse(milkDate)) / 86400000);
    milkDate.setTime(milkDate.getTime() + milkDate.getTimezoneOffset() * 60 * 1000);
    var days = 'days'
    if (diff == 1)
        days = 'day'
    bot.reply(message, 'Last Milk change was at ' + milkDate.toDateString() + ' has been in the fridge for ' + diff + ' ' + days);
    if (diff > 3)
        bot.reply(message, 'Maybe you should change it :wink:');
});

// 'Cafe con Piernas' controller
controller.hears(['cafe con piernas'], 'direct_message,direct_mention,mention', function(bot, message) {
    console.log(message)
    var url = 'http://www.800.cl/ResultadoEspecial.asp?c=560&r=664&p=0&esp=7059,1709';
    request(url, function(error, response, html) {
        if (!error && response.statusCode == 200) {
            var results = [];
            var $ = cheerio.load(html);
            var n = Math.floor((Math.random() * 5) + 0);
            $('.cssTipoLugar560-cssNivelPrecio0-cssComuna1174').each(function(i, element) {
                var title = $(this).find('tr td a').attr('title');
                var link = $(this).find('tr td a').attr('href');
                var img = $(this).find('tr td img').attr('src');
                results.push({ 'title': title, 'link': link, 'img': img });
            });
            bot.reply(message, '`Recommended for you --->`');
            bot.reply(message, '*' + results[n]['title'] + '*');
            bot.reply(message, results[n]['img']);
            bot.reply(message, '+more info: http://www.800.cl/' + results[n]['link']);
        }
    });
});
