var ASO_BASE_URL = 'https://api.appfollow.io/aso';
var BASE_URL = 'https://api.appfollow.io';
var REPORTS_BASE_URL = 'https://api.appfollow.io/reports';
var DEFAULT_COUNTRY = 'US';
var DEFAULT_DEVICE = 'iphone';
var DEMO_CID = '966';
var DEMO_APISECRET = 'AppFollow-966-2b3da05ee';
var DEMO_LIMIT_MSG = '[Demo account] Please use cid of your account in the sidebar of AppFollow Add-on.';
var CURRENT_VERSION = '2.7.0';
var SOURCE = 'gsheets';

function onInstall() {
	onOpen();
	showSidebar();
}

function onOpen() {
	SpreadsheetApp.getUi()
		.createMenu('AppFollow')
		.addItem('Show sidebar', 'showSidebar')
		.addItem('Remove data', '_removeData')
		.addToUi();

	//refreshLastUpdate();
}

function onEdit(e) {
	//refreshLastUpdate();
}

function showSidebar() {
	var userProperties = PropertiesService.getUserProperties();

	if (userProperties.getProperty('cid') == null || userProperties.getProperty('apiSecret') == null) {
		var html = HtmlService.createTemplateFromFile('sidebar').evaluate();
		var ui = html.setTitle('AppFollow').setWidth(300);
	} else {
		var html = HtmlService.createTemplateFromFile('sidebar-no-form');
		html.cid = userProperties.getProperty('cid');
		html.apiSecret = userProperties.getProperty('apiSecret');
		html.countriesAll= getCountries();
		html.countriesWW = getCountries('ww');
		html.countriesSAds = getCountries('sads');
		html.isDemoAccount = _isDemoAccount();
		var ui = html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).setTitle('AppFollow').setWidth(300);
	}

	SpreadsheetApp.getUi().showSidebar(ui);
}

function include(filename) {
	return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function showSpinner() {
	SpreadsheetApp.getActiveSpreadsheet().toast("Loading...","",-1);
	Utilities.sleep(5000);
	SpreadsheetApp.getActiveSpreadsheet().toast("Logged.");
}

function getSafeApiSecret() {
	var _apiSecret = PropertiesService.getUserProperties().getProperty('apiSecret').slice(-7);
	return '*************' + _apiSecret;
}

function _getUserData() {
	var userProperties = PropertiesService.getUserProperties();

	return [userProperties.getProperty('cid'), userProperties.getProperty('apiSecret')];
}

function _isDemoAccount() {
	var userProperties = PropertiesService.getUserProperties();

	return userProperties.getProperty('cid') == DEMO_CID && userProperties.getProperty('apiSecret') == DEMO_APISECRET;
}

function checkData(cid, apiSecret) {
	var url = 'http://api.appfollow.io/test';

	var data = {
		'cid' : cid
	}

	var sign = makeSign(data, '/test', apiSecret);

	data['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': data
	});

	var text = res.getContentText();
	var testRes = text ? JSON.parse(text) : [];

	if (testRes.test == 'OK') {
		return true;
	}

	return false;
}

function _setDemoAccount(trigger) {
	PropertiesService.getUserProperties().setProperty('cid', DEMO_CID);
	PropertiesService.getUserProperties().setProperty('apiSecret', DEMO_APISECRET);
	if (trigger) {
		showSidebar();
	}
}

function setUserData(cid, apiSecret) {
	if (checkData(cid, apiSecret)) {
		var userProperties = PropertiesService.getUserProperties();
		userProperties.setProperty('cid', cid);
		userProperties.setProperty('apiSecret', apiSecret);
		showSidebar();
	} else {
		var ui = SpreadsheetApp.getUi();
		ui.alert('Wrong cid or api-secret');
	}
}

function _removeData() {
	var userProperties = PropertiesService.getUserProperties();
	userProperties.deleteAllProperties();

	showSidebar();
}

function getSuggest(term, country, device) {
	var userProperties = PropertiesService.getUserProperties();
	var url = ASO_BASE_URL + '/suggest';
	var cid = userProperties.getProperty('cid') || DEMO_CID;
	var apiSecret = userProperties.getProperty('apiSecret') || DEMO_APISECRET;

	var data = {
		'cid': cid,
		'term': term || '',
		'country': country || DEFAULT_COUNTRY,
		'device': device || DEFAULT_DEVICE,
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	if (!term || !country || !device || data['term'] === '') {
		return [['ERROR: Please enter a missing parameters.']];
	}

	var sign = makeSign(data, '/aso/suggest', apiSecret);

	data['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': data
	});

	var text = res.getContentText();
	var suggest = text ? JSON.parse(text) : [];

	if ('error' in suggest) {
		var limitString = 'limit exceeded';
		var errorMsg;
		if (suggest.error.msg.indexOf(limitString) !== -1) {
			var errorMsg = cid == DEMO_CID ? DEMO_LIMIT_MSG : '[cid ' + cid + '] Please upgrade your account in AppFollow.';
			return [[errorMsg]];
		}

		if ('submsg' in suggest.error) {
			return [['ERROR: ' + suggest.error.msg + ' (' + suggest.error.submsg + ')' +
				'\nPlease try again or contact us.']];
		}

		return [['ERROR: ' + suggest.error.msg + '\nPlease try again or contact us.']];
	}

	var array = [[term + ' ' + data.country + ' ' + data.device, '']];

	for (var i in suggest) {
		var item = suggest[i];
		array.push([item.pos, item.term]);
	}

	return array;
}

