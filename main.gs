function getSuggestRU(term) {
  var url = 'http://api.appfollow.io/aso/suggest';
  
  var data = {
      'term' : term,
      'country' : 'RU',
      'device' : 'iphone'
  };
  
  var res = UrlFetchApp.fetch(url, {
    'method': 'post',
    'payload': data
  });
  
  var text = res.getContentText();
  var suggest = text ? JSON.parse(text) : [];
  
  var array = [[term + ' ' + data.country + ' ' + data.device]];
  for (var i in suggest) {
    var item = suggest[i];
    
    array.push([item.pos, item.term]);
  }
  
  return array;
}

function getSuggestUS(term) {
  var url = 'http://api.appfollow.io/aso/suggest';
  
  var data = {
      'term' : term,
      'country' : 'US',
      'device' : 'android'
  };
  
  var res = UrlFetchApp.fetch(url, {
    'method': 'post',
    'payload': data
  });
  
  var text = res.getContentText();
  var suggest = text ? JSON.parse(text) : [];
  
  var array = [[term + ' ' + data.country + ' ' + data.device]];
  for (var i in suggest) {
    var item = suggest[i];
    
    array.push([item.pos, item.term]);
  }
  
  return array;
}

function getSearchRU(term) {
  var url = 'http://api.appfollow.io/aso/search';
  
  var data = {
      'term' : term,
      'country' : 'RU',
      'device' : 'iphone'
  };
  
  var res = UrlFetchApp.fetch(url, {
    'method': 'post',
    'payload': data
  });
  
  var text = res.getContentText();
  var search = text ? JSON.parse(text) : [];
  
  var array = [[term + ' ' + data.country + ' ' + data.device]];
  for (var i in search) {
    var item = search[i];
    
    var title = item.title || item["itunes_id"] || item["id"];
    array.push([item.pos, title, item.artist_name, item.type]);
  }
  
  return array;
}

function getSearchUS(term) {
  var url = 'http://api.appfollow.io/aso/search';
  
  var data = {
      'term' : term,
      'country' : 'US',
      'device' : 'iphone'
  };
  
  var res = UrlFetchApp.fetch(url, {
    'method': 'post',
    'payload': data
  });
  
  var text = res.getContentText();
  var search = text ? JSON.parse(text) : [];
  
  var array = [[term + ' ' + data.country + ' ' + data.device]];
  for (var i in search) {
    var item = search[i];
    
    var title = item.title || item["itunes_id"] || item["id"];
    array.push([item.pos, title, item.artist_name, item.type]);
  }
  
  return array;
}
