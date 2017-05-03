function getKeywordsCompare(extId, country, device) {
	var userProperties = PropertiesService.getUserProperties();
	var cid = userProperties.getProperty('cid');
	var apiSecret = userProperties.getProperty('apiSecret');

	var params = {
		'cid': cid,
		'ext_id': extId,
		'country': country || 'US',
		'device': device || 'iphone',
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

		if (!hash[item.kw]) {
			hash[item.kw] = {};
		}

		hash[item.kw]['old_value'] = item.pos;
	}

	var array = [['Keywords', 'New Position', 'Old Position', 'Difference']];

	for (var kw in hash) {
		var item = hash[kw];

		var old_value  = item['old_value'] || 0;
		var new_value  = item['new_value'] || 0;

		var diff = new_value && old_value
			? new_value - old_value
			: !new_value
				? 'out'
				: !old_value
					? 'new'
					: 'undefined';

		array.push([kw, old_value || '-', new_value || '-', diff || '=']);
	}

	return array;
}

// sets

function setOldDate(value) {
	if (value) {
		PropertiesService.getUserProperties().setProperty('old_date', value);
	}

	return PropertiesService.getUserProperties().getProperty('old_date');
}

function setNewDate(value) {
	if (value) {
		PropertiesService.getUserProperties().setProperty('new_date', value);
	}

	return PropertiesService.getUserProperties().getProperty('new_date');
}

function _kws_req(params) {
	var apiSecret = PropertiesService.getUserProperties().getProperty('apiSecret');
	var res  = makeRequest(params, '/keywords', apiSecret);
	var json = JSON.parse(res);

	return json['keywords']['list'];
}
