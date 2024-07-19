var nodemailer = require('nodemailer');

async function sendEmail(params, callback){
    var transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587,
        auth: {
            user: process.env.USER,
            pass: process.env.APP_PASSWORD
        }
    });

    var mailOptions = {
        from: '"Subnote Admin" <admin@subnote.com>',
        to: params.email,
        subject: params.subject,
        text: params.body,
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return callback(error);
        } 
        else {
            return callback (null, info.params);
        }
    });
}

module.exports = {
    sendEmail
}