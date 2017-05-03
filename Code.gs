var ASO_BASE_URL = "http://api.appfollow.io/aso";
var BASE_URL = "http://api.appfollow.io";

function onInstall() {
    onOpen();
}

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('AppFollow')
        .addItem('Show sidebar', 'showSidebar')
        .addItem('Remove data', 'removeData')
        .addToUi();
}

function showSidebar() {
    var userProperties = PropertiesService.getUserProperties();

    if (userProperties.getProperty("cid") == null || userProperties.getProperty("apiSecret") == null) {
        var html = HtmlService.createHtmlOutputFromFile('sidebar');
    } else {
        var html = HtmlService.createHtmlOutputFromFile('sidebar-no-form');
    }

    html.setTitle('AppFollow').setWidth(300);
    SpreadsheetApp.getUi().showSidebar(html);
}

function checkData(cid, apiSecret) {
    var url = 'http://api.appfollow.io/test';

    var data = {
        "cid" : cid
    }

    var sign =  makeSign(data, "/test", apiSecret);

    data["sign"] = sign;

    var res = UrlFetchApp.fetch(url, {
        'method': 'post',
        'payload': data
    });

    var text = res.getContentText();
    var testRes = text ? JSON.parse(text) : [];

    if (testRes.test == "OK") {
        return true;
    }

    return false;
}

function setUserData(cid, apiSecret) {
    if (checkData(cid, apiSecret)) {
        var userProperties = PropertiesService.getUserProperties();
        userProperties.setProperty("cid", cid);
        userProperties.setProperty("apiSecret", apiSecret);
        showSidebar();
    } else {
        var ui = SpreadsheetApp.getUi();
        ui.alert("Wrong cid or api-secret");
    }
}

function removeData() {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.deleteAllProperties();
    var html = HtmlService.createHtmlOutputFromFile('sidebar').setTitle('AppFollow').setWidth(300);
    SpreadsheetApp.getUi().showSidebar(html); 
}

function getSuggest(term, country, device) {
    var userProperties = PropertiesService.getUserProperties();
    var url = ASO_BASE_URL + '/suggest';
    var cid = userProperties.getProperty("cid");
    var apiSecret = userProperties.getProperty("apiSecret");

    var data = {
        'cid' : cid,
        'term' : term,
        'country' : country || "US",
        'device' : device || "iphone",
    };

    var sign =  makeSign(data, "/suggest", apiSecret);

    data['sign'] = sign;

    var res = UrlFetchApp.fetch(url, {
        'method': 'post',
        'payload': data
    });

    var text = res.getContentText();
    var suggest = text ? JSON.parse(text) : [];

    if ('error' in suggest) {    
        if ('submsg' in suggest.error) {
            return "ERROR: " + suggest.error.msg + " (" + suggest.error.submsg + ")" + "\nPlease try again or contact us.";
        }

        return "ERROR: " + suggest.error.msg + "\nPlease try again or contact us.";
    }

    var array = [[term + ' ' + data.country + ' ' + data.device]];

    for (var i in suggest) {
        var item = suggest[i];
        array.push([item.pos, item.term]);
    }

    return array;
}

function getSearch(term, country, device) {
    var userProperties = PropertiesService.getUserProperties();
    var url = ASO_BASE_URL + '/search';
    var cid = userProperties.getProperty("cid");
    var apiSecret = userProperties.getProperty("apiSecret");

    var data = {
        'cid' : cid,
        'term' : term,
        'country' : country || 'US',
        'device' : device || 'iphone'
    };

    var sign =  makeSign(data, "/suggest", apiSecret);

    data['sign'] = sign;

    var res = UrlFetchApp.fetch(url, {
        'method': 'post',
        'payload': data
    });

    var text = res.getContentText();
    var search = text ? JSON.parse(text) : [];

    if ('error' in search) {
        if ('submsg' in search.error) {
            return "ERROR: " + search.error.msg + " (" + search.error.submsg + ")" + "\nPlease try again or contact us.";
        }

        return "ERROR: " + search.error.msg + "\nPlease try again or contact us.";
    }

    var array = [[term + ' ' + data.country + ' ' + data.device]];
    for (var i in search) {
        var item = search[i];
        var title = item.title || item["itunes_id"] || item["id"];
        array.push([item.pos, title, item.artist_name, item.type]);
    }

    return array;  
}

