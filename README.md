![](https://i.4da.ms/dWVXpH.png)

Discord-Crypto is a simple self-hostable bot for Discord providing current crypto currency exchange rates 
in a neat and informative design.

## Examples
![](https://i.imgur.com/ZAcSpwF.png)
![](https://i.imgur.com/DrygOk8.png)
![](https://i.imgur.com/Nrzf0e5.png)

## Prerequisites
In order to get this application running, you will need the following things:

- A [Node.js](https://nodejs.org/en/) installation
- A [cryptocompare.com](https://cryptocompare.com) api key
- A [registered Discord application](https://discordapp.com/developers/applications/)

## Installation
To install and run this application on your own machine, simply run the following commands:

```
git clone https://github.com/4dams/Discord-Crypto.git && cd Discord-Crypto
npm install
```

Now that all dependencies are installed, simply edit `config.json` and fill in all your information, 
including the desired currencies and exchanges. Then run the following code to start up the bot:

```
node index.js
```

## Usage
After you installed the bot and added it to your server, simply type `=cc` in any channel the bot can see
and it will provide you with the most recent exchange rates.

## Upcoming
- [X] Request exchange rates for given currencies (e.g. '=cc btc eth')
- [ ] Edit `config.json` via commands
- [ ] Detailed explanation of `config.json`
- [ ] Split commands into file
- [ ] ^ Update command handler
- [ ] Crypto news
- [ ] **Caching to prevent unnecessary API calls**


