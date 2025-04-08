import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChats, accessChat } from "../../redux/actions/chatActions";
import axios from 'axios';

const ChatPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { selectedChat, chats } = useSelector((state) => state.chat);
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  // Fetch chats when component mounts
  useEffect(() => {
    dispatch(fetchChats());
    console.log(JSON.stringify(user, null, 2)); 
    console.log("chats: "+chats);
  }, [dispatch]);
  
  // Fetch messages when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
    }
  }, [selectedChat]);
  
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const fetchMessages = async () => {
    if (!selectedChat) return;
    
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);
      setMessages(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setLoading(false);
    }
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      setNewMessage('');
      const { data } = await axios.post(
        '/api/message',
        {
          content: newMessage,
          chatId: selectedChat._id,
        },
        config
      );
      
      setMessages([...messages, data]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  const getSenderName = (chat) => {
    if (!chat || !user) return '';
    return chat.isGroupChat 
      ? chat.chatName 
      : chat.users.find(u => u._id !== user._id)?.name || '';
  };
  
  const getSenderAvatar = (chat) => {
    if (!chat || !user) return '/api/placeholder/40/40';
    return chat.isGroupChat 
      ? '/api/placeholder/40/40' // Group avatar
      : chat.users.find(u => u._id !== user._id)?.pic || '/api/placeholder/40/40';
  };
  
  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    
    // Socket implementation would go here for typing indicators
  };
  
  const isSameUser = (messages, m, i) => {
    return i > 0 && messages[i - 1].sender._id === m.sender._id;
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left sidebar - Chat list */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
          <div className="mt-2">
            <input
              type="text"
              placeholder="Search or start a new chat"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Chat list */}
        <div className="overflow-y-auto flex-1">
          {chats && chats?.map((chat) => (
            <div 
              key={chat._id} 
              onClick={() => dispatch(accessChat(chat._id))}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${
                selectedChat?._id === chat._id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="relative">
                <img 
                  src={getSenderAvatar(chat)} 
                  alt={getSenderName(chat)} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                {chat.latestMessage?.sender._id !== user._id && chat.unreadMessages > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {chat.unreadMessages}
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex justify-between">
                  <h3 className="font-medium text-gray-900 truncate">{getSenderName(chat)}</h3>
                  <span className="text-xs text-gray-500">
                    {chat.latestMessage?.createdAt 
                      ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                      : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {chat.latestMessage 
                    ? `${chat.latestMessage.sender._id === user._id ? 'You: ' : ''}${chat.latestMessage.content}` 
                    : 'Start a conversation'}
                </p>
              </div>
            </div>
          ))}
          
          {chats.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Search for users to start chatting</p>
            </div>
          )}
        </div>
        
        {/* User profile */}
        <div className="p-4 border-t border-gray-200 flex items-center">
          <img 
            src={user?.pic || '/api/placeholder/40/40'} 
            alt={user?.name} 
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="ml-3">
            <p className="font-medium text-gray-900">{user?.name}</p>
          </div>
          <div className="ml-auto">
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Right side - Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
              <div className="flex items-center">
                <img 
                  src={getSenderAvatar(selectedChat)} 
                  alt={getSenderName(selectedChat)} 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">{getSenderName(selectedChat)}</h3>
                  {isTyping ? (
                    <p className="text-xs text-blue-500">Typing...</p>
                  ) : (
                    <p className="text-xs text-gray-500">Online</p>
                  )}
                </div>
              </div>
              
              <div className="ml-auto flex space-x-2">
                <button className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, i) => (
                    <div 
                      key={message._id} 
                      className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'} ${
                        isSameUser(messages, message, i) ? 'mt-1' : 'mt-3'
                      }`}
                    >
                      {message.sender._id !== user._id && !isSameUser(messages, message, i) && (
                        <img 
                          src={message.sender.pic || '/api/placeholder/40/40'} 
                          alt={message.sender.name} 
                          className="h-8 w-8 rounded-full mr-2 self-end"
                        />
                      )}
                      {message.sender._id !== user._id && isSameUser(messages, message, i) && (
                        <div className="w-8 mr-2"></div>
                      )}
                      <div>
                        <div 
                          className={`px-4 py-2 rounded-2xl max-w-xs md:max-w-md ${
                            message.sender._id === user._id 
                              ? 'bg-blue-600 text-white rounded-br-none' 
                              : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div 
                          className={`text-xs text-gray-500 mt-1 ${
                            message.sender._id === user._id ? 'text-right' : 'text-left'
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                      {message.sender._id === user._id && (
                        <img 
                          src={user.pic || '/api/placeholder/40/40'} 
                          alt={user.name} 
                          className="h-8 w-8 rounded-full ml-2 self-end"
                        />
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex mt-2">
                  <div className="flex space-x-1 ml-12 bg-gray-200 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={sendMessage} className="flex items-center">
                <button type="button" className="text-gray-500 hover:text-gray-700 p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={typingHandler}
                  placeholder="Type a message..."
                  className="flex-1 border-0 focus:ring-0 focus:outline-none px-4 py-2"
                />
                <button type="button" className="text-gray-500 hover:text-gray-700 p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button 
                  type="submit" 
                  className="ml-2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:opacity-50"
                  disabled={!newMessage.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          // No chat selected state
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <div className="text-center p-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-1">Select a chat to start messaging</h3>
              <p className="text-gray-500">Choose from your existing conversations or start a new conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;