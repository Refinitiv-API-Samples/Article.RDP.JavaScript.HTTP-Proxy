const inputUsername = document.querySelector('#inputUsername')
const inputPassword = document.querySelector('#inputPassword')
const inputAppkey = document.querySelector('#inputAppkey')
const btnAuthen = document.querySelector('#btnAuthen')
const btnLogOut = document.querySelector('#btnLogOut')

const authenResult = document.querySelector('#authenResult')

const btnESG = document.querySelector('#btnESG')
let inputDataSymbol = document.querySelector('#inputDataSymbol')
const btnGetNewsHeadlines = document.querySelector('#btnGetNewsHeadlines')
const btnSymbology = document.querySelector('#btnSymbology')
const btnRDPPermID = document.querySelector('#btnRDPPermID')

const txtSymbolStatus = document.querySelector('#txtSymbolStatus')

let txtESGJSON = document.querySelector('#txtESGJSON')
let txtNewsHeadlines = document.querySelector('#txtNewsHeadlines')
let txtSymbology = document.querySelector('#txtSymbology')
let txtRDPPermID = document.querySelector('#txtRDPPermID')

var access_token = ''
var refresh_token = ''
var expires_in = ''
var username = ''
var password = ''
var client_id = ''
var expire_in = ''
const scope = 'trapi'
const takeExclusiveSignOnControl = true

const rdpEsgVersion = 'v2'
const rdpAuthVersion = 'v1'
const rdpSymbologyVersion = 'v1'

btnESG.disabled = true
btnGetNewsHeadlines.disabled = true
btnSymbology.disabled = true
btnRDPPermID.disabled = true
btnLogOut.disabled = true

// ---------------- HTML Buttons Handler ---------------------------------------- //

btnAuthen.addEventListener('click', async () => {

    username = inputUsername.value
    password = inputPassword.value
    client_id = inputAppkey.value

    if (username.length === 0 || password.length === 0 || client_id.length === 0) {
        return authenResult.textContent = 'Please input your credentials'
    }

    try {
        await authenRDP({
            username,
            password,
            client_id,
            refresh_token
        })
        authenResult.textContent = 'Authentication to RDP success'
        btnESG.disabled = false
        btnGetNewsHeadlines.disabled = false
        btnSymbology.disabled = false
        btnRDPPermID.disabled = false
        btnLogOut.disabled = false
    } catch (error) {
        console.log(error)
        authenResult.textContent = error
    }
})

btnLogOut.addEventListener('click', async () => {
    try {
        let response = await revokeRDP(access_token, client_id)
        authenResult.textContent = response
        btnESG.disabled = true
        btnGetNewsHeadlines.disabled = true
        btnSymbology.disabled = true
        btnRDPPermID.disabled = true
        btnLogOut.disabled = true
        txtESGJSON.value = ''
        txtNewsHeadlines.value = ''
        txtSymbology.value = ''
        txtRDPPermID.value = ''
        inputDataSymbol.value = ''
    } catch (error) {
        console.log(error)
        authenResult.textContent = error
    }
})


btnESG.addEventListener('click', async () => {

    const symbol = inputDataSymbol.value
    if (symbol.length === 0) {
        return txtSymbolStatus.textContent = 'Please input symbol'
    }

    try {
        let data = await requestESG(symbol, access_token)
        // console.log(data)
        txtESGJSON.value = JSON.stringify(data, undefined, 2)
    } catch (error) {
        console.log(error)
        txtESGJSON.value = error

    }
})



btnGetNewsHeadlines.addEventListener('click', async () => {

    const symbol = inputDataSymbol.value
    if (symbol.length === 0) {
        return txtSymbolStatus.textContent = 'Please input symbol'
    }
    
    try {
        let data = await getNewsHeadlines(symbol, access_token)
        //console.log(data)
        txtNewsHeadlines.value = JSON.stringify(data, undefined, 2)
    } catch (error) {
        console.log(error)
        txtNewsHeadlines.value = error
    }
})

btnSymbology.addEventListener('click', async () => {

    const symbol = inputDataSymbol.value
    if (symbol.length === 0) {
        return txtSymbolStatus.textContent = 'Please input symbol'
    }

    
    const reqBody = {
        "from": [{
            "identifierTypes": [
                "RIC"
            ],
            "values": [symbol]
        }],
        "to": [{
            "identifierTypes": [
                "ISIN",
                "ExchangeTicker"
            ]
        }],
        "reference": [
            "name",
            "status",
            "classification"
        ],
        "type": "auto"
    }

    try {
        let data = await getSymbology(symbol, reqBody, access_token)
        //console.log(data)
        txtSymbology.value = JSON.stringify(data, undefined, 2)

    } catch (error) {
        console.log(error)
        txtSymbology.value = error
    }
})

