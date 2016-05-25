'use strict';


let React = require('react');
let ReactDom = require('react-dom');
import Helper from '../helper';
let Promise = require('promise');
let fs = require('fs');
let jQuery = require('jquery');
let apiHelper = new Helper();


let AppMenu = React.createClass({
    switchMainView: function (view) {
        if (view == 'friends') {
            ReactDom.render(<FriendsBox />, document.getElementById('app-container-dialogs'));
        } else if (view == 'dialogs') {
            ReactDom.render(<DialogsBox />, document.getElementById('app-container-dialogs'));
        } else if (view == 'settings') {
            return;
        }
    },
    render: function() {
        let friendsView = this.switchMainView.bind(this, 'friends');
        let dialogsView = this.switchMainView.bind(this, 'dialogs');
        let settingsView = this.switchMainView.bind(this, 'settings');
        return (
            <div className="app-menu-inner">
                <div className="app-menu-inner-list">
                    <div className="app-menu-inner-list-element" onClick={friendsView}>F</div>
                    <div className="app-menu-inner-list-element active" onClick={dialogsView}>D</div>
                    <div className="app-menu-inner-list-element" onClick={settingsView}>S</div>
                </div>
            </div>
        );
    }
});


let FriendsList = React.createClass({
    render: function() {
        let friendsNodes = this.props.data.map(function(friend) {
            let uname = friend.first_name + ' ' + friend.last_name;
            return (
                <div className="list-element" data-friend_id={friend.id} key={friend.id} data-type="tet-a-tet">
                    <div className="friends-list-element-inner">
                        <div className="list-element-photo"><img src={friend.photo_50} /></div>
                        <div className="friends-list-element-name" data-user-name={uname}>{uname}</div>
                    </div>
                </div>
            );
        });
        return (
            <div className="friends-list">
                {friendsNodes}
            </div>
        );
    }
});

let FriendsBox = React.createClass({
    getFriendsFromServer: function() {
        apiHelper.getFriends()
            .then(friends => {
                // this.setState({data: friends});
                this.saveFriends(friends);
                return friends;
            })
            .then(friends => {
                // this.saveFriends(friends);
                this.setState({data: friends});
            })
    },
    saveFriends: function(friends) {
        let toWrite = {};
        for (let i = 0; i < friends.length; i++) {
            let uid = friends[i]['id'];
            let firstName = friends[i]['first_name'];
            let lastName = friends[i]['last_name'];
            let photoUrl = friends[i]['photo_50'];
            toWrite[uid] = {
                    'first_name': firstName,
                    'last_name': lastName,
                    'photo': photoUrl
            };
        }
        fs.writeFileSync(__dirname + '/friends_data.json', JSON.stringify(toWrite));
    },
    getInitialState: function() {
        return {data: []};
    },
    componentDidMount: function() {
        this.getFriendsFromServer();
        console.log('mount');
        console.log(this.state);
    },
    componentWillUnmount: function () {
        // jQuery('#app-container-dialogs').empty();
    },
    render: function() {
        return (
            <div className="app-container-inner">
                <FriendsList data={this.state.data} />
            </div>
        );
    }
});

let DialogsList = React.createClass({
    onDialogClick: function(text, e) {
        console.log(text);
    },
    render: function() {
        console.log('data', this.props.data);
        let u = JSON.parse(fs.readFileSync(__dirname + '/friends_data.json'));
        let friendsNodes = this.props.data.map(function(dialog) {
            let body = (dialog.message.body.length > 20) ? dialog.message.body.substr(0,20) + '...' : dialog.message.body;

            let dialog_type = dialog.message.chat_id ? 'chat' : 'tet-a-tet';
            let mid = dialog.message.chat_id ? dialog.message.chat_id : dialog.message.user_id;
            let title = dialog.message.chat_id ? dialog.message.title.substr(0,18) :
                        u[dialog.message.user_id] ? u[dialog.message.user_id].first_name + ' ' + u[dialog.message.user_id].last_name :
                        'unknow user';
            let photo = dialog.message.photo_50 ? dialog.message.photo_50 :
                        u[dialog.message.user_id] ? u[dialog.message.user_id].photo : 'http://vk.com/images/camera_50.png';

            let date = dialog.message.date * 1000;
            let ndate = new Date(date);
            let cdate = ndate.toLocaleDateString();
            let readState = dialog.message.read_state;
            return (
                <div className="list-element" data-dialog_id={mid} key={dialog.message.id} data-type={dialog_type} >
                    <div className="dialogs-list-element-inner">
                        <div className="list-element-photo"><img src={photo} /></div>
                        <div className="dialogs-list-element-info">
                            <div className="dialogs-list-element-info-head">
                                <div className="dialogs-list-element-info-head-name">
                                    {title}
                                </div>
                                <div className="dialogs-list-element-info-head-date">
                                    {cdate}
                                </div>
                            </div>
                            <div className="dialogs-list-element-info-head-body">
                                {body}
                            </div>
                        </div>
                    </div>
                </div>
            );
        });
        return (
            <div className="dialogs-list" onClick={this.onDialogClick.bind(this, 'hi')}>
                {friendsNodes}
            </div>
        );
    }
});

