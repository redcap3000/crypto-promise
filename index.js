/*
    
    crypto-promise

    An implementation of promises to monitor cryptocurrency mining and 
    exchange operations. Currently supports hitbtc, bittrex, and nanopool with a 
    hacked version of nanopool_api npm module to support easy checking of 
    multiple nanopool accounts for all supported
    nanopool currencies. Outputs response (JSON) using express @ /user endpoint.

    
*/

var Promise = require('promise');

if (typeof process.env.HITBTC_API_KEY != 'undefined' && typeof process.env.HITBTC_API_SECRET != 'undefined') {
    console.log('hitbtc key found')
    HitBTC = require('hitbtc-api')
    makeHitBtcClient = function(key, secret) {
        try {
            restClient = new HitBTC.default({ key, secret, isDemo: false })
        } catch (error) {
            console.log("Could not make hitbtc client.")
            console.log(error)
            return false
        }
        return true
    }

    getHitbtcBalance = function(key, secret) {
        makeHitBtcClient(key, secret)
        let { getMyBalance } = restClient
        // return a promise
        return getMyBalance()
    }

}

if (typeof process.env.BITTREX_API_KEY != 'undefined' && typeof process.env.BITTREX_API_SECRET != 'undefined') {
    console.log("bittrex key found")

    var bittrex = require('@you21979/bittrex.com')
    var api = bittrex.PublicApi;
    var errors = require('@you21979/bittrex.com/errors')
    api = bittrex.createPrivateApi(process.env.BITTREX_API_KEY, process.env.BITTREX_API_SECRET, "none")
}



// https://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}
nanoapi = require('nanopool_api');
try {
    var accounts = require('./accounts.json')
} catch (error) {
    console.log("Problem reading accounts.json")
    //console.log(error)
    //process.exit()
}
// setup express server

const express = require('express')
const app = express()
var bodyParser = require("body-parser")


app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/usdQuotes', function(req,res) {
    // designed to be simple.... 
    
    makeHitBtcClient(process.env.HITBTC_API_KEY, process.env.HITBTC_API_SECRET)

    let { getTicker } = restClient
    promises = []
    // hitbtc quote
    let convertBittrex = function(string){
        let temp = string.split('-')
        return temp[1]

        if(temp[0] == 'USDT'){
            return temp[1] + 'USD'
        }else{
            return temp[1] + temp[0]

        }
    }
    let quotes = [
        ['BTCUSD','hitbtc'],
        ['ETHUSD','hitbtc'],
        ['BCCUSD','hitbtc'],
        //['LTCUSD','hitbtc'],
        //['XMRUSD','hitbtc'],
        //['ZECUSD','hitbtc'],
        ['USDT-BTC','bittrex'],
        ['USDT-ETH','bittrex'],
        ['USDT-BCC','bittrex'],
        ['USDT-XRP','bittrex']
        //['USDT-LTC','bittrex'],
        //['USDT-XMR','bittrex'],
        //['USDT-ZEC','bittrex']
    ]

    quotes.filter(function(q){
        
        let andThen = function(r){
            let newObj = []
            // symbol change this if you'd like to do some clientside maths... 
            if(typeof r.Last != 'undefined'){
                newObj.push(convertBittrex(q[0]))
            }else{
                newObj.push(q[0].split('USD')[0]);
            }
            // exchange
            newObj.push(q[1]);
            // quote (swapping from slightly differing api responses)
            if(typeof r.last != 'undefined'){
                newObj.push(parseFloat(r.last));
            }else if(typeof r.Last != 'undefined'){
                newObj.push(parseFloat(r.Last));
            }
            return newObj
        }
        
        if(q[1] == 'hitbtc'){
            promises.push(getTicker(q[0]).then(andThen))
        }else if(q[1] == 'bittrex'){
            //console.log("Pushing bittrex")
            promises.push( bittrex.PublicApi.getTicker(q[0]).then(andThen))
        }
    })
   
    let results = []
    console.log(promises.length)
    var result = Promise.all(promises).then((r)=>{
//        console.log(r)
        res.send(r)
        //results.push(r)
       
    }
    ).catch((e,r)=>{
        console.log(e)
    })

});

app.get('/bittrex',function(req,res){
    app.use(bodyParser.json({ type: 'application/*+json' }))

    let balances = []
    api.getBalances().then((row,err)=>{
    if(typeof err == 'undefined'){
        row.filter((o)=>{
            if(o.Balance === 0 && o.Available === 0 && o.Pending === 0){
            }else{
                let obj = {
                    symbol : o.Currency,
                    available : o.Available,
                    pending : o.Pending,
                    onOrders : o.Balance - o.Available
                }   
                    // then this symbol has open orders?
                if(o.Balance - o.Available > 0){
                    // look up  open orders
                    balances.push(obj)
                }
            }

        })

        }
        return balances
    }
    ).then((wallets)=>{
        let openOrders=[]
        let orderSymbols=[]
        let finalResult=[]
        let innerPromises = []
        // get unique symbols?
        wallets.filter((wallet,i)=>{
            //console.log(wallet)
            if(parseInt(orderSymbols.indexOf(wallet.symbol))=== -1){
                //orderSymbols.push(wallet.symbol)
                openOrders.push(api.getOpenOrders(wallet.symbol))
            }
            if(i === wallets.length-1){
                //console.log('open orders length' + openOrders.length)
             
                let r = Promise.all(openOrders).then((values) => {
                    if(values[0][0].OrderUuid === values[1][0].OrderUuid){
                        // only parse the top row
                        // weird azz thing going on here dunno why.... 
                        values[0].filter((order)=>{
                            innerPromises.push(
                                bittrex.PublicApi.getTicker(order.Exchange)
                                )
                        })
                        result = Promise.all(innerPromises).then((fValues)=>{
                            var r = []
                            wallets.filter((w,wI)=>{
                                if(w.available === 0){
                                    w.available = w.onOrders
                                }
                                r.push([
                                        w.symbol,
                                        parseFloat(w.available)+w.onOrders,
                                        w.onOrders,
                                        values[wI],
                                        fValues[wI]
                                        ]
                                    )

                            })
                            res.send(r)
                        })
                    }else{
                        console.log("This is a really strange error inside a hack to fix another error")
                        process.exit()
                    }
                })
            }
        })
    })
})

