import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const UserContext = createContext({});

export function UserContextProvider({children}){
    const [username, setUsername] = useState('');
    const [id, setId] = useState('');
    useEffect(()=>{
        axios.get('/profile').then(response => {
            setId(response.data.userId);
            setUsername(response.data.username);
        })
    }, [])
    return (
        <UserContext.Provider value={{username, setUsername, id, setId}}>
            {children}
        </UserContext.Provider>
    );
}

