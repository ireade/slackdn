var Botkit = require("botkit");
var https = require("https");

var token = process.env.SLACK_TOKEN
if (!token) {
  console.error('SLACK_TOKEN is required!')
  process.exit(1)
}

var controller = Botkit.slackbot({
  debug: false
});

controller.spawn({
  token: token
}).startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error(err);
  }
});




/* **********************

  VARS

********************** */

var botName = "designernewsbot";
var topStoriesReuqestURL = 'https://api.import.io/store/connector/_magic?url=https%3A%2F%2Fwww.designernews.co%2F&js=false&_user=59cf7cce-4fdd-4a7f-be6f-630574c6d814&_apikey=59cf7cce4fdd4a7fbe6f630574c6d814abab1e75fbbde6cf59de38356992b106d481a5277e31e78ee98026babe24c5dfe561b854cb2bbeb5459e0aaffc4370e6b656b0ed4e47ee26c417c3672d28d410';
var newStoriesReuqestURL = 'https://api.import.io/store/connector/_magic?url=https%3A%2F%2Fwww.designernews.co%2Fnew&js=false&_user=59cf7cce-4fdd-4a7f-be6f-630574c6d814&_apikey=59cf7cce4fdd4a7fbe6f630574c6d814abab1e75fbbde6cf59de38356992b106d481a5277e31e78ee98026babe24c5dfe561b854cb2bbeb5459e0aaffc4370e6b656b0ed4e47ee26c417c3672d28d410';
var discussionsRequestURL = 'https://api.import.io/store/connector/_magic?url=https%3A%2F%2Fwww.designernews.co%2Fdiscussions&js=false&_user=59cf7cce-4fdd-4a7f-be6f-630574c6d814&_apikey=59cf7cce4fdd4a7fbe6f630574c6d814abab1e75fbbde6cf59de38356992b106d481a5277e31e78ee98026babe24c5dfe561b854cb2bbeb5459e0aaffc4370e6b656b0ed4e47ee26c417c3672d28d410';



/* **********************

  FUNCTIONS

********************** */


var getStories = function(url, callback) {
    https.get(url, function(res) {

        var body = '';

        res.on('data', function(data) {
            data = data.toString();
            body += data;
        });

        res.on('end', function() {
            body = JSON.parse(body);
            var stories = body.tables[0].results;
            callback(stories);
        });

    }).on('error', function(err) {
        callback(null, err)
    });
}


var getAttachmentColour = function(storyTitle) {

    storyTitle = storyTitle.toLowerCase();

    if ( storyTitle.indexOf('css') > -1 ) {
        return "#266EDC";
    } 
    else if ( storyTitle.indexOf('apple') > -1 ) {
        return "#C3C9D2";
    }
    else if ( storyTitle.indexOf('ask dn') > -1 ) {
        return "#03A95C";
    } 
    else if ( storyTitle.indexOf('show dn') > -1 ) {
        return "#D9392B";
    } 
    else if ( storyTitle.indexOf('ama') > -1 ) {
        return "#DD3723";
    } 
    else if ( storyTitle.indexOf('ask dn') > -1 ) {
        return "#DBE0E8";
    } 
    else if ( storyTitle.indexOf('font') > -1 | storyTitle.indexOf('type') > -1 | storyTitle.indexOf('typography') > -1 ) {
        return "#39B86F";
    } 

    else {
        return "#2d72d9";
    }
}


var getStoryAttachment = function(story) {

    var title = story['story_link/_text'];
    var storyLink = story['story_link'];
    var poster = story['from_link/_text'];
    var posterLink = story['from_link'];
    var storyDate = story['storytimeago_value'];
    var comments = story['commentcount_link/_text'];
    var commentsLink = story['commentcount_link'];
    var votes = story['storyvoteis_number'][0];
    var attachmentColour = getAttachmentColour(title);

    var attachment = {
        "title": title,
        "title_link": storyLink,
        "color": attachmentColour,
        "text": ":speech_balloon: <"+commentsLink+"|"+comments+"> :clock8: " + storyDate + " :smiley: from <"+posterLink+"|"+poster+">"
    }

    return attachment;
}





function makeRequest(bot, message, replyTitle, requestUrl) {

    bot.reply(message, "Fetching " + replyTitle + "...");


    var count = message.text.split(" ")[1];
    if ( count ) {
        if ( !( !isNaN(parseFloat(count)) && isFinite(count) ) ) {
            count = false;
        }
    }


    getStories(requestUrl, function(stories, err) {
        if ( err ) {
            bot.reply(message, err);
        }

        var attachments = [];
        var numberOfStories = count ? count++ : 8;

        for ( var i = 0; i < numberOfStories; i++ ) {
            var storyAttachment = getStoryAttachment(stories[i]);
            attachments.push(storyAttachment);
        }
        
        var reply = {
            username: botName,
            "text": replyTitle,
            "attachments": attachments
        };

        bot.reply(message, reply);
    })

}



