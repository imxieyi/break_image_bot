const BrkImg = require('./brkimg.js');
const Telegraf = require('telegraf');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;
const SocksProxyAgent = require('socks-proxy-agent');

const API_TOKEN = process.env.API_TOKEN || '';
const PORT = process.env.PORT || 3000;
const URL = process.env.URL || 'https://your-heroku-app.herokuapp.com';

const logger = createLogger({
    level: (typeof config.level == 'undefined') ? 'info' : config.level,
    format: combine(
        timestamp(),
        prettyPrint()
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'bot.log' })
    ]
});

var agent = null;
if (process.env.SOCKS_PROXY) {
    agent = new SocksProxyAgent(process.env.SOCKS_PROXY);
}
const options = {
    telegram: {
        agent: agent,
        webhookReply: true
    }
};
const bot = new Telegraf(API_TOKEN, options);

bot.start(ctx => ctx.reply('Send image you want to break to me.'));
bot.command('help', ctx => {
    ctx.reply('Send image you want to break to me. It can be either photo or document.')
});

var breakDocument = function(fileId, name, ctx) {
    return bot.telegram.getFileLink(fileId).then(fileLink => {
        if (fileLink) {
            BrkImg.breakImage(fileLink, agent).then(result => {
                if (result === null) {
                    ctx.reply('Failed to read image.');
                    return;
                }
                ctx.replyWithPhoto({ source: result , filename: `${name}.png` });
                ctx.replyWithDocument({ source: result , filename: `${name}.png` });
                logger.info(`[${ctx.message.from.id}] Replied.`);
            });
        }
    });
}

bot.on('photo', ctx => {
    logger.info(`[${ctx.message.from.id}] Sent a photo.`);
    if (ctx.message.photo.length >= 2) {
        var fileId = ctx.message.photo[1].file_id;
        logger.info(`[${ctx.message.from.id}] File id: ${fileId}`);
        breakDocument(fileId, 'result', ctx).catch(err => {
            logger.error(err);
            ctx.reply(`Failed to download image.`);
        });
    }
});

bot.on('document', ctx => {
    logger.info(`[${ctx.message.from.id}] Sent a file.`);
    var document = ctx.message.document;
    if (document) {
        var fileId = document.file_id;
        logger.info(`[${ctx.message.from.id}] File id: ${fileId}`);
        breakDocument(fileId, `broken-${document.file_name.replace(/\.[^/.]+$/, '')}`, ctx).catch(err => {
            logger.error(err);
            ctx.reply(`Failed to download image.`);
        });
    }
});

bot.hears(/\/breakme/, ctx => {
    logger.info(`[${ctx.message.from.id}] /breakme`);
    bot.telegram.getUserProfilePhotos(ctx.message.from.id).then(userProfilePhotos => {
        var photos = userProfilePhotos.photos;
        var username = ctx.message.from.username;
        if (typeof photos !== 'undefined' && photos.length > 0 && photos[0].length > 0) {
            var fileId = photos[0][0].file_id;
            if (!username) {
                username = 'result';
            }
            logger.info(`[${ctx.message.from.id}] Profile photo file id: ${fileId}`);
            breakDocument(fileId, username, ctx).catch(err => {
                logger.error(err);
                ctx.reply(`Failed to download profile image for ${username}.`);
            });
        } else {
            ctx.reply(`User ${username} does not have profile photos.`);
        }
    }).catch(err => {
        logger.error(err);
        ctx.reply(`Failed to fetch profile image for ${username}.`);
    })
});

bot.telegram.setWebhook(`${URL}/bot${API_TOKEN}`);
bot.startWebhook(`/bot${API_TOKEN}`, null, PORT);

bot.launch();
