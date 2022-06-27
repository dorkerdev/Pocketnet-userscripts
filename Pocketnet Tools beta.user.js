// ==UserScript==
// @name         Pocketnet Tools
// @namespace    http://tampermonkey.net/
// @version      current
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
        el.appendChild(elVote);
    }

    function init() {
        return waitUntil(() => app.platform.sdk.address.pnet);
        /*
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(x);
            }, 5000);
        });
        //*/
    }

    //var xxx = console.log(await init());
    //await (async function() { waitUntil(()=> true)})();

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
            value: false,
        },
        //*/
        {
            name: "Bastyhax",
            id: "uncuck",
            type: "BOOLEAN",
            value: false,
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
            value: false,
        },
        {
            name: "Add comment sidebar link",
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
            name: "Show walled content",
            id: "nowalls",
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

    /*
    waitUntil(() => app.platform.sdk.usersettings.init).then(() => {
        var init = app.platform.sdk.usersettings.init;
        app.platform.sdk.usersettings.init = function(t) {
            _.each(configParams, p => {
                app.platform.sdk.usersettings.meta[p.id] = p;
            });
            return init(t);
        }
    });

    //*/

    var _initialized = false;
    var getUserSetting = function(key) {
        if (!_initialized) {
            configParams.forEach(p => {
                app.platform.sdk.usersettings.meta[p.id] = p;
            });
            app.platform.sdk.usersettings.init();
            _initialized = true;
        }

        return app.platform.sdk.usersettings.meta[key].value;
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
                    n.data.shares = n.data.shares.filter(x=> !x.dorkynuke);
                    //if (!!n.data.share.dorkynuke) return "";
                    break;
            }

            return renderTemplate(a, t, n);
        }

        x.insertTemplate = function(e, a) {
            var ret = insertTemplate(e, a);
            //console.log(e.name);
            switch(e.name){
                case "lastcommentslist":
                    /*
                    Comment sidebar. Adds [link] to post that you can open in
                    new tab
                    */
                    if (!getUserSetting("commentsidebarlink")) break;

                    e.el.find("div.lastcommentslist > div.commentgroup").each((i,el) => {
                        var shareId = el.attributes["share"].value;
                        var commentId = $(el).find("div.comment").prop("id");
                        $(el).find("div.commentmessage").prepend(`<a target="_blank" href="post?s=${shareId}&commentid=${commentId}">[link] </a>`);
                    });
                    break;
                case "share":

                    if (e.data.share.deleted) {
                        let elRemove = e.el.find("div.removeDescription");
                        elRemove.css("color","red");
                        elRemove.append(`<ul>${Array.from(e.data.share.deleteReasons.map(x=> `<li>${x}</li>`)).join("")}</ul>`);
                        break;
                    }

                    /*
                    Remove blocking class so that you can still view the posts and comment
                    sections of users you've blocked
                    */
                    if (getUserSetting("showblockedprofilecontent")) {
                        e.el.removeClass("blocking");
                    }

                    /*
                    Add language feed post was created in
                    */
                    e.el.find("div.authorTable > div.sys").append(`<span>(${e.data.share.language})</span>`)

                    /*
                    Outer post template. Adds permalink anchor alement to upper-right corner
                    so that you can open in new tab or copy URL more easily
                    */

                    var metaHead = e.el.find("div.metapanel");

                    metaHead.attr("style", "width: 1px!important");
                    metaHead.attr("style", "textAlign: right");
                    metaHead.prepend(`<a href="post?s=${e.data.share.txid}" style="paddingRight = 10px" target="_blank">permalink<a>`);

                    /*
                    Adds "Show votes" button
                    */
                    if (getUserSetting("showvotes")) {
                        var panel = e.el.find("div.panel.sharepanel");
                        var container = $("<div style=\"text-align:right\"></div>");
                        var link = $("<input type=\"button\" value=\"Show votes\" />")

                        container.append(link);
                        container.insertAfter(panel);

                        link.click(() => {
                            //e.target.disabled = true;
                            displayVotesByPost(e.data.share.txid, container[0]);
                        });
                    }

                    break;
                case "sharearticle":
                    {
                        /*
                        Show score count
                        */
                        var score = e.el.find("div.postscoresshow > span:first-of-type")
                        score && score.prepend(e.data.share.scnt + "/");
                    }
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
                            let accountAge = (new Date() - author.regdate) / 1000 / 3600 / 24;
                            let infos = [
                                {
                                    label: "Language",
                                    value: author.language
                                },
                                {
                                    label: "Account age",
                                    value: `${Math.trunc(accountAge)} days`
                                },
                                {
                                    label: "Rep/day",
                                    value: (author.reputation / accountAge).toFixed(2)
                                },
                                {
                                    label: "Posts/day",
                                    value: (author.postcnt / accountAge).toFixed(2)
                                }
                            ];

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

    /*
    Wrap the pShare class so we can carry over the filter properties
    that were set in the RPC function
    */
    window.pShareBase = function() {
        var x = new pShareBase.base;

        var __import = x._import;
        x._import = function(e) {
            __import(e);
            x.dorkynuke = e.dorkynuke;
            x.deleteReasons = e.deleteReasons;
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
                    return true;
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
    if (getUserSetting("pagetitles")) {
        (function() {
            /*
        Need to figure out how to get the app name so that I don't
        have to hardcode "Bastyon".
        window.location.host.split(".")[0]
        */
            waitUntil(() => app.nav.api.load).then(load => {
                app.nav.api.load = function(e) {
                    if (e.history === true) {
                        window.document.title = `${app.meta.fullname} - ${e.href}`;
                    }
                    load(e);
                }
            });

            waitUntil(() => app.nav.api.history.openCurrent).then(fn => {
                app.nav.api.history.openCurrent = function() {
                    window.document.title = `${app.meta.fullname} - ${history.state.href}`;
                    fn();
                }
            });

            var ps = window.history.pushState;
            window.history.pushState = function() {
                window.document.title = `${arguments[1]} - ${arguments[2]}`;
                //window.document.title = arguments[1] + " - " + arguments[2];
                ps.apply(history, arguments);
            }

            var rs = window.history.replaceState;
            window.history.replaceState = function() {
                window.document.title = `${arguments[1]} - ${arguments[2]}`;
                //window.document.title = arguments[1] + " - " + arguments[2];
                rs.apply(history, arguments);
            }
        })();
    }

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
                    //case "getboostfeed":
                    /*
                    In case nuking the getboost() function fails above, this will
                    ensure it doesn't return any data
                    */
                    //return Promise.resolve();
                case "getcomments":
                    return ret.then(function(e) {
                        e.forEach(x => nukeDonateComment(x, noboost));
                        return Promise.resolve(e);
                    });
                case "getprofilefeed":
                case "gethierarchicalstrip":
                case "gethistoricalstrip":
                    var dt = new Date()
                    dt = dt.addHours(-(dt.getTimezoneOffset() / 60));
                    return ret.then(function(e) {

                        switch(n) {
                            case "gethierarchicalstrip":
                            case "gethistoricalstrip":
                                e.contents.forEach(share => {
                                //for(var i = 0; i < e.contents.length; i++) {
                                    if (!app.platform.sdk.users.storage[app.user.address.value]
                                        .relation(share.address, "subscribes") || feedfilter){

                                        var args = {
                                            share: share,
                                            user: share.userprofile,
                                            today: dt
                                        };

                                        var user = share.userprofile;

                                        user.repPerDay = 0;
                                        user.upvotesPerPost = 0;

                                        ///*
                                        user.regDateTime = new Date(user.regdate * 1000);
                                        user.accountAgeDays = (dt - user.regDateTime) / 1000 / 3600 / 24;

                                        user.repPerDay = user.reputation / user.accountAgeDays;
                                        user.upvotesPerPost = user.likers_count / user.postcnt;
                                        //*/

                                        args.belowThresholds = (!repPerDayThreshold || user.repPerDay <= repPerDayThreshold) &&
                                            (!upvotesPerPostThreshold || user.upvotesPerPost <= upvotesPerPostThreshold);

                                        var ignore = !!feedIgnoreList.includes(share.address);

                                        var filtered;

                                        try {
                                            filtered = !feedFilter(args);
                                        } catch (error) {
                                            sitemessage(`${feedFilterParam.name}: ${error.message}`);
                                        }

                                        if (!args.belowThresholds || ignore || filtered) {
                                            if (debughiddenfeedcontent) {
                                                args.share.deleted = true;
                                                args.share.deleteReasons = [];
                                                if (!args.belowThresholds) args.share.deleteReasons.push("Exceeded thresholds");
                                                if (ignore) args.share.deleteReasons.push("Address ignore list");
                                                if (filtered) args.share.deleteReasons.push(feedFilterParam.name);
                                            } else {
                                                args.share.dorkynuke = true;
                                            }
                                        }
                                    }
                                });

                                break;
                        }

                        //return Promise.resolve(e);

                        e.contents.forEach(x => {
                            nukeDonateComment(x.lastComment, noboost);
                            /*
                            Show all walled content
                            2022-06-25 - autoshow walled content if user is not logged in
                            */
                            if (nowalls || !app.user.address.value) x.s.f = "0";
                        });

                        return Promise.resolve(e);
                    });
                default:
                    return ret;
            }
        };
    });

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

    /*
    waitForElement("#main:not(.videomain) .leftpanelcell", document.body, e =>{
        e.style.display = "none";
    });

    waitForElement("#main:not(.videomain) .lentacell", document.body, e =>{
        e.style.marginLeft = "0px";
    });
    //*/

    //document.querySelector("div.leftpanelcell").style.display = "None";
    //document.querySelector("#main .lentacell").style.marginLeft = "0px";

    /*
    var shite = document.createElement("div");
    shite.id = "shite";
    shite.style.display = "none";
    document.body.appendChild(shite);
    //*/

    /*
    var oldRpc = app.api.rpc;
    app.api.rpc = function(t,r,n) {

        if (t === "getlastcomments"){
            r[0] = "20";
            r.xxxxxxxx = Date.now();
        }

        return oldRpc(t,r,n);
	};
    //*/

    //var oldRpc = app.api.rpc;
    //app.api.rpc = function(t,r,n) { console.log(t); return oldRpc(t,r,n); };

    // Later, you can stop observing
    //observer.disconnect();
})();