function getCid() {
	var cid = PropertiesService.getUserProperties().getProperty('cid');
	return cid == undefined ? 'No cid' : cid;
}

function getSearch(term, country, device) {
	var userProperties = PropertiesService.getUserProperties();
	var url = ASO_BASE_URL + '/search';
	var cid = userProperties.getProperty('cid') || DEMO_CID;
	var apiSecret = userProperties.getProperty('apiSecret') || DEMO_APISECRET;

	var data = {
		'cid' : cid,
		'term' : term,
		'country' : country || DEFAULT_COUNTRY,
		'device' : device || DEFAULT_DEVICE,
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	if (!term || !country || !device || data['term'] === '') {
		return [['ERROR: Please enter a missing parameters.']];
	}

	if (country != undefined && country.length > 2) {
		data.country = DEFAULT_COUNTRY;
		data.device = country;
	}
	var sign = makeSign(data, '/aso/search', apiSecret);
	data['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': data
	});

	var text = res.getContentText();
	var search = text ? JSON.parse(text) : [];

	if ('error' in search) {
		var limitString = 'limit exceeded';
		var errorMsg;
		if (search.error.msg.indexOf(limitString) !== -1) {
			var errorMsg = cid == DEMO_CID ? DEMO_LIMIT_MSG : '[cid ' + cid + '] Please upgrade your account in AppFollow.';
			return [[errorMsg]];
		}

		if ('submsg' in search.error) {
			return [['ERROR: ' + search.error.msg + ' (' + search.error.submsg + ')' + '\nPlease try again or contact us.']];
		}

		return [['ERROR: ' + search.error.msg + '\nPlease try again or contact us.']];
	}

	var array = [[term + ' ' + data.country + ' ' + data.device, '', '', '', '', '']];
	for (var i in search.result) {
		var item = search.result[i];
		var title = item.title || item['itunes_id'] || item['id'];
		var extId = item.ext_id || item.extId || '';
		array.push([item.pos, extId, title, item.artist_name, item.type, item.url]);
	}

	return array;
}

