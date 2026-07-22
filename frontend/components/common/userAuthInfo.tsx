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


function UserAuthInfo() {

    const [authenticationInfoVm, setUserAuthenticationVm] = useState<authenticationInfoVm>({
        isAuthenticated: false,
        authenticatedUser: {
            username: ''
        }
    });


   

    // useEffect(() => {
    //     customerService.getAuthenticationInfo()
    //         // .then((userAuthInfo) => {
    //         //     console.log(userAuthInfo)
    //         //     setUserAuthenticationVm(userAuthInfo)
    //         // })
    // }, [])

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
                            <Dropdown.Item className="d-block h-full">Logout</Dropdown.Item>
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