function getTrending(country, device) {
    var userProperties = PropertiesService.getUserProperties();
    var url = ASO_BASE_URL + '/trending';
    var cid = userProperties.getProperty("cid");
    var apiSecret = userProperties.getProperty("apiSecret");

    var data = {
        'cid' : cid,
        'country' : country || 'US',
        'device' : device || 'iphone'
    };

    var sign =  makeSign(data, "/suggest", apiSecret);
    data['sign'] = sign;

    var res = UrlFetchApp.fetch(url, {
        'method': 'post',
        'payload': data
    });

    var text = res.getContentText();
    var trending = text ? JSON.parse(text) : [];

    if ('error' in trending) {
        if ('submsg' in trending.error) {
            return "ERROR: " + trending.error.msg + " (" + trending.error.submsg + ")" + "\nPlease try again or contact us.";
        }

        return "ERROR: " + trending.error.msg + "\nPlease try again or contact us.";
    }

    var array = [[data.country + ' ' + data.device]];
    for (var i in trending.trendings) {
        var item = trending.trendings[i];
        array.push([item.term]);
    }

    return array;
}

// K E Y W O R D S

function getKeywords(ext_id, country, device, date) {
    var url = BASE_URL + "/keywords";
    var userProperties = PropertiesService.getUserProperties();
    var cid = userProperties.getProperty("cid");
    var apiSecret = userProperties.getProperty("apiSecret");

    var params = {
        "cid": cid,
        "ext_id": ext_id,
        "country": country || "RU",
        "device": device || "iphone"
    }

    if (date != undefined) { params["date"] = date; }
    var sign =  makeSign(params, "/keywords", apiSecret);
    params["sign"] = sign;

    var res = UrlFetchApp.fetch(url, {
        'method': 'post',
        'payload': params
    });

    var text = res.getContentText();
    var keywords = text ? JSON.parse(text) : [];

    if ('error' in keywords) {
        if ('submsg' in keywords.error) {
            return "ERROR: " + keywords.error.msg + " (" + keywords.error.submsg + ")" + "\nPlease try again or contact us.";
        }

        return "ERROR: " + keywords.error.msg + "\nPlease try again or contact us.";
    }

    var array = [[params.ext_id + " " + params.country + " " + params.device]];

    for (var i in keywords.keywords.list) {
        var item = keywords.keywords.list[i];
        array.push([item.date, item.kw, item.pos]);
    }

    return array;
}

function _kws_req(params) {
    var userProperties = PropertiesService.getUserProperties();
    var apiSecret = userProperties.getProperty("apiSecret");
    var res  = makeRequest(params, "/keywords", apiSecret);
    var json = JSON.parse(res);

    return json;
}

// R E V I E W S

function getReviews(ext_id, page, date) {
    var url = BASE_URL + "/reviews";
    var cid = PropertiesService.getUserProperties().getProperty("cid");
    var apiSecret = PropertiesService.getUserProperties().getProperty("apiSecret");

    var params = {
        "cid"      : cid,
        "ext_id"   : ext_id,
    };

    if (page != undefined) { params["page"] = page; }
    if (date != undefined) { params["date"] = date; }
    var sign =  makeSign(params, "/reviews", apiSecret);
    params["sign"] = sign;

    var res = UrlFetchApp.fetch(url, {
        'method': 'post',
        'payload': params
    });

    var text = res.getContentText();
    var reviews = text ? JSON.parse(text) : [];

    if ('error' in reviews) {
        if ('submsg' in reviews.error) {
            return "ERROR: " + reviews.error.msg + " (" + reviews.error.submsg + ")" + "\nPlease try again or contact us.";
        }

        return "ERROR: " + reviews.error.msg + "\nPlease try again or contact us.";
    }

    var array = [["Author", "Date", "Rating", "Title", "Review"]];

    for (var i in reviews.reviews.list) {
        var item = reviews.reviews.list[i];
        array.push([item.author, item.date, item.rating, item.title, item.content]);
    }

    return array;
}