function getTrending(country, device) {
	var userProperties = PropertiesService.getUserProperties();
	var url = ASO_BASE_URL + '/trending';
	var cid = userProperties.getProperty('cid') || DEMO_CID;
	var apiSecret = userProperties.getProperty('apiSecret') || DEMO_APISECRET;

	var data = {
		'cid' : cid,
		'country' : country || DEFAULT_COUNTRY,
		'device' : device || DEFAULT_DEVICE,
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	var sign = makeSign(data, '/aso/trending', apiSecret);
	data['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': data
	});

	var text = res.getContentText();
	var trending = text ? JSON.parse(text) : [];

	if ('error' in trending) {
		var limitString = 'limit exceeded';
		var errorMsg;
		if (trending.error.msg.indexOf(limitString) !== -1) {
			var errorMsg = cid == DEMO_CID ? DEMO_LIMIT_MSG : '[cid ' + cid + '] Please upgrade your account in AppFollow.';
			return [[errorMsg]];
		}

		if ('submsg' in trending.error) {
			return [['ERROR: ' + trending.error.msg + ' (' + trending.error.submsg + ')' +
				'\nPlease try again or contact us.']];
		}

		return [['ERROR: ' + trending.error.msg + '\nPlease try again or contact us.']];
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
	var url = BASE_URL + '/keywords';
	var userProperties = PropertiesService.getUserProperties();
	var cid = userProperties.getProperty('cid') || DEMO_CID;
	var apiSecret = userProperties.getProperty('apiSecret') || DEMO_APISECRET;

	var params = {
		'cid': cid,
		'ext_id': ext_id,
		'device': device || DEFAULT_DEVICE,
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	if (date != undefined) { params['date'] = date; }
	if (country != undefined) { params['country'] = country; }

	var sign = makeSign(params, '/keywords', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': params
	});

	var text = res.getContentText();
	var keywords = text ? JSON.parse(text) : [];

	if ('error' in keywords) {
		if ('submsg' in keywords.error) {
			return [['ERROR: ' + keywords.error.msg + ' (' + keywords.error.submsg + ')' +
				'\nPlease try again or contact us.']];
		}

		return [['ERROR: ' + keywords.error.msg + '\nPlease try again or contact us.']];
	}

	var array;
	if (params.country != undefined) {
		array = [[params.ext_id, params.device, params.country]]
	} else {
		array = [[params.ext_id + ' ' + params.device, '', '']]
	}

	for (var i in keywords.keywords.list) {
		var item = keywords.keywords.list[i];
		array.push([item.date, item.kw, item.pos]);
	}
	if (keywords.keywords.no_pos.length != 0) {
		array.push(['No positions:', '', '']);
	}
	for (var i in keywords.keywords.no_pos) {
		var item = keywords.keywords.no_pos[i];
		array.push(['', item, '']);
	}

	return array;
}

function _kws_req(params) {
	var userProperties = PropertiesService.getUserProperties();
	var apiSecret = userProperties.getProperty('apiSecret') || DEMO_APISECRET;
	var res = makeRequest(params, '/keywords', apiSecret);
	var json = JSON.parse(res);

	return json;
}

// R E V I E W S

function getReviews(ext_id, page, date, store, country) {
	var url = BASE_URL + '/reviews';
	var cid = PropertiesService.getUserProperties().getProperty('cid') || DEMO_CID;
	var apiSecret = PropertiesService.getUserProperties().getProperty('apiSecret') || DEMO_APISECRET;
	var array;

	var params = {
		'cid' : cid,
		'ext_id' : ext_id,
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	if (page != undefined) { params['page'] = page; }
	if (date != undefined) { params['date'] = date; }
	if (store == 'android' && country != undefined) {
		params['lang'] = country;
	} else if (country != undefined) {
		params['country'] = country;
	}
	var sign = makeSign(params, '/reviews', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': params
	});

	var text = res.getContentText();
	var reviews = text ? JSON.parse(text) : [];

	if ('error' in reviews) {
		if ('submsg' in reviews.error) {
			return [['ERROR: ' + reviews.error.msg + ' (' + reviews.error.submsg + ')' +
				'\nPlease try again or contact us.']];
		}

		return [['ERROR: ' + reviews.error.msg + '\nPlease try again or contact us.']];
	}

	if (store == 'iphone' || store == 'ipad') {
		array = _getReviewsAS(reviews.reviews);
	} else {
		array = _getReviewsGP(reviews.reviews);
	}

	return array;
}

function _getReviewsAS(reviews) {
	var array = [['Total: ' + reviews.total, 'Author', 'Version', 'Country', 'Date', 'Rating', 'Title', 'Review']];

	for (var i in reviews.list) {
		var item = reviews.list[i];
		array.push(['', item.author, item.app_version, item.country, item.date, item.rating, item.title, item.content]);
	}

	return array;
}

function _getReviewsGP(reviews) {
	var array = [['Total: ' + reviews.total, 'Author', 'Version', 'Language', 'Date', 'Rating', 'Title', 'Review']];

	for (var i in reviews.list) {
		var item = reviews.list[i];
		array.push(['', item.author, item.app_version, item.lang, item.date, item.rating, item.title, item.content]);
	}

	return array;
}

// R E V I E W S   S U M M A R Y

function getReviewsSummary(ext_id, from, to, store, country) {
	var url = BASE_URL + '/reviews/summary';
	var cid = PropertiesService.getUserProperties().getProperty('cid') || DEMO_CID;
	var apiSecret = PropertiesService.getUserProperties().getProperty('apiSecret') || DEMO_APISECRET;
	var array;

	var params = {
		'cid': cid,
		'ext_id': ext_id,
		'from': from,
		'to': to,
		's': SOURCE,
		'v': CURRENT_VERSION
	}

	if (store == 'android' && country != undefined) {
		params['lang'] = country;
	} else if (country != undefined) {
		params['country'] = country;
	}
	var sign = makeSign(params, '/reviews/summary', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': params
	});

	var text = res.getContentText();
	var reviewsSummary = text ? JSON.parse(text) : [];

	if ('error' in reviewsSummary) {
		if ('submsg' in reviewsSummary.error) {
			return [['ERROR: ' + reviewsSummary.error.msg + ' (' + reviewsSummary.error.submsg + ')' +
				'\nPlease try again or contact us.']];
		}

		return [['ERROR: ' + reviewsSummary.error.msg + '\nPlease try again or contact us.']];
	}

	if (store == 'android') {
		array = _getReviewsSummaryGP(params.ext_id, reviewsSummary);
	} else {
		array = _getReviewsSummaryAS(params.ext_id, reviewsSummary);
	}

	return array;
}

function _getReviewsSummaryGP(extId, reviewsSummary) {
	var array = [
		[extId, '', '', '', '', ''],
		['From', 'To', 'Language', 'Reviews Avg.', 'Reviews Count', 'Rating Avg.', 'Rating Count'],
	];

	array.push([reviewsSummary.from, reviewsSummary.to, reviewsSummary.lang, reviewsSummary.reviews_avg.toFixed(3),
		reviewsSummary.reviews_cnt, reviewsSummary.rating_avg.toFixed(3), reviewsSummary.rating_cnt]);

	return array;
}

