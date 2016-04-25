var Botkit = require("botkit");
var https = require("https");
var beepboop = require("beepboop-botkit");

var token = process.env.SLACK_TOKEN
var importAPIKey = process.env.IMPORT_API_KEY

var controller = Botkit.slackbot({
  debug: false
});

if (token) {
  console.log("Starting in single-team mode")
  controller.spawn({
    token: token
  }).startRTM(function(err,bot,payload) {
    if (err) {
      throw new Error(err);
    }
  });
} else {
  console.log("Starting in Beep Boop multi-team mode")
  require('beepboop-botkit').start(controller, { debug: true })
}

if ( !importAPIKey ) {
    throw new Error("Import.io API Key required");
}



/* **********************

  VARS

********************** */

var topStoriesReuqestURL = 'https://api.import.io/store/connector/_magic?url=https%3A%2F%2Fwww.designernews.co%2F&js=false&_user=59cf7cce-4fdd-4a7f-be6f-630574c6d814&_apikey='+importAPIKey;
var newStoriesReuqestURL = 'https://api.import.io/store/connector/_magic?url=https%3A%2F%2Fwww.designernews.co%2Fnew&js=false&_user=59cf7cce-4fdd-4a7f-be6f-630574c6d814&_apikey='+importAPIKey;
var discussionsRequestURL = 'https://api.import.io/store/connector/_magic?url=https%3A%2F%2Fwww.designernews.co%2Fdiscussions&js=false&_user=59cf7cce-4fdd-4a7f-be6f-630574c6d814&_apikey='+importAPIKey;



/* **********************

  FUNCTIONS

********************** */


var handleError = function(err, bot, message) {
    var reply = {
        "text": "Oops! Looks like there was an error! :sob:",
        "attachments": [
            {
                "title": "Error",
                "color": "danger",
                "text": err
            },
            {
                "title": "Report this error",
                "color": "#000",
                "text": ":email: ire@ireaderinokun.com \n :bird: <http://twitter.com/ireaderinokun|@ireaderinokun>"
            
            }
        ]
    };

    bot.reply(message, reply);
}


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
        "text": ":zap: "+votes+" votes :speech_balloon: <"+commentsLink+"|"+comments+"> :clock8: " + storyDate + " :smiley: from <"+posterLink+"|"+poster+">"
    }

    return attachment;
}





function makeRequest(bot, message, replyTitle, requestUrl) {

    var loaded = false;
    bot.reply(message, "Fetching " + replyTitle + "...");


    var count = message.text.split(" ")[1];
    if ( count ) {
        if ( !( !isNaN(parseFloat(count)) && isFinite(count) ) ) {
            count = false;
        }
    }


    getStories(requestUrl, function(stories, err) {

        if ( err ) { handleError(err, bot, message) }

        var attachments = [];
        var numberOfStories = count ? count++ : 8;

        for ( var i = 0; i < numberOfStories; i++ ) {
            var storyAttachment = getStoryAttachment(stories[i]);
            attachments.push(storyAttachment);
        }
        
        var reply = {
            "text": replyTitle,
            "attachments": attachments
        };

        bot.reply(message, reply);
    })

}



function getRandomStory(bot, message) {

    bot.reply(message, "Feeling lucky are we? :four_leaf_clover: Fetching a random story...");

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
            handleError(err, bot, message);
        }

        var attachments = [];
        var index = Math.floor(Math.random() * stories.length);
        var storyAttachment = getStoryAttachment(stories[index]);
        attachments.push(storyAttachment);

        var reply = {
            "text": "Random Story",
            "attachments": attachments
        };

        bot.reply(message, reply);

    })

}






/* **********************

  CONTROLLER LISTENERS

********************** */

var contexts = ["mention", "direct_mention", "direct_message"];


controller.hears(["hi", "hello", "hey"], contexts, function(bot, message) {

    var reply = "Hello! I'm a bot for Designer News :robot_face: \n Looking for some stories? Try saying `top` to fetch the top stories, or say `help` for more information on commands I understand.";
    bot.reply(message, reply);
})

controller.hears(["thank you", "thanks"], contexts, function(bot, message) {

    var reply = "You're welcome :simple_smile:";
    bot.reply(message, reply);
})


controller.hears("help", contexts, function(bot, message) {

    var reply = {
        "text": "Hi there! Here are some commands you can use with me",
        "attachments": [
            {
                "title": "<list> <number of stories>",
                "color": "#2d72d9",
                "text": "Pulls stories from a certain list. \n The list can be either `top`, `recent`, or `discussions` \n Optionally set the number of stories to pull \n For example, `recent 5` or just `recent`"
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


controller.hears(["feedback"], contexts, function(bot, message) {

    var reply = {
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
})





/* */

controller.hears(["top"], contexts, function(bot, message) {
    makeRequest(bot, message, "Top Stories", topStoriesReuqestURL); 
})
controller.hears(["recent"], contexts, function(bot, message) {
    makeRequest(bot, message, "Recent Stories", newStoriesReuqestURL);
})
controller.hears(["discussions", "discussion"], contexts, function(bot, message) {
    makeRequest(bot, message, "Discussions", discussionsRequestURL);
})
controller.hears(["random"], contexts, function(bot, message) {
    getRandomStory(bot, message);
})


controller.on("direct_mention", function(bot, message) {
    bot.reply(message, "Sorry I didn't get that, say `help` if you need help.");
});
controller.on("direct_message", function(bot, message) {
    bot.reply(message, "Sorry I didn't get that, say `help` if you need help.");
});


