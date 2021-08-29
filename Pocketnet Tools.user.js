// ==UserScript==
// @name         Pocketnet Tools
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://pocketnet.app/*
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

    const targetNode = document.body;
    const config = { attributes: false, childList: true, subtree: true };

    const callback = function(mutationsList, observer) {
        //let postClasses = ["share", "shareinlenta"];
        //let postClasses = ["authorgroup", "shareinlenta"];
        // Use traditional 'for loops' for IE 11
        for(const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(element => {
                    if (element.nodeName != "#text"){
                        //if (element.classList.contains("authorgroup")) {
                        //if (postClasses.some(x => element.classList.contains(x))) {
                        if (element.parentNode?.classList?.contains("shares")) {
                            var post = element.classList?.contains("authorgroup")
                            ? element.children[0]
                            : element;
                            //console.log(post.id);
                            var stars = element.querySelectorAll(".wholikes")[0];
                            if (!stars) return;
                            var link = document.createElement("input");
                            link.type = "button";
                            link.value = "Show votes";
                            link.href = "javascript:void(0)";
                            stars.parentNode.insertBefore(link, stars);
                            //stars.parentNode.insertBefore(link, stars.nextSibling);
                            //newDiv.addEventListener("onclick", function(e){
                            link.onclick = function(e){
                                e.target.disabled = true;
                                displayVotesByPost(post.id, stars);
                            };
                        }
                    }
                });
            }
            //else if (mutation.type === 'attributes') {
                //console.log('The ' + mutation.attributeName + ' attribute was modified.');
            //}
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);

    // Later, you can stop observing
    //observer.disconnect();
})();