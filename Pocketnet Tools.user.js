// ==UserScript==
// @name         Pocketnet Tools
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Adds a "Show Votes" button
// @author       dorker
// @match        https://pocketnet.app/*
// @match        https://bastyon.com/*
// @icon         https://www.google.com/s2/favicons?domain=mozilla.org
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function getVotesByPost(txid, dataReceived) {
		postData({
			"parameters": [
				txid
			],
			"method": "getpostscores",
			"state": 1
		}, dataReceived);
	}

    function sortMultiple(arr, conditions){
        arr.sort((a,b) => {
            var i;
            for(const c of conditions){
                i = c(a,b);
                if (i !== 0) return i;
            }
        });
    }

	function displayVotesByPost(txid, el) {
        getVotesByPost(txid, function(data) {
            sortMultiple(data, [
                (a,b) => {
                    var aa = parseFloat(a.value);
                    var bb = parseFloat(b.value);
                	var eq = aa > bb ? -1 :
                	aa < bb ? 1 :
                	0;
                	return eq;
                },
                (a,b) => a.name.localeCompare(b.name)
            ]);
			//data.sort((a,b) => parseFloat(a.value) > parseFloat(b.value) ? -1 : 1);
			for(const vote of data) {
				appendVote(el, vote);
			}
		});
	}

	function appendVote(el, vote) {
		var elVote = document.createElement("div");
		elVote.innerHTML = `<a target="_blank" href="${vote.address}">${decodeURIComponent(vote.name)}</a>: ${vote.value}`;
		el.appendChild(elVote);
        //el.parentNode.insertBefore(elVote, el.nextSibling);
	}

	function postData(data, responseReturned){
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (this.readyState == 4) {
                switch(this.status){
                    case 200:
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

    //waitForElement("div.leftpanelcell", document.body, el => { el.style.display = "none"; });
    //waitForElement("#main .lentacell", document.body, el => { el.style.marginLeft = "0px"; });
    //waitForElement("#staking", document.body, el => { el.style.display = "none"; });
    //waitForElement("#maincntwrapper > div > div.mainpanelcell",
                   //document.body, el => { el.style.display = ""; });

    //waitForElement("div.lentaWrapper", document.body, function(el) {
        //console.log("Found " + el.nodeName);
        //observe(el, function(m,el,s) {
        //observe(document.body, function(m,el,s) {

    //Looks like I'll have to observe the entire contentWrapper
    //in order to avoid breaking the script after swapping feeds. At
    //least now you don't have to refresh the page.
        observe("div.contentWrapper", function(m,el,s) {
            if (el.nodeName === "#text") return;
            if (!el.parentNode?.matches("div.shares")) return;
            var post = el.classList?.contains("authorgroup")
            ? el.children[0] : el;
            //console.log(post.id);
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

                var container = document.createElement("div");
                container.style.textAlign = "right";
                var link = document.createElement("input");
                link.type = "button";
                link.value = "Show votes";

                container.appendChild(link);
                stars.parentNode.insertBefore(container, null);
                //stars.appendChild(link);
                //stars.style.textAlign = "right";
                link.onclick = function(e){
                    e.target.disabled = true;
                    displayVotesByPost(post.id, container);
                };
            });
        });
    //});

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


    // Later, you can stop observing
    //observer.disconnect();
})();