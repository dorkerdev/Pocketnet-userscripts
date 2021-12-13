// ==UserScript==
// @name         Pocketnet Tools - Upvote everything
// @namespace    http://tampermonkey.net/
// @version      0.0001
// @description  Upvotes everything in the feed you're on
// @author       dorker
// @match        https://pocketnet.app/index
// @match        https://bastyon.com/index
// @icon         https://www.google.com/s2/favicons?domain=mozilla.org
// @grant        none
// ==/UserScript==
// If you also want to auto-upvote everything visible on a user's feed,
// replace the two lines above with this:
//
// @match        https://pocketnet.app/*
// @match        https://bastyon.com/*
//
// Remember, only two upvotes per user per 24 hours affects rep.
// Anything above that is a wasted vote, so only use if you've already
// upvoted almost everything on a user's feed

(function() {
    'use strict';

    var excludedAddresses = [];
    //If you don't want to upvote certain users, just add their address
    //to the above array like so:
    //
    //var excludedAddresses = ["AJHGD84LDKJD","DLK3903IJDKJHGF"];
    //
    //Note: Will upvote every post in the main feed and any user feed you're
    //unless the user is in excludedAddresses

    //If you only want to upvote specific accounts, add the addresses to
    //exclusiveAddresses in the same way. Overrides/ignores excludedAddresses

    observe("div.contentWrapper", function(m,el,s) {
        if (el.nodeName === "#text") return;
        if (!el.parentNode?.matches("div.shares")) return;
        var post = el.classList?.contains("authorgroup")
        ? el.children[0] : el;

        //debugger;

        var elHeader = el.querySelector(".shareTable.post.truerepost");
        var address = elHeader.getAttribute("address");
        var txid = elHeader.getAttribute("stxid");

        if (exclusiveAddresses && exclusiveAddresses.length > 0){
            if (!exclusiveAddresses.includes(address)) return;
        }else if (excludedAddresses && excludedAddresses.includes(address)) {
            return;
        }

        //debugger;

        //todo: detect whether or not you're on user page. If user, only
        //upvote two posts and then stop

        waitForElement("div.starswr", el, function(stars) {
            //don't upvote post if you've already upvoted it
            if (el.classList.contains("liked")) return;

            var elStar = stars.querySelector("i.far.fa-star[value='5']");
            //note: If you want to make this script auto-downvote everything,
            //change the CSS selector to "i.far.fa-star[value='1']". Haven't,
            //tested that, but it should work. Use at your own risk.

            //debugger;
            elStar.click();
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