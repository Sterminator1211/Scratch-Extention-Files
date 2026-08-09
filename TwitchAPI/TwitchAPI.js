(function (Scratch) {
    "use strict";

    const API_BASE = "https://api.twitch.tv/helix";
    const OAUTH_BASE = "https://id.twitch.tv/oauth2";

    class TwitchExtension {
        constructor() {
            // ---------------------------------------------------------
            // INTERNAL STATE
            // ---------------------------------------------------------
            // IMPORTANT:
            // These names intentionally do NOT match reporter method
            // names. This prevents:
            //
            // TypeError: t[n] is not a function
            //
            this._clientId = "";
            this._clientSecret = "";
            this._accessToken = "";

            this._lastResponse = "";
            this._lastStatus = 0;
            this._lastError = "";

            this._currentUser = null;
        }

        // =============================================================
        // EXTENSION INFO
        // =============================================================

        getInfo() {
            return {
                id: "generictwitch",
                name: "Twitch API",

                color1: "#9146FF",
                color2: "#772CE8",
                color3: "#5B1FB8",

                blocks: [

                    // =================================================
                    // AUTHENTICATION
                    // =================================================

                    {
                        opcode: "setClientId",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "set Twitch Client ID to [VALUE]",
                        arguments: {
                            VALUE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "setClientSecret",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "set Twitch Client Secret to [VALUE]",
                        arguments: {
                            VALUE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "setAccessToken",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "set Twitch Access Token to [VALUE]",
                        arguments: {
                            VALUE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "clearCredentials",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "clear Twitch credentials"
                    },

                    {
                        opcode: "getAppAccessToken",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "get Twitch App Access Token"
                    },

                    {
                        opcode: "validateToken",
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: "validate Twitch Access Token?"
                    },

                    {
                        opcode: "connected",
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: "Twitch API connected?"
                    },

                    {
                        opcode: "getOAuthToken",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch OAuth token"
                    },

                    {
                        opcode: "clientId",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch Client ID"
                    },

                    {
                        opcode: "accessToken",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch Access Token"
                    },

                    {
                        opcode: "lastStatus",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch last HTTP status"
                    },

                    {
                        opcode: "lastResponse",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch last response"
                    },

                    {
                        opcode: "lastError",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch last error"
                    },

                    // =================================================
                    // USERS
                    // =================================================

                    "---",

                    {
                        opcode: "getUser",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch user [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "getUsers",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch users [USERS]",
                        arguments: {
                            USERS: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch,shroud"
                            }
                        }
                    },

                    {
                        opcode: "getCurrentUser",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get current Twitch user"
                    },

                    {
                        opcode: "userId",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch user ID of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "userName",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch display name of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "userLogin",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch login of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "userDescription",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch description of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "userProfileImage",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch profile image of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "userOfflineImage",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch offline image of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "userCreatedAt",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch account creation date of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    // =================================================
                    // STREAMS
                    // =================================================

                    "---",

                    {
                        opcode: "getStream",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch stream for [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "isLive",
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: "is Twitch user [USER] live?",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "streamViewerCount",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch viewers of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "streamTitle",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch stream title of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "streamGame",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch stream game of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "streamLanguage",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch stream language of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "streamStartedAt",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch stream start time of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "streamThumbnail",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch stream thumbnail of [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "getStreams",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch streams parameters [PARAMETERS]",
                        arguments: {
                            PARAMETERS: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "first=20"
                            }
                        }
                    },

                    {
                        opcode: "getFollowedStreams",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch followed streams"
                    },

                    // =================================================
                    // CHANNELS
                    // =================================================

                    "---",

                    {
                        opcode: "getChannel",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch channel [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "twitch"
                            }
                        }
                    },

                    {
                        opcode: "setChannelTitle",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "set Twitch channel [CHANNEL] title to [TITLE]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            TITLE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "setChannelGame",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "set Twitch channel [CHANNEL] game to [GAME]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            GAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    // =================================================
                    // GAMES
                    // =================================================

                    "---",

                    {
                        opcode: "searchCategories",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "search Twitch categories for [QUERY]",
                        arguments: {
                            QUERY: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "Minecraft"
                            }
                        }
                    },

                    {
                        opcode: "getCategory",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch category [CATEGORY]",
                        arguments: {
                            CATEGORY: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "Minecraft"
                            }
                        }
                    },

                    {
                        opcode: "getTopGames",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get top Twitch games [FIRST]",
                        arguments: {
                            FIRST: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 20
                            }
                        }
                    },

                    // =================================================
                    // SEARCH
                    // =================================================

                    "---",

                    {
                        opcode: "searchChannels",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "search Twitch channels for [QUERY]",
                        arguments: {
                            QUERY: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "Minecraft"
                            }
                        }
                    },

                    // =================================================
                    // CLIPS
                    // =================================================

                    "---",

                    {
                        opcode: "createClip",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "create Twitch clip from [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "getClips",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch clips for [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    // =================================================
                    // VIDEOS
                    // =================================================

                    "---",

                    {
                        opcode: "getVideos",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch videos for [USER]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "deleteVideo",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "delete Twitch video [ID]",
                        arguments: {
                            ID: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    // =================================================
                    // FOLLOWERS
                    // =================================================

                    "---",

                    {
                        opcode: "getFollowers",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch followers of [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "isFollowing",
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: "is [USER] following [CHANNEL]?",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    // =================================================
                    // CHAT
                    // =================================================

                    "---",

                    {
                        opcode: "getChatters",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch chatters in [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "getChatSettings",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch chat settings for [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "sendChatMessage",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "send Twitch chat message [MESSAGE] to [CHANNEL]",
                        arguments: {
                            MESSAGE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "Hello Twitch!"
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "deleteChatMessage",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "delete Twitch chat message [MESSAGE] in [CHANNEL]",
                        arguments: {
                            MESSAGE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    // =================================================
                    // MODERATION
                    // =================================================

                    "---",

                    {
                        opcode: "getBannedUsers",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch banned users in [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "banUser",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "ban Twitch user [USER] in [CHANNEL] reason [REASON]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            REASON: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "unbanUser",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "unban Twitch user [USER] in [CHANNEL]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "getModerators",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch moderators in [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "addModerator",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "add Twitch moderator [USER] to [CHANNEL]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "removeModerator",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "remove Twitch moderator [USER] from [CHANNEL]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "getVips",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch VIPs in [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "addVip",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "add Twitch VIP [USER] to [CHANNEL]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "removeVip",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "remove Twitch VIP [USER] from [CHANNEL]",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    // =================================================
                    // POLLS
                    // =================================================

                    "---",

                    {
                        opcode: "createPoll",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "create Twitch poll in [CHANNEL] title [TITLE] choices JSON [CHOICES] duration [SECONDS]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            TITLE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "Poll"
                            },
                            CHOICES: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "[\"Yes\",\"No\"]"
                            },
                            SECONDS: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 60
                            }
                        }
                    },

                    {
                        opcode: "getPolls",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch polls in [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "endPoll",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "end Twitch poll [ID] in [CHANNEL] as [STATUS]",
                        arguments: {
                            ID: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            STATUS: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "POLL_STATUS"
                            }
                        }
                    },

                    // =================================================
                    // PREDICTIONS
                    // =================================================

                    "---",

                    {
                        opcode: "createPrediction",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "create Twitch prediction in [CHANNEL] title [TITLE] outcomes JSON [OUTCOMES] seconds [SECONDS]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            TITLE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "Prediction"
                            },
                            OUTCOMES: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "[\"Yes\",\"No\"]"
                            },
                            SECONDS: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 60
                            }
                        }
                    },

                    {
                        opcode: "getPredictions",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch predictions in [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "resolvePrediction",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "set Twitch prediction [ID] in [CHANNEL] status [STATUS]",
                        arguments: {
                            ID: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            STATUS: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "PREDICTION_STATUS"
                            }
                        }
                    },

                    // =================================================
                    // CHANNEL POINT REWARDS
                    // =================================================

                    "---",

                    {
                        opcode: "getRewards",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch channel point rewards in [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "createReward",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "create Twitch reward in [CHANNEL] title [TITLE] cost [COST]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            TITLE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "Reward"
                            },
                            COST: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 100
                            }
                        }
                    },

                    {
                        opcode: "deleteReward",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "delete Twitch reward [REWARD] in [CHANNEL]",
                        arguments: {
                            REWARD: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    // =================================================
                    // SUBSCRIPTIONS
                    // =================================================

                    "---",

                    {
                        opcode: "getSubscriptions",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch subscriptions in [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "isSubscribed",
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: "is [USER] subscribed to [CHANNEL]?",
                        arguments: {
                            USER: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    // =================================================
                    // RAIDS
                    // =================================================

                    "---",

                    {
                        opcode: "startRaid",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "raid Twitch channel [TARGET] from [CHANNEL]",
                        arguments: {
                            TARGET: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "cancelRaid",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "cancel Twitch raid from [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    // =================================================
                    // ADS
                    // =================================================

                    "---",

                    {
                        opcode: "startCommercial",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "start Twitch commercial in [CHANNEL] for [LENGTH] seconds",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            LENGTH: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 30
                            }
                        }
                    },

                    {
                        opcode: "getAdSchedule",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch ad schedule for [CHANNEL]",
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    // =================================================
                    // EVENTSUB
                    // =================================================

                    "---",

                    {
                        opcode: "getEventSub",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Twitch EventSub subscriptions"
                    },

                    {
                        opcode: "deleteEventSub",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "delete Twitch EventSub subscription [ID]",
                        arguments: {
                            ID: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    },

                    {
                        opcode: "createEventSub",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "create Twitch EventSub type [TYPE] version [VERSION] condition [CONDITION] transport [TRANSPORT]",
                        arguments: {
                            TYPE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "stream.online"
                            },
                            VERSION: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "1"
                            },
                            CONDITION: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "{}"
                            },
                            TRANSPORT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "{\"method\":\"websocket\",\"session_id\":\"\"}"
                            }
                        }
                    },

                    // =================================================
                    // RAW API
                    // =================================================

                    "---",

                    {
                        opcode: "rawGet",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch API GET [PATH] parameters [PARAMETERS]",
                        arguments: {
                            PATH: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "/users"
                            },
                            PARAMETERS: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "login=twitch"
                            }
                        }
                    },

                    {
                        opcode: "rawPost",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch API POST [PATH] JSON [BODY]",
                        arguments: {
                            PATH: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "/clips"
                            },
                            BODY: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "{}"
                            }
                        }
                    },

                    {
                        opcode: "rawPatch",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch API PATCH [PATH] parameters [PARAMETERS] JSON [BODY]",
                        arguments: {
                            PATH: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            PARAMETERS: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            BODY: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "{}"
                            }
                        }
                    },

                    {
                        opcode: "rawPut",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch API PUT [PATH] parameters [PARAMETERS] JSON [BODY]",
                        arguments: {
                            PATH: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            PARAMETERS: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            BODY: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "{}"
                            }
                        }
                    },

                    {
                        opcode: "rawDelete",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Twitch API DELETE [PATH] parameters [PARAMETERS]",
                        arguments: {
                            PATH: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            },
                            PARAMETERS: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ""
                            }
                        }
                    }
                ],

                menus: {
                    POLL_STATUS: {
                        acceptReporters: true,
                        items: [
                            "TERMINATED",
                            "ARCHIVED"
                        ]
                    },

                    PREDICTION_STATUS: {
                        acceptReporters: true,
                        items: [
                            "LOCKED",
                            "RESOLVED",
                            "CANCELED"
                        ]
                    }
                }
            };
        }

        // =============================================================
        // GENERAL HELPERS
        // =============================================================

        clean(value) {
            return String(value == null ? "" : value).trim();
        }

        setSuccess(status, data) {
            this._lastStatus = status;
            this._lastError = "";

            try {
                this._lastResponse =
                    typeof data === "string"
                        ? data
                        : JSON.stringify(data);
            } catch (e) {
                this._lastResponse = String(data);
            }

            return data;
        }

        setFailure(status, error, responseData) {
            this._lastStatus = Number(status) || 0;
            this._lastError =
                String(error || "Unknown Twitch API error");

            if (responseData !== undefined) {
                try {
                    this._lastResponse =
                        typeof responseData === "string"
                            ? responseData
                            : JSON.stringify(responseData);
                } catch (e) {
                    this._lastResponse =
                        String(responseData);
                }
            } else {
                this._lastResponse =
                    JSON.stringify({
                        error: this._lastError,
                        status: this._lastStatus
                    });
            }

            return null;
        }

        headers() {
            const headers = {
                "Accept": "application/json"
            };

            if (this._clientId) {
                headers["Client-Id"] = this._clientId;
            }

            if (this._accessToken) {
                headers["Authorization"] =
                    "Bearer " +
                    this._accessToken.replace(
                        /^Bearer\s+/i,
                        ""
                    );
            }

            return headers;
        }

        makeQuery(parameters) {
            const value = this.clean(parameters);

            if (!value) {
                return "";
            }

            return value.startsWith("?")
                ? value
                : "?" + value;
        }

        async request(method, path, parameters, body) {
            try {
                if (!this._clientId) {
                    return this.setFailure(
                        0,
                        "Twitch Client ID has not been set."
                    );
                }

                if (!this._accessToken) {
                    return this.setFailure(
                        0,
                        "Twitch Access Token has not been set."
                    );
                }

                path = this.clean(path);

                if (!path.startsWith("/")) {
                    path = "/" + path;
                }

                let url = API_BASE + path;

                if (parameters) {
                    url += this.makeQuery(parameters);
                }

                const options = {
                    method,
                    headers: this.headers()
                };

                if (
                    method !== "GET" &&
                    method !== "DELETE" &&
                    body !== undefined
                ) {
                    options.headers["Content-Type"] =
                        "application/json";

                    options.body =
                        typeof body === "string"
                            ? body
                            : JSON.stringify(body);
                }

                const response =
                    await fetch(url, options);

                const text =
                    await response.text();

                let data;

                try {
                    data =
                        text.length > 0
                            ? JSON.parse(text)
                            : {};
                } catch (e) {
                    data = text;
                }

                if (!response.ok) {
                    let message =
                        "Twitch API returned HTTP " +
                        response.status;

                    if (
                        data &&
                        typeof data === "object"
                    ) {
                        if (data.message) {
                            message = data.message;
                        } else if (data.error) {
                            message = data.error;
                        }
                    }

                    return this.setFailure(
                        response.status,
                        message,
                        data
                    );
                }

                return this.setSuccess(
                    response.status,
                    data
                );
            } catch (error) {
                return this.setFailure(
                    0,
                    error && error.message
                        ? error.message
                        : error
                );
            }
        }

        async getUserObject(value) {
            const user = this.clean(value);

            if (!user) {
                return null;
            }

            const parameter =
                /^\d+$/.test(user)
                    ? "id=" +
                      encodeURIComponent(user)
                    : "login=" +
                      encodeURIComponent(user);

            const data =
                await this.request(
                    "GET",
                    "/users",
                    parameter
                );

            if (
                !data ||
                !Array.isArray(data.data) ||
                !data.data.length
            ) {
                return null;
            }

            return data.data[0];
        }

        async getUserId(value) {
            const user =
                await this.getUserObject(value);

            return user ? user.id : "";
        }

        async getCurrentUserObject() {
            const data =
                await this.request(
                    "GET",
                    "/users"
                );

            if (
                data &&
                Array.isArray(data.data) &&
                data.data.length
            ) {
                this._currentUser =
                    data.data[0];

                return data.data[0];
            }

            return null;
        }

        async getCurrentUserId() {
            const user =
                await this.getCurrentUserObject();

            return user ? user.id : "";
        }

        async getGameObject(value) {
            const game = this.clean(value);

            if (!game) {
                return null;
            }

            const parameter =
                /^\d+$/.test(game)
                    ? "id=" +
                      encodeURIComponent(game)
                    : "name=" +
                      encodeURIComponent(game);

            const data =
                await this.request(
                    "GET",
                    "/games",
                    parameter
                );

            if (
                !data ||
                !Array.isArray(data.data) ||
                !data.data.length
            ) {
                return null;
            }

            return data.data[0];
        }

        // =============================================================
        // AUTHENTICATION
        // =============================================================

        setClientId(args) {
            this._clientId =
                this.clean(args.VALUE);
        }

        setClientSecret(args) {
            this._clientSecret =
                this.clean(args.VALUE);
        }

        setAccessToken(args) {
            this._accessToken =
                this.clean(args.VALUE)
                    .replace(
                        /^Bearer\s+/i,
                        ""
                    );
        }

        clearCredentials() {
            this._clientId = "";
            this._clientSecret = "";
            this._accessToken = "";

            this._currentUser = null;

            this._lastResponse = "";
            this._lastStatus = 0;
            this._lastError = "";
        }

        async getAppAccessToken() {
            if (!this._clientId) {
                this.setFailure(
                    0,
                    "Set the Twitch Client ID first."
                );
                return;
            }

            if (!this._clientSecret) {
                this.setFailure(
                    0,
                    "Set the Twitch Client Secret first."
                );
                return;
            }

            try {
                const body =
                    new URLSearchParams();

                body.set(
                    "client_id",
                    this._clientId
                );

                body.set(
                    "client_secret",
                    this._clientSecret
                );

                body.set(
                    "grant_type",
                    "client_credentials"
                );

                const response =
                    await fetch(
                        OAUTH_BASE + "/token",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/x-www-form-urlencoded"
                            },
                            body: body.toString()
                        }
                    );

                const text =
                    await response.text();

                let data;

                try {
                    data =
                        JSON.parse(text);
                } catch (e) {
                    data = text;
                }

                if (!response.ok) {
                    this.setFailure(
                        response.status,
                        data &&
                        data.message
                            ? data.message
                            : "OAuth request failed.",
                        data
                    );

                    return;
                }

                this._accessToken =
                    data.access_token || "";

                this.setSuccess(
                    response.status,
                    data
                );
            } catch (error) {
                this.setFailure(
                    0,
                    error && error.message
                        ? error.message
                        : error
                );
            }
        }

        async validateToken() {
            if (!this._accessToken) {
                this.setFailure(
                    0,
                    "No Twitch Access Token has been set."
                );

                return false;
            }

            try {
                const response =
                    await fetch(
                        OAUTH_BASE + "/validate",
                        {
                            method: "GET",
                            headers: {
                                Authorization:
                                    "OAuth " +
                                    this._accessToken
                            }
                        }
                    );

                const text =
                    await response.text();

                let data;

                try {
                    data =
                        JSON.parse(text);
                } catch (e) {
                    data = text;
                }

                if (!response.ok) {
                    this.setFailure(
                        response.status,
                        data &&
                        data.message
                            ? data.message
                            : "Token validation failed.",
                        data
                    );

                    return false;
                }

                this.setSuccess(
                    response.status,
                    data
                );

                return true;
            } catch (error) {
                this.setFailure(
                    0,
                    error && error.message
                        ? error.message
                        : error
                );

                return false;
            }
        }

        async connected() {
            return await this.validateToken();
        }

        getOAuthToken() {
            return this._accessToken;
        }

        clientId() {
            return this._clientId;
        }

        accessToken() {
            return this._accessToken;
        }

        lastStatus() {
            return this._lastStatus;
        }

        lastResponse() {
            return this._lastResponse;
        }

        lastError() {
            return this._lastError;
        }

        // =============================================================
        // USERS
        // =============================================================

        async getUser(args) {
            return (
                await this.getUserObject(
                    args.USER
                )
            ) || {};
        }

        async getUsers(args) {
            const users =
                this.clean(args.USERS)
                    .split(",")
                    .map(x => x.trim())
                    .filter(Boolean);

            if (!users.length) {
                return {};
            }

            const parameters = [];

            for (const user of users) {
                if (/^\d+$/.test(user)) {
                    parameters.push(
                        "id=" +
                        encodeURIComponent(user)
                    );
                } else {
                    parameters.push(
                        "login=" +
                        encodeURIComponent(user)
                    );
                }
            }

            return (
                await this.request(
                    "GET",
                    "/users",
                    parameters.join("&")
                )
            ) || {};
        }

        async getCurrentUser() {
            return (
                await this.getCurrentUserObject()
            ) || {};
        }

        async userId(args) {
            return await this.getUserId(
                args.USER
            );
        }

        async userName(args) {
            const user =
                await this.getUserObject(
                    args.USER
                );

            return user
                ? user.display_name
                : "";
        }

        async userLogin(args) {
            const user =
                await this.getUserObject(
                    args.USER
                );

            return user
                ? user.login
                : "";
        }

        async userDescription(args) {
            const user =
                await this.getUserObject(
                    args.USER
                );

            return user
                ? user.description
                : "";
        }

        async userProfileImage(args) {
            const user =
                await this.getUserObject(
                    args.USER
                );

            return user
                ? user.profile_image_url
                : "";
        }

        async userOfflineImage(args) {
            const user =
                await this.getUserObject(
                    args.USER
                );

            return user
                ? user.offline_image_url
                : "";
        }

        async userCreatedAt(args) {
            const user =
                await this.getUserObject(
                    args.USER
                );

            return user
                ? user.created_at
                : "";
        }

        // =============================================================
        // STREAMS
        // =============================================================

        async getStreamObject(value) {
            const id =
                await this.getUserId(value);

            if (!id) {
                return null;
            }

            const data =
                await this.request(
                    "GET",
                    "/streams",
                    "user_id=" +
                    encodeURIComponent(id)
                );

            if (
                data &&
                Array.isArray(data.data) &&
                data.data.length
            ) {
                return data.data[0];
            }

            return null;
        }

        async getStream(args) {
            return (
                await this.getStreamObject(
                    args.USER
                )
            ) || {};
        }

        async isLive(args) {
            return !!(
                await this.getStreamObject(
                    args.USER
                )
            );
        }

        async streamViewerCount(args) {
            const stream =
                await this.getStreamObject(
                    args.USER
                );

            return stream
                ? stream.viewer_count
                : 0;
        }

        async streamTitle(args) {
            const stream =
                await this.getStreamObject(
                    args.USER
                );

            return stream
                ? stream.title
                : "";
        }

        async streamGame(args) {
            const stream =
                await this.getStreamObject(
                    args.USER
                );

            return stream
                ? stream.game_name
                : "";
        }

        async streamLanguage(args) {
            const stream =
                await this.getStreamObject(
                    args.USER
                );

            return stream
                ? stream.language
                : "";
        }

        async streamStartedAt(args) {
            const stream =
                await this.getStreamObject(
                    args.USER
                );

            return stream
                ? stream.started_at
                : "";
        }

        async streamThumbnail(args) {
            const stream =
                await this.getStreamObject(
                    args.USER
                );

            if (
                !stream ||
                !stream.thumbnail_url
            ) {
                return "";
            }

            return stream.thumbnail_url
                .replace(
                    "{width}",
                    "1280"
                )
                .replace(
                    "{height}",
                    "720"
                );
        }

        async getStreams(args) {
            return (
                await this.request(
                    "GET",
                    "/streams",
                    args.PARAMETERS
                )
            ) || {};
        }

        async getFollowedStreams() {
            const userId =
                await this.getCurrentUserId();

            if (!userId) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/streams/followed",
                    "user_id=" +
                    encodeURIComponent(userId)
                )
            ) || {};
        }

        // =============================================================
        // CHANNELS
        // =============================================================

        async getChannel(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            const data =
                await this.request(
                    "GET",
                    "/channels",
                    "broadcaster_id=" +
                    encodeURIComponent(id)
                );

            if (
                data &&
                Array.isArray(data.data) &&
                data.data.length
            ) {
                return data.data[0];
            }

            return {};
        }

        async setChannelTitle(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!broadcasterId) {
                return;
            }

            await this.request(
                "PATCH",
                "/channels",
                "broadcaster_id=" +
                encodeURIComponent(
                    broadcasterId
                ),
                {
                    title:
                        this.clean(
                            args.TITLE
                        )
                }
            );
        }

        async setChannelGame(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!broadcasterId) {
                return;
            }

            const game =
                await this.getGameObject(
                    args.GAME
                );

            if (!game) {
                this.setFailure(
                    0,
                    "Twitch game/category not found."
                );

                return;
            }

            await this.request(
                "PATCH",
                "/channels",
                "broadcaster_id=" +
                encodeURIComponent(
                    broadcasterId
                ),
                {
                    game_id: game.id
                }
            );
        }

        // =============================================================
        // GAMES
        // =============================================================

        async searchCategories(args) {
            return (
                await this.request(
                    "GET",
                    "/search/categories",
                    "query=" +
                    encodeURIComponent(
                        this.clean(args.QUERY)
                    )
                )
            ) || {};
        }

        async getCategory(args) {
            return (
                await this.getGameObject(
                    args.CATEGORY
                )
            ) || {};
        }

        async getTopGames(args) {
            const first =
                Math.max(
                    1,
                    Math.min(
                        100,
                        Number(args.FIRST) || 20
                    )
                );

            return (
                await this.request(
                    "GET",
                    "/games/top",
                    "first=" + first
                )
            ) || {};
        }

        // =============================================================
        // SEARCH
        // =============================================================

        async searchChannels(args) {
            return (
                await this.request(
                    "GET",
                    "/search/channels",
                    "query=" +
                    encodeURIComponent(
                        this.clean(args.QUERY)
                    )
                )
            ) || {};
        }

        // =============================================================
        // CLIPS
        // =============================================================

        async createClip(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "POST",
                    "/clips",
                    "broadcaster_id=" +
                    encodeURIComponent(id)
                )
            ) || {};
        }

        async getClips(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/clips",
                    "broadcaster_id=" +
                    encodeURIComponent(id)
                )
            ) || {};
        }

        // =============================================================
        // VIDEOS
        // =============================================================

        async getVideos(args) {
            const id =
                await this.getUserId(
                    args.USER
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/videos",
                    "user_id=" +
                    encodeURIComponent(id)
                )
            ) || {};
        }

        async deleteVideo(args) {
            await this.request(
                "DELETE",
                "/videos",
                "id=" +
                encodeURIComponent(
                    this.clean(args.ID)
                )
            );
        }

        // =============================================================
        // FOLLOWERS
        // =============================================================

        async getFollowers(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/channels/followers",
                    "broadcaster_id=" +
                    encodeURIComponent(id)
                )
            ) || {};
        }

        async isFollowing(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            const userId =
                await this.getUserId(
                    args.USER
                );

            if (
                !broadcasterId ||
                !userId
            ) {
                return false;
            }

            const data =
                await this.request(
                    "GET",
                    "/channels/followers",
                    "broadcaster_id=" +
                    encodeURIComponent(
                        broadcasterId
                    ) +
                    "&user_id=" +
                    encodeURIComponent(
                        userId
                    )
                );

            return !!(
                data &&
                Array.isArray(data.data) &&
                data.data.length
            );
        }

        // =============================================================
        // CHAT
        // =============================================================

        async getChatters(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            const moderatorId =
                await this.getCurrentUserId();

            if (
                !broadcasterId ||
                !moderatorId
            ) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/chat/chatters",
                    "broadcaster_id=" +
                    encodeURIComponent(
                        broadcasterId
                    ) +
                    "&moderator_id=" +
                    encodeURIComponent(
                        moderatorId
                    )
                )
            ) || {};
        }

        async getChatSettings(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!broadcasterId) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/chat/settings",
                    "broadcaster_id=" +
                    encodeURIComponent(
                        broadcasterId
                    )
                )
            ) || {};
        }

        async sendChatMessage(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            const senderId =
                await this.getCurrentUserId();

            if (
                !broadcasterId ||
                !senderId
            ) {
                return;
            }

            await this.request(
                "POST",
                "/chat/messages",
                undefined,
                {
                    broadcaster_id:
                        broadcasterId,

                    sender_id:
                        senderId,

                    message:
                        this.clean(
                            args.MESSAGE
                        )
                }
            );
        }

        async deleteChatMessage(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            const moderatorId =
                await this.getCurrentUserId();

            if (
                !broadcasterId ||
                !moderatorId
            ) {
                return;
            }

            await this.request(
                "DELETE",
                "/moderation/chat",
                "broadcaster_id=" +
                encodeURIComponent(
                    broadcasterId
                ) +
                "&moderator_id=" +
                encodeURIComponent(
                    moderatorId
                ) +
                "&message_id=" +
                encodeURIComponent(
                    this.clean(
                        args.MESSAGE
                    )
                )
            );
        }

        // =============================================================
        // MODERATION
        // =============================================================

        async getBannedUsers(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/moderation/banned",
                    "broadcaster_id=" +
                    encodeURIComponent(id)
                )
            ) || {};
        }

        async banUser(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            const moderatorId =
                await this.getCurrentUserId();

            const userId =
                await this.getUserId(
                    args.USER
                );

            if (
                !broadcasterId ||
                !moderatorId ||
                !userId
            ) {
                return;
            }

            await this.request(
                "POST",
                "/moderation/bans",
                "broadcaster_id=" +
                encodeURIComponent(
                    broadcasterId
                ) +
                "&moderator_id=" +
                encodeURIComponent(
                    moderatorId
                ),
                {
                    data: {
                        user_id: userId,
                        reason:
                            this.clean(
                                args.REASON
                            ).substring(
                                0,
                                500
                            )
                    }
                }
            );
        }

        async unbanUser(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            const moderatorId =
                await this.getCurrentUserId();

            const userId =
                await this.getUserId(
                    args.USER
                );

            if (
                !broadcasterId ||
                !moderatorId ||
                !userId
            ) {
                return;
            }

            await this.request(
                "DELETE",
                "/moderation/bans",
                "broadcaster_id=" +
                encodeURIComponent(
                    broadcasterId
                ) +
                "&moderator_id=" +
                encodeURIComponent(
                    moderatorId
                ) +
                "&user_id=" +
                encodeURIComponent(
                    userId
                )
            );
        }

        async getModerators(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/moderation/moderators",
                    "broadcaster_id=" +
                    encodeURIComponent(id)
                )
            ) || {};
        }

        async addModerator(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            const userId =
                await this.getUserId(
                    args.USER
                );

            if (
                !broadcasterId ||
                !userId
            ) {
                return;
            }

            await this.request(
                "POST",
                "/moderation/moderators",
                "broadcaster_id=" +
                encodeURIComponent(
                    broadcasterId
                ) +
                "&user_id=" +
                encodeURIComponent(
                    userId
                )
            );
        }

        async removeModerator(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            const userId =
                await this.getUserId(
                    args.USER
                );

            if (
                !broadcasterId ||
                !userId
            ) {
                return;
            }

            await this.request(
                "DELETE",
                "/moderation/moderators",
                "broadcaster_id=" +
                encodeURIComponent(
                    broadcasterId
                ) +
                "&user_id=" +
                encodeURIComponent(
                    userId
                )
            );
        }

        async getVips(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/channels/vips",
                    "broadcaster_id=" +
                    encodeURIComponent(id)
                )
            ) || {};
        }

        async addVip(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            const userId =
                await this.getUserId(
                    args.USER
                );

            if (
                !broadcasterId ||
                !userId
            ) {
                return;
            }

            await this.request(
                "POST",
                "/channels/vips",
                "broadcaster_id=" +
                encodeURIComponent(
                    broadcasterId
                ) +
                "&user_id=" +
                encodeURIComponent(
                    userId
                )
            );
        }

        async removeVip(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            const userId =
                await this.getUserId(
                    args.USER
                );

            if (
                !broadcasterId ||
                !userId
            ) {
                return;
            }

            await this.request(
                "DELETE",
                "/channels/vips",
                "broadcaster_id=" +
                encodeURIComponent(
                    broadcasterId
                ) +
                "&user_id=" +
                encodeURIComponent(
                    userId
                )
            );
        }

        // =============================================================
        // POLLS
        // =============================================================

        async createPoll(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!broadcasterId) {
                return {};
            }

            let choices;

            try {
                choices =
                    JSON.parse(
                        this.clean(
                            args.CHOICES
                        )
                    );
            } catch (e) {
                this.setFailure(
                    0,
                    "CHOICES must be valid JSON."
                );

                return {};
            }

            if (
                !Array.isArray(choices) ||
                choices.length < 2 ||
                choices.length > 5
            ) {
                this.setFailure(
                    0,
                    "A Twitch poll requires 2 to 5 choices."
                );

                return {};
            }

            const choiceObjects =
                choices.map(
                    title => ({
                        title:
                            String(title)
                                .substring(
                                    0,
                                    25
                                )
                    })
                );

            return (
                await this.request(
                    "POST",
                    "/polls",
                    undefined,
                    {
                        broadcaster_id:
                            broadcasterId,

                        title:
                            this.clean(
                                args.TITLE
                            ).substring(
                                0,
                                60
                            ),

                        choices:
                            choiceObjects,

                        duration:
                            Math.max(
                                15,
                                Math.min(
                                    1800,
                                    Number(
                                        args.SECONDS
                                    ) || 60
                                )
                            )
                    }
                )
            ) || {};
        }

        async getPolls(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/polls",
                    "broadcaster_id=" +
                    encodeURIComponent(id)
                )
            ) || {};
        }

        async endPoll(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!broadcasterId) {
                return;
            }

            await this.request(
                "PATCH",
                "/polls",
                undefined,
                {
                    broadcaster_id:
                        broadcasterId,

                    id:
                        this.clean(
                            args.ID
                        ),

                    status:
                        this.clean(
                            args.STATUS
                        )
                }
            );
        }

        // =============================================================
        // PREDICTIONS
        // =============================================================

        async createPrediction(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!broadcasterId) {
                return {};
            }

            let outcomes;

            try {
                outcomes =
                    JSON.parse(
                        this.clean(
                            args.OUTCOMES
                        )
                    );
            } catch (e) {
                this.setFailure(
                    0,
                    "OUTCOMES must be valid JSON."
                );

                return {};
            }

            if (
                !Array.isArray(outcomes) ||
                outcomes.length < 2 ||
                outcomes.length > 10
            ) {
                this.setFailure(
                    0,
                    "A Twitch prediction requires 2 to 10 outcomes."
                );

                return {};
            }

            const outcomeObjects =
                outcomes.map(
                    title => ({
                        title:
                            String(title)
                                .substring(
                                    0,
                                    25
                                )
                    })
                );

            return (
                await this.request(
                    "POST",
                    "/predictions",
                    undefined,
                    {
                        broadcaster_id:
                            broadcasterId,

                        title:
                            this.clean(
                                args.TITLE
                            ).substring(
                                0,
                                45
                            ),

                        outcomes:
                            outcomeObjects,

                        prediction_window:
                            Math.max(
                                30,
                                Math.min(
                                    1800,
                                    Number(
                                        args.SECONDS
                                    ) || 60
                                )
                            )
                    }
                )
            ) || {};
        }

        async getPredictions(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/predictions",
                    "broadcaster_id=" +
                    encodeURIComponent(id)
                )
            ) || {};
        }

        async resolvePrediction(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!broadcasterId) {
                return;
            }

            await this.request(
                "PATCH",
                "/predictions",
                undefined,
                {
                    broadcaster_id:
                        broadcasterId,

                    id:
                        this.clean(
                            args.ID
                        ),

                    status:
                        this.clean(
                            args.STATUS
                        )
                }
            );
        }

        // =============================================================
        // CHANNEL POINT REWARDS
        // =============================================================

        async getRewards(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/channel_points/custom_rewards",
                    "broadcaster_id=" +
                    encodeURIComponent(id)
                )
            ) || {};
        }

        async createReward(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "POST",
                    "/channel_points/custom_rewards",
                    undefined,
                    {
                        broadcaster_id:
                            id,

                        title:
                            this.clean(
                                args.TITLE
                            ).substring(
                                0,
                                45
                            ),

                        cost:
                            Math.max(
                                1,
                                Math.min(
                                    1000000,
                                    Number(
                                        args.COST
                                    ) || 100
                                )
                            ),

                        prompt:
                            ""
                    }
                )
            ) || {};
        }

        async deleteReward(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return;
            }

            await this.request(
                "DELETE",
                "/channel_points/custom_rewards",
                "broadcaster_id=" +
                encodeURIComponent(id) +
                "&id=" +
                encodeURIComponent(
                    this.clean(
                        args.REWARD
                    )
                )
            );
        }

        // =============================================================
        // SUBSCRIPTIONS
        // =============================================================

        async getSubscriptions(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/subscriptions",
                    "broadcaster_id=" +
                    encodeURIComponent(id)
                )
            ) || {};
        }

        async isSubscribed(args) {
            const broadcasterId =
                await this.getUserId(
                    args.CHANNEL
                );

            const userId =
                await this.getUserId(
                    args.USER
                );

            if (
                !broadcasterId ||
                !userId
            ) {
                return false;
            }

            const data =
                await this.request(
                    "GET",
                    "/subscriptions",
                    "broadcaster_id=" +
                    encodeURIComponent(
                        broadcasterId
                    ) +
                    "&user_id=" +
                    encodeURIComponent(
                        userId
                    )
                );

            return !!(
                data &&
                Array.isArray(data.data) &&
                data.data.length
            );
        }

        // =============================================================
        // RAIDS
        // =============================================================

        async startRaid(args) {
            const fromId =
                await this.getUserId(
                    args.CHANNEL
                );

            const targetId =
                await this.getUserId(
                    args.TARGET
                );

            if (
                !fromId ||
                !targetId
            ) {
                return;
            }

            await this.request(
                "POST",
                "/raids",
                "from_broadcaster_id=" +
                encodeURIComponent(
                    fromId
                ) +
                "&to_broadcaster_id=" +
                encodeURIComponent(
                    targetId
                )
            );
        }

        async cancelRaid(args) {
            const fromId =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!fromId) {
                return;
            }

            await this.request(
                "DELETE",
                "/raids",
                "broadcaster_id=" +
                encodeURIComponent(
                    fromId
                )
            );
        }

        // =============================================================
        // ADS
        // =============================================================

        async startCommercial(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return;
            }

            const length =
                Math.max(
                    30,
                    Math.min(
                        180,
                        Number(
                            args.LENGTH
                        ) || 30
                    )
                );

            await this.request(
                "POST",
                "/channels/commercial",
                undefined,
                {
                    broadcaster_id: id,
                    length: length
                }
            );
        }

        async getAdSchedule(args) {
            const id =
                await this.getUserId(
                    args.CHANNEL
                );

            if (!id) {
                return {};
            }

            return (
                await this.request(
                    "GET",
                    "/channels/ads",
                    "broadcaster_id=" +
                    encodeURIComponent(id)
                )
            ) || {};
        }

        // =============================================================
        // EVENTSUB
        // =============================================================

        async getEventSub() {
            return (
                await this.request(
                    "GET",
                    "/eventsub/subscriptions"
                )
            ) || {};
        }

        async deleteEventSub(args) {
            await this.request(
                "DELETE",
                "/eventsub/subscriptions",
                "id=" +
                encodeURIComponent(
                    this.clean(
                        args.ID
                    )
                )
            );
        }

        async createEventSub(args) {
            let condition;
            let transport;

            try {
                condition =
                    JSON.parse(
                        this.clean(
                            args.CONDITION
                        )
                    );

                transport =
                    JSON.parse(
                        this.clean(
                            args.TRANSPORT
                        )
                    );
            } catch (e) {
                this.setFailure(
                    0,
                    "CONDITION and TRANSPORT must be valid JSON."
                );

                return {};
            }

            return (
                await this.request(
                    "POST",
                    "/eventsub/subscriptions",
                    undefined,
                    {
                        type:
                            this.clean(
                                args.TYPE
                            ),

                        version:
                            this.clean(
                                args.VERSION
                            ),

                        condition:
                            condition,

                        transport:
                            transport
                    }
                )
            ) || {};
        }

        // =============================================================
        // RAW API
        // =============================================================

        async rawGet(args) {
            return (
                await this.request(
                    "GET",
                    args.PATH,
                    args.PARAMETERS
                )
            ) || {};
        }

        async rawPost(args) {
            let body;

            try {
                body =
                    JSON.parse(
                        this.clean(
                            args.BODY
                        )
                    );
            } catch (e) {
                this.setFailure(
                    0,
                    "BODY must be valid JSON."
                );

                return {};
            }

            return (
                await this.request(
                    "POST",
                    args.PATH,
                    undefined,
                    body
                )
            ) || {};
        }

        async rawPatch(args) {
            let body;

            try {
                body =
                    JSON.parse(
                        this.clean(
                            args.BODY
                        )
                    );
            } catch (e) {
                this.setFailure(
                    0,
                    "BODY must be valid JSON."
                );

                return {};
            }

            return (
                await this.request(
                    "PATCH",
                    args.PATH,
                    args.PARAMETERS,
                    body
                )
            ) || {};
        }

        async rawPut(args) {
            let body;

            try {
                body =
                    JSON.parse(
                        this.clean(
                            args.BODY
                        )
                    );
            } catch (e) {
                this.setFailure(
                    0,
                    "BODY must be valid JSON."
                );

                return {};
            }

            return (
                await this.request(
                    "PUT",
                    args.PATH,
                    args.PARAMETERS,
                    body
                )
            ) || {};
        }

        async rawDelete(args) {
            return (
                await this.request(
                    "DELETE",
                    args.PATH,
                    args.PARAMETERS
                )
            ) || {};
        }
    }

    Scratch.extensions.register(
        new TwitchExtension()
    );
})(Scratch);
