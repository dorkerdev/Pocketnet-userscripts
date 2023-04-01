/* 
Execute this code in your browser dev console to auto-upvote everypost in 
whatever feed you're on (main, user, etc).

1) Enter 1-5 for the rating you want to give all posts 
2) Enter the number of ratings to drop. If on a user profile, it defaults to 
2. Leave blank to vote on all posts in the feed. Remember to scroll several 
times to load multiple pages if you want to vote on more than just a page's 
worth
3) Process will end once you reach your daily limit, cool-down period, or all 
posts in the feed
*/
/*debugger;*/
let voteValue = prompt("What star rating do you want to drop (1-5)?", 5);
let maxVoteCount;
let shares = [];
let alreadyVoted = [];
let alreadyVotedAddresses = [];

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

try {
    function smish() {
        throw "Smishmortioned";
    }
    
    if (!voteValue || !voteValue.match(/[1-5]/)) {
        smish();
    }
    
    $("div.lentaWrapper div.shareTable").each(function(x) { 
        let share = {
            txid: this.attributes['stxid'].value, 
            addr: this.attributes['address'].value,
            name: $(this).find("div.authorCell span.adr").text(),
            voted: $(this).find("div.likeAction").hasClass("liked")
        }
    
        if (share.voted) alreadyVoted++;
        
        shares.push(share);
    });

    let path = window.location.pathname.split('/');
    path = path[path.length - 1];
    
    maxVoteCount = (prompt(`${shares.length} posts found.\r\nHow many votes to cast (blank = unlimited, 0 = cancel)?`, path === 'index' ? '' : 2))?.trim() ?? null;

    if (maxVoteCount === null) smish();
    
    if (maxVoteCount) {
        maxVoteCount = parseFloat(maxVoteCount);
        if (!maxVoteCount || maxVoteCount === 0) {
            smish();
        }
    }    
} catch (ex) {
    sitemessage(ex);
    throw ex;
}

showMessage(`${shares.length} posts found. Please wait...`);

/*
4 = already voted
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
    let prog = (maxVoteCount ? voteCount / maxVoteCount : voteAttempts / shares.length) * 100;
    return prog;
}

function updateVoteCount() {
    setMessage(`Progress ${GetProgress().toFixed(2)}%</br>${voteCount} ${voteValue}-star votes cast`);
    if (alreadyVoted > 0) setMessage(`Already voted on ${alreadyVoted} posts`);
}

let voteAttempts = 0;
let voteCount = 0;

async function forEachAsPromise(items, action) {
    for (const item of items) {
        let code;
        let state = {};
        await action(item, state);
        if (state.abort) break;
    }
}

new Promise(async (resMain, rejMain) => {
    await forEachAsPromise(shares, async function(share, state) {
        function smishmortion() {
            state.abort = true;
            //resMain();
        }
        
        voteAttempts++;
        
        if (share.voted) return;
        if (blockers.includes(share.addr)) return;
        if (alreadyVotedAddresses.includes(share.addr)) return;
        
        let ushare = new UpvoteShare();
        
        ushare.share.set(share.txid);
        ushare.address.set(share.addr);
        ushare.value.set(voteValue);

        await new Promise(async resVote => {
            app.platform.sdk.node.transactions.create.commonFromUnspent(ushare, async function (e,t) {
                let goodState = !t || goodErrors.includes(t);
                /*console.log(t ? `Error: ${t}` : e);*/
                if (goodState) {
                    if (!t) {                        
                        voteCount++;
                        alreadyVotedAddresses.push(share.addr);
                        if (voteCount === maxVoteCount) {
                            smishmortion();
                        }
                    }
                    else if (t === 4) {
                        alreadyVoted++;
                    }
                    else if (t === 32) {
                        blockers.push({addr: share.addr, name: share.name});
                        await setMessage(`Blocked by ${share.name} (${share.addr})`);
                    }
                } else { 
                    let errmsg = app.platform.errors[t];
                    errmsg = errmsg && errmsg.message ? errmsg.message() : t;
                    await setMessage(`Error: ${errmsg}`);
                    smishmortion();
                }
                
                if (
                    (voteAttempts > 0 && voteAttempts % 10 === 0) || 
                    //voteAttempts === shares.length || 
                    //GetProgress() == 100 ||
                    !goodState
                ) {
                    updateVoteCount();
                    await dumpMessages();
                }
                resVote();
            });
        });
    }); //end of foreach
    resMain();
}).then(async () => {
    updateVoteCount();
    await setMessage("Mass vote completed");
    await dumpMessages();
    if (blockers.length > 0) {
        console.log(`Blockers\r\n${blockers.map(x=> `${x.addr}: ${x.name}`).join("\r\n")}`);
    }
});