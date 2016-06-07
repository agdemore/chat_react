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
                this.setState({data: friends});
            })
    },
    getInitialState: function() {
        return {data: []};
    },
    componentDidMount: function() {
        this.getFriendsFromServer();
    },
    componentWillUnmount: function () {
        ReactDom.unmountComponentAtNode(document.getElementById('app-container-dialogs'))
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

        let u = this.props.users;// JSON.parse(fs.readFileSync(__dirname + '/friends_data.json'));
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
                    <div className="list-element-photo">
                        <img src={photo} />
                    </div>
                    <div className="dialogs-list-element-info">
                        <div className="dialogs-list-element-info-head">
                            <div className="dialogs-list-element-info-head-name">
                                {title}
                            </div>
                            {/*<div className="dialogs-list-element-info-head-date">
                                {cdate}
                            </div>*/}
                        </div>
                        {/*<div className="dialogs-list-element-info-head-body">
                            {body}
                        </div>*/}
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
                return d;
            })
            .then(d => {
                this.getIdsFromDialogs(d);
            });
    },
    getInitialState: function() {
        return {data: [], users: {}};
    },
    componentDidMount: function() {
        this.getDialogsFromServer('0');
        jQuery('#app-container-dialogs').on('scroll', this.handleScroll);
    },
    componentWillUnmount: function () {
        jQuery('#app-container-dialogs').off('scroll', this.handleScroll);
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
    getUsers: function (ids, fields) {
        apiHelper.getUsers(ids, fields)
            .then(users => {
                let u = {};
                for (let usr of users) {
                    u[usr.id] = {
                        'first_name': usr.first_name,
                        'last_name': usr.last_name,
                        'photo': usr.photo_50
                    }
                }
                return u;
            })
            .then(u => {
                this.setState({users: u});
            })
    },
    getIdsFromDialogs: function (data) {
        let usersIds = [];
        data.map(function (dialog) {
            if (dialog.message.user_id) {
                let uid = dialog.message.user_id;
                usersIds.push(uid);
            }
        });
        let idsString = usersIds.join(',');
        let fields = 'first_name,last_name,photo_50';
        this.getUsers(idsString, fields);
    },
    render: function() {
        return (
            <div className="app-container-inner" data-pagination="20">
                <DialogsList data={this.state.data} users={this.state.users}/>
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
    },
    componentWillUnmount: function () {
        console.log('unmount');
    },
    componentWillMount: function () {
        // this.getMessagesFromServer(this.props.items, '0');
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

let App = React.createClass({
    getInitialState: function() {
        return {
            "client_id": "5309107",
            "app_scope": "offline,friends,messages"
        };
    },
    componentDidMount: function() {
        //make vk_auth return promise then set state with token and so on
        //create object helper and pass to props
    },
    render: function() {
        return (
            <div id='app-container'>
                <div id='app-container-top'>

                </div>
                <div id="app-container-main">
                    <div id="app-container-dialogs">
                        <DialogsBox />
                    </div>
                    <div id="app-container-main-messages">
                    </div>
                </div>
            </div>
        );
    }
})


ReactDom.render(<App />, document.getElementById('app'));

jQuery(document).on('click', ".app-menu-inner-list-element", function() {
    let appWidth = $(window).width();
    let appHeight = $(window).height();

    jQuery(".app-menu-inner-list-element").removeClass('active');
    jQuery(this).toggleClass('active');
    jQuery('#app-container').height(appHeight);
});
