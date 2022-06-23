# Pocketnet-userscripts
If the devs change any of their code, these scripts could break. Just open up an issue if any of them stop working or DM me on Bastyon.

2022-06-13
All userscript files have been consolidated into Pocketnet Tools.user.js (except for autovote everything which is currently broken due to the new Bastyon UI redesign). Major update: All features are now configurable through the user settings menu. Scroll down the setting page and you will surely find it. For now, you will need to refresh the page for any changes to take effect as I have not yet figured out how to make then take effect instantly.

### Description of configurables:

##### Hide Left Panel
Collapse the left panel. Ideally, there would be a collapse button/control on the panel's border, but my CSS skills are substandard, so you have to do it this way for now
##### Show Post Votes 
Adds a "Show Votes" button below all posts. I built this before the team added their own, but I like this one better because it's easier to copy/paste and screenshot
##### Enable Page Titles
Navigating the site will now update the page title so that it shows on the tab, taskbar icon, and your browsing history.

![image](https://user-images.githubusercontent.com/89675012/175362178-eaa44220-7038-420d-8b84-f2283c4c71e4.png)
![pn userscript show page title history](https://user-images.githubusercontent.com/89675012/175362212-d9d8104f-e594-49de-9e23-66e780f8df67.PNG)

##### Bastyhax
Uncucks things
  - Show content that the UI hides from you based on low ratings, low rep, reports, etc
  - Show content hidden behind subscriber/membership walls
##### Show Block Message 
Shows a message alerting you that you've been blocked by a user as soon as you click into the comment box beneath their post. Prevents you from typing out a long comment only to find out you've been blocked after the fact. Doesn't yet work for comment box replies to other people's comments. **Note**: The devs will soon be implementing their own version of this. Strange that they're doing that only after I added that feature myself, huh?
##### Show Blocked Profile Content
When you block a user, you are unable to view or interact with their content. This feature removes that restriction so that you can still stalk and interact with users you've blocked (until they block you back)
##### Add Comment Sidebar Link
Adds [link] to all comments in the sidebar that you can middle-click/right-click to open in new tab/window
##### Hide Boosted Content
  - Removes all boosted posts from the feed
  - Unpins pkoin comments from tops of comment sections so that they're sorted normally like all other comments. Doesn't work for the default top comment that shows below posts as this is how the posts are pulled from the node
##### Show User Block List
Allows you to view other users' block lists just as you can your own
##### Disable Default Image Resizer/Converter
When uploading images, Bastyon's proprietary image resizer scales your image down to 1080x1080 and utterly destroys its quality, making it all crusty with compression artifacts. This feature allows you to disable their resize and upload your image as-is. For now, Bastyon saves to imgur which supports PNG, so this will prevent your PNGs from being converted to JPG. When they switch to their media server, I don't believe PNG is supported, but you should still be able to upload high-quality images
##### Show Walled Content
Enabling this will allow you to view content that is locked behind a login or membership wall. In theory, you will also be able to rate/comment on the content, though I haven't tested that
##### Thresholds 
Used to hide accounts that have excessive post/vote metrics. Useful for coping with bot attacks (currently eye bots)
  - Rep per day threshold: Hides all posts from accounts that exceed the average rep per day that you configure. Leave blank to disable. I use 20 myself
  - Upvote per post threshold: Hides posts from accounts that exceed the average upvote per post that you configure. Leave blank to disable. I use 10 for this one
  - Thresholds are ignored for users you follow so that they show in your feeds regardless

### Other features added automatically

##### Add additional stats to user profile
![image](https://user-images.githubusercontent.com/89675012/175365467-e774b159-1d98-42de-9b40-ab992c606885.png)

##### Add language feed next to post timestamp
Useful when browsing a user's profile to see what language feeds they're posting to

**Note**: If the userscripts don't appear to work, try these:

- Refresh the browser. Sometimes, the userscripts don't load during the initial page load. Not sure why, but am looking into it
- If your config options don't seem to work, go to the settings page and check/uncheck one of the options and then refresh all tabs. I made some spelling corrections to the settings keys, so the old ones could still be cached in your local storage

##### Screenshot of new config page

![image](https://github.com/dorkerdev/Pocketnet-userscripts/blob/main/Pocketnet%20Tools%20settings%20screenshot.PNG)
