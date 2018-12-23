// Import modules
const Discord = require('discord.js');
const moment = require('moment');
const axios = require('axios');
const config = require('./config.json');

// Create and connect Discord client
const client = new Discord.Client();
client.login(config.token);

// Return promise
function getCryptoData() {
    return axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${config.currencies.join(',')}&tsyms=${config.translateTo.join(',')}&api_key=${config.cryptoApiKey}`)
}

// Return embed object
function getEmbed(data) {
    let fields = [];
    let currencyKey = Object.keys(data);
    currencyKey.forEach(currency => {
        let exchangeData = config.translateTo.map(cur => {
            return {
                name: cur,
                exchange: data[currency][cur]
            }
        });
        let exchangeString = '';
        exchangeData.forEach(exchange => {
            exchangeString += exchange['exchange'] + ' ' + exchange['name'] + '\n'
        });
        fields.push({
            name: `:chart_with_upwards_trend: ${currency}`,
            value: `**${exchangeString}**`,
            inline: false
        })
    });

    return {
        color: 0x7289DA,
        description: ":money_with_wings: __***Current Crypto Currency Exchange***__\n***Note**: Every data you see below is the exchange rate for **one coin** of each currency.*\n ",
        footer: {
            text: `Data last updated on ${moment().format('MMMM Do YYYY, h:mm:ss a')}`
        },
        fields: fields
    }
}

// Set bots status message
function setStatus() {
    const inputCurrency = 'BTC';
    const outputCurrency = 'EUR';
    axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${inputCurrency}&tsyms=${outputCurrency}&api_key=${config.cryptoApiKey}`)
        .then(res => {
            let statusString = `${inputCurrency} @ ${res.data[inputCurrency][outputCurrency]} ${outputCurrency}`;
            client.user.setActivity(statusString, {
                type: 'PLAYING'
            })
        })
}

// Handle message-event
client.on('message', message => {
    if (message.content.toLowerCase() === config.prefix + 'cc') {
        getCryptoData()
            .then(res => {
                message.channel.send({
                    embed: getEmbed(res.data)
                })
            })
            .catch(err => {
                console.log(err);
            });
    }
});

// Handle ready-event
client.on('ready', () => {
    // Log success message
    console.log('Discord-Crypto online!');

    // Set and then update clients status message in given interval
    setStatus();
    setInterval(() => {
        setStatus();
    }, config.refreshDelay);
});