function getRandomStory(bot, message) {

    bot.reply(message, "Fetching a random story...");

    var requestUrl;
    var r = Math.floor(Math.random() * 3);
    switch(r) {
        case 0:
            requestUrl = topStoriesReuqestURL;
            break;
        case 1:
            requestUrl = newStoriesReuqestURL;
            break;
        case 2:
            requestUrl = discussionsRequestURL;
            break;
        default:
            requestUrl = topStoriesReuqestURL;
            break;
    }

    getStories(requestUrl, function(stories, err) {

        if ( err ) {
            bot.reply(message, err);
        }

        var attachments = [];

        var index = Math.floor(Math.random() * stories.length);
        var storyAttachment = getStoryAttachment(stories[index]);
        attachments.push(storyAttachment);


        var reply = {
            username: botName,
            "text": "Random Story",
            "attachments": attachments
        };

        bot.reply(message, reply);

    })

}






/* **********************

  CONTROLLER LISTENERS

********************** */


controller.hears(["hi", "hello", "hey"], ["mention", "direct_mention", "direct_message"], function(bot, message) {

    var reply = "Hello :) Looking for some stories?";
    bot.reply(message, reply);
})

controller.hears(["thank you", "thanks"], ["mention", "direct_mention", "direct_message"], function(bot, message) {

    var reply = "You're welcome :)";
    bot.reply(message, reply);
})


controller.hears("help", ["mention", "direct_mention", "direct_message"], function(bot, message) {

    var reply = {
        username: botName,
        "text": "Hi there! Here are some commands you can use with me",
        "attachments": [
            {
                "title": "<list> <number of stories>",
                "color": "#2d72d9",
                "text": "Pulls stories from a certain list. \n The list can be either 'top', 'recent', or 'discussions' \n Optionally set the number of stories to pull \n For example, 'recent 5' or just 'recent'"
            },
            {
                "title": "random",
                "color": "#2d72d9",
                "text": "Show a random story"
            
            },
            {
                "title": "feedback",
                "color": "#2d72d9",
                "text": "Send feedback about this bot"
            }
        ]
    };

    bot.reply(message, reply);
})



controller.on("direct_mention", function(bot, message) {

    var messageText = message.text.toLowerCase();

    if ( messageText.indexOf('feedback') > -1 ) {

        var reply = {
            username: botName,
            "attachments": [
                {
                    "title": "This bot was made with :heart: by <http://twitter.com/ireaderinokun|Ire Aderinokun> :grimacing:",
                    "color": "#2d72d9",
                    "text": "If you want to send feedback about this bot, you can contact me through any of these mediums - \n :email: ire@ireaderinokun.com \n :bird: <http://twitter.com/ireaderinokun|@ireaderinokun>"
                
                },
                {
                    "title": "Stories from <http://designernews.co|Designer News>",
                    "color": "#2d72d9",
                    "text": "Designer News is a community of people in design and technology. Launched on Dec 31, 2012 as a place to discuss and share interesting things in our industry."
                }
            ]
        };

        bot.reply(message, reply);
    }

    else if ( messageText.indexOf('random') > -1 ) {
        getRandomStory(bot, message);
    } 
    else if ( messageText.indexOf('top') > -1 ) {
        makeRequest(bot, message, "Top Stories", topStoriesReuqestURL); 
    } else if ( messageText.indexOf('recent') > -1 ) {
        makeRequest(bot, message, "Recent Stories", newStoriesReuqestURL);
    } else if ( messageText.indexOf('discussions') > -1 ) {
        makeRequest(bot, message, "Discussions", discussionsRequestURL);
    }  


    else {
        bot.reply(message, "Sorry I didn't get that, say `help` if you need help.");
    }

});

controller.on("direct_message", function(bot, message) {

    var messageText = message.text.toLowerCase();

    if ( messageText.indexOf('random') > -1 ) {
        getRandomStory(bot, message);
    } else if ( messageText.indexOf('top') > -1 ) {
        makeRequest(bot, message, "Top Stories", topStoriesReuqestURL); 
    } else if ( messageText.indexOf('recent') > -1 ) {
        makeRequest(bot, message, "Recent Stories", newStoriesReuqestURL);
    } else if ( messageText.indexOf('discussions') > -1 ) {
        makeRequest(bot, message, "Discussions", discussionsRequestURL);
    }  else {
        bot.reply(message, "Sorry I didn't get that, say `help` if you need help.");
    }

});


