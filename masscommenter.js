/* 
Execute this code in your browser dev console to spam comments on every post in whatever feed you're on (main, user, etc).

1) Enter the comment you want to spam
2) Enter the number of posts to spam. Remember to scroll several times to load 
multiple pages if you want to vote on more than just a page's worth
3) Process will end once you reach your daily limit, cool-down period, or you 
spam all available posts in the feed
*/
debugger;
let lastMessage;
async function showMessage(m) {
    console.log(m);
    if (lastMessage) {
        let wait = new Date() - lastMessage.t;
        console.log("time passed:" + wait);
        wait = 5000 - wait;
        console.log("wait:" + wait);
        await new Promise(resolve => setTimeout(resolve, wait));
        lastMessage.fn();
    }
    lastMessage = {fn: sitemessage(m), t: new Date()};
}

let spamValue = (prompt("Enter comment to spam") || "");
let shares = [];
let alreadySpammed = [];
let alreadySpammedUser = [];
let maxSpamCount;
let urlPath = window.location.pathname.split('/');
urlPath = urlPath[urlPath.length - 1];

try {
    function smish() {
        throw "Smishmortioned";
    }

    if (!spamValue) {
        smish();
    }    

    $("div.share.share_common.shareinlenta.rendered").each(function(x) {
        let post = this.querySelector("div.shareTable");
        let share = {
            txid: post.attributes['stxid'].value, 
            addr: post.attributes['address'].value,
            name: $(post).find("span.adr").text(),
            spammed: !!this.querySelector("div.comment.mycomment.commentnotedited.firstcomment")
        }
    
        if (share.spammed) alreadySpammed++;
        
        shares.push(share);
    });
    
    maxSpamCount = (prompt(`${shares.length} posts found.\r\nHow many times to spam (blank = unlimited, 0 = cancel)?`))?.trim() ?? null;
    
    if (maxSpamCount === null) smish();
    
    if (maxSpamCount) {
        maxSpamCount = parseFloat(maxSpamCount);
        if (!maxSpamCount || maxSpamCount === 0) {
            smish();
        }
    }
} catch (ex) {
    showMessage(ex);
    throw ex;
}

sitemessage(`${shares.length} posts found. Please wait...`);

/*
32 = blocked by user
*/
let goodErrors = [4,32];
let blockers = [];
let messages = [];

async function setMessage(msg, dump) {
    console.log(msg);
    messages.push(msg);
    if (dump) {
        await dumpMessages();
    }
}

async function dumpMessages() {
    if (messages.length === 0) return;
    await showMessage(messages.join("</br>"));
    messages = [];
}

function GetProgress() {
    let prog = (maxSpamCount ? spamCount / maxSpamCount : spamAttempts / shares.length) * 100;
    return prog;
}

async function updateSpamCount() {
    await setMessage(`Progress ${GetProgress().toFixed(2)}%</br>${spamCount} comments made`);
    if (alreadySpammed > 0) await setMessage(`Already spammed ${alreadySpammed} posts`);
}

let spamAttempts = 0;
let spamCount = 0;

async function forEachAsPromise(items, action) {
    for (const item of items) {
        let state = {};
        await action(item, state);
        if (state.abort) break;
    }
}

let me = app.platform.sdk.user.me();

new Promise(async (resMain, rejMain) => { 
    await forEachAsPromise(shares, async function(share, state) {
        function smishmortion() {
            state.abort = true;
        }
        spamAttempts++;
        if (share.spammed) return;
        if (urlPath !== me.name && urlPath !== me.address && alreadySpammedUser.includes(share.addr)) return;
        if (blockers.includes(share.addr)) return;
        
        let spamObject = new Comment();
        
        spamObject.txid = share.txid;
		spamObject.message.set(spamValue);
		spamObject.ustate = "comment";
		spamObject.type = "comment";
        
        await new Promise(async resComment => app.platform.sdk.comments.send(share.txid, spamObject, null, null, async function (t,e) {
            let goodState = !t || goodErrors.includes(t);

            if (goodState) {
                if (!t) {
                    spamCount++;
                    alreadySpammedUser.push(share.addr);
                    if (spamCount === maxSpamCount) {
                        smishmortion();
                    }
                }
                else if (t === 4) {
                    alreadySpammed++;
                }
                else if (t === 32) {
                    blockers.push(share.addr);
                    await setMessage(`Blocked by ${share.name} (${share.addr})`);
                }
            } else { 
                let errmsg = app.platform.errors[t];
                errmsg = errmsg && errmsg.message ? errmsg.message() : t;
                await setMessage(`Error: ${errmsg}`);
                smishmortion();
            }
            
            if (
                (spamAttempts > 0 && spamAttempts % 10 === 0) || 
                spamAttempts === shares.length || 
                !goodState
            ) {
                updateSpamCount();
                await dumpMessages();
            }

            resComment();
        }));
    });
    resMain();
}).then(async () => {
    await showMessage("Comment spammer completed");
    if (blockers.length > 0) {
        console.log(`Blockers\r\n${blockers.join("\r\n")}`);
    }
});