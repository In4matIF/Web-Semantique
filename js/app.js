var googleSearchKey = "AIzaSyD5moi_-N6jsin00kMULpt7pa68q809Xy8";
var googleUrl = "https://www.googleapis.com/customsearch/v1?key=" + googleSearchKey;

var alchemyApiKey = "184ae5713a19672c62356383a3b5e1be5894a3b6";
var alchemyUrl = "https://gateway-a.watsonplatform.net/calls/url/URLGetText?apikey="+alchemyApiKey;

var dbpediaUrl = "http://spotlight.sztaki.hu:2222/rest/annotate";

$( "#button-search" ).click(function(event) {
    var search = $("#search").val();
    $("#icon-search").addClass("loading");
    getUrlList(search);
});

function getUrlList(search){
    var url = googleUrl + "&cx=013036536707430787589:_pqjad5hr1a&q=" + search + "&alt=json" + "&start=1";
    $("#results").empty();
    $.ajax({
        method: "GET",
        url: url
    }).done(function(data) {
        _.forEach(data.items,function (item) {
            $.ajax({
                method: "POST",
                url: alchemyUrl,
                data: {url:item.formattedUrl}
            }).done(function(alchemyData) {
                var text = alchemyData.getElementsByTagName('text')[0].innerHTML;
                console.log("Text : ",text);
                $.ajax({
                    method: "POST",
                    url: dbpediaUrl,
                    crossDomain: true,
                    data: {
                        text:text,
                        confidence:0.2,
                        support:20
                    }
                }).done(function(dbPediaData) {
                    $("#icon-search").removeClass("loading");
                    console.log("DBPEDIA : ",dbPediaData);
                });
            });
            $("#results").append("<div><a href='"+item.formattedUrl+"'>"+item.formattedUrl+"</a></div>");
        })
    });
}