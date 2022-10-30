const socket = io();
const $loginForm = $('#login-form');
const $loginArea = $('#login-area');
const $msgForm = $('#message-form');
const $messageArea = $('#message-area');
const $errorMessage = $('#error-msg');
let last;

socket.on('connect', () => {
    $loginForm.on('submit', function (e) {
        e.preventDefault();
        const $username = $.trim($loginForm.find('input[name=username]').val());
        const $room = $.trim($loginForm.find('input[name=room]').val());
        socket.emit(
            'joinRoom',
            {
                username: $username,
                room: $room
            },
            function (data) {
                if (data.nameAvailable) {
                    $('.room-title').append('<strong>Room Code:</strong> ' + $room);
                    $messageArea.show();
                    $loginArea.hide('slow');
                } else {
                    $errorMessage.text(data.error);
                }
            }
        );
    });
});

function scrollSmoothToBottom(id) {
    const div = document.getElementById(id);
    $('#' + id).animate(
        {
            scrollTop: div.scrollHeight - div.clientHeight
        },
        500
    );
}

socket.on('message', (message) => {
    const momentTimestamp = moment.utc(message.timestamp);
    const $message = $('#messages');
    if (last !== message.username) $message.append(
        '<p><strong>' +
            message.username +
            '</strong> • <span class="time">' +
            momentTimestamp.local().format('hh:mm A') +
            '</span></p>'
    );
    $message.append('<div class="wrap-msg"><p>' + message.text + '</p></div>');
    last = message.username;
    scrollSmoothToBottom('messages');
});

$msgForm.on('submit', (e) => {
    e.preventDefault();

    const $message = $msgForm.find('textarea[name=message]');
    const $username = $loginForm.find('input[name=username]');
    if (!$message.val().trim())
        return alert('Enter a message!') && $message.val('');
    socket.emit('message', {
        username: $.trim($username.val()),
        text: $message.val()
    });
    $message.val('');
});

$('#textarea').keypress((e) => {
    if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();

        const $message = $msgForm.find('textarea[name=message]');
        const $username = $loginForm.find('input[name=username]');
        if (!$message.val().trim())
            return alert('Enter a message!') && $message.val('');
        socket.emit('message', {
            username: $.trim($username.val()),
            text: $message.val()
        });
        $message.val('');
    }
});

$(document).ready(() => {
    $('*').css({ transition: 'color 0.5s, background 0.5s' });
});