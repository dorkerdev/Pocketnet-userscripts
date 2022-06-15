# Pocketnet-userscripts
If the devs change any of their code, these scripts could break. Just open up an issue if any of them stop working or DM me on Bastyon.

2022-06-13
All userscript files have been consolidated into Pocketnet Tools.user.js (except for autovote everything which is currently broken due to the new Bastyon UI redesign). Major update: All features are now configurable through the user settings menu. Scroll down the setting page and you will surely find it. For now, you will need to refresh the page for any changes to take effect as I have not yet figured out how to make then take effect instantly.

Description of configurables;

- Hide Left Panel - Collapse the left panel. Ideally, there would be a collapse button/control on the panel's border, but my CSS skills are substandard, so you have to do it this way for now
- Show Post Votes - Adds a "Show Votes" button below all posts. I built this before the team added their own, but I like this one better because it's easier to copy/paste and screenshot
- Bastyhax - Uncucks things
  - Show content that the UI hides from you based on low ratings, low rep, reports, etc
  - Show content hidden behind subscriber/membership walls
- Show Block Message - Shows a message alerting you that you've been blocked by a user as soon as you click into the comment box beneath their post. Prevents you from typing out a long comment only to find out you've been blocked after the fact. Doesn't yet work for comment box replies to other people's comments
- Add Comment Sidebar Link: Adds [link] to all comment in the comment sidebar that you can middle-click/right-click to open in new tab/window
- Hide Boosted Content
  - Removes all boosted posts from the feed
  - Unpins pkoin comments from tops of comment sections so that they're sorted normally like all other comments. Doesn't work for the default top comment that shows below posts as this is how the posts are pulled from the node
- Show User Block List: Allows you to view other users' block lists just as you can your own
- Disable Default Image Resizer/Converter: When uploading images, Bastyon's proprietary image resizer scales your image down to 1080x1080 and utterly destroys its quality, making it all crusty with compression artifacts (crustification). You can disable this and upload your image as-is. For now, Bastyon saves to imgur which supports PNG, so your PNGs will not be converted to JPG. When they switch to their media server, I don't believe PNG is supported, but you should still be able to upload high-quality images
- Rep per day threshhold: For coping with bot attacks (currently eye bots). Hides all posts from accounts that exceed the average rep per day that you configure. Leave blank to disable. I use 20 myself
- Upvote per post threshold: Similar to above, hides posts from accounts that exceed the average upvote per post that you configure. Leave blank to disable. I use 10 for this one

**Note**: If the userscripts don't appear to work, try these:

- Refresh the browser. Sometimes, the userscripts don't load during the initial page load. Not sure why, but am looking into it
- If your config options don't seem to work, go to the settings page and check/uncheck one of the options and then refresh all tabs. I made some spelling corrections to the settings keys, so the old ones could still be cached in your local storage

![image](https://user-images.githubusercontent.com/89675012/173812411-eef875c5-b84c-44b5-8f22-7cbf2d94a004.png)