btnRDPPermID.addEventListener('click', async () => {

    const symbol = inputDataSymbol.value
    if (symbol.length === 0) {
        return txtSymbolStatus.textContent = 'Please input symbol'
    }

    

    const reqBody = {
        "from": [{
            "identifierTypes": [
                "RIC"
            ],
            "values": [symbol]
        }],
        "to": [{
            "objectTypes": [
                "organization"
            ],
            "identifierTypes": [
                "PermID",
            ]
        }],
        "reference": [
            "name",
            "status",
            "classification"
        ],
        "type": "auto"
    }


    try {
        let data = await getSymbology(symbol, reqBody, access_token)
        //console.log(data)
        txtRDPPermID.value = JSON.stringify(data, undefined, 2)

    } catch (error) {
        console.log(error)
        txtRDPPermID.value = error
    }
})

// ---------------- REST API functions ---------------------------------------- //


const authenRDP = async (opt) => {

    const authenURL = `/auth/oauth2/${rdpAuthVersion}/token`

    let authReq = {
        'username': opt['username'],
        'client_id': opt['client_id'],
        takeExclusiveSignOnControl
    }

    if (opt['refresh_token'].length === 0) {
        authReq['password'] = opt['password']
        authReq['grant_type'] = 'password'
        authReq['scope'] = scope
    } else {
        authReq['refresh_token'] = opt['refresh_token']
        authReq['grant_type'] = 'refresh_token'
    }

    console.log(JSON.stringify(authReq))

    // Send HTTP Request
    const response = await fetch(authenURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(authReq)
    })

    if (!response.ok) {
        const statusText = await response.text()
        throw new Error(`HTTP error!: ${response.status} ${statusText}`);
    }
    //Parse response to JSON
    authResponse = await response.json()
    access_token = authResponse.access_token
    refresh_token = authResponse.refresh_token
    expires_in = authResponse.expires_in
    console.log('Authentication Granted')
    // Define the timer to refresh our token 
    setRefreshTimer()
    //return await response.json()
}

const revokeRDP = async (accessToken, client_id) => {

    const authenURL = `/auth/oauth2/${rdpAuthVersion}/revoke`

    let authReq = {
        'token': accessToken
    }

    // console.log(JSON.stringify(authReq))

    // Send HTTP Request
    const response = await fetch(authenURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${window.btoa(`${client_id}:`)}`
        },
        body: new URLSearchParams(authReq)
    })

    if (!response.ok) {
        const statusText = await response.text()
        throw new Error(`HTTP error!: ${response.status} ${statusText}`);
    }
    //Parse response to JSON
    return 'Logout user success'
    // Define the timer to refresh our token 
}

const setRefreshTimer = () => {
    let millis = (parseInt(expires_in) - 30) * 1000; //
    let intervalID = window.setInterval(async () => {
        try {
            await authenRDP({
                username,
                client_id,
                refresh_token
            })
        } catch (error) {
            console.log(error)
            authenResult.textContent = error
        }
    }, millis);
}

const getNewsHeadlines = async (symbol, accessToken) => {
    const rdpNewsURL = `https://api.refinitiv.com/data/news/v1/headlines?query=${symbol}`

    const response = await fetch(rdpNewsURL, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    })

    if (!response.ok) {
        const statusText = await response.text()
        throw new Error(`HTTP error!: ${response.status} ${statusText}`);
    }
    //Parse response to JSON
    return await response.json()
}

const getSymbology = async (symbol, reqBody, accessToken) => {
    const rdpSymbologyURL = `https://api.refinitiv.com/discovery/symbology/${rdpSymbologyVersion}/lookup`

    const response = await fetch(rdpSymbologyURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(reqBody)
    })

    if (!response.ok) {
        const statusText = await response.text()
        throw new Error(`HTTP error!: ${response.status} ${statusText}`);
    }
    //Parse response to JSON
    return await response.json()
}


const requestESG = async (symbol, accessToken) => {

    const esgURL = `https://api.refinitiv.com/data/environmental-social-governance/${rdpEsgVersion}/views/basic?universe=${symbol}`

    // Send HTTP Request
    const response = await fetch(esgURL, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    })

    if (!response.ok) {
        const statusText = await response.text()
        throw new Error(`HTTP error!: ${response.status} ${statusText}`);
    }
    //Parse response to JSON
    return await response.json()

}