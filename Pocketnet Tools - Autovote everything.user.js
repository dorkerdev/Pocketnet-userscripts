// ==UserScript==
// @name         Pocketnet Tools - Autovote everything
// @namespace    http://tampermonkey.net/
// @version      0.0001
// @description  Upvotes everything in the feed you're on
// @author       dorker
// @match        https://pocketnet.app/*
// @match        https://bastyon.com/*
// @icon         https://www.google.com/s2/favicons?domain=mozilla.org
// @grant        none
// ==/UserScript==

/*
Remember, only two upvotes per user per 48 hours affects rep. Anything
above that is a wasted vote, so only use if you've already upvoted almost
everything on a user's feed
*/

(function() {
    'use strict';

    var isIndex;

    function SetIsIndex(){
        isIndex = window.location.pathname === "/index";
    }

    SetIsIndex();

    //Uncomment this line if you only want to autovote on the main feed
    //if (!isIndex) return;

    var excludedAddresses;

    /*
    If you don't want to upvote certain users, just add their address to the
    above array like so:

    excludedAddresses = [
        "ADDRESS1",
        "ADDRESS2",
        "aDDRESS3"
    ];

    You can add as many as you like.

    Note: Will upvote every post in the main feed and any user feed you're unless
    the user is in excludedAddresses
    //*/

    var exclusiveAddresses;

    /*
    If you only want to upvote specific accounts, add the addresses to
    exclusiveAddresses in the same way. Overrides/ignores excludedAddresses
    even if you've added addresses to it.
    */

    /*
    exclusiveAddresses = [
        "ADDRESS1",
        "ADDRESS2",
        "aDDRESS3"
    ];
    //*/

    /*
    IMPORTANT READ: If you don't add addresses to excludedAddresses OR
    exclusiveAddresses, you will end up auto-voting EVERYTHING in the feed. If
    that is what you want and you don't care about blowing through all your
    votes, go for it.
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

    window.addEventListener('locationchange', function(){
        voteCount = 0;
        SetIsIndex();
    });
    //END SHITE

    observe("div.contentWrapper", function(m,el,s) {
        if (el.nodeName === "#text") return;
        if (!el.parentNode?.matches("div.shares")) return;
        //var post = el.classList?.contains("authorgroup")
        //? el.children[0] : el;

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
                if (el.classList.contains("liked") || (isIndex === false && voteCount >= 2)) return;

                var selector;
                var voteValue = 5;

                //selector = `i.far.fa-star[value='${voteValue}']`
                selector = `.starsWrapper.starsWrapperM > div > i.far.fa-star[value='${voteValue}']`;

                var elStar = stars.querySelector(selector);

                /*
                note: If you want to make this script auto-downvote everything, change the
                CSS selector to "i.far.fa-star[value='1']". Haven't, tested that, but it
                should work. Use at your own risk.
                */

                //todo: Create separate address lists for upvoting and downvoting

                //debugger;
                elStar.click();

                /*
                window.setTimeout(() => {
                    //console.log("in timeout");
                    elStar.click();
                }, 2000);
                */

                voteCount++;
            });
        });
    });

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
