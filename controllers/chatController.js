const Chat = require("../models/Chat");
const Message = require("../models/Message");

exports.addChat = async (chatInfo) => {
  try {
    console.log(chatInfo.participants)
    const existingChat = await Chat.find({ participants: chatInfo.participants });
    console.log("existingChat", existingChat)
    if (existingChat?.length > 0) {
      return existingChat;
    } else {
      const newChat = await Chat.create({ participants: chatInfo.participants });
      console.log(newChat)
      return newChat;
    }
  } catch (error) {
    console.log(error)
    return null;
  }
}
exports.getChatById = async (id) => {
  try {
    const chat = await Chat.findById(id);
    console.log(id, chat)
    if (chat) {
      return chat;
    }
    else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};
exports.getChatByParticipantId = async (id) => {
  try {
    const chat = await Chat.find({ participants: id })
      .populate({
        path: 'participants',
        match: { _id: { $ne: id } }, // Exclude your own user ID
        select: 'role image fullName',
      });
    console.log("All Check List------>", id, chat.length, chat);
    if (chat.length > 0) {
      return chat;
    }
    else {
      return null;
    }
    // const chat = await Chat.find({ participants: id }).populate('participants');
    // console.log(id, chat);
    // var data = [];
    // if (chat.length > 0) {
    //   for (const chatItem of chat) {
    //     const chatId = chatItem._id;
    //     const messages = await Message.find({ chat: chatId }).populate('message').sort({ createdAt: -1 }).limit(1);
    //     data.push({ chat: chatItem, message: messages });
    //   }
    //   return data;
    // } else {
    //   return data;
    // }
  } catch (err) {
    console.error(err);
    return null;
  }
};
exports.deleteChatById = async (id) => {
  try {
    const chat = await Chat.findByIdAndDelete(id);
    if (chat) {
      return chat;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error)
  }
}