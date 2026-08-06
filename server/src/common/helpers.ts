import axios from 'axios';
import { text } from 'stream/consumers';
interface SENDOTPWHATSAPP {
  sender: string;
  recevier: string;
  phone: string;
  co: string;
}

export const sendWishWhatsapp = async (
  token: string,
  data: SENDOTPWHATSAPP,
) => {
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
    const response = await axios.post(
      `${process.env.WHATSAPP_API_MESSAGE_URL}`,
      requestBody,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log(response);

    return response.data;
  } catch (error) {
    console.error('Error in sending OTP Whatsapp');
    throw error;
  }
};

export const sendAnniversaryWhatsapp = async (
  token: string,
  data: SENDOTPWHATSAPP,
) => {
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
    const response = await axios.post(
      `${process.env.WHATSAPP_API_MESSAGE_URL}`,
      requestBody,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error in sending OTP Whatsapp');
    throw error;
  }
};

export const loginToWhatsappAPI = async (): Promise<{
  status: string;
  message: string;
  JWTAUTH?: string;
}> => {
  const body = {
    username: `${process.env.WHATSAPP_API_LOGIN_USERNAME}`,
    password: `${process.env.WHATSAPP_API_LOGIN_PASSWORD}`,
  };
  try {
    const { data } = await axios.post(
      `${process.env.WHATSAPP_API_LOGIN_URL}`,
      body,
    );
    return {
      status: 'success',
      message: 'Login to whatsapp service successful',
      JWTAUTH: data.JWTAUTH,
    };
  } catch (err) {
    return {
      status: 'error',
      message: 'Unable to login to whatsapp service',
    };
  }
};