function _getReviewsSummaryAS(extId, reviewsSummary) {
	var array = [
		[extId, '', '', '', '', ''],
		['From', 'To', 'Country', 'Reviews Avg.', 'Reviews Count', 'Rating Avg.', 'Rating Count'],
	];

	array.push([reviewsSummary.from, reviewsSummary.to, reviewsSummary.country, reviewsSummary.reviews_avg.toFixed(3),
		reviewsSummary.reviews_cnt, reviewsSummary.rating_avg.toFixed(3), reviewsSummary.rating_cnt]);

	return array;
}

// R A T I N G S

function getRatings(store, ext_id, date) {
	var url = BASE_URL + '/ratings';
	var cid = PropertiesService.getUserProperties().getProperty('cid') || DEMO_CID;
	var apiSecret = PropertiesService.getUserProperties().getProperty('apiSecret') || DEMO_APISECRET;
	var array;

	var params = {
		'cid': cid,
		'ext_id': ext_id,
		's': SOURCE,
		'v': CURRENT_VERSION
	}

	if (date != undefined) { params['date'] = date; }
	var sign = makeSign(params, '/ratings', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': params
	});

	var text = res.getContentText();
	var ratings = text ? JSON.parse(text) : [];

	if ('error' in ratings) {
		if ('submsg' in ratings.error) {
			return [['ERROR: ' + ratings.error.msg + ' (' + ratings.error.submsg + ')' +
				'\nPlease try again or contact us.']];
		}

		return [['ERROR: ' + ratings.error.msg + '\nPlease try again or contact us.']];
	}

	if (store == 'iphone' || store == 'ipad') {
		array = _getRatingsAS(params.ext_id, ratings.ratings.list);
	} else {
		array = _getRatingsGP(params.ext_id, ratings.ratings.list);
	}

	return array;
}

function _getRatingsAS(ext_id, list) {
	var array = [[ext_id, 'Date', 'Rating', 'Stars Total', '1 Star', '2 Star', '3 Star', '4 Star',
		'5 Star', 'Country', 'Type']];

	for (var i in list) {
		var item = list[i];
		array.push(['', item.date, item.rating, item.stars_total, item.stars1, item.stars2, item.stars3,
			item.stars4, item.stars5, item.country, item.type]);
	}

	return array;
}

function _getRatingsGP(ext_id, list) {
	var array = [[ext_id, 'Date', 'Rating', 'Stars Total', '1 Star', '2 Star', '3 Star', '4 Star', '5 Star', 'Type']];

	for (var i in list) {
		var item = list[i];
		array.push(['', item.date, item.rating, item.stars_total, item.stars1, item.stars2,
			item.stars3, item.stars4, item.stars5, item.type]);
	}

	return array;
}

// R A T I N G S   S U M M A R Y

function getRatingsSummary(store, ext_id, date) {
	var url = BASE_URL + '/ratings/summary';
	var cid = PropertiesService.getUserProperties().getProperty('cid') || DEMO_CID;
	var apiSecret = PropertiesService.getUserProperties().getProperty('apiSecret') || DEMO_APISECRET;

	var params = {
		'cid': cid,
		'ext_id': ext_id,
		'date' : date,
		's': SOURCE,
		'v': CURRENT_VERSION
	}

	var sign = makeSign(params, '/ratings/summary', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': params
	});

	var text = res.getContentText();
	var ratingsSummary = text ? JSON.parse(text) : [];

	if ('error' in ratingsSummary) {
		if ('submsg' in ratingsSummary.error) {
			return [['ERROR: ' + ratingsSummary.error.msg + ' (' + ratingsSummary.error.submsg + ')' +
				'\nPlease try again or contact us.']];
		}
		return [['ERROR: ' + ratingsSummary.error.msg + '\nPlease try again or contact us.']];
	}

	if (store == 'iphone' || store == 'ipad') {
		_getRatingsSummaryAS(params.ext_id, ratingsSummary.ratings_summary.summary)
	} else {
		_getRatingsSummaryGP(params.ext_id, ratingsSummary.ratings_summary.summary)
	}

	return array;
}

function _getRatingsSummaryAS(ext_id, list) {
	array = [[ext_id, 'Date', 'Avg.Rating', 'Count', 'Country']];
	for (var i in list) {
		var item = list[i];
		array.push(['', item.group_date, item.avg_rating.toFixed(3), item.cnt_stars, item.country]);
	}

	return array;
}

function _getRatingsSummaryGP(ext_id, list) {
	array = [[ext_id, 'Date', 'Avg.Rating', 'Count']];
	for (var i in list) {
		var item = list[i];
		array.push(['', item.group_date, item.avg_rating.toFixed(3), item.cnt_stars]);
	}

	return array;
}


// R A N K I N G S

