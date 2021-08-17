const generateMessage = (username,text) =>{
    return {
        username: username,
        text: text,
        createdAt: new Date().getTime()
    }
}   

const generateLocationMessage = (username, url) =>{
    return {
        url: url,
        createdAt: new Date().getTime(),
        username: username

    }
}   

module.exports = {
    generateMessage,
    generateLocationMessage
}