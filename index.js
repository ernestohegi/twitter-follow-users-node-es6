(function () {
    'use strict';

    console.log('Twitter API');

    const PRODUCER_HANDLE           = 'XXXX',
          CONSUMER_HANDLE           = 'XXXX',
          FRIENDS_API_KEY           = 'friends/ids',
          FRIENDSHIP_CREATE_API_KEY = 'friendships/create',
          USERS_LOOKUP_API_KEY      = 'users/lookup';

    let Twitter = require('twitter'),
        credentialsHandler = require('./credentials'),
        twitterClients;

    twitterClients = {
        init: function () {
            this.clients = [];
            this.usersIterator = function () {};

            this.generateClients();

            this.getFriends(PRODUCER_HANDLE, this.parseFriends);
        },
        generateClients: function () {
            let credentials = credentialsHandler.getCredentials();

            this.clients[PRODUCER_HANDLE] = new Twitter(credentials.producer);
            this.clients[CONSUMER_HANDLE] = new Twitter(credentials.consumer);
        },
        getFriends: function (handle, callback) {
            console.log('Getting friends from ' + handle);

            this.clients[handle].get(FRIENDS_API_KEY, {}, (error, friends, response) => {
                if (error) {
                    console.log(error);
                    return false;
                }

                callback.call(this, PRODUCER_HANDLE, friends, 100);
            });
        },
        parseFriends: function (handle, friends, chunk) {
            let i,
                j,
                friendsList,
                friendsIds = friends.ids;

            for (i = 0, j = friendsIds.length; i < j; i += chunk) {
                friendsList = friendsIds.slice(i, i+chunk);

                this.clients[handle].get(
                    USERS_LOOKUP_API_KEY,
                    {
                        user_id: friendsList.toString()
                    },
                    (error, users, response) => {
                        if (error) {
                            console.log(error);
                            return false;
                        }

                        this.usersIterator = this.createUsersGenerator(users);

                        this.createFriendship(CONSUMER_HANDLE, this.usersIterator.next())
                    }
                );
            }
        },
        createUsersGenerator: function* (users) {
            yield* users;
        },
        createFriendship: function (handle, user) {
            if (user.done) return false;

            this.clients[handle].post(
                FRIENDSHIP_CREATE_API_KEY,
                {
                    user_id: user.value.id_str
                },
                (error, friend, response) => {
                    if (error) {
                        console.log(error);
                    }

                    console.log('Friendship created!', user.value.name + ' ' + user.value.id_str);

                    this.createFriendship(handle, this.usersIterator.next());
                }
            );
        }
    };

    twitterClients.init();
})();
