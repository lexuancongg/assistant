"use client";

import React, { Context, ReactElement, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import authenticationService from "@/services/auth/authenticationService";

export const UserInfoContext: Context<UserInfo> = React.createContext({
    name: '',
    email: '',
    fetchUserInfo: () => {}
});

export function UserInfoProvider({ children }: React.PropsWithChildren): ReactElement {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const initialCheckDoneRef = useRef(false);

    const fetchUserInfo: () => void = useCallback(() => {
        authenticationService.checkAuthenticated()
            .then((response) => {
                if (response.isAuthenticated) {
                    setName(response.authenticatedUser.username);
                    setEmail(response.authenticatedUser.email);
                }
            })
            .catch((err) => {
                console.warn('Failed to fetch user info:', err);
            });
    }, []);

    useEffect(() => {
        if (initialCheckDoneRef.current) return;
        initialCheckDoneRef.current = true;
        fetchUserInfo();
    }, [fetchUserInfo]);

    const userInfo: UserInfo = useMemo(() => ({
        name,
        email,
        fetchUserInfo
    }), [name, email, fetchUserInfo]);

    return <UserInfoContext.Provider value={userInfo}>{children}</UserInfoContext.Provider>;
}

export const useUserInfoContext = () => {
    const { email, name, fetchUserInfo } = useContext(UserInfoContext);
    return { email, name, fetchUserInfo };
};
