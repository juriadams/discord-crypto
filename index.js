// Import modules
const Discord = require('discord.js');
const moment = require('moment');
const axios = require('axios');
const format = require('currency-formatter');
const config = require('./config.json');

// Create and connect Discord client
const client = new Discord.Client();
client.login(config.token);

// Return promise
function getCryptoData(inputCurrencies, outputCurrencies) {
    return axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${inputCurrencies.join(',')}&tsyms=${outputCurrencies.join(',')}&api_key=${config.cryptoApiKey}`)
}

// Return embed object
function getEmbed(data) {
    let fields = [];
    let example = {
        from: config.currencies[0],
        to: config.translateTo[0],
        value: data[config.currencies[0]][config.translateTo[0]]
    };
    let currencyKeys = Object.keys(data);
    currencyKeys.forEach(currency => {
        let exchangeData = config.translateTo.map(cur => {
            return {
                name: cur,
                exchange: data[currency][cur]
            }
        });
        let exchangeString = '';
        exchangeData.forEach(exchange => {
            exchangeString += `${exchange['name']}: ` + format.format(exchange['exchange'], { code: exchange['name'], locale: 'de-DE' }) + '\n'
        });
        fields.push({
            name: `:chart_with_upwards_trend: **${currency}**`,
            value: `${exchangeString}`,
            inline: true
        })
    });

    return {
        title: ':money_with_wings: Current Crypto Exchange Rates',
        color: 4743568,
        description: `**Note**: The following exchange rates are 1:X for each currency.\n `,
        footer: {
            icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
            text: `Discord-Crypto | github.com/4dams/Discord-Crypto`
        },
        fields: fields
    }
}

// Set bots status message
function setStatus() {
    const inputCurrency = ['BTC'];
    const outputCurrency = ['EUR'];
    getCryptoData(inputCurrency, outputCurrency)
        .then(res => {
            let statusString = `${inputCurrency} @ ${format.format(res.data[inputCurrency][outputCurrency], { code: outputCurrency, locale: 'de-DE' })} `;
            client.user.setActivity(statusString, {
                type: 'WATCHING'
            })
        })
}

// Handle message-event
client.on('message', message => {
    if (message.content.toLowerCase() === config.prefix + 'cc') {
        getCryptoData(config.currencies, config.translateTo)
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