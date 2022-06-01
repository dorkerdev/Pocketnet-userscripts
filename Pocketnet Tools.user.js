// ==UserScript==
// @name         Pocketnet Tools
// @namespace    http://tampermonkey.net/
// @version      0.55
// @description  Adds various UI tools to the post/content template: Show votes, permalink
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

	function displayBlockMessage(blockerAddress, el) {
		postData({
		  "parameters": [
			[
			  blockerAddress
			],
			"0"
		  ],
		  "method": "getuserprofile",
		  "options": {
			"node": null
		  },
		  "state": 1
		}, function(data){
			//var lajson = localStorage.pool;
			//var la = JSON.parse(lajson);
			//var user = Object.keys(la.map)[0];
            var user = app.platform.sdk.address.pnet().address;
            var blockIndex = data[0].blocking.indexOf(user);
            if (blockIndex > -1) {
            	var div = document.createElement("div");
            	div.style.color = "Red";
            	div.innerText = "You have been blocked by this user";
				el.parentNode.insertBefore(div, el.nextSibling);
            }else{
            	/*
                var div = document.createElement("div");
            	div.style.color = "Green";
            	div.innerText = "You have NOT been blocked by this user";
				el.parentNode.insertBefore(div, el.nextSibling);
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
        getVotesByPost(txid, function(data) {
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
        //el.parentNode.insertBefore(elVote, el.nextSibling);
	}

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
    observe("div.contentWrapper", function(m,el,s) {
        if (el.nodeName === "#text") return;
        if (!el.parentNode?.matches("div.shares")) return;

        /*
        Must get entire post element which includes the post and the
        comment textbox.
        */
        var post = el.classList?.contains("authorgroup")? el.children[0] : el;

        /*
        Wait for the elipses menu to add permalink above it
        */
        waitForElement("div.metapanel", post, metaHead => {
            metaHead.style.setProperty("width","auto","important");
            metaHead.style.textAlign = "right";
            var perma = document.createElement("a");
            perma.href = `post?s=${post.id}`;
            perma.style.paddingRight = "10px";
            perma.target = "_blank";
            perma.innerText = "permalink";
            metaHead.prepend(perma);
        });

        /*
        Add button to show votes
        */
        waitForElement("div.panel.sharepanel", post, function(panel) {
            var container = document.createElement("div");
            container.style.textAlign = "right";
            var link = document.createElement("input");
            link.type = "button";
            link.value = "Show votes";

            container.appendChild(link);
            panel.parentNode.appendChild(container);

            link.onclick = function(e){
                //e.target.disabled = true;
                displayVotesByPost(post.id, container);
            };
        });

        /*
        Wait for comment textbox to add onclick even to check if post
        author has user blocked.
        */
        waitForElement("textarea.leaveCommentPreview", post, e =>{
            var info = post.querySelector(".shareTable.post.truerepost");
            var addr = info?.getAttribute("address");
            e.addEventListener("click", x =>{
                //console.log(addr);
                var div = post.querySelector("div.emojionearea.leaveComment");
                displayBlockMessage(addr, div);
            });
        });
    });

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