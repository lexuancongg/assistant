"use client"
import React, {Context, PropsWithChildren} from "react";
import {UserInfoProvider} from "@/context/userInfoContext";


export function AppProvider({children}: React.PropsWithChildren<{}>){
    return (
        <UserInfoProvider>
            {children}
        </UserInfoProvider>
    )
}
