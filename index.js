// Import modules
const Discord = require('discord.js');
const axios = require('axios');
const format = require('currency-formatter');
const config = require('./config.json');

// Create and connect Discord client
const client = new Discord.Client();
client.login(config.token);

// Return promise
function getCryptoData(inputCurrencies, outputCurrencies) {
    return axios.get(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${inputCurrencies.join(',')}&tsyms=${outputCurrencies.join(',')}&api_key=${config.cryptoApiKey}`)
}

// Return embed object
function getEmbed(data) {
    // Define fields array for embed, prefill it with information-field
    let fields = [
        {
            name: ':bulb: **Information**',
            value: 'The following exchange rates are 1:X for each currency\n**▲/▼** shows the trend in the past 24 hours in exchange for each currency\n\u200B',
            inline: false
        }
    ];

    // Loop through all currencies and add their data to the fields array
    Object.keys(data).forEach(currency => {
        // Define trend icons and percent (from first translateTo-currency)
        let trend = data[currency][config.translateTo[0]]['CHANGEPCT24HOUR'] > 0 ? ':chart_with_upwards_trend:' : ':chart_with_downwards_trend:';
        let trendPercentPrefix = data[currency][config.translateTo[0]]['CHANGEPCT24HOUR'] > 0 ? '+' : '';
        let trendPercent = data[currency][config.translateTo[0]]['CHANGEPCT24HOUR'].toFixed(2);

        // Array with exchanges for crypto currency
        let exchangeData = config.translateTo.map(translatedTo => {
            return {
                name: translatedTo,
                exchange: data[currency][translatedTo]['PRICE'],
                trend: data[currency][translatedTo]['CHANGE24HOUR'] > 0 ? '▲' : '▼'
            }
        });

        // Generate string including exchange data
        let exchangeString = '';
        exchangeData.forEach(exchange => {
            exchangeString += `${exchange.trend} | ${exchange.name}: ` + format.format(exchange.exchange, { code: exchange.name, locale: 'de-DE' }) + '\n'
        });

        // Push the final data to fields
        fields.push({
            name: `${trend} **${currency}** (${trendPercentPrefix}${trendPercent}%)`,
            value: `${exchangeString}`,
            inline: true
        })
    });

    // Return embed object, ready to attach to message
    return {
        title: ':money_with_wings: Current Crypto Exchange Rates',
        color: 0x7289DA,
        description: ``,
        footer: {
            icon_url: 'https://i.4da.ms/cNexOb.png',
            text: `Discord-Crypto | github.com/4dams/Discord-Crypto`
        },
        fields: fields
    }
}

// Set bots status message
function setStatus() {
    // Arrays with input and output currency
    const inputCurrency = ['BTC'];
    const outputCurrency = ['EUR'];

    // Get crypto data for these currencies
    getCryptoData(inputCurrency, outputCurrency)
        .then(res => {
            // Get exchange rate/value and add to statusString
            let value = res.data['RAW'][inputCurrency][outputCurrency]['PRICE'];
            let statusString = `${inputCurrency} @ ${format.format(value, { code: outputCurrency, locale: 'de-DE' })} `;

            // Set client status to 'Watching *inputCurrency* at *value*'
            client.user.setActivity(statusString, {
                type: 'WATCHING'
            })
        })
        .catch(err => {
            console.log(err);
            console.log('WARN: An error occurred fetching the crypto data!')
        });
}

// Handle message-event
client.on('message', message => {
    if (message.content.toLowerCase() === config.prefix + 'cc') {
        getCryptoData(config.currencies, config.translateTo)
            .then(res => {
                // Send response message including generated embed
                message.channel.send({
                    embed: getEmbed(res.data['RAW'])
                })
            })
            .catch(err => {
                console.log(err);
                message.channel.send(':warning: An error occurred fetching the crypto data!')
            });
    }
});

// Handle ready-event
client.on('ready', () => {
    // Display success message
    console.log('Discord-Crypto online!');

    // Set and then update clients status message in given interval
    setStatus();
    setInterval(() => {
        setStatus();
    }, config.refreshDelay);
});