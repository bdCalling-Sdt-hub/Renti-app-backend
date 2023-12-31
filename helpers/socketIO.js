const { addChat, getChatByParticipantId } = require("../controllers/chatController");
const { addMessage, getMessageByChatId } = require("../controllers/messageController");

const socketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`ID: ${socket.id} just connectedemit('on`);
    socket.on('join-room', (data) => {
      console.log('someone wants to join--->', data);
      socket.join('room' + data.uid);
      socket.emit('join-check',

        {
          "uid": data.uid
        }

      );
    });

    socket.on('add-new-chat', async (data) => {
      console.log("data info----> data:", data)
      console.log("data info----> uid:", data.uid)
      console.log("data info---->: chatInfo", data.chatInfo)
      const chat = await addChat(data.chatInfo)
      console.log("add-new chat--->", chat, data.uid)
      io.to('room' + data.uid).emit('new-chat', chat)
    })
    socket.on("join-chat", async (data) => {
      socket.join('room' + data.uid)
      console.log("join-chat info---->", data)
      const allChats = await getMessageByChatId(data.uid)
      io.to("room" + data.uid).emit('all-messages', allChats)
    })

    socket.on('add-new-message', async (data) => {
      console.log("message info------->", data)
      const message = await addMessage(data)
      console.log('new message---------> ', message)
      const allMessages = await getMessageByChatId(message?.chat)
      console.log('all messages list----> ', allMessages)
      io.to('room' + message?.chat).emit('all-messages', allMessages)
    })

    socket.on('get-all-chats', async (data) => {
      const allChats = await getChatByParticipantId(data.uid)
      socket.join('room' + data.uid)
      console.log('hitting from socket -------->', allChats)
      io.to('room' + data.uid).emit('all-chats', allChats)
      // socket.emit('all-chats', allChats)
    })

    socket.on('leave-room', (data) => {
      if (data?.uid) {
        socket.leave('room' + data.uid);
      }
    });

    socket.on('disconnect', () => {
      console.log(`ID: ${socket.id} disconnected`);
    });
  });
};

module.exports = socketIO;