// R E V I E W S   S U M M A R Y

function getReviewsSummary(ext_id, date) {
    var url = BASE_URL + "/reviews/summary";
    var cid = PropertiesService.getUserProperties().getProperty("cid");
    var apiSecret = PropertiesService.getUserProperties().getProperty("apiSecret");

    var params = {
        "cid": cid,
        "ext_id": ext_id,
        "date": date
    }

    var sign =  makeSign(params, "/reviews/summary", apiSecret);
    params["sign"] = sign;

    var res = UrlFetchApp.fetch(url, {
        'method': 'post',
        'payload': params
    });

    var text = res.getContentText();
    var reviewsSummary = text ? JSON.parse(text) : [];

    if ('error' in reviewsSummary) {
        if ('submsg' in reviewsSummary.error) {
            return "ERROR: " + reviewsSummary.error.msg + " (" + reviewsSummary.error.submsg + ")" + "\nPlease try again or contact us.";
        }

        return "ERROR: " + reviewsSummary.error.msg + "\nPlease try again or contact us.";
    }
  
    array = [[params.ext_id, "Date", "Count", "Avg.Rating"]];
    for (var i in reviewsSummary.reviews_summary.summary) {
        var item = reviewsSummary.reviews_summary.summary[i];
        array.push(["", item.group_date, item.cnt, item.avg_rating]);
    }

    return array;
}

// R A T I N G S 

function getRatings(ext_id, date) {
    var url = BASE_URL + "/ratings";
    var cid = PropertiesService.getUserProperties().getProperty("cid");
    var apiSecret = PropertiesService.getUserProperties().getProperty("apiSecret");

    var params = {
        "cid": cid,
        "ext_id": ext_id,
    }

    if (date != undefined) { params["date"] = date; }
    var sign =  makeSign(params, "/ratings", apiSecret);
    params["sign"] = sign;

    var res = UrlFetchApp.fetch(url, {
        'method': 'post',
        'payload': params
    });

    var text = res.getContentText();
    var ratings = text ? JSON.parse(text) : [];

    if ('error' in ratings) {
        if ('submsg' in ratings.error) {
            return "ERROR: " + ratings.error.msg + " (" + ratings.error.submsg + ")" + "\nPlease try again or contact us.";
        }

        return "ERROR: " + ratings.error.msg + "\nPlease try again or contact us.";
    }
  
    array = [[params.ext_id, "Date", "Type", "★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★", "Stars Total", "Rating"]];
    for (var i in ratings.ratings.list) {
        var item = ratings.ratings.list[i];
        array.push(["", item.date, item.type, item.stars1, item.stars2, item.stars3, item.stars4, item.stars5, item.stars_total, item.rating]);
    }

    return array;
}

// R A T I N G S   S U M M A R Y

function getRatingsSummary(ext_id, date) {
    var url = BASE_URL + "/ratings/summary";
    var cid = PropertiesService.getUserProperties().getProperty("cid");
    var apiSecret = PropertiesService.getUserProperties().getProperty("apiSecret");

    var params = {
        "cid": cid,
        "ext_id": ext_id,
        "date" : date
    }
  
    var sign =  makeSign(params, "/ratings/summary", apiSecret);
    params["sign"] = sign;

    var res = UrlFetchApp.fetch(url, {
        'method': 'post',
        'payload': params
    });

    var text = res.getContentText();
    var ratingsSummary = text ? JSON.parse(text) : [];

    if ('error' in ratingsSummary) {
        if ('submsg' in ratingsSummary.error) {
            return "ERROR: " + ratingsSummary.error.msg + " (" + ratingsSummary.error.submsg + ")" + "\nPlease try again or contact us.";
        }
        return "ERROR: " + ratingsSummary.error.msg + "\nPlease try again or contact us.";
    }
  
    array = [[params.ext_id, "Date", "Count", "Avg.Rating", "Stars Count"]];
    for (var i in ratingsSummary.ratings_summary.summary) {
        var item = ratingsSummary.ratings_summary.summary[i];
        array.push(["", item.group_date, item.cnt, item.avg_rating, item.cnt_stars]);
    }

    return array;
}

