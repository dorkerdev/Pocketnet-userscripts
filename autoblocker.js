/*
This helper can be used to block multiple accounts. An input pop-up dialog will
prompt you for a list of addresses to block, each on its own line like so:

P8gt991Yycn5gfmq2Xd2F42zGjpB3xyLRa
PA8bvzNsT54vk1vNLHvjsFPn6oLCGRMkcj
PADejggBaZSH4nEWkKrB5LbaDnHWcRKuCg: spartan041
PAbCyuP8bVMLzExAkaRo1iPHgNMSMqvNei: spartan017
PAd2NRU2Qa6P9BX8t3wJqseDco3r6ZMFed: annoying account
PAiG9g6eGd8dDj4WJUZcT4KJtWDnNZRStn: SPARTAN117

You can also add notes after each address using a colon as shown above.

To execute, open your browser's dev console, paste the below code, and press ENTER.

Pro tip: Store all your addresses in a text file so you can copy and paste them 
into the input dialog. They will all show on a single line, but the newline code 
is still there.

Pro tip: Copy the JS and paste into a bookmarklet's URL field so you can execute 
the code by simply clicking the bookmark without having to open the dev console. 
Bookmarklet must be defined like so:

javascript:(()=>{ ..your JS code.. })()

Remove the // from the code below and then paste all into bookmarklet.

NOTE: I believe there is a blocking cool-down limit if your account is < 100 rep. If
so, you will only be able to block maybe 25 at a time and then have to wait before
being able to block again. You will get the error code "money"... whatever that means.
*/

//javascript:(()=>{
//debugger;
let me = app.platform.sdk.user.me();

/*get the logged-in user profile so you have access to its address and blocks*/
app.api.rpc("getuserprofile", [[me.address],"0"]).then(async d => {
	const forEachAsPromise = async (items, action) => {
        for (const item of items) {
			let code;
            await action(item, x => code = x);
            if (code) {
                if (code === "money" || code === 28) return code;
            }
		}
	};
    var addrs = prompt("Enter addresses to block, each on its own line");
    /*
    var addrs = `ahgdhjgshdjssdghdjdsjgh
    fgflkfkjhfhkjfhjkfhkjk`;
    */
    let alreadyBlocked = 0;

    sitemessage("Auto-blocker initiating...");
    
    /*
    sanitize the list by removing blank lines and addresses that have 
    already been blocked
    */
    addrs = addrs
		.split("\r\n")
		.filter(x => x)
		.map(x => x.split(":")[0].trim());
    
    let addrCount = addrs.length;
    
    addrs = addrs.filter(x => {
        if (d[0].blocking.includes(x)) {
            alreadyBlocked++;
            return false;
        }
        return true;
    });
    
    let blocks = 0;

    let code = await forEachAsPromise(addrs, async (addr, clbk) => {
        await new Promise((res,rej) => {
            app.platform.api.actions.blocking(addr, function(e,t) {
				/*app.platform.ws.messages*/
                clbk(t);
                if (!t && me.relation(addr, "blocking")) {
                    blocks++;
                    if (blocks % 10 === 0) sitemessage(`Blocked ${blocks} of ${addrCount}...`);
                }
                res(t);
            });
        });
    });

    let msgs = [];

    if (code) {
        msgs.push(`Blocking failed. Error code: ${code}.`);
    } 
    
    msgs.push(`Blocked ${blocks} out of ${addrs.length} addresses`);
    if (alreadyBlocked > 0) msgs.push(`Already blocked ${alreadyBlocked} out of ${addrCount} addresses`);

    sitemessage(msgs.join("</br>"));
});
//})()