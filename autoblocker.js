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

TODO: Add some notification to let the user know whether or not the blocks were
successful. Dev console is currently the only indicator.
*/

//javascript:(()=>{
app.api.rpc("getuserprofile", [[app.platform.sdk.address.pnet().address],"0"]).then(d => {
    const forEachAsPromise = async (items, action) => {
		for (const item of items) {
		await action(item)
	  }
	};
	const addrs = prompt("Enter addresses to block, each on its own line")
        .split("\n")
        .filter(x => x)
        .map(x => x.split(":")[0].trim())
        .filter(x => !d[0].blocking.includes(x));
    forEachAsPromise(addrs, addr => {
        app.platform.api.actions.blocking(addr.trim(), function(e,t) {
            console.log(e || t);
		});
    });
});
//})()