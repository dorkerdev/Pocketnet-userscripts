// ==UserScript==
// @name         Pocketnet Tools
// @namespace    http://tampermonkey.net/
// @version      23
// @description  Adds various UI enhancements to the post/content template (see top comment for details)
// @author       dorker
// @match        https://bastyon.com/*
// @icon         https://www.google.com/s2/favicons?domain=mozilla.org
// @grant        none
// ==/UserScript==

/*
See README.md on the Github page for full description of features
*/

(async function() {
    'use strict';

    /*
    Waits asynchronously until a condition is true. Mainly
    used to pause execution of code while waiting for
    Bastyon's various UI elements to fully initialize
    */
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

    function displayBlockMessage(blockerAddress) {
        app.api.rpc("getuserprofile", [[blockerAddress],"0"]).then(data => {
            var user = app.platform.sdk.address.pnet().address;
            var blockIndex = data[0].blocking.indexOf(user);
            if (blockIndex > -1) {
                sitemessage("You have been blocked by this user");
            } else {
                /*
                sitemessage("You have not been blocked by this user");
                //*/
            }
        });
    }

    function userBlockedBy(blockerAddress) {
        return new Promise((res, rej) => app.api.rpc("getuserprofile", [[blockerAddress],"0"]).then(data => {
            var user = app.platform.sdk.address.pnet().address;
            var blockIndex = data[0].blocking.indexOf(user);
            var blocked = blockIndex > -1;
            res(blocked);
        }));
    }

    function sortMultiple(arr, comparers){
        arr.sort((a,b) => {
            var i;
            for(const c of comparers){
                i = c(a,b);
                if (i !== 0) return i;
            }
        });
    }

    function compareNumbers(a,b){
        var eq =
            a > b ? -1 :
        a < b ? 1 :
        0;
        return eq;
    }

    function displayVotesByPost(txid, el) {
        app.api.rpc("getpostscores", [txid]).then(data => {
            sortMultiple(data, [
                (a,b) => compareNumbers(parseFloat(a.value), parseFloat(b.value)),
                (a,b) => a.name.localeCompare(b.name)
            ]);
            for(const vote of data) {
                appendVote(el, vote);
            }
        });
    }

    function appendVote(el, vote) {
        var elVote = document.createElement("div");
        elVote.innerHTML = `<a target="_blank" href="${vote.address}">${decodeURIComponent(vote.name)} (${(vote.reputation/10).toLocaleString()})</a>: ${vote.value}`;
        if (addressBlocked(vote.address)) {
            elVote.style.color = 'red';
            elVote.style.fontStyle = 'italic';
        }
        el.appendChild(elVote);
    }

    var feedFilterParam;

    var configParams = [
        {
            name: "Hide left panel",
            id: "hideleftpanel",
            type: "BOOLEAN",
            value: false,
        },
        {
            name: "Show post votes",
            id: "showvotes",
            type: "BOOLEAN",
            value: true,
        },
        ///*
        {
            name: "Enable page titles",
            id: "pagetitles",
            type: "BOOLEAN",
            value: true,
        },
        //*/
        {
            name: "Bastyhax",
            id: "uncuck",
            type: "BOOLEAN",
            value: true,
        },
        {
            name: "Show block message",
            id: "showblockmessage",
            type: "BOOLEAN",
            value: true,
        },
        {
            name: "Show blocked profile content",
            id: "showblockedprofilecontent",
            type: "BOOLEAN",
            value: true,
        },
        {
            name: "Comment sidebar enhancements",
            id: "commentsidebarlink",
            type: "BOOLEAN",
            value: true,
        },
        {
            name: "Hide boosted content",
            id: "hideboost",
            type: "BOOLEAN",
            value: false,
        },
        {
            name: "Show user block list",
            id: "showuserblocks",
            type: "BOOLEAN",
            value: true,
        },
        {
            name: "Disable default image resizer/converter",
            id: "disableimageresize",
            type: "BOOLEAN",
            value: true,
        },
        //*
        {
            name: "Show additional user stats",
            id: "userstats",
            type: "BOOLEAN",
            value: true,
        },
        {
            name: "Show walled content",
            id: "nowalls",
            type: "BOOLEAN",
            value: true,
        },
        {
            name: "Nuclear block removal",
            id: "deleteblockedcomments",
            type: "BOOLEAN",
            value: false,
        },
        {
            name: "Remove verified badges",
            id: "removereal",
            type: "BOOLEAN",
            value: false,
        },
        {
            name: "Rep per day threshold",
            id: "repperdaythreshold",
            type: "STRINGANY",
            value: "",
        },
        {
            name: "Upvotes per post threshold",
            id: "upvotesperpostthreshold",
            type: "STRINGANY",
            value: "",
        },
        {
            name: "Feed ignore list",
            id: "feedignorelist",
            type: "STRINGANY",
            value: "",
        },
        feedFilterParam = {
            name: "Feed filter expression",
            id: "feedfilter",
            type: "STRINGANY",
            value: "",
        },
        {
            name: "Debug hidden feed content",
            id: "debughiddenfeedcontent",
            type: "BOOLEAN",
            value: true,
        }
        //*/
    ];

    waitUntil(() => app.platform.__getSettingsMeta).then(()=> {
        var old__getSettingsMeta = app.platform.__getSettingsMeta;
        app.platform.__getSettingsMeta = function() {
            var meta = old__getSettingsMeta();
            configParams.forEach(p => {
                meta[p.id] = p;
            });
            return meta;
        }
    });

    function initSettings() {
    }

    var _settingsInitialized = false;
    function getUserSetting(key) {
        if (!_settingsInitialized) {
            /*
            configParams.forEach(p => {
                app.platform.sdk.usersettings.meta[p.id] = p;
            });
            //*/
            app.platform.sdk.usersettings.init();
            _settingsInitialized = true;
        }

        try {
            return app.platform.sdk.usersettings.meta[key].value;
        } catch(ex) {
            return null;
        }
    }

    window.nModuleBase = function() {
        var x = new nModuleBase.base();

        var loadTemplate = x.loadTemplate;
        var renderTemplate = x.renderTemplate;
        var insertTemplate = x.insertTemplate;

        x.loadTemplate = function(a, t) {
            //if (a.name === "share") return null;
            return loadTemplate(a, t);
        }

        x.renderTemplate = function(a, t, n) {
            //console.log(n.name);
            //if (n.name === "share") return null;
            try {
                if (getUserSetting("showuserblocks") && n.name === "menu" && n.data.reports.blocking.if) {
                    delete n.data.reports.blocking.if;
                }
            } catch {
            }

            switch(n.name) {
                case "groupshares":
                    n.data.shares = n.data.shares.filter(x=> !x.data?.dorkynuke);
                    //if (!!n.data.share.dorkynuke) return "";
                    break;
            }

            return renderTemplate(a, t, n);
        }

        x.insertTemplate = function(e, a) {
            var ret = insertTemplate(e, a);
            //console.log(e.name);
            /*
            authorcaption
            best
            body
            categories
            graph
            groupshares
            images
            index
            info
            lastcommentslist
            lastprice
            lenta
            list
            menu
            post
            postline
            repost
            settings
            share
            sharearticle
            shares
            sharevideolight
            stars
            tags
            url
            */
            switch(e.name){
                case "index":
                    switch(e.id){
                        case "menu":
                            {
                                /*
                                Turn site logo into a clickable link
                                works only in debug mode. something else must be overwriting
                                the changes after this executes. Disabled for now
                                */
                                /*
                                let logo = e.el.find("img.header_logo");
                                let logoParent = logo.parent();
                                let link = $("<a href='index'></a>");
                                logoParent.append(link);
                                link.append(logo.detach());
                                //*/
                            }
                            break;
                    }
                    break;
                case "lastcommentslist":
                    /*
                    Comment sidebar. Adds [link] to post that you can open in
                    new tab
                    */
                    if (!getUserSetting("commentsidebarlink")) break;

                    e.el.find("div.icons").remove();

                    e.el.find("div.lastcommentslist > div.commentgroup").each((i,el) => {
                        var shareId = el.attributes["share"].value;
                        var commentId = $(el).find("div.comment").prop("id");
                        $(el).find("div.commentmessage").prepend(`<a target="_blank" href="post?s=${shareId}&commentid=${commentId}">[link] </a>`);
                    });
                    break;
                case "groupshares":
                    e.el.find("div.share.share_common.hidden").removeClass("hidden");
                    e.el.find("div.showmorebyauthor").remove();
                case "share":
                case "sharearticle":
                    {
                        if (e.data.share?.deleted) {
                            /*
                            function moveProperty(source, dest, prop) {
                                dest[prop] = source[prop];
                                delete source[prop];
                            }

                            function dumpObject(source, dest, objProp) {
                                for(var i in source[objProp]) {
                                    dest[i] = source[objProp][i];
                                }

                                delete source[objProp];
                            }
                            //*/

                            var clone = { share: e.data.share };
                            clone.userprofile = clone.share.userprofile;
                            clone.userstats = clone.userprofile.stats;
                            delete clone.share.userprofile;

                            var htmlReasons = `<div>Content removed by userscript</div><ul>${Array.from(e.data.share.data?.deleteReasons?.map(x=> `<li>${x}</li>`)).join("")}</ul>`;
                            var elInfo = $(`<div style='height: 200px;overflow-wrap: break-word; overflow-y: hidden'></div>`);

                            elInfo.click(e => {
                                var height = e.currentTarget.style.height;
                                if (height) {
                                    e.currentTarget.style.height = '';
                                    $(e.currentTarget).off(e.type);
                                }
                            });

                            for(var prop1 in clone) {
                                for(var prop2 in clone[prop1]){
                                    var val = clone[prop1][prop2];
                                    switch(typeof val) {
                                        case "object":
                                        case "function":
                                            break;
                                        default:
                                            elInfo.append(`<div><strong>${prop1}.${prop2}</strong>: ${clone[prop1][prop2]}</div>`);
                                            break;
                                    }

                                }
                            }

                            var elWrapper = $(`<div style='margin: 15px'><div style='color: red;'>${htmlReasons}</div></div>`);

                            elWrapper.append(elInfo);
                            e.el.empty();
                            e.el.append(elWrapper);

                            break;
                        }

                        /*
                        Remove blocking class so that you can still view the posts and comment
                        sections of users you've blocked
                        */
                        if (getUserSetting("showblockedprofilecontent")) {
                            e.el.removeClass("blocking");
                        }

                        switch(e.name) {
                            case "sharearticle":
                                /*
                                Show score count
                                */
                                var score = e.el.find("div.postscoresshow > span:first-of-type")
                                score && score.prepend(e.data.share.scnt + "/");
                                break;
                            case "share":
                                if (getUserSetting("userstats")) {
                                    var header = e.el.find("div.authorTable > div.sys");
                                    var metricsContainer = $("<div class='postMetrics'></div>");
                                    header.append(metricsContainer);

                                    function addMetadata(label, value) {
                                        if (!value) return;
                                        metricsContainer.append(`<div><span>${label}: ${value};</span></div>`)
                                    }

                                    addMetadata("Feed", e.data.share.language);

                                    var stats = getUserStats(e.data.share.userprofile);

                                    stats.forEach(x=> addMetadata(x.label, x.value));

                                    addMetadata("Page", e.data.share?.data?.page);
                                }

                                /*
                                Outer post template. Adds permalink anchor alement to upper-right corner
                                so that you can open in new tab or copy URL more easily
                                */

                                var metaHead = e.el.find("div.metapanel");

                                metaHead.attr("style", "width: 1px!important");
                                metaHead.attr("style", "textAlign: right");
                                metaHead.prepend(`<a class='postPermalink' href="post?s=${e.data.share.txid}" style="paddingRight = 10px" target="_blank">permalink<a>`);

                                /*
                                Adds "Show votes" button
                                */
                                if (getUserSetting("showvotes")) {
                                    var panel = e.el.find("div.panel.sharepanel");
                                    var container = $("<div class='showVotesContainer' style=\"text-align:right\"></div>");
                                    var link = $("<input type=\"button\" value=\"Show votes\" />")

                                    container.append(link);
                                    container.insertAfter(panel);

                                    link.click(() => {
                                        //e.target.disabled = true;
                                        displayVotesByPost(e.data.share.txid, container[0]);
                                    });
                                }
                                break;
                        }


                    }
                    break;
                case "stars":

                    break;
                case "post":
                    /*
                    Post body and comment box. Alerts you if you've been banned by
                    a user as soon as you click in the comment box on their post
                    */
                    var div = e.el.find("textarea.leaveCommentPreview");
                    div.click(el =>{
                        if (!getUserSetting("showblockmessage")) return;
                        displayBlockMessage(e.data.receiver);
                    });
                    break;
                case "info":
                    {
                        if (e.data.module.map.href === "author") {
                            let author = e.data.author.data;
                            setUserStats(author, new Date());

                            var infos = getUserStats(author);

                            infos.forEach(info => {
                                //let o = infos[info];
                                e.el.find("div.additionalinfo").append(`<div class="item">
	<div class="itemtable table">
		<div class="icon"><i class="fas fa-info"></i></div>
			<div class="label">${info.label} <b>${info.value}</b>
		</div>
	</div>
</div>`);
                            });
                        }
                    }
            }

            return ret;
        }

        return x;
    }

    /*
    It is critical that this run before any other code to ensure that
    the nModule class can be wrapped before it is defined in Bastyon's
    code. Otherwise, we won't be able to intercept new instances of
    the class which will prevent being able to wrap its functions as
    shown above with nModuleBase.
    */
    Object.defineProperty(window, "nModule", {
        get() {
            return nModuleBase;
        },
        set(x) {
            nModuleBase.base = x;
        }
    })

    false && waitUntil(() => jQuery.event.add).then(function(e) {
        var _event = jQuery.event.add;

        jQuery.event.add = function(elem, types, handler, data, selector) {
            _event.apply(this, arguments);
        }
    });

    /*
    Override the global event dispatcher so that we can intercept events
    to add additional functionality. Disabled for now
    */
    false && waitUntil(() => jQuery.event.dispatch).then(function(e) {
        var _event = jQuery.event.dispatch;

        jQuery.event.dispatch = function( nativeEvent ) {
            var elem = nativeEvent.srcElement;
            //console.log(elem);
            function eventMatches(sel, events) {
                var match = elem && elem.matches(sel) &&
                    nativeEvent.type === events;
                try {
                    //var log = "EVENT: " + elem.classList + " " + nativeEvent.type;
                    //console.log(log);
                    //console.log(elem);
                    return match;
                } catch(error) {
                    console.log(error);
                }
            }

            function wrapHandler(newHandler) {
                var _handler = handler;
                handler = newHandler;
            }

            var match;

            if (!match) _event.apply(this, arguments);
        }
    });

    /*
    Wrap the pShare class so we can carry over the filter properties
    that were set in the RPC function
    */
    window.pShareBase = function() {
        var x = new pShareBase.base;

        var __import = x._import;
        x._import = function(e) {
            __import(e);
            //x.rpc = e.rpc;
            x.data = e.data;
            x.userprofile = e.userprofile;
            //x.dorkynuke = e.dorkynuke;
            //x.deleteReasons = e.deleteReasons;
        }

        return x;
    }

    Object.defineProperty(window, "pShare", {
        get() {
            return pShareBase;
        },
        set(x) {
            pShareBase.base = x;
        }
    })

    window.ParameterBase = function(e) {
        var x = new ParameterBase.base(e);

        var _mask = x.mask;
        x.mask = function(e) {
            if (this.id !== feedFilterParam.id) {
                _mask(e);
            }
        }

        return x;
    }

    /*
    Need to wrap the Parameter class to override the mask function
    to allow the pipe character in the feedFilterParam
    */
    Object.defineProperty(window, "Parameter", {
        get() {
            return ParameterBase;
        },
        set(x) {
            ParameterBase.base = x;
        }
    })

    /*
    window.UserInfoBase = function() {
        var x = new UserInfoBase.base;

        var _about = x.about.set;

        x.about.set = function (e) {
            let aboutarr = e.split("--img:");
            if (aboutarr.length === 2) {
                x.image.set(aboutarr[1]);
            }

            _about(aboutarr[0].trim());

        }

        return x;
    }

    Object.defineProperty(window, "UserInfo", {
        get() {
            return UserInfoBase;
        },
        set(x) {
            UserInfoBase.base = x;
        }
    })
    //*/

    /*
    window.initUploadBase = function(e) {
        var x = new initUploadBase.base(e);
    }

    Object.defineProperty(window, "initUpload", {
        get() {
            return initUploadBase;
        },
        set(x) {
            initUploadBase.base = x;
        }
    })
    //*/

    /*
    Defer execution of this script while we wait for the .meta property to
    be defined. This will ensure that the new config settings will work
    */
    await waitUntil(() => app.platform.sdk.usersettings.meta);

    waitUntil(() => app.platform.sdk).then(sdk => {

        if (getUserSetting("hideleftpanel")) {
            var sheet;

            waitUntil(() => sheet = document.querySelector('link[href*=master]').sheet)
                .then(() => {
                sheet.insertRule("#main:not(.videomain) .leftpanelcell {display: none}",0);
                sheet.insertRule("#main:not(.videomain) .lentacell { margin-left: 0 }",0);
            });
        }

        waitUntil(() => sdk.node.shares.gettopfeed).then(() => {
            sdk.node.shares.gettopfeed = function(x,y,z) {
                return null;
            };
        });

        waitUntil(() => sdk.usersettings.createall).then(() => {
            var createall = sdk.usersettings.createall;
            sdk.usersettings.createall = function() {
                ///*
                configParams.forEach(p => {
                    sdk.usersettings.meta[p.id] = p;
                });
                //*/
                var settings = createall();
                return settings;
            };
        });

        waitUntil(() => sdk.usersettings.compose).then(() => {
            var a = sdk.usersettings;
            var compose = a.compose;
            sdk.usersettings.compose = function() {
                var e = arguments[0];
                var composed = compose(e);
                var s = a.meta;

                var params = [];

                function pushAndReturn(value) {
                    var i = params.push(value);
                    return params[i-1];
                }

                composed.c.dorkershit = {
                    class: "dorker",
                    name: "Dorkershit",
                    options: {}
                }

                configParams.forEach(p =>
                                     {
                    composed.c.dorkershit.options[p.id] = composed.o[p.id];
                });

                return composed;
            };
        });

        /*
        Disables the function that gets boosted posts, preventing them from
        being shown in the feeds
        */

        if (getUserSetting("hideboost")) {
            waitUntil(() => sdk.node.shares.getboost)
                .then(() => { sdk.node.shares.getboost = function(e, t, n) { }; }
                     );
        }

        if (getUserSetting("uncuck")) {
            /*
            All code below removes any functionality that hides content from
            the feeds or comment sections, usually accounts with low rep or
            comments that have been highly downvoted
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

            //*/
            waitUntil(() => app.platform.sdk.user.reputationBlocked)
                .then(() => {
                app.platform.sdk.user.reputationBlocked = function(e) {
                    return false;
                };
            });
            //*/

            waitUntil(() => app.platform.sdk.user.hiddenComment)
                .then(() => {
                app.platform.sdk.user.hiddenComment = function(e) {
                    return false;
                };
            });

            ///*
            waitUntil(() => app.platform.sdk.user.isNotAllowedName)
                .then(() => {
                app.platform.sdk.user.isNotAllowedName = function(e) {
                    return false;
                };
            });
            //*/

            /*
            Disables minimum rep limit to post images to comments
            */
            waitUntil(() => app.platform.sdk.user.canuseimagesincomments)
                .then(() => {
                app.platform.sdk.user.canuseimagesincomments = function(e) {
                    return true;
                };
            });

        }

        /*
        Disables the function that mangles your images by downscaling them and converting
        them to jpg. Images will now retain their original dimensions and format (supports
        PNG)
        */
        if (getUserSetting("disableimageresize")) {
            waitUntil(() => resize)
                .then(() => {
                var oldResize = resize;
                resize = function(e, t, n, a, i) {
                    a(e);
                };
            });
        }

    })

    /*
    Update page title during navigation and page loads
    */
    let qparams = null;
    function updateQueryParams() {
        qparams = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop),
        });
    }

    let pagetitles = getUserSetting("pagetitles");
    //if (getUserSetting("pagetitles")) {
    //(function() {
    waitUntil(() => app.nav.api.load).then(load => {
        app.nav.api.load = function(e) {
            updateQueryParams();
            if (pagetitles && e.history === true) {
                window.document.title = `${app.meta.fullname} - ${e.href}`;
            }
            load(e);
        }
    });

    waitUntil(() => app.nav.api.history.openCurrent).then(fn => {
        app.nav.api.history.openCurrent = function() {
            updateQueryParams();
            if (pagetitles) {
                window.document.title = `${app.meta.fullname} - ${history.state.href}`;
            }
            fn();
        }
    });

    var ps = window.history.pushState;
    window.history.pushState = function() {
        updateQueryParams();
        if (pagetitles) {
            window.document.title = `${arguments[1]} - ${arguments[2]}`;
        }
        ps.apply(history, arguments);
    }

    var rs = window.history.replaceState;
    window.history.replaceState = function() {
        updateQueryParams();
        if (pagetitles) {
            window.document.title = `${arguments[1]} - ${arguments[2]}`;
        }
        rs.apply(history, arguments);
    }
    //})();
    //}

    /*
    Removes all traces of donations from comments so that they're sorted
    like every other comment (ie, unpins them from the top of comment
    sections
    */
    function nukeDonateComment(comment, noboost) {
        if (noboost && comment && comment.donation === "true") {
            delete comment.donation;
            comment.amount = 0;
        }
    }

    var noboost = getUserSetting("hideboost"), nowalls = getUserSetting("nowalls"),
        debughiddenfeedcontent = !!getUserSetting("debughiddenfeedcontent");
    var feedIgnoreList = (getUserSetting("feedignorelist") || "").split(",");
    var feedFilterExpression = getUserSetting("feedfilter");
    var repPerDayThreshold = parseFloat(getUserSetting("repperdaythreshold"));
    var upvotesPerPostThreshold = parseFloat(getUserSetting("upvotesperpostthreshold"));

    var feedFilter;

    try {
        feedFilter = new Function(["args"], `return ${feedFilterExpression || "true"};`);
    } catch (error) {
        sitemessage(`${feedFilterParam.name}: ${error.message}`);
    }

    waitUntil(() => app.platform.sdk.node.transactions.create.common).then(common => {
        var _common = app.platform.sdk.node.transactions.create.common;
        app.platform.sdk.node.transactions.create.common = function(p) {
            var obj = arguments[1];
            if (obj instanceof UserInfo) {
                let arr = obj.about.v.split("--img:");
                if (arr.length === 2) {
                    obj.image.v = arr[1];
                    obj.about.v = arr[0].trim();
                }
            } else if (obj instanceof Comment) {
                let arr = obj.message.v.split("--img:");
                if (arr.length === 2) {
                    let images = arr[1].split("\n").filter(x => x);
                    obj.images.v = images;
                    obj.message.v = arr[0].trim();
                }
            }
            _common.apply(this, arguments)
        }
    });

    function setUserStats(user, dt) {
        if (!getUserSetting("userstats")) return;

        var stats = {
            repPerDay: 0,
            upvotesPerPost: 0
        };

        user.stats = stats;

        ///*
        stats.postcnt = user.postcnt;
        stats.likers_count = user.likers_count;
        stats.upvotesPerPost = stats.likers_count / user.postcnt;
        stats.regDateTime = typeof user.regdate.getMonth === "function" ? user.regdate : new Date(user.regdate * 1000);
        stats.accountAgeDays = (dt - stats.regDateTime) / 1000 / 3600 / 24;

        stats.repPerDay = user.reputation / stats.accountAgeDays;
        stats.postsPerDay = user.postcnt / stats.accountAgeDays;
    }

    function toLocaleString(number, places) {
        return number.toLocaleString(undefined, {minimumFractionDigits:places,maximumFractionDigits:places});
    }

    function getUserStats(user) {
        if (!user || !user.stats) return [];

        let infos = [
            {
                label: "Profile language",
                value: user.l || user.language
            },
            {
                label: "Account age",
                value: `${Math.trunc(user.stats.accountAgeDays)} days`
            },
            {
                label: "Total posts",
                value: toLocaleString(user.postcnt, 0)
            },
            {
                label: "Rep/day",
                value: (user.stats.repPerDay).toFixed(2)
            },
            {
                label: "Posts/day",
                value: (user.stats.postsPerDay).toFixed(2)
            }
        ];

        if (user.stats.likers_count) {
            infos.push(
            {
                label: "Total upvotes",
                value: toLocaleString(user.stats.likers_count, 0)
            });
            infos.push({
                label: "Upvotes/post",
                value: toLocaleString(user.stats.upvotesPerPost, 2)
            });
        }

        return infos;
    }

    function addressBlocked(address) {
        var blocked = !!app.platform.sdk.users.storage[app.user.address.value].relation(address, "blocking");
        return blocked;
    }

    function updateShare(share, dt){
        if (nowalls || !app.user.address.value) share.s.f = "0";

        share.data = {
            rpctype: share.type,
        }

        if (share.lastComment) {
            if (getUserSetting("deleteblockedcomments") && addressBlocked(share.lastComment.address)) {
                share.lastComment = null;
            } else {
                nukeDonateComment(share.lastComment, noboost);
            }
        }

        if (nowalls || !app.user.address.value) share.s.f = "0";

        setUserStats(share.userprofile, dt);
    }

    function GetURLParameter(sParam)
    {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++)
        {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam)
            {
                return sParameterName[1];
            }
        }
    }

    waitUntil(() => app.api.rpc)
        .then(() => {

        /*
        Override the rpc function with one of our own
        */
        var oldrpc = app.api.rpc;
        let feedPage = {};
        app.api.rpc = function(n, t, r, o) {
            //console.log(n);
            /*
			getuserstate
			getuserprofile
			txunspent
			getprofilefeed
			getnodeinfo
			gettags
			getaccountsetting
			getpagescores
			gethistoricalstrip
			getlastcomments
			gethotposts
			getrawtransactionwithmessagebyid
			getsubscribesfeed
			getcomments
			getrecommendedcontentbyaddress
			gettopfeed
			*/

            /*
            Execute code before the rpc method is even called. Useful for modifying
            parameters such as feed posts per page, address ignore list, etc
            */
            switch (n) {
                    //case "getboostfeed":
                    //break;
                case "getactivities":
                    var user = GetURLParameter("user");
                    if (user) t[0] = user;
                    break;
                case "getcomments":
                    if (t?.length > 2) t[2] = 'lol';
                    break;
            }

            /*
            Calls the original rpc function and returns its promise which is
            handled below
            */
            var ret = oldrpc(n, t, r, o);

            var dt = new Date()
            dt = dt.addHours(-(dt.getTimezoneOffset() / 60));

            /*
            Handle the promise object returned from the original rpc call
            */
            switch (n) {
                    //case "getboostfeed":
                    /*
                    In case nuking the getboost() function fails above, this will
                    ensure it doesn't return any data
                    */
                    //return Promise.resolve();
                case "getcomments":
                    {

                        return ret.then(function(e) {
                            e = e.filter(x => {
                                /*
                                This code removes comments from blocked users rather than showing
                                a message with a link to unhide comment. Comment will show if the
                                query string contains the commentid param in case you navigate
                                directly to a comment section via URL. Was going to check if the
                                hidden comment ID was in the query string, but the node doesn't
                                return the blocked user's comment ID, so this is not possible for
                                now.
                                */
                                ///*
                                if (addressBlocked(x.address)) {
                                    var deleteCommentIfBlocked =
                                        !qparams?.commentid &&
                                        getUserSetting("deleteblockedcomments");
                                    if (deleteCommentIfBlocked) return false;
                                }

                                nukeDonateComment(x, noboost);
                                return true;
                            });

                            return Promise.resolve(e);
                        });
                    }
                case "getrawtransactionwithmessagebyid":
                    return ret.then(function(e) {
                        e.forEach(share => {
                            updateShare(share, dt);
                        });
                        return Promise.resolve(e);
                    });
                case "getprofilefeed":
                case "gethierarchicalstrip":
                case "gethistoricalstrip":
                    return ret.then(function(e) {
                        feedPage[n] = t[1] && n in feedPage ? ++feedPage[n] : 1;
                        e.contents.forEach(share => {
                            updateShare(share, dt);
                            share.data.page = feedPage[n];
                            switch(n) {
                                case "gethierarchicalstrip":
                                case "gethistoricalstrip":
                                    if (!app.platform.sdk.users.storage[app.user.address.value]
                                        .relation(share.address, "subscribes") || feedFilter){

                                        ///*
                                        var args = {
                                            rpcParams: {
                                                feedFilter: t[5]
                                            },
                                            share: share,
                                            user: share.userprofile,
                                            today: dt
                                        };
                                        //*/

                                        var user = share.userprofile;

                                        args.belowThresholds = (!repPerDayThreshold || user.repPerDay <= repPerDayThreshold) &&
                                            (!upvotesPerPostThreshold || user.upvotesPerPost <= upvotesPerPostThreshold);

                                        var ignore = !!feedIgnoreList.includes(share.address);

                                        var filtered;

                                        try {
                                            filtered = !feedFilter(args);
                                        } catch (error) {
                                            sitemessage(`${feedFilterParam.name}: ${error.message}`);
                                        }

                                        var ignoreFilter = (t?.[4]?.length || 0) > 0/* && (t?.[5]?.length || 0) === 0*/;

                                        if ((!ignoreFilter) && (!args.belowThresholds || ignore || filtered)) {
                                            if (debughiddenfeedcontent) {
                                                args.share.deleted = true;
                                                args.share.data.deleteReasons = [];
                                                if (!args.belowThresholds) args.share.data.deleteReasons.push("Exceeded thresholds");
                                                if (ignore) args.share.data.deleteReasons.push("Address ignore list");
                                                if (filtered) args.share.data.deleteReasons.push(feedFilterParam.name);
                                            } else {
                                                args.share.data.dorkynuke = true;
                                            }
                                        }
                                    }

                                    break;
                            }
                        });

                        return Promise.resolve(e);
                    });
                default:
                    return ret;
            }
        };
    });

    if (getUserSetting("removereal")) {
        waitUntil(() => app.platform.ui.usertype).then(x=> {
            app.platform.ui.usertype = function(e) {
                return app.platform.sdk.usersl.storage[e] && app.platform.sdk.usersl.storage[e].dev ? "dev" : "";
            }
        });
    }

    //utilities
    function arrayIncludes(arr, value) {
        return arr && arr.includes(value);
    }


    /*******************************************************************
    Nothing below this comment is needed. Will remove in future release
    *******************************************************************/

    function postData(data, responseReturned){
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
                switch(this.status){
                    case 200:
                    case 208:
                        var response = JSON.parse(this.responseText);
                        responseReturned(response.data);
                        break;
                    default:
                        alert(`Error: ${this.readyState}.\nReport this error as I may have to change the API call to bastyon.com`);
                        break;
                }
            }
        };

        //will update to bastyon.com when they have it available
        xhr.open("POST", `https://pocketnet.app:8899/rpc/${data.method}`, true);
        xhr.setRequestHeader("Content-type", "application/json");

        xhr.send(JSON.stringify(data));
    }

    //Looks like I'll have to observe the entire contentWrapper
    //in order to avoid breaking the script after swapping feeds. At
    //least now you don't have to refresh the page.
    if (false){
        observe("div.contentWrapperx", function(m,el,s) {
            if (el.nodeName === "#text") return;
            if (!el.parentNode?.matches("div.shares")) return;
            var post = el.classList?.contains("authorgroup")
            ? el.children[0] : el;
            //console.log(post.id);
            //$("i.far.fa-star[value=5]").click()
            /*
            waitForElement(".starsWrapper.starsWrapperM", el, function(stars) {
                var allstars = stars.querySelector("i.far.fa-star[value='5']");
                //debugger;
                allstars.click();
            });
            //*/

            waitForElement(".wholikes", el, function(stars) {
                if (!stars) return;
                var metaHead = post.querySelector("div.metapanel");
                if (metaHead) {
                    metaHead.style.setProperty("width","auto","important");
                    metaHead.style.textAlign = "right";
                    var perma = document.createElement("a");
                    perma.href = `post?s=${post.id}`;
                    perma.style.paddingRight = "10px";
                    perma.target = "_blank";
                    perma.innerText = "permalink";
                    metaHead.prepend(perma);
                }

                waitForElement("textarea.leaveCommentPreview", post, e =>{
                    var info = post.querySelector(".shareTable.post.truerepost");
                    var addr = info?.getAttribute("address");
                    e.addEventListener("click", x =>{
                        //console.log(addr);
                        var div = post.querySelector("div.emojionearea.leaveComment");
                        displayBlockMessage(addr, div);
                    });
                });

                var container = document.createElement("div");
                container.style.textAlign = "right";
                var link = document.createElement("input");
                link.type = "button";
                link.value = "Show votes";

                container.appendChild(link);
                stars.parentNode.insertBefore(container, null);

                link.onclick = function(e){
                    //e.target.disabled = true;
                    displayVotesByPost(post.id, container);
                };
            });
        });
    }

    function waitForElement(sel, targetNode, elementFound) {
        var el = targetNode.querySelector(sel);
        if (el) {
            //console.log(sel + " found");
            elementFound(el);
            return;
        }
        //console.log(sel + " NOT found");
        observe(targetNode, function(m,el,s){
            if (el.nodeName === "#text") return;
            //console.log(el.nodeName);
            var e;
            if (el.matches(sel) || (e = el.querySelector(sel))){
                s.abort = true;
                elementFound(e ? e : el);
                return;
            }
        });
    }

    function observe(targetNode, onObserve){
        var state = {abort: false};
        if (typeof targetNode === "string") {
            targetNode = document.querySelector(targetNode);
        }
        const callback = function(mutationsList, observer) {
            // Use traditional 'for loops' for IE 11
            for(const mutation of mutationsList) {
                for(const element of mutation.addedNodes) {
                    onObserve(mutation, element, state);
                    if (state.abort) {
                        observer.disconnect();
                        return;
                    }
                }
            }
        }

        const config = { attributes: false, childList: true, subtree: true };
        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    }
})();