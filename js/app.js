var googleSearchKey = "AIzaSyD5moi_-N6jsin00kMULpt7pa68q809Xy8";
var googleUrl = "https://www.googleapis.com/customsearch/v1?key=" + googleSearchKey;

var alchemyApiKey = "184ae5713a19672c62356383a3b5e1be5894a3b6";
var alchemyUrl = "https://gateway-a.watsonplatform.net/calls/url/URLGetText?apikey="+alchemyApiKey;

var dbpediaUrl = "http://spotlight.sztaki.hu:2222/rest/annotate";

var sparqlRequest = String("PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                        "SELECT * WHERE { " +
                            "{ ?node rdf:type <http://dbpedia.org/ontology/Album> }" +
                            "UNION" +
                            "{ ?node rdf:type <http://schema.org/MusicAlbum> }" +
                            "UNION" +
                            "{ ?node rdf:type <http://umbel.org/umbel/rc/MusicalPerformer> }" +
                            "UNION" +
                            "{ ?node rdf:type <http://dbpedia.org/ontology/Band> }" +
                            "UNION" +
                            "{ ?node rdf:type <http://dbpedia.org/ontology/Group> }" +
                            "UNION" +
                            "{ ?node rdf:type <http://schema.org/MusicGroup> }" +
                            "UNION" +
                            "{ ?node rdf:type <http://dbpedia.org/ontology/MusicalArtist> }" +
                            "UNION" +
                            "{ ?node rdf:type <http://dbpedia.org/ontology/MusicalWork> }" +
                        "}"
                    );

var URIs = [];

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
                $.ajax({
                    method: "POST",
                    url: dbpediaUrl,
                    headers: {
                        Accept: "application/json"
                    },
                    data: {
                        text:text,
                        confidence:0.20,
                        support:20
                    }
                }).done(function(dbPediaData) {
                    _.forEach(dbPediaData.Resources, function (resource, index) {
                        var test = _.find(URIs,function(e){
                            return e == resource['@URI'];
                        });
                        if(!test){
                            URIs.push(resource['@URI']);
                            $("#results").append("<div><a target='_blank' href='"+resource['@URI']+"'>"+resource['@URI']+"</a></div>");
                        }
                        if(index==dbPediaData.Resources.length-1){
                            $("#icon-search").removeClass("loading");
                        }
                    });
                });
            });
        })
    });
}