function getRankings(ext_id, page, date) {
	var url = BASE_URL + '/rankings';
	var cid = PropertiesService.getUserProperties().getProperty('cid') || DEMO_CID;
	var apiSecret = PropertiesService.getUserProperties().getProperty('apiSecret') || DEMO_APISECRET;

	var params = {
		'cid': cid,
		'ext_id': ext_id,
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	if (page != undefined) { params['page'] = page; }
	if (date != undefined) { params['date'] = date; }
	var sign = makeSign(params, '/rankings', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': params
	});

	var text = res.getContentText();
	var rankings = text ? JSON.parse(text) : [];

	if ('error' in rankings) {
		if ('submsg' in rankings.error) {
			return [['ERROR: ' + rankings.error.msg + ' (' + rankings.error.submsg + ')' +
				'\nPlease try again or contact us.']];
		}
		return [['ERROR: ' + rankings.error.msg + '\nPlease try again or contact us.']];
	}

	array = [[params.ext_id, 'Position', 'Date', 'Device', 'Hour', 'Feed Type']];
	for (var i in rankings.rankings.list) {
		var item = rankings.rankings.list[i];
		array.push(['', item.pos, item.date, item.device, item.hour, item.feed_type]);
	}

	return array;
}

// S E A R C H   A D S

function getSearchAds(app, country, phrase) {
	var url = ASO_BASE_URL + '/search_ads';
	var cid = PropertiesService.getUserProperties().getProperty('cid') || DEMO_CID;
	var apiSecret = PropertiesService.getUserProperties().getProperty('apiSecret') || DEMO_APISECRET;

	var params = {
		'cid': cid,
		'app': app,
		'country': country || DEFAULT_COUNTRY,
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	if (phrase != undefined) { params['phrase'] = phrase; }
	var sign = makeSign(params, '/aso/search_ads', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'muteHttpExceptions': true,
		'payload': params
	});

	var text = res.getContentText();
	var searchAds = text ? JSON.parse(text) : [];

	if ('error' in searchAds) {
		var limitString = 'limit exceeded';
		var errorMsg;
		if (searchAds.error.msg && searchAds.error.msg.indexOf(limitString) !== -1) {
			var errorMsg = cid == DEMO_CID ? DEMO_LIMIT_MSG : '[cid ' + cid + '] Please upgrade your account in AppFollow.';
			return [[errorMsg]];
		}

		return [['ERROR: ' + searchAds.error.app + '\nPlease try again or contact us.']];
	}

	if (searchAds.result.app == 'not exists' || searchAds.result.app == 'incorrect value') {
		return [['App: ' + searchAds.error.app + '.']];
	} else {
		app = [[searchAds.result.app.title, searchAds.result.app.developer]];
		app.push(['Phrase', 'Scoring']);
	}
	var array = [];
	for (var i in searchAds.result.keywords) {
		var item = searchAds.result.keywords[i];
		array.push([item.phrase, item.scoring]);
	}

	array = array.sort(compare);
	return app.concat(array);
}

function compare(a, b) {
	if (a[1] > b[1])
		return -1;
	if (a[1] < b[1])
		return 1;
	return 0;
}

// Keywords Save

function saveKeywords(country, device, keywords, apps_id) {
	var url = BASE_URL + '/keywords/edit';
	var cid = PropertiesService.getUserProperties().getProperty('cid') || DEMO_CID;
	var apiSecret = PropertiesService.getUserProperties().getProperty('apiSecret') || DEMO_APISECRET;

	var params = {
		'cid': cid,
		'device': device || DEFAULT_DEVICE,
		'keywords': keywords,
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	if (country != undefined) {
		params['country'] = country;
	} else {
		return [['ERROR: country is required.']];
	}
	if (apps_id != undefined) { params['apps_id'] = apps_id; }

	var sign = makeSign(params, '/keywords/edit', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': params
	});

	var kws = keywords.split(',');
	var text = res.getContentText();
	var keywords = text ? JSON.parse(text) : [];

	if ('error' in keywords) {
		if ('submsg' in keywords.error) {
			return [['ERROR: ' + keywords.error.msg + ' (' + keywords.error.submsg + ')' +
				'\nPlease try again or contact us.']];
		}

		return [['ERROR: ' + keywords.error.msg + '\nPlease try again or contact us.']];
	}

	array = [['Update:', keywords.keywords.update == 1 ? 'Successful' : 'Something went wrong']];
	array.push(['Keywords:', '']);

	for (var keyword in kws) {
		array.push(['', kws[keyword]]);
	}

	return array;
}

// W H A T ' S   N E W

