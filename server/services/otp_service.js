const otpGenerator = require('otp-generator')
const crypto = require('crypto')
const key = "test123"
const emailServices = require("../services/email_service")

async function sendOTP(params, callback){
    const otp = otpGenerator.generate(
        6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        }
    );

    // Setting an expiry time
    const expiryTime = 5 * 60 * 1000;
    const expires = Date.now() + expiryTime;
    const data = `${params.email}.${otp}.${expires}`;
    const hash = crypto.createHmac("sha256", key).update(data).digest("hex");
    const fullHash = `${hash}.${expires}`;

    var otpMessage = `Dear Customer, ${otp} is a one-time password for your login`;

    var model = {
        email: params.email,
        subject: "Registration OTP",
        body: otpMessage,
    }

    emailServices.sendEmail(model, (error, result) => {
        if(error){
            return callback(error);
        }
        return callback(null, fullHash);
    })
}

async function verifyOTP(params, callback){ 
    if (!params || !params.hash) {
        return callback("Invalid parameters");
    }

    let [hashValue, expires] = params.hash.split('.');

    let now = Date.now();

    if (now > parseInt(expires)) return callback("OTP Expired");

    let data = `${params.email}.${params.otp}.${expires}`;
    let newCalculatedHash = crypto.createHmac("sha256", key).update(data).digest("hex");

    if (newCalculatedHash === hashValue){
        return callback(null, "Success");
    }
    return callback("Invalid OTP");
}

module.exports = {
    sendOTP,
    verifyOTP,
}
