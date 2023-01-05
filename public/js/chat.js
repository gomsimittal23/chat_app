const socket = io();

//elements
const $msgForm = document.querySelector("#msg-form");
const $msgFormInput = $msgForm.querySelector('input');
const $msgFormButton = $msgForm.querySelector('button');
const $locationBtn = document.querySelector('#send-location');
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

//templates
const msgTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true }); //gets access to url query

const autoScroll = () => {
    const $newMsg = $messages.lastElementChild

    const newMsgStyle = getComputedStyle($newMsg);
    const newMsgMargin = parseInt(newMsgStyle.marginBottom);
    const newMsgHeight = $newMsg.offsetHeight + newMsgMargin;

    const visibleHeight = $messages.offsetHeight;

    //height of messages container
    const containerHeight = $messages.scrollHeight;

    //how far have i scrolled
    const scrollOffset = Math.ceil($messages.scrollTop) + visibleHeight;

    if(containerHeight - newMsgHeight <= scrollOffset)
    {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    console.log(message);

    const html = Mustache.render(msgTemplate, {
        dynamicUsername: message.username,
        dynamicMsg: message.text,
        dynamicTime: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage', (message) => {
    console.log(message);

    const html = Mustache.render(locationTemplate, {
        dynamicUsername: message.username,
        dynamicLocation: message.url,
        dynamicTime: moment(message.createdAt).format('h:mm a')
    });

    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('roomData', ({ room, users }) => {
    console.log(room);
    console.log(users);

    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    $sidebar.innerHTML = html;
})

$msgForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $msgFormButton.setAttribute('disabled', 'disabled');

    let text = document.querySelector("#input").value;

    // console.log(text);

    //last argument is acknowledgement that msg was delivered from client to server
    socket.emit('sendMessage', text, (error) => {
        $msgFormButton.removeAttribute('disabled');
        $msgFormInput.value = '';
        $msgFormInput.focus();

        if(error)   return alert(error);

        console.log('Message delivered');
    });
});

$locationBtn.addEventListener('click', () => {
    if(!navigator.geolocation)
    {
        return alert('geolocation is not supported  by your browser');
    }

    $locationBtn.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        let latitude = position.coords.latitude;
        let longitude = position.coords.longitude;

        socket.emit('sendLocation', { latitude, longitude }, () => {
            $locationBtn.removeAttribute('disabled'); 
            console.log('Location shared!');
        });
    })
});

socket.emit('join', { username, room }, (error) => {
    if(error)
    {
        alert(error);
        location.href = '/';
    }
});