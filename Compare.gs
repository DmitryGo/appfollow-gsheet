function getKeywordsCompare(ext_id, oldDate, newDate, country, device) {
	var userProperties = PropertiesService.getUserProperties();
	var cid = userProperties.getProperty('cid') || DEMO_CID;
	var apiSecret = userProperties.getProperty('apiSecret') || DEMO_APISECRET;

	if (oldDate != undefined && newDate != undefined) {
		if (oldDate < newDate) {
			PropertiesService.getUserProperties().setProperty('old_date', oldDate);
			PropertiesService.getUserProperties().setProperty('new_date', newDate);
		} else {
			PropertiesService.getUserProperties().setProperty('old_date', newDate);
			PropertiesService.getUserProperties().setProperty('new_date', oldDate);
		}
	} else {
		return 'Please enter a valid date.';
	}

	var params = {
		'cid': cid || DEMO_CID,
		'ext_id': ext_id,
		'country': country || DEFAULT_COUNTRY,
		'device': device || DEFAULT_DEVICE
	};

	return _compare(params);
}

function _compare(params) {
	// First Date
	params['date'] = PropertiesService.getUserProperties().getProperty('new_date');
	var list = _kws_req(params);
	var hash = {};

	for (var i in list) {
		var item = list[i];

		hash[item.kw] = {};
		hash[item.kw]['new_value'] = item.pos;
	}

	// Compare Date
	params['date'] = PropertiesService.getUserProperties().getProperty('old_date');
	var list2 = _kws_req(params);

	for (var i in list2) {
		var item = list2[i];

		if (!hash[ item.kw ]) {
			hash[ item.kw ] = {};
		}

		hash[ item.kw ]['old_value'] = item.pos;
	}

	var array = [['Keywords', 'Old Position', 'New Position', 'Difference']];
	for (var kw in hash) {
		var item = hash[kw];
		var old_value = item['old_value'];
		var new_value = item['new_value'];

		var diff =
			new_value && old_value ? old_value - new_value :
			!new_value ? 'out' :
			!old_value ? 'new' : 'undefined'
		;

		array.push([kw, old_value || '-', new_value || '-', diff || "'="]);
	}

	return array;
}

function _kws_req(params) {
	var apiSecret = PropertiesService.getUserProperties().getProperty('apiSecret') || DEMO_APISECRET;
	var res = makeRequest(params, '/keywords', apiSecret);
	var json = JSON.parse(res);

	return json['keywords']['list'];
}
