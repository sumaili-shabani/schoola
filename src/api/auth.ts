import { callApi } from "./callApi";
import { setToken, setUser } from "./config";

export const AuthAPI = {
    login: async (email: string, password: string) => {
        const data = await callApi<any>("post", "/login", { email, password });
        setToken(data.access_token);
        setUser(data.user);
        saveUser(data.token, data.user);


        return data;
    },
    me: async () => callApi("get", "/me"),
    logout: async () => {
        await callApi("post", "/logout");
        setToken(null);
        setUser(null);
    },
};

export const saveUser = (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const getToken = () => localStorage.getItem('access_token');

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

};
