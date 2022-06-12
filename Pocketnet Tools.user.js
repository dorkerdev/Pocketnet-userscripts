// ==UserScript==
// @name         Pocketnet Tools
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  Adds various UI enhancements to the post/content template (see top comment for details)
// @author       dorker
// @match        https://bastyon.com/*
// @icon         https://www.google.com/s2/favicons?domain=mozilla.org
// @grant        none
// ==/UserScript==

/*
- Add show votes button. Makes it easier screencap votes
- Add permalink to upper-right of post. Less clicks to open in new window and copy post URL
- Add a link to all comment in the sidebar to make it possible to open in new tab
- Alerts user if blocked by another user when entering the comment box. Prevents typing out a whole comment only to find out
you're blocked when you go to send
- Disable Bastyon's proprietary image downscaling, brutal encoding, and conversion. Supports PNG! This might break when they
switch to their media server which does not appear to support PNG, but it will still retain the quality of your JPGs
*/

(function() {
    'use strict';

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

        /*
        getVotesByPost(txid, function(data) {
            sortMultiple(data, [
                (a,b) => compareNumbers(parseFloat(a.value), parseFloat(b.value)),
                (a,b) => a.name.localeCompare(b.name)
            ]);
			for(const vote of data) {
				appendVote(el, vote);
			}
		});
        //*/
	}

	function appendVote(el, vote) {
		var elVote = document.createElement("div");
		elVote.innerHTML = `<a target="_blank" href="${vote.address}">${decodeURIComponent(vote.name)} (${(vote.reputation/10).toLocaleString()})</a>: ${vote.value}`;
		el.appendChild(elVote);
        //el.parentNode.insertBefore(elVote, el.nextSibling);
	}

    window.nModuleBase = function() {
        var x = new nModuleBase.base();

        var loadTemplate = x.loadTemplate;
        var renderTemplate = x.renderTemplate;
        var insertTemplate = x.insertTemplate;

        x.loadTemplate = function(a, t) {
            return loadTemplate(a, t);
        }

        x.renderTemplate = function(a, t, n) {
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
                    e.el.find("div.lastcommentslist > div.commentgroup").each((i,el) => {
                        var shareId = el.attributes["share"].value;
                        var commentId = $(el).find("div.comment").prop("id");
                        $(el).find("div.commentmessage").prepend(`<a target="_blank" href="post?s=${shareId}&commentid=${commentId}">[link] </a>`);
                    });
                    break;
                case "share":
                    /*
                    Outer post template. Adds permalink anchor alement to upper-right corner
                    so that you can open in new tab or copy URL more easily
                    */
                    var metaHead = e.el.find("div.metapanel");

                    metaHead.attr("style", "width: 1px!important");
                    metaHead.attr("style", "textAlign: right");
                    metaHead.prepend(`<a href="post?s=${e.data.share.txid}" style="paddingRight = 10px" target="_blank">permalink<a>`);

                    var panel = e.el.find("div.panel.sharepanel");
                    var container = $("<div style=\"text-align:right\"></div>");
                    var link = $("<input type=\"button\" value=\"Show votes\" />")

                    container.append(link);
                    container.insertAfter(panel);

                    link.click(() => {
                        //e.target.disabled = true;
                        displayVotesByPost(e.data.share.txid, container[0]);
                    });

                    break;
                case "post":
                    /*
                    Post body and comment box. Alerts you if you've been banned by
                    a user as soon as you click in the comment box on their post
                    */
                    var div = e.el.find("textarea.leaveCommentPreview");
                    div.click(el =>{
                        displayBlockMessage(e.data.receiver);
                    });
                    break;
            }

            return ret;
        }

        return x;
    }

    Object.defineProperty(window, "nModule", {
        get() {
            return nModuleBase;
        },
        set(x) {
            nModuleBase.base = x;
        }
    })

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