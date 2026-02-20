import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000'; // Define backend URL here

export const login = async (username: string, password: string) => {
    // The backend uses OAuth2PasswordRequestForm, which requires application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await axios.post(`${API_URL}/auth/login`, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    return response.data;
};
