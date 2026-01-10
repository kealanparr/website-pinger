const lineByLine = require('line-by-line')
const nodemailer = require('nodemailer')
const axios = require('axios')
require('dotenv').config()

const brokenUrls  = []
const workingUrls = []
const errorUrls = []

const checkResponseCode = async url => {
	try {
		const res = await axios.get(encodeURI(url))
		workingUrls.push(url + ' is returning ' + res.status)
	} catch (err) {
		if (err?.response?.status >= 400) {
			brokenUrls.push(url + ' is returning ' + err?.response?.status)
		}
		else {
			errorUrls.push(url + ' is erroring on the request!')
		}
	}
}

const sendEmail = async () => {
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		host: 'smtp.gmail.com',
		auth: {
			user: process.env.EMAIL,
			pass: process.env.PASSWORD
		}
	})

	const htmlBody = 
	`<h1>Your friendly website pinger status update</h1>
	
	<h2>Working URL's that returned 200</h2>
	${workingUrls.map(url => url + "<br>")}

	<h2>Broken URL's that are down</h2>
	${brokenUrls.map(url => url + "<br>")}

	<h2>URL's that are erroring on request</h2>
	${errorUrls.map(url => url + "<br>")}
	`

	// send mail with defined transport object
	let info = await transporter.sendMail({
		from: '"Kealan Website Pinger" <kealan@website-pinger.com>',
		to: process.env.MY_EMAIL,
		subject: "Websites pinged ✔", // Subject line
		html: htmlBody
	})

	console.log("Message sent: %s", info.messageId)
}

const forEachUrl = checkResponseCodeCallback => {
	const lr = new lineByLine("links.md")
	lr.on("line", url => {
		if (url) {
			checkResponseCodeCallback(url)
		}
	})
	lr.on("end", _ => {
		setTimeout(_ =>{
			sendEmail()	
		}, 5000)
	})
}

forEachUrl(checkResponseCode)
