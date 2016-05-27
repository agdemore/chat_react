"use strict";

// const ipcRenderer = require('electron').ipcRenderer;
let request = require('request');
let vkAuth = require('./vk_auth');
let fs = require('fs');
let Promise = require('promise');
// let jQuery = require('jquery');
let notifier = require('node-notifier')

vkAuth.authenticate();

let appData = JSON.parse(fs.readFileSync(__dirname + '/app_data.json'));

class Helper {
    constructor() {
        this.accessToken = appData.access_token;
        this.userId = appData.user_id;
    }

    getFriends() {
        return new Promise((resolve, reject) => {
            request({
                url: 'https://api.vk.com/method/friends.get?user_id=' + this.userId + '&fields=nickname,photo_50&v=5.50'
            }, function(error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    let friendsJson = JSON.parse(response.body);
                    let friends = friendsJson.response.items;
                    resolve(friends);
                }
            });
        })
    }

    getDialogs(offset) {
        return new Promise((resolve, reject) => {
            request({
                url: 'https://api.vk.com/method/messages.getDialogs?access_token=' + this.accessToken + '&offset='+ offset +'&v=5.33'
            }, function(error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    let dialogsJson = JSON.parse(response.body);
                    let dialogs = dialogsJson.response.items;
                    resolve(dialogs);
                }
            });
        })
    }

    loadUserMessageHistory(userId, offset) {
        return new Promise((resolve, reject) => {
            request({
                url: 'https://api.vk.com/method/messages.getHistory?' +
                        'access_token=' + this.accessToken + '&count=50&offset=' + offset + '&user_id=' + userId +
                        '&start_message_id=0&v=5.38'
            }, function(error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    let historyJson = JSON.parse(response.body);
                    let history = historyJson.response.items;
                    resolve(history);
                }
            })
        })
    }

    loadChatHistory(chatId, offset) {
        return new Promise((resolve, reject) => {
            request({
                url: 'https://api.vk.com/method/messages.getHistory?' +
                        'access_token=' + this.accessToken + '&count=50&offset=' + offset + '&peer_id=' +
                        String(2000000000 + parseInt(chatId)) +
                        '&start_message_id=0&v=5.38'
            }, function(error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    let historyJson = JSON.parse(response.body);
                    let history = historyJson.response.items;
                    resolve(history);
                }
            })
        })
    }

    getUsers(usersString, fields) {
        return new Promise((resolve, reject) => {
            request({
                url: 'https://api.vk.com/method/users.get?' +
                        'users_ids=' + usersString + '&fields=' + fields + '&v=5.38'
            }, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    let usersJson = JSON.parse(response.body);
                    let users = usersJson.response.items;
                    resolve(users);
                }
            })
        })
    }
}


export default Helper;
