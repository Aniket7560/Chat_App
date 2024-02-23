import axios from 'axios';
import React, { useContext, useState } from 'react'
import { UserContext } from './UserContext';

const RegisterAndLoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState('register');

    const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

    async function handleSubmit(ev) {
        ev.preventDefault();
        const url = isLoggedIn === 'register' ? 'register' : 'login';
        console.log(url);
        const { data } = await axios.post(url, { username, password });
        setId(data.id);
        console.log(data.id);
        setLoggedInUsername(username);
    }

    return (
        <>
            <div className='bg-blue-50 h-screen flex items-center'>
                <form className='w-64 mx-auto' onSubmit={handleSubmit}>
                    <input
                        value={username} onChange={ev => setUsername(ev.target.value)}
                        type="text" placeholder='username' className='block w-full rounded-sm p-2 mb-2 border'
                    />
                    <input
                        value={password} onChange={ev => setPassword(ev.target.value)}
                        type="password" placeholder='password' className='block w-full rounded-sm p-2 mb-2 border'
                    />
                    <button className='bg-blue-500 w-full rounded-sm p-2 mb-2 text-white block'>
                        {isLoggedIn === 'register' ? 'Register' : 'Login'}
                    </button>

                    <div className="text-center mt-2">
                        {isLoggedIn === 'register' && (
                            <div>
                                Already a member?
                                <button className="ml-2 text-blue-500" onClick={() => setIsLoggedIn('login')}>
                                    Login here
                                </button>
                            </div>
                        )}
                        {isLoggedIn === 'login' && (
                            <div>
                                Dont have an account?
                                <button className="ml-2  text-blue-500" onClick={() => setIsLoggedIn('register')}>
                                    Register
                                </button>
                            </div>
                        )}
                    </div>
                </form>
            </div>


        </>
    )
}

export default RegisterAndLoginForm