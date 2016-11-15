var app = angular.module('webSemantiqueApp', []);

app.controller('MainCtrl', MainCtrl);
app.filter('URIDisplay', URIDisplayFilter);

MainCtrl.$inject = ['$scope'];

function MainCtrl($scope) {
    /************************************************
     *                 Variables
     *************************************************/
            /************************************************
             *                 Scope Variables
             *************************************************/
    $scope.artist = {
        name:"",
        albums:[],
        tracks:[],
        comment:"",
        image:"",
        link:""
    };
    $scope.track = {
        name:"",
        artiste:"",
        album:"",
        genre:"",
        comment:"",
        length:"",
        date:"",
        link:"",
        image:""
    };
    $scope.album = {
        name:"",
        annee:"",
        artiste:"",
        genre:"",
        labels:[],
        comment:"",
        nextAlbum:"",
        producers:[],
        tracks:[],
        link:""
    };

    $scope.searchFinished = false;
    $scope.activeType = "";
    $scope.choosenType = "";

            /************************************************
             *                 Locales Variables
             *************************************************/
    //var googleSearchKey = "AIzaSyD5moi_-N6jsin00kMULpt7pa68q809Xy8";
    var googleSearchKey = "AIzaSyA8yFNv877LLhd6khc0K6fXoptPS5pGbwI";
    var googleUrl = "https://www.googleapis.com/customsearch/v1?key=" + googleSearchKey;
    var nbGoogleLinks = 5;
    var nbGoogleImageLinks = 1;
    var imageType = "jpg";

    var alchemyApiKey = "184ae5713a19672c62356383a3b5e1be5894a3b6";
    var alchemyApiKey2 = "9ba8cb9c60c03a5735dda4d10b5579c57aeb0127";
    var alchemyUrl = "https://gateway-a.watsonplatform.net/calls/url/URLGetText?apikey="+alchemyApiKey2;

    var dbpediaUrl = "http://spotlight.sztaki.hu:2222/rest/annotate";
    var dbpediaUrl2 = "http://www.dbpedia-spotlight.com/en/annotate";

    var sparqlUrl = "http://dbpedia.org/sparql";

    var URIs = [];
    var sortedURIs = [];

    var bestURI = "";

    var cptData = 0;

    var artistType = [
        'MusicalPerformer',
        'Band',
        'Group',
        'MusicGroup',
        'MusicalArtist'
    ];

    var albumType = [
        'Album',
        'MusicalWork'
    ];

    var trackType = [
        'MusicalWork'
    ];

    var artistSparqlRequest =  "PREFIX foaf: <http://xmlns.com/foaf/0.1/> \
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
                                PREFIX dbpedia2: <http://dbpedia.org/property/> \
                                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
                                PREFIX ont: <http://dbpedia.org/ontology/> \
                                SELECT DISTINCT * WHERE { \
                                    { %artist% dbpedia2:name ?name } \
                                    UNION \
                                    { \
                                        { ?track dbpedia2:Artist %artist% } \
                                        UNION \
                                        { ?track dbpedia2:musicalArtist %artist% } \
                                        UNION \
                                        { ?track dbpedia2:musicalBand %artist% } \
                                        UNION \
                                        { ?track dbpedia2:writer %artist% } \
                                        MINUS \
                                        { ?track rdf:type ont:Album} \
                                    } \
                                    UNION \
                                    { \
                                        { ?album dbpedia2:artist %artist% } \
                                        UNION \
                                        { ?album dbpedia2:musicalArtist %artist% } \
                                        UNION \
                                        { ?album dbpedia2:musicalBand %artist% } \
                                        UNION \
                                        { ?album dbpedia2:writer %artist% } \
                                        ?album rdf:type ont:Album. \
                                        ?album dbpedia2:genre ?genre. \
                                    } \
                                    UNION \
                                    { ?band ont:formerBandMember %artist%. } \
                                    UNION \
                                    { ?band ont:bandMember %artist% } \
                                    UNION \
                                    { \
                                        { %artist% rdfs:comment ?comment } . \
                                        FILTER(langMatches(lang(?comment), \"EN\")) \
                                    } \
                                    UNION \
                                    { %artist% ont:birthDate ?birth. } \
                                    UNION \
                                    { %artist% ont:deathDate ?death. } \
                                    UNION \
                                    { %artist% foaf:depiction ?image. } \
                                    UNION \
                                    { %artist% foaf:isPrimaryTopicOf ?link }\
                                }";

    var albumSparqlRequest =   "PREFIX foaf: <http://xmlns.com/foaf/0.1/> \
                                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
                                PREFIX dbpedia2: <http://dbpedia.org/property/> \
                                PREFIX ontology: <http://dbpedia.org/ontology/> \
                                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
                                SELECT DISTINCT * WHERE { \
                                    { %album% dbpedia2:name ?name } \
                                    UNION \
                                    { %album% dbpedia2:released ?annee } \
                                    UNION \
                                    { %album% ontology:artist ?artiste } \
                                    UNION \
                                    { %album% ontology:genre ?genre } \
                                    UNION \
                                    { %album% ontology:genre ?genre } \
                                    UNION \
                                    { %album% ontology:recordLabel ?label } \
                                    UNION \
                                    { %album% rdfs:comment ?comment. \
                                    FILTER(LANGMATCHES(LANG(?comment), \"en\"))} \
                                    UNION \
                                    { %album% dbpedia2:lastAlbum ?lastAlbum } \
                                    UNION \
                                    { %album% dbpedia2:nextAlbum ?nextAlbum } \
                                    UNION \
                                    { %album% dbpedia2:type ?type } \
                                    UNION \
                                    { %album% ontology:producer ?producer } \
                                    UNION \
                                    { ?track dbpedia2:album %album%. } \
                                    UNION \
                                    { %album% foaf:isPrimaryTopicOf ?link } \
                                }";

    var trackSparqlRequest =   "PREFIX foaf: <http://xmlns.com/foaf/0.1/> \
                                PREFIX dbpedia2: <http://dbpedia.org/property/> \
                                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
                                PREFIX ontology: <http://dbpedia.org/ontology/> \
                                SELECT DISTINCT * WHERE { \
                                    { %track% dbpedia2:name ?name } \
                                    UNION \
                                    { \
                                        {%track% ontology:artist ?artiste} \
                                        UNION \
                                        {%track% ontology:musicalArtist ?artiste} \
                                    } \
                                    UNION \
                                    { %track% ontology:album ?album } \
                                    UNION \
                                    { %track% ontology:genre ?genre } \
                                    UNION \
                                    { %track% ontology:recordLabel ?label } \
                                    UNION \
                                    { \
                                        { %track% dbpedia2:writer ?creator } \
                                        UNION \
                                        { %track% dbpedia2:lyricist ?creator } \
                                        UNION \
                                        { %track% dbpedia2:composer ?creator } \
                                    } \
                                    UNION \
                                    { \
                                    %track% rdfs:comment ?comment. \
                                    FILTER(LANGMATCHES(LANG(?comment), \"en\")) \
                                    } \
                                    UNION \
                                    { \
                                    %track% dbpedia2:length ?length. \
                                    filter(datatype(?length) = <http://dbpedia.org/datatype/second>) \
                                    } \
                                    UNION \
                                    { \
                                    %track% dbpedia2:released ?date. \
                                    filter(datatype(?date) = xsd:date) \
                                    } \
                                    UNION \
                                    { %track% dbpedia2:trackNo ?no } \
                                    UNION \
                                    { %track% foaf:isPrimaryTopicOf ?link } \
                                    UNION \
                                    { %track% foaf:depiction ?image. } \
                                }";

    var testArtistSparql = "PREFIX ontology: <http://dbpedia.org/ontology/> \
                            SELECT * WHERE { \
                                { %artist% rdf:type ontology:Band } \
                                UNION \
                                { %artist% rdf:type <http://umbel.org/umbel/rc/Artist> } \
                            }";

    var testAlbumSparql =  "PREFIX ontology: <http://dbpedia.org/ontology/> \
                            SELECT * WHERE { \
                                %album% rdf:type ontology:Album \
                            }";

    var testTrackSparql =  "PREFIX ontology: <http://dbpedia.org/ontology/> \
                            SELECT * WHERE { \
                                { %track% rdf:type ontology:Song } \
                                UNION \
                                { %track% rdf:type ontology:Single } \
                            }";

    /************************************************
     *                 Listeners
     *************************************************/
    $scope.launchedSearch = function () {
        init();
        var search = $("#search").val();
        getUrlList(search);
    };

    $scope.launchedSparqlRequest = function (typeURI,URI) {
        init(typeURI);
        sparql(typeURI,URI);
    };

    $scope.googleImage = function(search){
        console.log(search);
        var url = googleUrl + "&cx=013036536707430787589:_pqjad5hr1a&q=" + search + "&alt=json" + "&start=1" + "&num=" + nbGoogleImageLinks + "&fileType=" + imageType;
        $.ajax({
            method: "GET",
            url: url,
            success: function (googleImageData) {
                console.log("GoogleImage : ",googleImageData);
                return googleImageData.items[0].link;
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log(arguments);
            }
        });
    }

    /************************************************
     *                 Functions
     *************************************************/
    function getUrlList(search){
        google(search);
    }

    function init(typeURI) {
        $("#icon-search").addClass("loading");
        $scope.artist = {
            name:"",
            albums:[],
            tracks:[],
            comment:"",
            image:"",
            link:""
        };
        $scope.track = {
            name:"",
            artiste:"",
            album:"",
            genre:"",
            comment:"",
            length:"",
            date:"",
            link:"",
            image:""
        };
        $scope.album = {
            name:"",
            annee:"",
            artiste:"",
            genre:"",
            labels:[],
            comment:"",
            nextAlbum:"",
            producers:[],
            tracks:[],
            link:""
        };

        $scope.searchFinished = false;
        if(typeURI){
            $scope.activeType = typeURI;
        }else{
            $scope.activeType = $scope.choosenType;
        }

        URIs = [];
        sortedURIs = [];
        bestURI = "";
        cptData = 0;
    }

            /************************************************
             *             Step 1 : Google
             *************************************************/
    function google(search){
        var url = googleUrl + "&cx=013036536707430787589:_pqjad5hr1a&q=" + search + " Music" + "&alt=json" + "&start=1" + "&num=" + nbGoogleLinks;
        $.ajax({
            method: "GET",
            url: url,
            success: function (googleData) {
                console.log("Google : ",googleData);
                _.forEach(googleData.items,function (item, indexGoogle) {
                    alchemyAPI(item, indexGoogle, googleData.items.length);
                })
            },
            error: function (xhr, ajaxOptions, thrownError) {
                $("#icon-search").removeClass("loading");
                console.log(arguments);
            }
        });
    }

            /************************************************
             *             Step 2 : Alchemy
             *************************************************/
    function alchemyAPI(item, indexGoogle, dataLength){
        $.ajax({
            method: "POST",
            url: alchemyUrl,
            data: {url:item.formattedUrl},
            success: function (alchemyData) {
                //console.log("Alchemy : ",alchemyData);
                dbPedia(alchemyData, indexGoogle, dataLength);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                $("#icon-search").removeClass("loading");
                console.log(arguments);
            }
        });
    }

            /************************************************
             *           Step 3 : DBPedia Spotlight
             *************************************************/
    function dbPedia(alchemyData, indexGoogle, dataLength) {
        var text = alchemyData.getElementsByTagName('text')[0].innerHTML;
        text = formatText(text);
        $.ajax({
            method: "POST",
            url:dbpediaUrl2,
            headers: {
                Accept: "application/json"
            },
            data: {
                text:text,
                confidence:0.5,
                support:0
            },
            success: function (dbPediaData) {
                console.log("DBPedia : ",dbPediaData);
                cptData++;
                _.forEach(dbPediaData.Resources, function (resource, index) {
                    filterPush(resource, index, dbPediaData, dataLength);
                });
            },
            error: function (xhr, ajaxOptions, thrownError) {
                cptData++;
                $("#icon-search").removeClass("loading");
                console.log(arguments);
            }
        });
    }

            /************************************************
             *             Step 4 : Test Type Sparql
             *************************************************/
    function testTypeSparql(typeURI) {
        if(!typeURI) typeURI = 'artist';
        var sparqlRequest = generateSparqlRequest(true, typeURI, generateBestURI());
        $.ajax({
            method: "POST",
            url: sparqlUrl,
            headers: {
                Accept: "application/json"
            },
            data: {
                query:sparqlRequest
            },
            success: function (data) {
                //console.log("TestTypeSparql : ",data);
                if(data.results.bindings.length > 0){
                    sparql(typeURI);
                }else{
                    switch (typeURI){
                        case 'artist':
                            testTypeSparql('album');
                            break;
                        case 'album':
                            testTypeSparql('track');
                            break;
                        case 'track':
                            console.log("unknowned URI type");
                            $("#icon-search").removeClass("loading");
                            break;
                    }
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                $("#icon-search").removeClass("loading");
                console.log(arguments);
            }
        });
    }


            /************************************************
             *             Step 5 : Sparql
             *************************************************/
    function sparql(typeURI, URI) {
        if(URI){
            var sparqlRequest = generateSparqlRequest(false, typeURI, URI);
        }else{
            var sparqlRequest = generateSparqlRequest(false, typeURI, generateBestURI());
        }
        $.ajax({
            method: "POST",
            url: sparqlUrl,
            headers: {
                Accept: "application/json"
            },
            data: {
                query:sparqlRequest
            },
            success: function (data) {
                //console.log("Sparql : ",data);
                formatResultSparql(data, typeURI);
                $("#icon-search").removeClass("loading");
            },
            error: function (xhr, ajaxOptions, thrownError) {
                $("#icon-search").removeClass("loading");
                console.log(arguments);
            }
        });
    }


            /************************************************
             *             Treatment Functions
             *************************************************/
    function generateSparqlRequest(test, typeURI, URI){
        if(!test){
            switch (typeURI){
                case 'artist':
                    return _.replace(artistSparqlRequest,new RegExp("%artist%", 'g'), URI);
                case 'album':
                    return _.replace(albumSparqlRequest,new RegExp("%album%", 'g'), URI);
                case 'track':
                    return _.replace(trackSparqlRequest,new RegExp("%track%", 'g'), URI);
            }
        } else{
            switch (typeURI){
                case 'artist':
                    return _.replace(testArtistSparql,new RegExp("%artist%", 'g'), URI);
                case 'album':
                    return _.replace(testAlbumSparql,new RegExp("%album%", 'g'), URI);
                case 'track':
                    return _.replace(testTrackSparql,new RegExp("%track%", 'g'), URI);
            }
        }
    }

    function generateBestURI() {
        sortedURIs = Object.keys(URIs).sort(function(a,b){return URIs[b]-URIs[a]});
        bestURI = "<" + sortedURIs[0] + ">";
        return bestURI;
    }

    function formatText(text) {
        if(text==''){
            return "="
        }else{
            return unescape(encodeURIComponent(text));
        }
    }

    function filterPush(resource, index, dbPediaData, dataLength) {
        var bool = false;
        if(resource['@types']=="") bool = true;
        switch ($scope.choosenType){
            case 'artist':
                _.forEach(artistType,function (type) {
                    if(resource['@types'].indexOf(type) !== -1) bool = true;
                });
                break;
            case 'album':
                _.forEach(albumType,function (type) {
                    if(resource['@types'].indexOf(type) !== -1) bool = true;
                });
                break;
            case 'track':
                _.forEach(trackType,function (type) {
                    if(resource['@types'].indexOf(type) !== -1) bool = true;
                });
                break;
        }
        if(bool){
            if (URIs[resource['@URI']]){
                URIs[resource['@URI']]++;
            } else {
                URIs[resource['@URI']] = 1;
            }
        }
        if(index === dbPediaData.Resources.length-1 && cptData === dataLength){
            if($scope.choosenType == "artist"
                || $scope.choosenType == "album"
                || $scope.choosenType == "track"){
                sparql($scope.choosenType);
            }else{
                testTypeSparql();
            }
        }
    }

    function formatResultSparql(data, typeURI) {
        switch (typeURI){
            case 'artist':
                _.forEach(data.results.bindings, function (binding) {
                    _.forEach(binding, function (value, key, object) {
                        if(key=='genre') {
                            if(!_.find(
                                    $scope.artist['albums'],
                                    function (e) {return e['album'].value==object['album'].value;}
                                )
                            ){
                                $scope.artist['albums'].push(object);
                            }
                        }else if (key!='album'){
                            $scope.artist[key] = value.value;
                        }
                    });
                });
                break;
            case 'album':
                _.forEach(data.results.bindings, function (binding) {
                    _.forEach(binding, function (value, key, object) {
                        if(key=='label') {
                            $scope.album['labels'].push(object['label'].value);
                        }else if(key=='track'){
                            $scope.album['tracks'].push(object['track'].value);
                        }else if(key=='producer'){
                            $scope.album['producers'].push(object['producer'].value);
                        }else{
                            $scope.album[key] = value.value;
                        }
                    });
                });
                break;
            case 'track':
                _.forEach(data.results.bindings, function (binding) {
                    _.forEach(binding, function (value, key, object) {
                        $scope.track[key] = value.value;
                    });
                });
                break;
        }
        $scope.searchFinished = true;
        $scope.$apply();
    }

    $scope.URIDisplay = function (URI) {
        var output = URI.substr(URI.lastIndexOf("/") + 1);
        output = _.replace(output,new RegExp("_", 'g'), ' ');
        return output;
    }
}

function URIDisplayFilter() {

    return function(URI) {

        var output = URI.substr(URI.lastIndexOf("/") + 1);
        output = _.replace(output,new RegExp("_", 'g'), ' ');
        return output;

    }

}
