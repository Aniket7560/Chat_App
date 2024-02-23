import React from 'react';
import Avatar from './Avatar';

const Contacts = ({id, selected, online, username, onClick}) => {
    return (
        <div key={id}
            onClick={() => {
                // Clear previous messages when selecting a new user
                if (!selected) {  
                    onClick();
                }
            }}
            className={
                ' border-b border-gray-300  flex items-center gap-2 cursor-pointer ' +
                (selected ? 'bg-gray-200' : '')
            }
        >
            {selected && (
                <div className=" w-1 h-12 bg-blue-500 rounded-r-md "></div>
            )}
            <div className="flex gap-2 py-2 pl-2">
                <Avatar online={online} userId={id} username={username} />
                <span className="text-gray-800">{username}</span>
            </div>
        </div>
    )
}

export default Contacts