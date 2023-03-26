/* 
Execute this code in your browser dev console to auto-upvote every
post in whatever feed you're on (main, user, etc). It will display
progress as it's processing. When an error is encounterd, you will
be prompted to continue. If you enter 'y', it will wait 10 seconds
and retry. Otherwise, you probably hit a cooldown limit, so just
enter a blank or 'n' to abort.

Next release: Allow user to provide number of votes to cast to
avoid blowing through your daily allotment. Great for just upvoting
2 posts per user feed since anything above that doesn't affect rep
for 48 hours (assuming the rules have't changed).
*/
/*debugger;*/

var abort = false;
let voteValue = !abort && (prompt("Enter vote value") || "");
let voteInt = Math.floor(parseFloat(voteValue));

if (!voteValue || voteInt < 1 || voteInt > 5) {
    sitemessage("Smismortioned");
    throw "Smismortioned";
}

sitemessage("Auto-voter initiated...");

const forEachAsPromise = async (items, action) => {
	for (const item of items) {
		let code;
        let state = {};
		await action(item, state, x => code = x);
        if (state.abort) break;
	}
};

let shares = [];
let alreadyVoted = [];

$("div.shareTable").each(function(x) { 
    /*
    let isLiked = $(this).find("div.likeAction").hasClass("liked");
    if (isLiked) {
        alreadyVoted++;
        return;
    }
    */
    let share = {
        txid: this.attributes['stxid'].value, 
        addr: this.attributes['address'].value,
        name: $(this).find("span.adr").text(),
        voted: $(this).find("div.likeAction").hasClass("liked")
    }

    if (share.voted) alreadyVoted++;
    
    shares.push(share);
});

/*
4 = already voted
32 = blocked by user
*/
let goodErrors = [4,32];
let blockers = [];
let messages = [];

function setMessage(msg, dump) {
	console.log(msg);
	messages.push(msg);
    if (dump) {
        dumpMessages();
    }
}

function dumpMessages() {
    if (messages.length === 0) return;
    sitemessage(messages.join("</br>"));
    messages = [];
}

function updateVoteCount() {
    setMessage(`Progress ${(voteAttempts/shares.length * 100).toFixed(2)}%</br>${voteCount} ${voteValue}-star votes cast`);
    if (alreadyVoted > 0) setMessage(`Already voted on ${alreadyVoted} posts`);
}

let voteAttempts = 0;
let voteCount = 0;

new Promise(async (resMain, rejMain) => { 
	await forEachAsPromise(shares, async function(share, state) {
        voteAttempts++;
        if (share.voted) return;
        if (blockers.includes(share.addr)) return;
		let ushare = new UpvoteShare();
		
		ushare.share.set(share.txid);
		ushare.address.set(share.addr);
		ushare.value.set(voteValue);
		
		var p = await new Promise(async (res, rej) => {
			let handle;
			let code;
			let action = () => {
                function smishmortion() {
                    window.clearInterval(handle);
                }
				if (abort && handle) {
					smishmortion();
					return;
				}
				app.platform.sdk.node.transactions.create.commonFromUnspent(ushare, function (e,t) {
					let goodState = !t || goodErrors.includes(t);
					/*code = t;*/
					/*console.log(t ? `Error: ${t}` : e);*/
					if (goodState) {
						if (handle) window.clearInterval(handle);
						if (!t) {
							voteCount++;
						}
						else if (t === 4) {
							alreadyVoted++;
						}
						else if (t === 32) {
							blockers.push(ushare.address.v);
							setMessage(`Blocked by ${ushare.address.v} (${share.name})`);
						}
						res();
					} else { 
                        let errmsg = app.platform.errors[t];
                        errmsg = errmsg && errmsg.message ? errmsg.message() : t;
						setMessage(`Error: ${errmsg}`);
						let retry = (prompt(`Error: ${errmsg}. Try again? [Y/n]`) || '').trim().toLowerCase();
						if (retry !== "y") {
                            state.abort = true;
                            smishmortion();
							res();
							resMain();
						}
						//app.platform.errorHandler(t, !0);
					}
					
					if (
						(voteAttempts > 0 && voteAttempts % 10 === 0) || 
						voteAttempts === shares.length || 
						!goodState
					) {
                        updateVoteCount();
						/*setMessage(`${voteAttempts} of ${shares.length} votes processed`);
                        setMessage(`Already voted on ${voteCount} posts`);*/
						dumpMessages();
					}
				});
			};
			await action();
			/*await new Promise(resolve => setTimeout(resolve, 1000));*/
			handle = setInterval(action, 10000);
			
			if (abort) {
				about = false;
				return;
			}
		});
	});
	resMain();
}).then(() => {
    updateVoteCount();
    /*if (alreadyVoted > 0) setMessage(`Already voted on ${alreadyVoted} of ${shares.length} posts`);
    setMessage(`Completed. ${voteCount} of ${shares.length} total ${voteValue}-star votes cast`);*/
    dumpMessages();
    if (blockers.length > 0) {
        console.log(`Blockers\r\n${blockers.join("\r\n")}`);
    }
});