"use client"
import { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import Link from "next/link";

type UserAuthenticationInfo = {
    username: string,
}
export type authenticationInfoVm = {
    authenticatedUser: UserAuthenticationInfo,
    isAuthenticated: boolean
}


import authenticationService from "@/services/auth/authenticationService";
import { useRouter } from 'next/navigation';

function UserAuthInfo() {

    const [authenticationInfoVm, setUserAuthenticationVm] = useState<authenticationInfoVm>({
        isAuthenticated: false,
        authenticatedUser: {
            username: ''
        }
    });
    const router = useRouter();

    useEffect(() => {
        // check localStorage first for quick UI update
        try{
            if (typeof window !== 'undefined'){
                const username = window.localStorage.getItem('authUsername');
                const token = window.localStorage.getItem('accessToken');
                if (token) {
                    setUserAuthenticationVm({
                        isAuthenticated: true,
                        authenticatedUser: { username: username ?? '' }
                    });
                    return;
                }
            }
        }catch(e){/* ignore */}

        // fallback to calling backend
        authenticationService.checkAuthenticated()
            .then(resp => {
                if (resp && resp.isAuthenticated) {
                    setUserAuthenticationVm({
                        isAuthenticated: true,
                        authenticatedUser: { username: resp.authenticatedUser.username }
                    });
                } else {
                    setUserAuthenticationVm({
                        isAuthenticated: false,
                        authenticatedUser: { username: '' }
                    });
                }
            })
            .catch(() => {
                setUserAuthenticationVm({
                    isAuthenticated: false,
                    authenticatedUser: { username: '' }
                });
            });
    }, []);

    const handleLogout = async () => {
        try{
            await authenticationService.logout();
        }catch(e){
            console.warn('Logout failed', e);
        }
        setUserAuthenticationVm({ isAuthenticated: false, authenticatedUser: { username: '' } });
        router.push('/(auth)/login');
    };

    return (
        <>
            {authenticationInfoVm.isAuthenticated
                ?
                (

                    <Dropdown>
                        <Dropdown.Toggle variant="dark" id="user-dropdow " className="bg-transparent"
                            style={{ border: 'none', color: '#b2b2b2' }}
                        >
                            {authenticationInfoVm.authenticatedUser.username || 'xuan cong'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu variant="dark" style={{ backgroundColor: '#222' }}>
                            <Dropdown.Item as={Link} href="/profile" className="d-block h-full">
                                Profile
                            </Dropdown.Item>

                            <Dropdown.Item as={Link} href={"/my-orders"} className="d-block h-full">My orders</Dropdown.Item>
                            <Dropdown.Item className="d-block h-full" onClick={handleLogout}>Logout</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                )
                :
                (
                    <div>
                        <Link
                            href="http://localhost:8000/oauth2/authorization/ecommerce"
                            className="block text-gray-700 hover:text-blue-600 transition px-2 py-1 text-2xl"
                        >
                            <i className="bi bi-person-circle"></i>
                        </Link>
                    </div>
                )
            }
        </>
    );


}

export default UserAuthInfo;