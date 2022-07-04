# Pocketnet-userscripts
If the devs change any of their code, these scripts could break. Just open up an issue if any of them stop working or DM me on Bastyon.

2022-06-13
All userscript files have been consolidated into Pocketnet Tools.user.js (except for autovote everything which is currently broken due to the new Bastyon UI redesign). Major update: All features are now configurable through the user settings menu. Scroll down the setting page and you will surely find it. For now, you will need to refresh the page for any changes to take effect as I have not yet figured out how to make then take effect instantly.

### Description of configurables:

#### Hide Left Panel
Collapse the left panel. Ideally, there would be a collapse button/control on the panel's border, but my CSS skills are substandard, so you have to do it this way for now
#### Show Post Votes 
Adds a "Show Votes" button below all posts. I built this before the team added their own, but I like this one better because it's easier to copy/paste and screenshot
#### Enable Page Titles
Navigating the site will now update the page title so that it shows on the tab, taskbar icon, and your browsing history.

![image](https://user-images.githubusercontent.com/89675012/175362178-eaa44220-7038-420d-8b84-f2283c4c71e4.png)  
<sup>Shows page title in browser tab and taskbar icon</sup>

![pn userscript show page title history](https://user-images.githubusercontent.com/89675012/175362212-d9d8104f-e594-49de-9e23-66e780f8df67.PNG)  
<sup>Shows page title in history</sup>

![pn show title favorites](https://user-images.githubusercontent.com/89675012/175777570-ef99ed10-7d26-4953-9b19-50b3314b2a62.png)  
<sup>Bookmarks use the current page title</sup>

#### Bastyhax
Uncucks things
  - Show content that the UI hides from you based on low ratings, low rep, reports, etc
  - Show content hidden behind subscriber/membership walls
#### Show Block Message 
Shows a message alerting you that you've been blocked by a user as soon as you click into the comment box beneath their post. Prevents you from typing out a long comment only to find out you've been blocked after the fact. Doesn't yet work for comment box replies to other people's comments. **Note**: The devs will soon be implementing their own version of this. Strange that they're doing that only after I added that feature myself, huh?
#### Show Blocked Profile Content
When you block a user, you are unable to view or interact with their content. This feature removes that restriction so that you can still stalk and interact with users you've blocked (until they block you back)
#### Add Comment Sidebar Link
Adds [link] to all comments in the sidebar that you can middle-click/right-click to open in new tab/window
#### Hide Boosted Content
  - Removes all boosted posts from the feed
  - Unpins pkoin comments from tops of comment sections so that they're sorted normally like all other comments. Doesn't work for the default top comment that shows below posts as this is how the posts are pulled from the node

![no boost](https://user-images.githubusercontent.com/89675012/177214035-1a743547-ef84-4f07-99ab-6b146eab553e.png)

#### Show User Block List
Allows you to view other users' block lists just as you can your own
#### Disable Default Image Resizer/Converter
When uploading images, Bastyon's proprietary image resizer scales your image down to 1080x1080 and utterly destroys its quality, making it all crusty with compression artifacts. This feature allows you to disable their resize and upload your image as-is. For now, Bastyon saves to imgur which supports PNG, so this will prevent your PNGs from being converted to JPG. When they switch to their media server, I don't believe PNG is supported, but you should still be able to upload high-quality images
#### Show additional user stats
Enable to display additional user stats in the header of all posts and  in the user profile sidebar

![pn user stats feed](https://user-images.githubusercontent.com/89675012/177215012-fc8a8199-b5e9-45cf-b822-46b3c273f071.PNG)  
<sup>User stats in post header</sup>

![pn user stats profile](https://user-images.githubusercontent.com/89675012/177215013-fd8bcf1a-8f7e-4789-9c0e-8da976b1c03e.PNG)  
<sup>User stats in profile sidebar</sup>

#### Show Walled Content
Enabling this will allow you to view content that is locked behind a login or membership wall. In theory, you will also be able to rate/comment on the content, though I haven't tested that
#### Thresholds 
Used to hide accounts that have excessive post/vote metrics. Useful for coping with bot attacks (currently eye bots)
  - Rep per day threshold: Hides all posts from accounts that exceed the average rep per day that you configure. Leave blank to disable. I use 20 myself
  - Upvote per post threshold: Hides posts from accounts that exceed the average upvote per post that you configure. Leave blank to disable. I use 10 for this one
  - Thresholds are ignored for users you follow so that they show in your feeds regardless
#### Feed ignore list
A comma-delimited list of user addresses to be removed from the hierarchical and historical feeds. Less nuclear than a block
#### Feed filter expression
You can enter any JavaScript expression to query the parameters passed in by `args`. Below is what the `args` object looks like. Expression should return `true` for posts you wish to keep in the feed. Posts that fail the check will be removed. _You can only use single quotes for strings_. Double quotes are not supported due to Bastyon's code. Some examples of expressions you could use:

`args.share.comments > 0` only show posts with comment count greater than 0  
`args.share.userprofile.stats.accountAgeDays > 10` only show posts from accounts greater than 10 days old  
`args.share.userprofile.l === 'en'` only show posts from users who chose English as their profile language
`args.share.userprofile.l !== 'ru'` only show posts from users whose language is not Russian

You can also use `&&` and `||` operators:

`args.share.userprofile.stats.repPerDay <= 20 && args.share.userprofile.stats.upvotesPerPost <= 10`

You can also write your expression like this which rejects all posts that are articles when you're not viewing the article feed, where the user's profile language is not English, or where reputation is <= 25:

```
(() => {
	var a = args, s = a.share, u = s.userprofile;
	return !(
		!a.rpcParams.feedFilter.includes('article') && s.type === 'article' ||
		u.l !== 'en' ||
		u.reputation <= 25
	)
})()
```

Note the use of `feedFilter.includes('article')` in the above example which demonstrates how native JavaScript functions work as well.

This is what the full `args` object looks like:

```
"belowThresholds": [boolean],
"today": [datetime],
"rpcParams": {
	feedFilter: [string[]:rpc feed filter]
},
"share": {
	"txid": [string],
	"id": [number],
	"address": [string],
	"time": [number string],
	"l": [string: language],
	"m": [string: post body text],
	"t": [string[]: post tags],
	"i": [string[]: post image URLs,
	"scoreCnt": [number string],
	"scoreSum": [number string],
	"reposted": [number],
	"comments": [number],
	"userprofile": {
		"address": [string],
		"id": [number],
		"name": [string],
		"i": [string: profile avatar URL],
		"postcnt": [number],
		"dltdcnt": [number],
		"reputation": [decimal],
		"subscribes_count": [number],
		"subscribers_count": [number],
		"blockings_count": [number],
		"likers_count": [number],
		"l": [string: language],
		"update": [number: Unix epoch datetime in seconds],
		"regdate": [number: Unix epoch datetime in seconds],
		"stats": {
			"repPerDay": [decimal],
			"upvotesPerPost": [decimal],
			"regDateTime": [datetime],
			"accountAgeDays": [decimal],
			"postsPerDay": [decimal]
		}
	}
}
```
#### Debug hidden feed content
Shows only the post stub for content that was successfully filtered from the feed, but provides a list of all checks that caused the post to fail validation

![delete reasons](https://user-images.githubusercontent.com/89675012/175860649-7838253a-ccd1-400c-9205-d4489a25a849.png)

**Note**: If the userscripts don't appear to work, try these:

- Refresh the browser. Sometimes, the Bastyon page will load before your userscript extension initializes during your browser's first run
- If your config options don't seem to work, go to the settings page and check/uncheck options in question and then refresh all tabs. I could have made some changes to the settings' keys, so the old ones could still be cached in your local storage

#### Screenshot of new config page

![image](https://github.com/dorkerdev/Pocketnet-userscripts/blob/main/Pocketnet%20Tools%20settings%20screenshot.PNG)
