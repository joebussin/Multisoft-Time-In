require('dotenv').config()
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Welcome to the Multisoft Time-in Chatbot for Zoom!')
})

app.get('/authorize', (req, res) => {
  res.redirect('https://zoom.us/launch/chat?jid=robot_' + process.env.zoom_bot_jid)
})

app.get('/support', (req, res) => {
  res.send('')
})

app.get('/privacy', (req, res) => {
  res.send(' ')
})

app.get('/terms', (req, res) => {
  res.send('')
})

app.get('/documentation', (req, res) => {
  res.send('')
})

app.get('/zoomverify/verifyzoom.html', (req, res) => {
  res.send(process.env.zoom_verification_code)
})

app.post('/mstime', (req, res) => {
  console.log(req.body)
  res.send('Chat received')
  getChatbotToken()
  
  function getChatbotToken () {
  request({
    url: `https://zoom.us/oauth/token?grant_type=client_credentials`,
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(process.env.zoom_client_id + ':' + process.env.zoom_client_secret).toString('base64')
    }
  }, (error, httpResponse, body) => {
    if (error) {
      console.log('Error getting chatbot_token from Zoom.', error)
    } else {
      body = JSON.parse(body)
	console.log(body)
	userCommand(body.access_token, req.body.payload.cmd,req.body.payload.userJid,req.body.payload.toJid, req.body.payload.accountId)
    }
  })
}
  function userCommand(chatbotToken,cmd,userJid, toJid, accountId) {
	
	const apiUrl = process.env.apiUrl
	/*
	//const params = req.body.payload.cmd.split(' ').slice(0)
  request(url,function (error,response, body) {    
      const data = JSON.parse(body);
	  sendChat(request,chatbotToken,userJid,toJid, accountId,cmd);
	  */
    request({
		url: apiUrl,
		method: 'POST',
		headers: {
			'Authorization' : 'Basic ' + Buffer.from(process.env.authorizationString).toString('base64')
		},
		json: {
			'userId' : userJid,
			'args' : cmd
		}
	}, function(error, response, body) {
		if (!error && response.statusCode == 200) {
		
		var returnMessage = [{
		  'type' : 'section',
		  'sections':[{
			  'type' :'message',
			  'text':  body
			}
		  ]
		}
		]
		sendChat(returnMessage, chatbotToken,userJid, toJid, accountId, cmd);
			}else{
		console.log(error);
		}
	
  });

}

  function sendChat(chatBody, chatbotToken, userJid, toJid, accountId, cmd){
	

  request({
    url: 'https://api.zoom.us/v2/im/chat/messages',
    method: 'POST',
    json: true,
    body: {
	  'robot_jid': process.env.zoom_bot_jid,
      'to_jid': toJid,
      'account_id': accountId,
	  'user_jid' : userJid ,
      'content': {
        'head': {
          'text': '/mstime ' + req.body.payload.cmd
        },
        'body': chatBody
      }
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + chatbotToken
    }
  }, (error, httpResponse, body) => {
    if (error) {
      console.log('Error sending chat.', error)
    } else {
      console.log(body)
  }
})
  } 
})

app.post('/deauthorize', (req, res) => {
  if (req.headers.authorization === process.env.zoom_verification_token) {
    res.status(200)
    res.send()
    request({
      url: 'https://api.zoom.us/oauth/data/compliance',
      method: 'POST',
      json: true,
      body: {
        'client_id': req.body.payload.client_id,
        'user_id': req.body.payload.user_id,
        'account_id': req.body.payload.account_id,
        'deauthorization_event_received': req.body.payload,
        'compliance_completed': true
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(process.env.zoom_client_id + ':' + process.env.zoom_client_secret).toString('base64'),
        'cache-control': 'no-cache'
      }
    }, (error, httpResponse, body) => {
      if (error) {
        console.log(error)
      } else {
        console.log(body)
      }
    })
  } else {
    res.status(401)
    res.send('Unauthorized request to Multisoft Time-in Chatbot for Zoom.')
  }
})

app.listen(port, () => console.log(`Multisoft Time-in Chatbot for Zoom listening on port ${port}!`))