// R A N K I N G S

function getRankings(ext_id, page, date) {
    var url = BASE_URL + "/rankings";
    var cid = PropertiesService.getUserProperties().getProperty("cid");
    var apiSecret = PropertiesService.getUserProperties().getProperty("apiSecret");

    var params = {
        "cid": cid,
        "ext_id": ext_id,
    }

    if (page != undefined) { params["page"] = page; }
    if (date != undefined) { params["date"] = date; }
    var sign =  makeSign(params, "/rankings", apiSecret);
    params["sign"] = sign;

    var res = UrlFetchApp.fetch(url, {
        'method': 'post',
        'payload': params
    });

    var text = res.getContentText();
    var rankings = text ? JSON.parse(text) : [];

    if ('error' in rankings) {
        if ('submsg' in rankings.error) {
            return "ERROR: " + rankings.error.msg + " (" + rankings.error.submsg + ")" + "\nPlease try again or contact us.";
        }
        return "ERROR: " + rankings.error.msg + "\nPlease try again or contact us.";
    }
  
    array = [[params.ext_id, "Position", "Date", "Device", "Hour", "Feed Type"]];
    for (var i in rankings.rankings.list) {
        var item = rankings.rankings.list[i];
        array.push(["", item.pos, item.date, item.device, item.hour, item.feed_type]);
    }

    return array;
}

// S E A R C H   A D S

function getSearchAds(app, country, phrase) {
    var url = ASO_BASE_URL + "/search_ads";
    var cid = PropertiesService.getUserProperties().getProperty("cid");
    var apiSecret = PropertiesService.getUserProperties().getProperty("apiSecret");

    var params = {
        "cid": cid,
        "app": app,
        "country": country || "US"
    }

    if (phrase != undefined) { params["phrase"] = phrase; }
    var sign =  makeSign(params, "/aso/search_ads", apiSecret);
    params["sign"] = sign;

    var res = UrlFetchApp.fetch(url, {
        'method': 'post',
        "muteHttpExceptions": true,
        'payload': params
    });

    var text = res.getContentText();
    var searchAds = text ? JSON.parse(text) : [];

    if ('error' in searchAds) {
        return "ERROR: " + searchAds.error.app + "\nPlease try again or contact us.";
    }
  
    if (searchAds.result.app == "not exists" || searchAds.result.app == "incorrect value") {
        return "App: " + searchAds.error.app + ".";
    } else {
        array = [[searchAds.result.app.title, searchAds.result.app.developer, "Phrase", "Scoring"]];
    }
    for (var i in searchAds.result.keywords) {
        var item = searchAds.result.keywords[i];
        array.push(["", "", item.phrase, item.scoring]);
    }

    return array; 
}

// Keywords Save

function saveKeywords(country, device, keywords, apps_id) {
    var url = BASE_URL + "/keywords/edit";
    var cid = PropertiesService.getUserProperties().getProperty("cid");
    var apiSecret = PropertiesService.getUserProperties().getProperty("apiSecret");

    var params = {
        "cid": cid,
        "country": country || "US",
        "device": device || "iphone",
        "keywords": keywords
    }
  
    if (apps_id != undefined) { params["apps_id"] = apps_id; }
    var sign =  makeSign(params, "/keywords/edit", apiSecret);
    params["sign"] = sign;

    var res = UrlFetchApp.fetch(url, {
        'method': 'post',
        'payload': params
    });

    var kws = keywords.split(",");
    var text = res.getContentText();
    var keywords = text ? JSON.parse(text) : [];

    if ('error' in keywords) {
        if ('submsg' in keywords.error) {
            return "ERROR: " + keywords.error.msg + " (" + keywords.error.submsg + ")" + "\nPlease try again or contact us.";
        }

        return "ERROR: " + keywords.error.msg + "\nPlease try again or contact us.";
    }
  
    array = [["Update:", keywords.keywords.update == 1 ? "Successfull" : "Something went wrong"]];
    array.push(["Keywords:", ""]);
  
    for (var keyword in kws) {
        array.push(["", kws[keyword]]);
    }

    return array;
}
