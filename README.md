# leo-bot
This is the source code for leo bot. You can [invite](https://discord.com/oauth2/authorize?client_id=1246326917334962188&permissions=8&scope=bot) the bot to your server.

### Components
Leo bot composes of the bot code, a command handler, and a server. The server is a simple express server that sends 200 ok requests to pings. It is used in uptime tests to determine if Leo Bot is still up or has crashed. You can use any uptime service that pings the server for this feature.

# Installation
If you would like to install Leo bot on your own server, continue to read the installation instructions, or simply [invite](https://discord.com/oauth2/authorize?client_id=1246326917334962188&permissions=8&scope=bot) Leo Bot to your server

### Dependencies
Leo bot has the following dependiencies for installation
- Docker installed
- Discord app setup in the Discord Developer portal
- Mongo database setup

## Instructions
Pull down the latest image from GHCR
`docker pull ghcr.io/nicharcha82/leo-bot-latest:latest`

If you already have a bot running, you will need to remove that image
`docker rm -f leo-bot`

You will then need to create a .env file in whatever directory you choose. Please see the example .env file below:
```
MONGO_URI=<mongodb+srv:url>
BOT_TOKEN=<DISCORD_BOT_TOKEN>
DEV_SERVERS=<DISCORD_DEV_SERVER_ID_1>,<DISCORD_DEV_SERVER_ID_2>,<ETC>
DEVS=<DISCORD_DEV_USER_ID_1>,<DISCORD_DEV_USER_ID_2>,<ETC>
```

You can then run Leo Bot by passing in the .env file in docker run command:
`docker run --env-file <path-to-.env-file -d -p 8080:5000 --name leo-bot ghcr.io/nicharcha82/leo-bot-latest:latest`

# Compile
If you would like to change the source code, or compile Leo Bot yourself continue to read the compile instructions, or simply install the prebuilt image or [invite](https://discord.com/oauth2/authorize?client_id=1246326917334962188&permissions=8&scope=bot) Leo Bot to your server

Download the latest Leo Bot release

extract the zip folder. You can make modifications to the source code here.

Compile the bot code
`docker build -t <DOCKER_IMAGE_NAME> .`

Create the bot env file. using the .env file example below:
```
MONGO_URI=<mongodb+srv:url>
BOT_TOKEN=<DISCORD_BOT_TOKEN>
DEV_SERVERS=<DISCORD_DEV_SERVER_ID_1>,<DISCORD_DEV_SERVER_ID_2>,<ETC>
DEVS=<DISCORD_DEV_USER_ID_1>,<DISCORD_DEV_USER_ID_2>,<ETC>
```

If you already have a bot running, you will need to remove that image
`docker rm -f leo-bot`

You can then run Leo Bot by passing in the .env file in docker run command:
`docker run --env-file <path-to-.env-file -d -p 8080:5000 --name leo-bot <DOCKER_IMAGE_NAME>`