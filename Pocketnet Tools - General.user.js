// ==UserScript==
// @name         Pocketnet Tools - General
// @namespace    http://tampermonkey.net/
// @version      0.55
// @description  Remove tags sidebar
// @author       dorker
// @match        https://pocketnet.app/*
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
        Adds a [link] tag to the beginning of all comments in the sidebar so that you
        can open the comment thread in a new window
        */
        waitUntil(() => window.pocketnetTemplates.lastcomments.lastcommentslist)
            .then(() => {window.pocketnetTemplates.lastcomments.lastcommentslist = "<div class=\"wrp\">\r\n    <div class=\"rcptwrp\">\r\n\r\n        <div class=\"rcaption\">\r\n            <span><%=e('e13122')%></span>\r\n        </div>\r\n\r\n        <div class=\"lastcommentslistwrapper\">\r\n            <div class=\"lastcommentslist\">        \r\n\r\n            \r\n\r\n                <% _.each(comments, function(group, postid){\r\n\t\t\t\t\t//debugger; \r\n                    \r\n                    var share = app.platform.sdk.node.shares.storage.trx[postid]\r\n                    \r\n                    if(!share) return\r\n\r\n                    if(share.address == 'PR7srzZt4EfcNb3s27grgmiG8aB9vYNV82') return\r\n\r\n\r\n                    var me = app.platform.sdk.user.me()\r\n                    \r\n                    var h = '';\r\n\r\n                    var m = '';\r\n\r\n                    if(share.caption) m = m + '' + share.caption + ' '\r\n\r\n                    if(share.message) m = m + '' + share.message + ''\r\n\r\n                    var nm = filterXSS(trimHtml(m, 80), {\r\n                        stripIgnoreTag : true,\r\n                        whiteList: {\r\n                            b : [\"style\"]\r\n                        }\r\n                    });\r\n\r\n                    if(!nm) return\r\n\r\n                    var image = share.images[0] || deep(app, 'platform.sdk.usersl.storage.'+share.address+'.image');\r\n                    var video = null;\r\n\r\n                    var vstyle = false;\r\n\r\n                    var cmts = _.filter(group, function(c){\r\n                        return c.message\r\n                    })\r\n\r\n                    if(!cmts.length) return\r\n\r\n                    if (share.url){\r\n                        video = videoImage(share.url)\r\n                        vstyle = true;\r\n                    } %>\r\n\r\n                    <div class=\"commentgroup\" share=\"<%-postid%>\">\r\n\r\n                        <div class=\"comments\">\r\n                            <% _.each(group, function(comment){ \r\n                                \r\n                                if(comment.deleted || !comment.message) return\r\n\r\n                                %> \r\n\r\n                                <div elementsid=\"lastcomments_<%-comment.id%>\" class=\"comment \" id=\"<%-comment.id%>\" aid=\"<%-comment.answerid%>\" pid='<%-comment.parentid%>'>\r\n\r\n                                    <div class=\"commentPaddingWrapper\">\r\n\r\n                                        <!--<div class=\"icons\">\r\n\r\n                                            <div class=\"iconWrapper\">\r\n                                                <% \r\n                                                    var src = deep(app, 'platform.sdk.usersl.storage.'+comment.address+'.image');\r\n                                                    var name = deep(app, 'platform.sdk.usersl.storage.'+comment.address+'.name');\r\n                                                    var letter = name ? name[0] : '';\r\n                                                %>\r\n                        \r\n                                                <div class=\"icon\">\r\n                                                    <div class=\"usericon\" image=\"<%-src || ''%>\">\r\n\r\n                                                        <% if(!src && letter) { %>\r\n\r\n                                                            <span \r\n                                                                class=\"letter\"\r\n                                                            >\r\n                                                                <%-letter.toUpperCase()%>\r\n                                                            </span>\r\n                                        \r\n                                                        <% } %>\r\n\r\n                                                    </div>\r\n                                                </div>\r\n                        \r\n                                            </div>\r\n\r\n                                            <% if(comment.address != share.address) {%>\r\n\r\n                                            <div class=\"iconbetweenWrapper\">\r\n                                                <i class=\"fas fa-long-arrow-alt-right\"></i>\r\n                                            </div>\r\n\r\n                                            <div class=\"iconWrapper\">\r\n                                                <% \r\n                                                    var src2 = deep(app, 'platform.sdk.usersl.storage.'+share.address+'.image')\r\n                                                    var name2 = deep(app, 'platform.sdk.usersl.storage.'+share.address+'.name');\r\n                                                    var letter2 = name ? name[0] : '';    \r\n                                                %>\r\n                        \r\n                                                <div class=\"icon\">\r\n                                                    <div elementsid=\"usericon<%-src2 || ''%>\" class=\"usericon\" image=\"<%-src2 || ''%>\">\r\n                                                        <% if(!src2 && letter2) { %>\r\n\r\n                                                            <span \r\n                                                                class=\"letter\"\r\n                                                            >\r\n                                                                <%-letter2.toUpperCase()%>\r\n                                                            </span>\r\n                                        \r\n                                                        <% } %>\r\n                                                    </div>\r\n                                                </div>\r\n                        \r\n                                            </div>\r\n\r\n                                            <% } %>\r\n\r\n                                            <% if(comment.donation === 'true' && comment.amount) {%>\r\n\r\n                                                <div class=\"donate\">\r\n                                                    +<%=comment.amount / 100000000 %> PKOIN\r\n                                                </div>\r\n                                            <% } %>\r\n\r\n                                        </div>-->\r\n                            \r\n                            \r\n\r\n\r\n                                        <div class=\"commentcontent\">\r\n                                            <% if(comment.message) {\r\n\r\n                                                var l = findAndReplaceLink(filterXSS(comment.message, {\r\n                                                    whiteList: [],\r\n                                                    stripIgnoreTag: true\r\n                                                }), true)\r\n\r\n                                                m = joypixels.toImage(l)\r\n\r\n                                            %>\r\n\r\n                                                <div class=\"commentmessage\">\r\n                                                    <div>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t<a target=\"_blank\" href=\"post?s=<%= share.txid %>&commentid=<%= comment.id %>\">[link] </a>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t<b\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t<% if (me && me.relation(comment.address, 'blocking')) { %>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\tstyle=\"font-style: italic; color: gray\"\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t<% } %>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t<%-deep(app, 'platform.sdk.usersl.storage.'+comment.address+'.name') || comment.address %>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t</b> \r\n\t\t\t\t\t\t\t\t\t\t\t\t\t<% if(comment.address != share.address) {%> \r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t<i class=\"fas fa-long-arrow-alt-right\"></i>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t<b\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<% if (me && me.relation(share.address, 'blocking')) { %>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tstyle=\"font-style: italic; color: gray\"\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<% } %>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<%-deep(app, 'platform.sdk.usersl.storage.'+share.address+'.name') || share.address %>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t</b>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t<% } %>: \r\n\t\t\t\t\t\t\t\t\t\t\t\t\t<%=nl2br(trimHtml(trimrn(m), 120))%> \r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class=\"realtime\" time=\"<%-comment.time%>\"><%- app.reltime(comment.time) %></span>\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t</div>\r\n                                                </div>\r\n\r\n                                            <% } %>\r\n                                    \r\n\r\n                                        </div>\r\n                            \r\n                                                        \r\n                            \r\n\r\n                                            \r\n                                                \r\n                            \r\n                                    </div>\r\n                            \r\n                                </div>\r\n                                \r\n                            <% }) %>\r\n                        </div>\r\n\r\n                    </div>\r\n                    \r\n                <% }) %>\r\n\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>";})


        /*
        Disables the function that mangles your images by downscaling them and converting
        them to jpg. Images will now retain their original dimensions and format (supports
        PNG)
        */
        waitUntil(() => resize)
            .then(() => {
                var oldResize = resize;
                resize = function(e, t, n, a, i) {
                    a(e);
                };
            });

        /*
        Removes the left sidebar of the main feed to increase real estate of the feeds.
        Not as useful now after the latest UI redesign because some of the feed controls
        were moved from the center to the left panel, so this script will render those
        inaccessible. Just remove the below code if you don't like it
        */

        //var sheet = document.querySelector('link[href*=master]').sheet
        var sheet;

        waitUntil(() => sheet = document.querySelector('link[href*=master]').sheet)
            .then(() => {
            sheet.insertRule("#main:not(.videomain) .leftpanelcell {display: none}",0);
            sheet.insertRule("#main:not(.videomain) .lentacell { margin-left: 0 }",0);
        });
    })();
})();