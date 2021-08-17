const socket  = io()        // create Websocket connection

// DOM elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room } = Qs.parse(location.search, {ignoreQueryPrefix:true})


const autoScroll = () =>{
    // New message element
    const $newMessage = $messages.lastElementChild

    // height of the new message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight


    // How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight
    


    if((containerHeight - newMessageHeight) <= scrollOffset +1){
        $messages.scrollTop = $messages.scrollHeight                //This makes visible content scrolled to the bottom
    }

}


socket.on('renderSavedChat', (data)=>{
    document.querySelector('#messages').innerHTML = data
})

socket.on('message', (data)=>{
    console.log(data)
    const html = Mustache.render(messageTemplate,{
        message: data.text,
        createdAt: moment(data.createdAt).format('h:mm a'),
        username: data.username
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('locationMessage', (data)=>{
    console.log(data)
    const html = Mustache.render(locationMessageTemplate, {
        url: data.url,
        createdAt: moment(data.createdAt).format('h:mm a'),
        username: data.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({room, users})=>{
   const html = Mustache.render(sidebarTemplate, {
       room: room,
       users: users
   })

   document.querySelector('#sidebar').innerHTML =html
})


$messageForm.addEventListener('submit', (event)=>{
    event.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    // const message = document.querySelector("#message-form input").value
    const message = event.target.elements.message.value
    socket.emit('sendMessage', message, (data)=>{

        $messageFormButton.removeAttribute('disabled') 
        $messageFormInput.value = ''
        $messageFormInput.focus()

        console.log('Message was ', data)
    })
})

document.querySelector('#send-location').addEventListener('click', ()=>{
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser")
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    
    navigator.geolocation.getCurrentPosition( (position)=>{
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () =>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })

    })

})


socket.emit('join',{username, room}, (error)=>{
    if (error){
        alert(error)
        location.href = '/'
    }
})

var currentContentMessages = $messages.innerHTML
const messagesAreChanged = ()=>{
    if(currentContentMessages!==$messages.innerHTML){
        currentContentMessages = $messages.innerHTML
        socket.emit('saveChat', currentContentMessages)
    }
}
setInterval(messagesAreChanged, 500)



// Responsive
const $panel_view = document.querySelector('#panel_view-on-phone')
const $sidebar = document.querySelector('#sidebar')

$panel_view.addEventListener('click', ()=>{
    $('#sidebar').toggle(500);
})