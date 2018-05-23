# AppFollow Add-On for Google Sheets

*AppFollow Add-On Functions:*

1. _getSuggest(term, country, device)_

Find suggestions for App Store and Google Play.
`=getSuggest("mario", "US", "android")`

2. _getSearch(term, country, device)_

Search result positions for App Store and Google Play.
`=getSearch("supermario", "GB", "ipad")`

3. _getTrending(country, device)_

Trending searches for App Store.
`=getTrending("RU")`

4. _getKeywords(extId, country, device, date)_

Get the position of keywords for the app.
`=getKeywords("com.nintendo.zara", "US", "android")`

5. _getKeywordsCompare(extId, country, device)_

After installation of the new and old date, get a comparison of keyword positions.
`=getKeywordsCompare("com.nintendo.zara", "US", "android")`

6. _saveKeywords(country, device, keywords, collectionId)_

Edit the keywords for a device and country.
`=saveKeywords("RU", "iphone", "keywords, separated by a comma")`

7. _getReviews(extId, page, date)_

Get a list of all reviews for the app.
`=getReviews("com.nintendo.zara")`

8. _getReviewsSummary(extId, date)_

Get a summary of keywords for a certain date.
`=getReviewsSummary("com.nintendo.zara", "2015-07-24")`

9. _getRatings(extId, date)_

Get a ratings history for the app.
`=getRatings("com.nintendo.zara")`

10. _getRatingsSummary(extId, date)_

Get a summary of the ratings for the app.
`=getRatingsSummary("com.nintendo.zara", "2017-04-24")`

11. _getRankings(extId, page, date)_

Get rankings history for the app.
`=getRankings("com.nintendo.zara", "1", "2017-04-24")`

12. _getSearchAds(app, country, phrase)_

Get search ads by phrase.
`=getSearchAds("telegram", "US")`

13. _getWhatsNew(extId, page, lastModified)_

What's new.
`=getWhatsNew("com.Slack")`

14. _getCollections()_

Get collections list.
`=getCollections()`

15. _getAppsFromCollection(collectionId)_

Get list of apps from the collection.
`=getAppsFromCollection("7458")`


Default country is *US*, default device is *iphone*.
