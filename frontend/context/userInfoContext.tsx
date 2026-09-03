"use client"
import authenticationService from "@/services/auth/authenticationService";
import React, { Context, ReactElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {error} from "console";

export const UserInfoContext: Context<UserInfo> = React.createContext({
    name:'',
    email: '',
    fetchUserInfo: () => {
    }
});

export function UserInfoProvider({ children }: React.PropsWithChildren): ReactElement {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        fetchUserInfo();
    }, [])

    const fetchUserInfo: () => void = useCallback(() => {
        authenticationService.checkAuthenticated()
        .then((response)=>{
            if(response.isAuthenticated){
                setName(response.authenticatedUser.username)
                setEmail(response.authenticatedUser.email)
            }
        }).catch((error)=>{
            console.log(error)
        })
    }, [])


    const userInfo: UserInfo = useMemo(() => (
        {
            name,
            email,
            fetchUserInfo
        }
    )
        , [name, email, fetchUserInfo]
    );
    return <UserInfoContext.Provider value={userInfo}>{children}</UserInfoContext.Provider>;

}
export const useUserInfoContext = () => {
    const { email,name, fetchUserInfo } = useContext(UserInfoContext);
    return { email, name, fetchUserInfo };
};
