import React, { useContext, useRef } from 'react';
import { useState, useEffect } from 'react';
import Avatar from './Avatar';
import Logo from './Logo';
import { UserContext } from './UserContext';
import axios from 'axios';
import Contacts from './Contacts';

const Chat = () => {
    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const selectedUserRef = useRef('');
    const [newMessageText, setNewMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const [offlineUser, setOfflineUser] = useState({});
    const { username, id, setId, setUsername } = useContext(UserContext);
    const messagesEndRef = useRef(null);
    useEffect(() => {
        connectWebSocket();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (selectedUserRef.current) {
            axios.get('/messages/' + selectedUserRef.current).then((res) => {
                setMessages(res.data);
            });
        }
    }, [selectedUserRef.current]);

    useEffect(() => {
        axios.get('/user').then((res) => {
            const users = res.data;
            const idsToRemove = Object.keys(onlinePeople);
            const offlineUserArr = users.filter((user) => user._id != id).filter((user) => !idsToRemove.includes(user._id));
            const offlineUserObj = {};

            offlineUserArr.forEach(user => {
                offlineUserObj[user._id] = user.username;
            })

            setOfflineUser(offlineUserObj)
        })
    }, [onlinePeople])

    const connectWebSocket = () => {
        const newWs = new WebSocket('ws://localhost:4000');

        newWs.addEventListener('open', () => {
            console.log('WebSocket connected');
            setWs(newWs);
        });

        newWs.addEventListener('message', handleMessage);

        newWs.addEventListener('close', () => {
            console.log('WebSocket closed');
            setWs(null);
            // Reconnect after a delay (e.g., 1 seconds)
            setTimeout(connectWebSocket, 1000);
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    const showOnlinePeople = (peopleArray) => {
        const people = {};
        peopleArray.forEach(({ userId, username }) => {
            people[userId] = username;
        });
        setOnlinePeople(people);
    };

    const handleMessage = (ev) => {
        const messageData = JSON.parse(ev.data);
        if ('online' in messageData) {
            showOnlinePeople(messageData.online);
        } else {
            if (selectedUserRef.current === messageData.sender) {
                setMessages((prev) => [...prev, { ...messageData }]);
            }
        }
    };

    const sendMessage = (ev, file = null) => {
        if (ev) ev.preventDefault();

        const message = {
            to: selectedUserRef.current,
            text: newMessageText.trim(),
            file,
        };
        try {
            ws.send(JSON.stringify(message));
        } catch (error) {
            console.error('Error while sending message:', error.message);
        }


        if (newMessageText.trim() !== '') {
            setMessages((prev) => [
                ...prev,
                {
                    text: newMessageText,
                    sender: id,
                    recipient: selectedUserRef.current,
                    _id: Date.now(),
                },
            ]);
        }
        setNewMessageText('');

        if (file) {
            axios.get('/messages/' + selectedUserRef.current).then((res) => {
                setMessages(res.data);
            });
        }
    };

    function sendFile(ev) {
        const reader = new FileReader();
        reader.readAsDataURL(ev.target.files[0]);
        console.log(ev.target.files[0].name);

        reader.onload = () => {
            sendMessage(null, {
                name: ev.target.files[0].name,
                data: reader.result,
            })
        }

    }


    const onlineUserExcludingOurUser = { ...onlinePeople };
    delete onlineUserExcludingOurUser[id];

    const findUniqueObjectsById = (arr) => {
        const uniqueObjects = [];
        const idSet = new Set();

        for (const obj of arr) {
            if (!idSet.has(obj._id)) {
                uniqueObjects.push(obj);
                idSet.add(obj._id);
            }
        }

        return uniqueObjects;
    };

    const uniqueMessage = findUniqueObjectsById(messages);

    console.log('current : ' + selectedUserRef.current);
    // console.log('userId  : ' + userId);

    const logOut = () => {
        axios.post('/logout').then((res) => {
            setWs(null);
            setId(null);
            setUsername(null);
        })
    }
    console.log('bi');
    return (
        <div className="flex h-screen">
            <div className="w-1/3 flex flex-col bg-blue-100">
                <div className='flex-grow '>
                    <Logo />
                    {Object.keys(onlineUserExcludingOurUser).map((userId) => (
                        <Contacts
                            key={userId}
                            id={userId}
                            selected={selectedUserRef.current === userId}
                            online={true}
                            username={onlineUserExcludingOurUser[userId]}
                            onClick={() => {
                                selectedUserRef.current = userId;
                                setMessages([]);
                            }}
                        />
                    ))}
                    {Object.keys(offlineUser).map((userId) => (
                        <Contacts
                            key={userId}
                            id={userId}
                            selected={selectedUserRef.current === userId}
                            online={false}
                            username={offlineUser[userId]}
                            onClick={() => {
                                selectedUserRef.current = userId;
                                setMessages([]);
                            }}
                        />
                    ))}
                </div>
                <div className='flex justify-center items-center'>
                    <button className='bg-gray-800 text-white flex items-center justify-center gap-1 p-3 m-2 rounded-md rounded-l-full cursor-pointer'
                        onClick={logOut}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                        </svg>
                        Logout
                    </button>

                    <div className='p-2 mr-2 flex font-bold gap-1 items-centre justify-center'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                        {username}
                    </div>
                </div>
            </div>
            <div className="bg-gray-700 w-2/3 flex flex-col">
                <div className="flex-grow bg-gray-800">
                    {selectedUserRef.current === '' && (
                        <div className="text-gray-400 flex h-full justify-center items-center">
                            <div>&larr; Select a person from the sidebar</div>
                        </div>
                    )}
                    {!!selectedUserRef.current && (
                        <div className="relative h-full ">
                            <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2 text-white">
                                {uniqueMessage.map(message => (
                                    <div key={message._id} className={(message.sender === id ? 'text-right' : 'text-left')}>
                                        <div className={"text-left whitespace-normal inline-block p-2 m-2 rounded-md text-sm " + (message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 ')}>
                                            {message.text}
                                            {message.file && (
                                                <div>
                                                    <a href={axios.defaults.baseURL + "/uploads/" + message.file} className='border-b-2 flex items-center justify-center'>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                                        </svg>
                                                        {message.file}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef}></div>
                            </div>
                        </div>
                    )}
                </div>


                {!!selectedUserRef.current && (
                    <form className="flex p-2 gap-2" onSubmit={sendMessage}>
                        <input
                            type="text"
                            value={newMessageText}
                            onChange={(ev) => setNewMessageText(ev.target.value)}
                            placeholder="Enter the message"
                            className="flex-grow p-2 rounded-sm border bg-white"
                        />

                        <label className='transition ease-in-out delay-150 p-2 text-white flex items-center justify-center rounded-sm hover:bg-slate-600 duration-300  cursor-pointer'>
                            <input type="file" className='hidden' onChange={sendFile} />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                            </svg>
                        </label>

                        <button
                            type="submit"
                            className="transition ease-in-out delay-150 p-2 text-white flex items-center justify-center rounded-sm hover:bg-slate-600 duration-300 cursor-pointer "
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                            </svg>
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Chat;