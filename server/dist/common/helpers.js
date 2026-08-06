"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginToWhatsappAPI = exports.sendAnniversaryWhatsapp = exports.sendWishWhatsapp = void 0;
const axios_1 = __importDefault(require("axios"));
const sendWishWhatsapp = async (token, data) => {
    const requestBody = {
        phone: data.phone,
        media: {
            type: 'media_template',
            template_name: 'birthday',
            lang_code: 'en',
            body: [
                {
                    text: data.recevier,
                },
                { text: data.sender },
            ],
        },
    };
    console.log(data);
    console.log(requestBody);
    try {
        const response = await axios_1.default.post(`${process.env.WHATSAPP_API_MESSAGE_URL}`, requestBody, {
            headers: {
                Authorization: token,
                'Content-Type': 'application/json',
            },
        });
        console.log(response);
        return response.data;
    }
    catch (error) {
        console.error('Error in sending OTP Whatsapp');
        throw error;
    }
};
exports.sendWishWhatsapp = sendWishWhatsapp;
const sendAnniversaryWhatsapp = async (token, data) => {
    const requestBody = {
        phone: data.phone,
        media: {
            type: 'media_template',
            template_name: 'anniversary_wish',
            lang_code: 'en_US',
            body: [
                {
                    text: data.recevier,
                },
                { text: data.sender },
            ],
        },
    };
    console.log(requestBody);
    try {
        const response = await axios_1.default.post(`${process.env.WHATSAPP_API_MESSAGE_URL}`, requestBody, {
            headers: {
                Authorization: token,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error in sending OTP Whatsapp');
        throw error;
    }
};
exports.sendAnniversaryWhatsapp = sendAnniversaryWhatsapp;
const loginToWhatsappAPI = async () => {
    const body = {
        username: `${process.env.WHATSAPP_API_LOGIN_USERNAME}`,
        password: `${process.env.WHATSAPP_API_LOGIN_PASSWORD}`,
    };
    try {
        const { data } = await axios_1.default.post(`${process.env.WHATSAPP_API_LOGIN_URL}`, body);
        return {
            status: 'success',
            message: 'Login to whatsapp service successful',
            JWTAUTH: data.JWTAUTH,
        };
    }
    catch (err) {
        return {
            status: 'error',
            message: 'Unable to login to whatsapp service',
        };
    }
};
exports.loginToWhatsappAPI = loginToWhatsappAPI;
//# sourceMappingURL=helpers.js.map