function getWhatsNew(ext_id, page, last_modified, store, country) {
	var url = BASE_URL + '/whatsnew';
	var cid = PropertiesService.getUserProperties().getProperty('cid') || DEMO_CID;
	var apiSecret = PropertiesService.getUserProperties().getProperty('apiSecret') || DEMO_APISECRET;

	var params = {
		'cid': cid,
		'ext_id': ext_id,
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	if (page != undefined) { params['page'] = page; }
	if (last_modified != undefined) { params['last_modified'] = last_modified; }
	if (store == 'android' && country != undefined) {
		params['lang'] = country;
	} else if (country != undefined) {
		params['country'] = country;
	}

	var sign = makeSign(params, '/whatsnew', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': params
	});

	var text = res.getContentText();
	var whatsnew = text ? JSON.parse(text) : {};

	if ('error' in whatsnew) {
		if ('submsg' in whatsnew.error) {
			return [['ERROR: ' + whatsnew.error.msg + ' (' + whatsnew.error.submsg + ')' +
				'\nPlease try again or contact us.']];
		}
		return [['ERROR: ' + whatsnew.error.msg + '\nPlease try again or contact us.']];
	}

	array = [[params.ext_id, 'Release Date', 'Created', 'What\'s New']];

	for (var i in whatsnew.whatsnew.list) {
		var item = whatsnew.whatsnew.list[i];
		array.push(['', item.release_date, item.created, item.whatsnew]);
	}

	return array;
}

// C O L L E C T I O N S

function getCollections() {
	var userProperties = PropertiesService.getUserProperties();
	var url = BASE_URL + '/apps';
	var cid = userProperties.getProperty('cid');
	var apiSecret = userProperties.getProperty('apiSecret');

	if (cid == '') {
		return [['ERROR: Log in to get Your collections list.']];
	}

	var params = {
		'cid': cid,
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	var sign = makeSign(params, '/apps', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': params
	});

	var text = res.getContentText();
	var collections = text ? JSON.parse(text) : {};

	if ('error' in collections) {
		if ('submsg' in collections.error) {
			return [['ERROR: ' + collections.error.msg + ' (' + collections.error.submsg + ')' +
				'\nPlease try again or contact us.']];
		}
		return [['ERROR: ' + collections.error.msg + '\nPlease try again or contact us.']];
	}

	array = [['Collection', 'Id', 'Apps Number', 'Languages']];
	for (var i in collections.apps) {
		var item = collections.apps[i];
		array.push([item.title, item.id, item.count_apps, item.languages]);
	}

	return array;
}

// A P P S   F R O M   C O L L E C T I O N

function getAppsFromCollection(apps_id) {
	var userProperties = PropertiesService.getUserProperties();
	var url = BASE_URL + '/apps/app';
	var cid = userProperties.getProperty('cid');
	var apiSecret = userProperties.getProperty('apiSecret');

	if (cid == '') {
		return [['ERROR: Log in to get Your apps from collection list.']];
	}

	var params = {
		'cid': cid,
		'apps_id': apps_id,
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	var sign = makeSign(params, '/apps/app', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': params
	});

	var text = res.getContentText();
	var apps = text ? JSON.parse(text) : [];

	if ('error' in apps) {
		if ('submsg' in apps.error) {
			return [['ERROR: ' + apps.error.msg + ' (' + apps.error.submsg + ')' + '\nPlease try again or contact us.']];
		}
		return [['ERROR: ' + apps.error.msg + '\nPlease try again or contact us.']];
	}

	array = [[apps_id, 'Title', 'Artist', 'Genre', 'Favorite', 'Store', 'Type', 'ext_id']];
	for (var i in apps.apps_app) {
		var item = apps.apps_app[i];
		var favorite = item.is_favorite == '1' ? 'Yes' : 'No';
		array.push(['', item.app.title, item.app.artist_name, item.app.genre, favorite, item.store,
			item.app.type, item.app.ext_id]);
	}

	return array;
}

// A S O   R E P O R T

function _addZeroBeforeDate(date) {
	return ('0' + date).slice(-2);
}

function _formatDate(date) {
	var fullDate = new Date(date);
	var day = _addZeroBeforeDate(fullDate.getDate());
	var month = _addZeroBeforeDate(fullDate.getMonth() + 1);
	var year = fullDate.getFullYear();
	return year + '-' + month + '-' + day;
}

function _generateDate(diff) {
	var today = new Date();

	return _formatDate(today.setDate(today.getDate() + diff));
}

function _getASOReport(ext_id, country, device, from, to, channel) {
	var url = REPORTS_BASE_URL + '/aso_report';
	var userProperties = PropertiesService.getUserProperties();
	var cid = userProperties.getProperty('cid') || DEMO_CID;
	var apiSecret = userProperties.getProperty('apiSecret') || DEMO_APISECRET;
	var _country;

	var params = {
		'cid': cid,
		'ext_id': ext_id,
		'channel': channel,
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	if (from < to) {
		params.from = from;
		params.to = to;
	} else {
		params.from = to;
		params.to = from;
	}

	if (country != undefined) {
		if (country == 'ww') {
			params.country = 'all';
		} else {
			params.country = country;
		}
	}

	var sign = makeSign(params, '/reports/aso_report', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': params
	});

	var text = res.getContentText();
	var report = text ? JSON.parse(text) : [];

	if ('error' in report) {
		if ('submsg' in report.error) {
			return [['ERROR: ' + report.error.msg + ' (' + report.error.submsg + ')' +
				'\nPlease try again or contact us.']];
		}

		return [['ERROR: ' + report.error.msg + '\nPlease try again or contact us.']];
	}

	var result = _getReportForChannel(params, device, report);
	return result;
}

