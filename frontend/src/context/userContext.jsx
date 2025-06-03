// src/context/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from '../utils/apiPath';

export const UserContext = createContext({
    user: null,
    loading: true,
    updateUser: () => { console.warn("updateUser called on initial context") },
    clearUser: () => { console.warn("clearUser called on initial context") },
    fetchUserProfile: async () => {
        console.warn("fetchUserProfile called on initial context");
        return null;
    }
});

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = useCallback(async () => {
        const accessToken = localStorage.getItem("token");
        if (!accessToken) {
            setUser(null);
            setLoading(false);
            return null;
        }
        try {
            const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
            if (response.data && response.data._id) {
                setUser(response.data);
            } else {
                console.warn("[UserContext] fetchUserProfile - Invalid data from profile API:", response.data);
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                localStorage.removeItem("token");
            }
            setUser(null);  
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    const updateUser = useCallback((data) => {
        setLoading(true);

        if (data && data.token) {
            localStorage.setItem("token", data.token);
        }

        let userInfoToSet = null;

        if (data && data.user && typeof data.user === 'object' && data.user._id) {
            userInfoToSet = data.user;
        } else if (data && data._id && typeof data.token !== 'undefined') {
            const { token, ...userDataFromApi } = data;
            userInfoToSet = userDataFromApi;
        } else if (data && data._id && typeof data.token === 'undefined') {
            userInfoToSet = data;
        }

        if (userInfoToSet && userInfoToSet._id) {
            setUser(prevUser => {
                const updatedUser = { ...(prevUser || {}), ...userInfoToSet };
                return updatedUser;
            });
            setLoading(false);
        } else if (data && data.token && (!userInfoToSet || !userInfoToSet._id)) {
            fetchUserProfile().finally(() => setLoading(false));
        } else {
            console.warn("[UserContext] updateUser - Invalid data or could not extract userInfo. Data:", data);
            setUser(null);
            setLoading(false);
        }
    }, [fetchUserProfile]);

    const clearUser = useCallback(() => {
        setUser(null);
        localStorage.removeItem("token");
        setLoading(false);
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, updateUser, clearUser, fetchUserProfile }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;