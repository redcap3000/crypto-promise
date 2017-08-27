
#crypto-promise

An implementation of promises to monitor cryptocurrency mining and exchange operations. Currently supports hitbtc, bittrex, and nanopool with a hacked version of nanopool_api npm module to support easy checking of multiple nanopool accounts for all supported nanopool currencies. 

**Ronaldo Barbachano 2017**

##Nanopool address checker
You can check many nanopool addresses by adding them to the accounts.json.

Example response with one eth address and one sia address.

**http://localhost:8080/nanopool**

```
[
  [
     //currency
    "eth",
    //last block found time from now
    "20 minutes",
    //total (balance+unconfirmed) amount
    0.01766751,
    {
      "h1": "14.2",
      "h3": "24.1",
      "h6": "21.5",
      "h12": "22.1",
      "h24": "22.2"
    },
    // worker count, total rating (of all workers)
    "Workers : 1 , rating : 1462, hashrate : 0.0"
  ],
  [
    "sia",
    "7 minutes",
    57.92600031,
    {
      "h1": "215.0",
      "h3": "143.3",
      "h6": "164.8",
      "h12": "179.2",
      "h24": "179.2"
    },
    "Workers : 1 , rating : 1434, hashrate : 258.0"
  ]
]
``` 

##Exchange API Feeds

The exchange feeds include wallet balances, orders, and ticker information and require working/valid API keys/secrets.

The exchange feed example

**http://localhost:8080/hitbtc**

```

[
  [
     // symbol name
    "XRP",
    // total available balance 
    99,
    // balance on orders
    75,
    // open orders (hitbtc shown, bittrex different)
    [
      {
        "orderId": "2208561488",
        "orderStatus": "new",
        "lastTimestamp": 1503594663405,
        "orderPrice": "0.00007082",
        "orderQuantity": 15,
        "avgPrice": "0",
        "quantityLeaves": 15,
        "type": "limit",
        "timeInForce": "GTC",
        "cumQuantity": 0,
        "clientOrderId": "31ba57729f2b455e8078520587123376",
        "symbol": "XRPBTC",
        "side": "sell",
        "execQuantity": 0
      },
      {
        "orderId": "2262290628",
        "orderStatus": "new",
        "lastTimestamp": 1503718002212,
        "orderPrice": "0.00005289",
        "orderQuantity": 60,
        "avgPrice": "0",
        "quantityLeaves": 60,
        "type": "limit",
        "timeInForce": "GTC",
        "cumQuantity": 0,
        "clientOrderId": "dbd7ca5fb8e84fb4b39176e954a07ee8",
        "symbol": "XRPBTC",
        "side": "sell",
        "execQuantity": 0
      }
    ],
    // ticker's based on open orders
    [
      "XRPBTC",
      {
        "ask": "0.00004746",
        "bid": "0.00004683",
        "last": "0.00004707",
        "low": "0.00004508",
        "high": "0.00005078",
        "open": "0.00005059",
        "volume": "3158721",
        "volume_quote": "152.00000000",
        "timestamp": 1503817250112
      }
    ]
  ],
    
    
```
###Quickstart
1) Configure env variables:
    
```
export HITBTC_API_KEY=KEY
export HITBTC_API_SECRET=SECRET

export BITTREX_API_KEY=KEY
export BITTREX_API_SECRET=SECRET
```
2) Edit accounts.json (for nanopool)
 

```
{
    "nanopool" :
        {   "eth" :
                [
                    "ETH ADDRESSES"
                ],
            "sia" :
                [
                    "SIA ADDRESSES"
                ]
        }
}
```

3) Point browser to endpoints:

http://localhost:8080/nanopool

http://localhost:8080/hitbtc

http://localhost:8080/bittrex

