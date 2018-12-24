![](https://i.4da.ms/dWVXpH.png)

Discord-Crypto is a simple self-hostable bot for Discord providing current crypto currency exchange rates 
in a neat and informative design.

## Example
![](https://i.4da.ms/MM7KR7.png)

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

## Planned Features
- [ ] Request exchange rates for given currencies (e.g. '=cc btc eth')
- [ ] More commands
