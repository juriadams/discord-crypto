// Import modules
const Discord = require('discord.js');
const axios = require('axios');
const moment = require('moment');
const format = require('currency-formatter');
const config = require('./config.json');

// Create and connect Discord client
const client = new Discord.Client();
client.login(config.token);

// Global variables
let allCurrencies = [];
let currencyTable = {};
let startTime = moment();
let statusMessages = config.statusMessages;
let currentStatus = 0;

// Return promise
function getCryptoData(inputCurrencies, outputCurrencies) {
    return axios.get(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${inputCurrencies.join(',')}&tsyms=${outputCurrencies.join(',')}&api_key=${config.cryptoApiKey}`)
}

// Return full name of currency, if found
function getCurrencyName(input) {
    if (currencyTable[input]) {
        return currencyTable[input].toUpperCase();
    } else {
        return input;
    }
}

// Return embed object
function getEmbed(data, showInfo) {
    // Define fields array for embed
    let fields = [];

    // If showInfo === true, add info field
    if (showInfo) {
        fields.push({
            name: ':bulb: **Information**',
            value: 'The following exchange rates are 1:X for each currency\n**▲/▼** shows the trend in the past 24 hours in exchange for each currency\n\u200B',
            inline: false
        })
    }

    // Loop through all currencies and add their data to the fields array
    Object.keys(data).forEach(currency => {
        // Define trend icons and percent (from first translateTo-currency)
        let exchangedTo = Object.keys(data[currency]);
        let trend = data[currency][exchangedTo[0]]['CHANGEPCT24HOUR'] >= 0 ? ':chart_with_upwards_trend:' : ':chart_with_downwards_trend:';
        let trendPercentPrefix = data[currency][exchangedTo[0]]['CHANGEPCT24HOUR'] > 0 ? '+' : '';
        let trendPercent = data[currency][exchangedTo[0]]['CHANGEPCT24HOUR'].toFixed(2);

        // Array with exchanges for crypto currency
        let exchangeData = exchangedTo.map(translatedTo => {
            return {
                name: translatedTo,
                exchange: data[currency][translatedTo]['PRICE'],
                trend: data[currency][translatedTo]['CHANGE24HOUR'] > 0 ? '▲' : '▼'
            }
        });

        // Generate string including exchange data
        let exchangeString = '';
        exchangeData.forEach(exchange => {
            exchangeString += `${exchange.trend} | ${exchange.name}: ` + format.format(exchange.exchange, {
                code: exchange.name,
                locale: 'de-DE'
            }) + '\n'
        });

        // Push the final data to fields
        fields.push({
            name: `${trend} **${getCurrencyName(currency)}** (${trendPercentPrefix}${trendPercent}%)`,
            value: `${exchangeString}`,
            inline: true
        })
    });

    // Return embed object, ready to attach to message
    return {
        title: ':bar_chart: Current Crypto Exchange Rates',
        color: 0x7289DA,
        description: ``,
        footer: {
            icon_url: 'https://i.4da.ms/cNexOb.png',
            text: `Discord-Crypto | github.com/4dams/Discord-Crypto`
        },
        fields: fields
    }
}

// Return error embed object
function getError(message) {
    return {
        color: 0xdf4e4e,
        description: ``,
        footer: {
            icon_url: 'https://i.4da.ms/cNexOb.png',
            text: `Discord-Crypto | github.com/4dams/Discord-Crypto`
        },
        fields: [
            {
                name: ':warning: **Error**',
                value: message,
                inline: false
            }
        ]
    }
}

// Get all currency names
function getAllCurrencies() {
    axios.get(`https://min-api.cryptocompare.com/data/top/totalvolfull?limit= 100&tsym=EUR&api_key=${config.cryptoApiKey}`)
        .then(res => {
            // Get array of all short names of coins
            allCurrencies = res.data['Data'].map(e => {
                return e['CoinInfo']['Name'].toLowerCase();
            });

            // Get Object with all coins where key = short name and value = full name
            res.data['Data'].forEach(e => {
                currencyTable[e['CoinInfo']['Name']] = e['CoinInfo']['FullName']
            });

            // Start updating the bots status
            setStatus();
            setInterval(() => {
                setStatus();
            }, config.updateDelay);
        })
}

// Set bots status message
function setStatus() {
    // Cycle through steps
    if (currentStatus === statusMessages.length - 1) {
        currentStatus = 0;
    } else {
        currentStatus++;
    }

    // Check for step type and set step accordingly
    if (statusMessages[currentStatus].type === 'currency') {
        let inputCurrency = statusMessages[currentStatus].value;
        let outputCurrency = config.defaultOutput;
        getCryptoData([inputCurrency], [outputCurrency])
            .then(res => {
                // Get exchange rate/value and add to statusString
                let value = res.data['RAW'][inputCurrency][outputCurrency]['PRICE'];
                let trend = res.data['RAW'][inputCurrency][outputCurrency]['CHANGE24HOUR'] > 0 ? '▲' : '▼';
                let trendPercentPrefix = res.data['RAW'][inputCurrency][outputCurrency]['CHANGEPCT24HOUR'] > 0 ? '+' : '';
                let trendPercent = res.data['RAW'][inputCurrency][outputCurrency]['CHANGEPCT24HOUR'].toFixed(2);
                let statusString = `${inputCurrency} @ ${format.format(value, {code: outputCurrency, locale: 'de-DE'})} ${trend} (${trendPercentPrefix}${trendPercent}%)`;

                // Set client status to 'Watching *inputCurrency* at *value*'
                client.user.setActivity(statusString, {
                    type: 'WATCHING'
                })
            })
            .catch(err => {
                console.log(err);
                console.log('WARN: An error occurred fetching the crypto data!')
            });
    } else if (statusMessages[currentStatus].type === 'message') {
        let message = statusMessages[currentStatus].value.replace('%PREFIX%', config.prefix);
        client.user.setActivity(message, {
            type: 'WATCHING'
        })
    }
}

// Handle message-event
client.on('message', message => {
    // Ignore all messages sent by bots
    if (message.author.bot) return;

    // Check if message starts with our prefix
    if (message.content.toLowerCase().startsWith(config.prefix)) {
        // Our very basic command handler
        // TODO: Put stuff like this into own class
        let msg = message.content.toLowerCase(); // String: Full message
        let command = msg.split(' ')[0].replace(config.prefix, ''); // String: command without prefix
        let args = msg.split(' ').filter(e => e !== ''); // Array: All arguments after command
        args.shift(); // Remove command from args

        // COMMAND: Exchange
        if (command === 'exchange' || command === 'cc') {
            // Check if there are no arguments
            if (args.length === 0) {
                getCryptoData(config.currencies, config.translateTo)
                    .then(res => {
                        // Send response message including generated embed
                        message.channel.send({
                            embed: getEmbed(res.data['RAW'], true)
                        })
                    })
                    .catch(err => {
                        console.log(err);
                        message.channel.send({
                            embed: getError(`An error occurred fetching the exchange data:\n\`\`\`${err.data['Message']}\`\`\``)
                        });
                    });

                // If there are one or more arguments
            } else {
                // Check if arguments contain 'to'
                if (!args.some(e => e === 'to')) {
                    message.channel.send({
                        embed: getError(`No currencies found to exchange to!\n\nExample usage of this command: \`\`\`${config.prefix}cc btc eth to eur usd\`\`\``)
                    });
                    return;
                }

                // Define input and output
                let inputCurrencies = [];
                let outputCurrencies = [];
                let hit = false; // True if we passed 'to' element in array

                // Cycle through args and get input/output currencies
                args.forEach(arg => {
                    if (arg === 'to') {
                        hit = true;
                        return;
                    }
                    if (!hit) {
                        inputCurrencies.push(arg.toUpperCase());
                    } else {
                        outputCurrencies.push(arg.toUpperCase());
                    }
                });

                // Return if there are no inputCurrencies/outputCurrencies
                if (inputCurrencies.length === 0 || outputCurrencies.length === 0) {
                    message.channel.send({
                        embed: getError(`Missing input or output currencies!\n\nExample usage of this command: \`\`\`${config.prefix}cc btc eth to eur usd\`\`\``)
                    });
                    return;
                }

                // If we passed all checks, get crypto data and send embed
                getCryptoData(inputCurrencies, outputCurrencies)
                    .then(res => {
                        // Send response message including generated embed
                        message.channel.send({
                            embed: getEmbed(res.data['RAW'], false)
                        })
                    })
                    .catch(err => {
                        console.log(err);
                        message.channel.send({
                            embed: getError(`An error occurred fetching the exchange data:\n\`\`\`${err.data['Message']}\`\`\``)
                        });
                    });
            }
        }

        // COMMAND: Help
        if (command === 'help') {
            message.channel.send({
                embed: {
                    title: ':bar_chart: Current Crypto Exchange Rates',
                    color: 0x7289DA,
                    description: ``,
                    footer: {
                        icon_url: 'https://i.4da.ms/cNexOb.png',
                        text: `Discord-Crypto | github.com/4dams/Discord-Crypto`
                    },
                    fields: [
                        {
                            name: ':bulb: **Supported Currencies**',
                            value: `You can request exchange rates for the following currencies: \`\`\`${allCurrencies.join(', ').toUpperCase()}, ... and many more!\`\`\`\u200B`,
                            inline: false
                        },
                        {
                            name: ':mag: **Request Top Currencies**',
                            value: `In order to see the data for the top trending crypto currencies, simply type the following: \`\`\`${config.prefix}exchange\`\`\`\u200B`,
                            inline: false
                        },
                        {
                            name: ':mag: **Request Specific Currencies**',
                            value: `If you are looking for some specific currencies, simply use the following layout:\`\`\`${config.prefix}exchange [input currencies] to [output currencies]\`\`\`If given correct information, this will return you the requested exchange rates for the input currencies!\nFeel free to try this out by simply typing\`\`\`${config.prefix}exchange btc iot eth to eur usd chf\`\`\`\u200B`,
                            inline: false
                        },
                        {
                            name: ':mag: **Bot Status**',
                            value: `Something wrong? Simply type \`\`\`${config.prefix}status\`\`\`to get a small status report!`,
                            inline: false
                        }
                    ]
                }
            });
        }

        // COMMAND: Status
        if (command === 'status' || command === 'uptime') {
            let messageReceived = new Date().getTime();
            let embed = {
                title: ':satellite: Discord-Crypto Status',
                color: 0x7289DA,
                description: ``,
                footer: {
                    icon_url: 'https://i.4da.ms/cNexOb.png',
                    text: `Discord-Crypto | github.com/4dams/Discord-Crypto`
                },
                fields: [
                    {
                        name: ':white_check_mark: **Discord Connection**',
                        value: `Discord connection up and running!\u200B`,
                        inline: false
                    },
                    {
                        name: ':white_check_mark: **Ping**',
                        value: `${messageReceived - message.createdTimestamp}ms\u200B`,
                        inline: false
                    },
                    {
                        name: ':white_check_mark: **Bot Uptime**',
                        value: `Running for ${moment.duration(moment().diff(startTime)).humanize()}\u200B`,
                        inline: false
                    }
                ]
            };

            // Make simple test request
            getCryptoData(['BTC'], ['USD'])
                .then(res => {
                    // Even if status code === 200, check for errors
                    if (res.data['Response'] && res.data['Response'] === 'Error') {
                        embed.fields.push({
                            name: ':no_entry: **API Service**',
                            value: `Error retrieving data from Cryptocompare API.`,
                            inline: false
                        });
                        message.channel.send({
                            embed: embed
                        })
                    } else {
                        embed.fields.push({
                            name: ':white_check_mark: **API Service**',
                            value: `Response Received`,
                            inline: false
                        });
                        message.channel.send({
                            embed: embed
                        })
                    }
                })
                // Catch errors
                .catch(err => {
                    embed.fields.push({
                        name: ':no:_entry: **API Service**',
                        value: `Error retrieving data from Cryptocompare API.`,
                        inline: false
                    });
                    message.channel.send({
                        embed: embed
                    })
                });
        }
    }
});

// Handle ready-event
client.on('ready', () => {
    // Display success message
    console.log('Discord-Crypto online!');

    // Get list and table with all currencies, then start updating status
    getAllCurrencies();
});