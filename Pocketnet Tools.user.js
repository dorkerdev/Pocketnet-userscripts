// ==UserScript==
// @name         Pocketnet Tools
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
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

	function displayVotesByPost(txid, el) {
		getVotesByPost(txid, function(data) {
			data.sort((a,b) => parseFloat(a.value) > parseFloat(b.value) ? -1 : 1);
			for(const vote of data) {
				appendVote(el, vote);
			}
		});
	}

	function appendVote(el, vote) {
		var elVote = document.createElement("div");
		elVote.innerHTML = `<a target="_blank" href="https://pocketnet.app/${vote.address}">${vote.name}</a>: ${vote.value}`;
		el.appendChild(elVote);
        //el.parentNode.insertBefore(elVote, el.nextSibling);
	}

	function postData(data, responseReturned){
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (this.status == 200) {
					var response = JSON.parse(this.responseText);
					responseReturned(response.data);
					return;
				} else {
					alert(`Error: ${this.readyState}`);
				}
			}
		};

		xhr.open("POST", `https://pocketnet.app:8899/rpc/${data.method}`, true);
		xhr.setRequestHeader("Content-type", "application/json");

		xhr.send(JSON.stringify(data));
	}

    waitForElement("div.lentaWrapper", document.body, function(el) {
        //console.log("Found " + el.nodeName);
        observe(el, function(m,el,s) {
            if (el.nodeName === "#text") return;
            if (!el.parentNode.matches("div.shares")) return;
            var post = el.classList?.contains("authorgroup")
            ? el.children[0] : el;
            //console.log(post.id);
            waitForElement(".wholikes", el, function(stars) {
                if (!stars) return;
                var link = document.createElement("input");
                link.type = "button";
                link.value = "Show votes";
                stars.parentNode.insertBefore(link, stars);
                link.onclick = function(e){
                    e.target.disabled = true;
                    displayVotesByPost(post.id, stars);
                };
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