app.get('/hitbtc', function(req, res) {
    app.use(bodyParser.json({ type: 'application/*+json' }))


    hitbtcCurrencies = []

    getHitbtcBalance(process.env.HITBTC_API_KEY, process.env.HITBTC_API_SECRET).then((balance) => {
        // balances
        let b = []
        let bal = balance.balance
        for (var key in bal) {
            if (bal[key].cash > 0 || bal[key].reserved > 0) {
                b.push([
                    bal[key].currency_code,
                    // show how much total!
                    bal[key].cash + bal[key].reserved, bal[key].reserved
                ])
            }
        }
        return b;
    }).then((wallets) => {
        let { getMyActiveOrders } = restClient
        let openOrders = []
        let symbols = []
        let orderDict = {}
        return getMyActiveOrders().then((orders) => {

            orders.orders.filter((order, z) => {
                if (symbols.indexOf(order.symbol) == -1) {
                    symbols.push(order.symbol)
                    openOrders[order.symbol] = [order]
                } else {
                    openOrders[order.symbol].push(order)
                }
            })
            wallets.filter((wallet, i) => {
                symbols.filter(function(symbol) {
                    if (symbol.startsWith(wallet[0])) {
                        // look up quote!
                        wallets[i].push(openOrders[symbol])
                    }
                })
            })
            // group open orders with
            return wallets
        })
    }).then((wallets) => {
        // determine wallets with orders so we know when to send a response back ... :/
        // the promises-friendly alternative is here:
        // https://stackoverflow.com/questions/33355528/filtering-an-array-with-a-function-that-returns-a-promise
        walletsWithOrderCount = 0
        orderIndex = {}
        wallets.filter((w,i)=>{
            if(typeof w[3] != 'undefined' && w[3].length > 0){
                if(typeof orderIndex[w[0]] == 'undefined'){
                    walletsWithOrderCount += 1
                    orderIndex[w[0]] = true
                }else{
                    console.log("Duplicate symbol within an order")
                    // no need to recount?
                }
            }
        })
        // also will want to check for symbols that have orders in multiple markets
        // i.e. if theres an order for ETHBTC and BCCETH
        // TO DO!

        wallets.filter((wallet, i) => {
            let resolution = []
            let activeSymbols = []
            if (typeof wallet[3] != 'undefined') {
                let orders = wallet[3]
                orders.filter((o, n) => {
                    //console.log(o.symbol)
                    if (activeSymbols.indexOf(o.symbol) == -1) {
                        activeSymbols.push(o.symbol)
                    }
                })
                activeSymbols.filter((sym) => {
                    let { getTicker } = restClient
                    resolution.push(getTicker(sym))
                })
                results = []
                Promise.all(resolution).then(values => {
                    if (activeSymbols.length === values.length) {
                        if (activeSymbols.length === 1) {
                            wallet.push([activeSymbols[0], values[0]])
                        } else {
                            wallet.push([activeSymbols, values])
                        }
                        // res send here .. :( ) 
                        results.push(wallet)
                        if(results.length === walletsWithOrderCount){
                            res.send(results)
                        }else{
                            //console.log(results.length-1 + ' > ' + wallets.length + ' : ' + i)
                        }
                    }
                })
            }

        })
    })

})
app.get('/nanopool', function(req, res) {
    app.use(bodyParser.json({ type: 'application/*+json' }))

    let response = [],
        supportedCurrencies = [],
        r = [],
        nanoCallback = function(response, json) {
            if (typeof json != 'undefined' && typeof json.status != 'undefined' && json.status) {
                fulfill(json.data)
            }
            reject(response)
        };

    if (accounts.nanopool != 'undefined') {
        for (var currency in accounts.nanopool) {
            accounts.nanopool[currency].filter(function(address) {
                let iCurr = currency,
                    rating = 0

                r.push(new Promise(function(fulfill, reject) {
                    nanoapi.user(currency, address, function(response, json) {
                        if (typeof json != 'undefined' && typeof json.status != 'undefined' && json.status) {
                            if (json.data.workers.length > 0) {
                                // last share completion (time from now value)
                                var lastShare = timeSince(new Date(json.data.workers[0].lastShare * 1000))
                                if (json.data.workers.length > 0) {
                                    // adding ratings of all workers
                                    json.data.workers.filter(function(worker) {
                                        rating += worker.rating
                                    })
                                }
                            } else {
                                var lastShare = 0
                            }
                            fulfill([ iCurr,lastShare, parseFloat(json.data.balance) + parseFloat(json.data.unconfirmed_balance), json.data.avgHashrate,'Workers : ' + json.data.workers.length + ' , rating : ' + rating + ', hashrate : ' + json.data.hashrate,])
                        } else {
                            reject(response)
                        }
                    })
                }))
            })
        }
    }

    Promise.all(r).then(values => {
        res.setHeader('Content-Type', 'application/json')
        res.send(JSON.stringify(values))
    }).catch(err => {
        console.log(err.body)
        res.send(err.body)
    })
})

app.listen(process.env.PORT || 8080, function() {
    console.log('Nanopool wallet tracker app listening on port ' + (process.env.PORT ? process.env.PORT : 8080))
})