let DialogsBox = React.createClass({
    getDialogsFromServer: function(offset) {
        apiHelper.getDialogs(offset)
            .then(dialogs => {
                let d = this.state.data.concat(dialogs)
                this.setState({data: d});
            });
    },
    getInitialState: function() {
        return {data: []};
    },
    componentDidMount: function() {
        this.getDialogsFromServer('0');
        jQuery('#app-container-dialogs').on('scroll', this.handleScroll);
    },
    componentWillUnmount: function () {
        jQuery('#app-container-dialogs').empty();
    },
    handleScroll: function() {
        // FRIENDS DELETE SCROLL EVENTS
        let elem = jQuery('#app-container-dialogs')
        if (elem.scrollTop() + elem.innerHeight()  == elem[0].scrollHeight) {
            let page = jQuery('.app-container-inner').attr('data-pagination')
            this.getDialogsFromServer(page);
            console.log(this.state.data);
            jQuery('.app-container-inner').attr('data-pagination', parseInt(page) + 20)
        }
    },
    render: function() {
        return (
            <div className="app-container-inner" data-pagination="20">
                <DialogsList data={this.state.data} />
            </div>
        );
    }
});


let UserMessagesList = React.createClass({
    render: function() {
        let friendsNodes = this.props.data.map(function(message) {
            let body = message.body;

            let date = message.date * 1000;
            let ndate = new Date(date);
            let cdate = ndate.toLocaleDateString();
            // let readState = dialog.message.read_state;
            return (
                <div key={message.id}>
                    {body}
                </div>
            );
        });
        return (
            <div className="messages-list">
                {friendsNodes}
            </div>
        );
    }
});

let UserMessagesBox = React.createClass({
    getMessagesFromServer: function(userId, offset) {
        apiHelper.loadUserMessageHistory(userId, offset)
            .then(history => {
                let d = this.state.data.concat(history)
                this.setState({data: d});
            });
    },
    getInitialState: function() {
        return {data: [], id: ''};
    },
    componentDidMount: function() {
    //     // let firstMessage = jQuery('.messages-list div:first');
        // this.getMessagesFromServer(this.props.items, '0');
        console.log('did mount: ', this.state.id);
    //     jQuery('#app-container-messages').on('scroll', this.handleScroll);
    //     console.log(jQuery('#app-container-messages')[0].scrollHeight);
    //     jQuery('#app-container-messages').scrollTop(1000);
    //     // jQuery('.right-menu-content').scrollTop(firstMessage.offset().top - 50);
    },
    componentWillUnmount: function () {
        console.log('unmount');
    },
    componentWillMount: function () {
        // this.getMessagesFromServer(this.props.items, '0');
        console.log('wil mount: ', this.props.id);
        this.setState({id: this.props.id})
    },
    handleScroll: function() {
        let elem = jQuery('#app-container-messages');
        // if (elem.scrollTop() == 223) {
        //     let page = jQuery('.app-messages-container-inner').attr('data-pagination')
        //     this.getMessagesFromServer(this.props.items, page);
        //     console.log(this.state.data);
        //     jQuery('.app-messages-container-inner').attr('data-pagination', parseInt(page) + 50)
        // }
    },
    render: function() {
        console.log('render: ', this.props.id);
        // this.getMessagesFromServer(this.props.items, '0');
        return (
            <div className="app-messages-container-inner" data-pagination="50">
                <UserMessagesList data={this.state.data.reverse()} />
            </div>
        );
    }
});



ReactDom.render(<AppMenu/>, document.getElementById('app-menu'));
ReactDom.render(<DialogsBox />, document.getElementById('app-container-dialogs'));


// jQuery(document).on('click', ".list-element", function() {
//     let type = jQuery(this).attr('data-type');
//     let mid = jQuery(this).attr('data-dialog_id')
//     if (type == 'tet-a-tet') {
//         ReactDom.render(<UserMessagesBox id={mid}/>, document.getElementById('app-container-messages'));
//     } else if (type == 'chat') {
//
//     }
// });

jQuery(document).on('click', ".app-menu-inner-list-element", function() {
    let appWidth = $(window).width();
    let appHeight = $(window).height();

    jQuery(".app-menu-inner-list-element").removeClass('active');
    jQuery(this).toggleClass('active');
    // if (jQuery(this).attr('data-name') == 'friends') {
    //     // ReactDom.render(<FriendsBox/>, document.getElementById('app-container-dialogs'));
    // } else if (jQuery(this).attr('data-name') == 'dialogs') {
    //     ReactDom.render(<DialogsBox/>, document.getElementById('app-container-dialogs'));
    // }
    jQuery('#app-container').height(appHeight);
});