function _getReportForChannel(params, device, report) {
	var result = [];

	switch(params.channel) {
		case 'country_organic_summary':
		case 'country_summary':
			result = _printCountrySummary(params, report);
			break;
		case 'campaign':
			result = _printCampaign(params, report);
			break;
		case 'site':
			result = _printSite(params, report);
			break;
		case 'channel':
			if (device === 'android') {
				result = _printChannelAndroid(params, report);
			} else {
				result = _printChannel(params, report);
			}
			break;
		case 'time_series':
			result = _printTimeSeries(params, report);
			break;
	}

	return result;
}

function _printSite(params, report) {
	var array = [];
	array.push([params.ext_id, report.query.country.toUpperCase(), params.from, params.to, params.channel,
		'', '', '', '', '']);
	array.push(['', 'Date', 'Weekday', 'Country', 'Channel', 'Site', 'Views', 'App Units', 'Count',
		'CRV: App Units / Views']);

	for (var i in report.data) {
		var item = report.data[i];
		array.push(['', item.date, item.weekday, item.country, item.channel, item.site, item.views,
			item.units, item.count, item.views_cr]);
	}

	return array;
}

function _printCampaign(params, report) {
	var array = [];
	array.push([params.ext_id, report.query.country.toUpperCase(), params.from, params.to, params.channel,
		'', '', '', '', '', '']);
	array.push(['', 'Date', 'Weekday', 'Country', 'Channel', 'Impressions', 'Views', 'Sales', 'Sessions',
		'App Units', 'CRV: App Units / Views']);

	for (var i in report.data) {
		var item = report.data[i];
		array.push(['', item.date, item.weekday, item.country, item.channel, item.impressions, item.views,
			item.sales, item.sessions, item.units, item.views_cr]);
	}

	return array;
}

function _printTimeSeries(params, report) {
	var array = [];
	array.push([params.ext_id, report.query.country.toUpperCase(), params.from, params.to, params.channel,
		'', '', '', '', '', '']);
	array.push(['', 'Date', 'Weekday', 'Country', 'Channel', 'Impressions', 'Views', 'App Units',
		'CRI: App Units / Impressions', 'CRV: App Units / Views', 'CR: Views / Impressions']);

	for (var i in report.data) {
		var item = report.data[i];
		array.push(['', item.date, item.weekday, item.country, item.channel, item.sum_impressions,
			item.sum_views, item.sum_units, item.impressions_cr, item.views_cr, item.vi_cr]);
	}

	return array;
}

function _printChannel(params, report) {
	var array = [];
	array.push([params.ext_id, report.query.country.toUpperCase(), params.from, params.to, params.channel,
		'', '', '', '', '', '']);

	array.push(['', 'Date', 'Weekday', 'Country', 'Channel', 'Impressions Uniq', 'Views Uniq',
		'App Units', 'CRI: App Units / Impressions', 'CRV: App Units / Views', 'CR: Views / Impressions']);

	for (var i in report.data) {
		var item = report.data[i];
		array.push(['', item.date, item.weekday, item.country, item.channel, item.impressions_uniq,
			item.views_uniq, item.units, item.impressions_cr, item.views_cr, item.vi_cr]);
	}

	return array;
}

function _printChannelAndroid(params, report) {
	var array = [];
	array.push([params.ext_id, report.query.country.toUpperCase(), params.from, params.to, params.channel, '', '', '']);
	array.push(['', 'Date', 'Weekday', 'Country', 'Channel', 'Installers', 'Visitors', 'Conversion']);

	for (var i in report.data) {
		var item = report.data[i];
		array.push(['', item.date, item.weekday, item.country, item.channel, item.installers,
			item.visitors, item.conversion]);
	}

	return array;
}

function _printCountrySummary(params, report) {
	var array = [];
	array.push([params.ext_id, report.query.country.toUpperCase(), params.from, params.to, params.channel, '', '', '']);
	array.push(['', 'Date', 'Weekday', 'Country', 'Channel', 'Installers', 'Visitors', 'Conversion']);

	for (var i in report.data) {
		var item = report.data[i];
		array.push(['', item.date, item.weekday, item.country, item.channel, item.sum_installers,
			item.sum_visitors, item.conversion]);
	}

	return array;
}

