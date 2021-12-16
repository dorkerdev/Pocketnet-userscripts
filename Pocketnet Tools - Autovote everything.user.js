// ==UserScript==
// @name         Pocketnet Tools - Autovote everything
// @namespace    http://tampermonkey.net/
// @version      current
// @description  Upvotes everything in the feed you're on
// @author       dorker
// @match        https://pocketnet.app/*
// @match        https://bastyon.com/*
// @icon         https://www.google.com/s2/favicons?domain=mozilla.org
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /*
    HOW TO USE: Read the comments below preceded by INSTRUCTION (ctrl+f will take
    you to all of them). If you install this script and let it run as-is, you will
    end up auto-voting on EVERYTHING in the feeds (except for user feeds which are
    capped at 2 per page load). Read INSTRUCTIONs below on how to add addresses to
    excludedAddresses and exclusiveAddresses.
    */

    /*
    isIndex is used to detect whether you're on bastyon.com/index (usually main feed).
    Otherwise, user feed is assumed.
    */
    var isIndex;

    function SetIsIndex(){
        isIndex = window.location.pathname === "/index";
    }

    SetIsIndex();

    //Uncomment this line if you only want to autovote on the main feed
    //if (!isIndex) return;

    var excludedAddresses;

    /*
    INSTRUCTION:

    If you don't want to upvote certain users, just add their address to the
    above array like so:

    excludedAddresses = [
        "PAsNipPlefRNkdHQF9Jp0opxp3n1sqfwBJ",
        "cMd3eNdcGcNdFMdUjIZzd4CZDL76bgvVaf",
        "PSSL82knV6zKaNus47TBXa84f2cYTPA2eT"
    ];

    You can add as many as you like.

    Note: Will upvote every post in the main feed and any user feed you're unless
    the user is in excludedAddresses
    //*/

    var exclusiveAddresses;

    /*
    INSTRUCTION:

    If you only want to upvote specific accounts, add the addresses to
    exclusiveAddresses in the same way. Overrides/ignores excludedAddresses
    even if you've added addresses to it. Just copy the code below and paste
    it under "var exclusiveAddresses" above.
    */

    /*
    exclusiveAddresses = [
        "PAsN39RgaSsNkdHQF9JB0Obw5zBaWqfwBJ",
        "PhaRTcGcMd3eNdFU3dYUd4CZDL76bgvVaf",
        "PTeF87SBVshIte2c53qPisSTeeQnipGWw9"
    ];
    //*/

    /*
    IMPORTANT READ: If you don't add addresses to excludedAddresses OR
    exclusiveAddresses, you will end up auto-voting EVERYTHING in the feed. If
    that is what you want and you don't care about blowing through all your
    votes in five minutes, go for it.
    */

    /*
    TODO: Allow these lists to be maintainable through some UI so that you
    don't have to edit code. Will this ever happen? Probably not because my
    JavaScript engineering skills are pretty shite.
    */

    //debugger;

    //SHITE
    /*
    some shite i copy/pasta'd to detect when the url changes since the
    web site is an spa. seems to work
    */
    history.pushState = ( f => function pushState(){
        var ret = f.apply(this, arguments);
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    })(history.pushState);

    history.replaceState = ( f => function replaceState(){
        var ret = f.apply(this, arguments);
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    })(history.replaceState);

    window.addEventListener('popstate',()=>{
        window.dispatchEvent(new Event('locationchange'))
    });

    var voteCount = 0;

    /*
    INSTRUCTION:

    Only 2 votes per account per 48 hours affects rep. Anything in excess of that
    is a wasted vote. To help prevent wasting your votes while on a user feed,
    maxUserFeedVotes is set to 2 so that you only upvote the top 2 posts. If you
    want to upvote everything currently loaded on the user feed, just set this to
    some yuge number like 9999 or something.
    */
    var maxUserFeedVotes = 2;

    window.addEventListener('locationchange', function(){
        voteCount = 0;
        SetIsIndex();
    });
    //END SHITE

    var starSelector;
    var voteValue = 5;

    //starSelector = `i.far.fa-star[value='${voteValue}']`
    starSelector = `.starsWrapper.starsWrapperM > div > i.far.fa-star[value='${voteValue}']`;

    /*
    INSTRUCTION:

    note: If you want to make this script auto-downvote everything, change above
    "voteValue = 5" to "voteValue = 1". Haven't tested that, but it should work.
    Use at your own risk.
    */

    //todo: Create separate address lists for upvoting and downvoting

    observe("div.contentWrapper", function(m,el,s) {
        if (el.nodeName === "#text") return;
        if (!el.parentNode?.matches("div.shares")) return;

        //debugger;

        waitForElement("div.shareTable.truerepost", el, elHeader => {
            var address = elHeader.getAttribute("address");
            var txid = elHeader.getAttribute("stxid");

            if (exclusiveAddresses && exclusiveAddresses.length > 0){
                if (!exclusiveAddresses.includes(address)) return;
            }else if (excludedAddresses && excludedAddresses.includes(address)) {
                return;
            }

            //debugger;

            waitForElement("div.starswr", elHeader, function(stars) {
                //don't upvote post if you've already upvoted it
                //debugger;
                if (el.classList.contains("liked") || (isIndex === false && voteCount >= maxUserFeedVotes)) return;

                var elStar = stars.querySelector(starSelector);

                //debugger;

                //click the star that matches the selector
                elStar.click();

                /*
                window.setTimeout(() => {
                    //console.log("in timeout");
                    elStar.click();
                }, 2000);
                //*/

                voteCount++;
            });
        });
    });

    //don't edit any of the code below

    function waitForElement(sel, targetNode, elementFound) {
        var els = targetNode.querySelectorAll(sel);
        if (els) {
            els.forEach(el=> {
               elementFound(el);
            });
            return;
        }
        //console.log(sel + " NOT found");
        observe(targetNode, function(m,el,s){
            if (el.nodeName === "#text") return;
            //console.log(el.nodeName);
            var e;
            if (el.matches(sel) || (e = el.querySelector(sel))){
                //s.abort = true;
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