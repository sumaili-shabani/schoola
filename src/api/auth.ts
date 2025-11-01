import { callApi } from "./callApi";
import { setToken } from "./config";

export const AuthAPI = {
    login: async (email: string, password: string) => {
        const data = await callApi<any>("post", "/login", { email, password });
        setToken(data.access_token);
        return data;
    },
    me: async () => callApi("get", "/me"),
    logout: async () => {
        await callApi("post", "/logout");
        setToken(null);
    },
};