function getASOReport(ext_id, country, date, channel) {
	var url = REPORTS_BASE_URL + '/aso_report';
	var userProperties = PropertiesService.getUserProperties();
	var cid = userProperties.getProperty('cid') || DEMO_CID;
	var apiSecret = userProperties.getProperty('apiSecret') || DEMO_APISECRET;
	var _country;

	var params = {
		'cid': cid,
		'ext_id': ext_id,
		'channel': channel || 'summary',
		's': SOURCE,
		'v': CURRENT_VERSION
	};

	if (country != undefined && country.slice(0, 1) == '2') {
		_country = _formatDate(country);
		params['from'] = _country;
		params['to'] = _country;
	} else if (country != undefined && country.length > 2) {
		params['channel'] = country;
	} else if (country != undefined) {
		if (country !== 'ww') {
			params['country'] = country;
		}
	}

	if (params.from == undefined && date == undefined) {
		var twoDaysAgo = _generateDate(-2);
		params['from'] = twoDaysAgo;
		params['to'] = params['from'];
	} else if (date != undefined && date.slice(0, 1) == '2') {
		params['from'] = date;
		params['to'] = date;
	} else if (date != undefined && typeof date.getMonth != 'function') {
		var twoDaysAgo = _generateDate(-2);
		params['from'] = twoDaysAgo;
		params['to'] = params['from'];
		params['channel'] = date;
	}

	var sign = makeSign(params, '/reports/aso_report', apiSecret);
	params['sign'] = sign;

	var res = UrlFetchApp.fetch(url, {
		'method': 'post',
		'payload': params
	});

	var text = res.getContentText();
	var report = text ? JSON.parse(text) : [];

	if ('error' in report) {
		if ('submsg' in report.error) {
			return [['ERROR: ' + report.error.msg + ' (' + report.error.submsg + ')' + '\nPlease try again or contact us.']];
		}

		return [['ERROR: ' + report.error.msg + '\nPlease try again or contact us.']];
	}

	var array = [];
	array.push([params.ext_id, report.query.country.toUpperCase(), params.from, params.channel,
		'', '', '', '', '', '', '']);

	array.push(['', 'Date', 'Weekday', 'Country', 'Channel', 'Impressions', 'Views', 'App Units',
		'CRI: App Units / Impressions', 'CRV: App Units / Views', 'CR: Views / Impressions']);

	for (var i in report.data) {
		var item = report.data[i];
		array.push(['', item.date, item.weekday, item.country, item.channel, item.impressions,
			item.views, item.units, item.impressions_cr, item.views_cr, item.vi_cr]);
	}

	return array;
}

function _showNewSheet(params, funcLabel) {
	var ss = SpreadsheetApp.getActiveSpreadsheet();

	// insert new sheet
	ss.insertSheet(ss.getSheets().length);
	sheets = ss.getSheets();

	// set name of sheet
	var sheetsId = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;

	var sheetsName = '(' + sheetsId + ') ' + funcLabel + ' | ' + params[0];
	var sheet = ss.getSheets()[sheets.length - 1].setName(sheetsName);

	var formula = _getFormula(params);
	refreshLastUpdate();
	sheet.getRange('A1').setFormula(formula).activate();
}

function _getFormula(params) {
	var firstSheetsName = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].getName();
	var formula = '=' + params[0] + '(';

	for (var i = 1; i < params.length; i++) {
		formula += '"' + params[i] + '";';
	}

	if (params.length > 1) {
		formula = formula.substring(0, formula.length - 1);
	}

	formula += ')';
	return formula;
}

function _showReport(params, funcLabel, isNewSheet, isAutoRefresh) {
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var sheets = ss.getSheets();

	if (isNewSheet) {
		_showNewSheet(params, funcLabel);
	} else {
		var func = params[0];
		var sheet;

		for (var i in sheets) {
			var sheetsName = sheets[i].getName().split(' | ')[1];
			if (func == sheetsName) {
				sheet = sheets[i];
				break;
			}
		}

		if (sheet == undefined) {
			_showNewSheet(params, funcLabel);
		} else {
			var rowsNumber = 'A' + getFirstEmptyRow(sheet);

			sheet.getRange(rowsNumber).setFormula(_getFormula(params)).activate();
		}
	}

	deleteTrigger();

	if (isAutoRefresh) {
		createSpreadsheetOpenTrigger();
	}
}

function _getLocalTime() {
	return (new Date()).toLocaleTimeString();
}

function getFirstEmptyRow(sheet) {
	var range = sheet.getDataRange();
	var values = range.getValues();

	return (values.length + 3);
}

function refreshLastUpdate() {
	if (SpreadsheetApp.getActiveSpreadsheet()) {
		var firstSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

		if (firstSheet) {
			firstSheet.getRange('A1').setValue((new Date()).toLocaleTimeString());
			firstSheet.getRange('B1').setValue('Please, don\'t delete this (first) page and value from A1');
		}
	}
}

function createSpreadsheetOpenTrigger() {
	ScriptApp.newTrigger('refreshLastUpdate')
		.timeBased()
		.everyMinutes(5)
		.create();
}

function deleteTrigger() {
	var allTriggers = ScriptApp.getProjectTriggers();
	for (var i = 0; i < allTriggers.length; i++) {
		ScriptApp.deleteTrigger(allTriggers[i]);
	}
}
