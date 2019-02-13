# Break Image Bot
Telegram Link: [http://t.me/break_image_bot](http://t.me/break_image_bot)

## Introduction
This is one of the most useless [Telegram](https://telegram.org/) bot in the world. It breaks whatever image you send.

## Commands
**Show help:** `/help`

**Break profile photo:** `/breakme`

**Break image:** send `photo` or `document`

## Environment
- Node.js 8.0+

## Installation
```sh
npm install
```

## Configuration
Create a file config.json:
```json
{
    "tg_bot_token": "Your Telegram bot token here",
    "log_file": "Log file",
    "socks_proxy": "socks://127.0.0.1:1086"
}
```

## Start
```sh
npm start
```