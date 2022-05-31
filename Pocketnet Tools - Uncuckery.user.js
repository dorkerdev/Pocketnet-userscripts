// ==UserScript==
// @name         Pocketnet Tools - Uncuckery
// @namespace    http://tampermonkey.net/
// @version      0.55
// @description  Uncuck it
// @author       dorker
// @match        https://bastyon.com/*
// @icon         https://www.google.com/s2/favicons?domain=mozilla.org
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    (function (){
        function waitUntil(isTrue, interval) {
            function TryIt() {
                var ret;
                try {
                    ret = isTrue();
                }catch {

                }

                if (!ret) console.log("not true yet");

                return ret;
            }

            var p = new Promise((resolve, reject) => {
                var ret = TryIt();
                if (ret) {
                    resolve(ret);
                } else {
                    var isTrueHandle = window.setInterval(function(){
                        ret = TryIt();
                        if (ret) {
                            window.clearInterval(isTrueHandle);
                            console.log("cleared interval");
                            resolve(ret);
                        }
                    }, interval || 500);
                }
            });

            return p;
        }

        /*
        All code below removes any functionality
        */
        waitUntil(() => app.platform.sdk.user.scamcriteria)
            .then(() => {
                app.platform.sdk.user.scamcriteria = function(e) {
                    return false;
                };
            });

        waitUntil(() => app.platform.sdk.user.upvotevalueblockcriteria)
            .then(() => {
                app.platform.sdk.user.upvotevalueblockcriteria = function(e) {
                    return false;
                };
            });

        waitUntil(() => app.platform.sdk.user.reputationBlockedMe)
            .then(() => {
                app.platform.sdk.user.reputationBlockedMe = function(e) {
                    return false;
                };
            });

        waitUntil(() => app.platform.sdk.user.reputationBlockedNotMe)
            .then(() => {
                app.platform.sdk.user.reputationBlockedNotMe = function(e) {
                    return false;
                };
            });

        waitUntil(() => app.platform.sdk.user.reputationBlocked)
            .then(() => {
                app.platform.sdk.user.reputationBlocked = function(e) {
                    return false;
                };
            });

        waitUntil(() => app.platform.sdk.user.hiddenComment)
            .then(() => {
                app.platform.sdk.user.hiddenComment = function(e) {
                    return false;
                };
            });

        waitUntil(() => app.platform.sdk.node.shares.getboost)
            .then(() => { app.platform.sdk.node.shares.getboost = function(e, t, n) { }; }
        );

        /*
        Removes all traces of donations from comments so that they're sorted
        like every other comment (ie, unpins them from the top of comment
        sections
        */
        function nukeDonateComment(comment) {
            if (comment && comment.donation === "true") {
                delete comment.donation;
                comment.amount = 0;
                comment.reputation = -1000;
                comment.scoreUp = 0;
                comment.scoreDown = 100;
            }
        }

        waitUntil(() => app.api.rpc)
            .then(() => {

                /*
                Override the rpc function with one of our own
                */
                var oldrpc = app.api.rpc;
                app.api.rpc = function(n, t, r, o) {

                    /*
                    Execute code before the rpc method is even called
                    */
                    switch (n) {
                        //case "getboostfeed":
                            //break;
                        //case "getcomments":
                            //break;
                    }

                    /*
                    Calls the original rpc function and returns its promise which is
                    handled below
                    */
                    var ret = oldrpc(n, t, r, o);

                    /*
                    Handle the promise object returned from the original rpc call
                    */
                    switch (n) {
                        case "getboostfeed":
                            /*
                            In case nuking the getboost() function fails above, this will
                            ensure it doesn't return any data
                            */
                            return Promise.resolve();
                        case "getcomments":
                            return ret.then(function(e) {
                                e.forEach(x => nukeDonateComment(x));
                                return Promise.resolve(e);
                            });
                        case "getprofilefeed":
                            return ret.then(function(e) {
                                e.contents.forEach(x => nukeDonateComment(x.lastComment));
                                return Promise.resolve(e);
                            });
                        default:
                            return ret;
                    }
                };
            });

    })();
})();