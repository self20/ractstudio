/* jshint -W117 */
/* jshint -W098 */

(function($){

    $.fn.spidochetubeTuts = function(options){

        //Set the option
        var settings = $.extend({
            key              : "",
            id               : "GoogleDevelopers",  // youtube user id is case sensitive
            max_results      : 10,
            autoplay         : 0,
            theme            :'dark',
            paging           : 0,
            scroll_duration  : 0,
            first_load       : true
        },options);

        //Stop the script here if no api key
        if(settings.key === ""){
            console.log('api key not defined');
            return;
        }

        return this.each(function(){

            var $this = $(this);
            var max_results = 0;
            var total_results = 0;
            var id = settings.id;
            var url= "";
            var next_page = "";
            var next_page_data = "";
            var first_load = settings.first_load;

            // Get the max results to display per page
            if(settings.max_results <= 50){
                max_results = settings.max_results;
            }else{
                max_results = 50;
            }

            // Add The Player container and the playlist container HTML only once
            if(first_load === true){
                init_item_click($this, settings.scroll_duration);
                $this.html('<div class="spidochetubeTuts_inner"><div id="spidochetubeTuts_player"></div><ul id="spidochetubeTuts_list"></ul></div>');

                if(settings.paging === "loadmore"){
                    $('#spidochetubeTuts_list').after('<a id="spidochetubeTuts_loadmore" href="#">More</a>');
                }
            }

            // get next page token
            next_page_data = $('#spidochetubeTuts_loadmore').attr('data-next');

            if(next_page_data !== undefined){
                next_page = next_page_data;
            }

            // Build the url
            url ="https://www.googleapis.com/youtube/v3/playlistItems?playlistId="+id+"&orderby=reversedPosition&pageToken="+next_page+"&maxResults="+max_results+"&key="+settings.key+"&part=snippet,status,contentDetails";

            //Connect to youtube via json
            $.getJSON(url,function(data){

                // Get the total results
                total_results = data.pageInfo.totalResults;
                next_page = data.nextPageToken;

                $.each(data.items, function(index,item){

                    // inspect the item object to know all the information available
                    // console.log(item);

                    // Get the video information
                    var snippet = item.snippet;
                    var title = snippet.title;
                    var status = item.status.privacyStatus;
                    var video_id  = "";
                    var thumb_url = "";
                    var video_url = "";

                    // Do not show video that display error message
                    if(status !== "public") {
                        return;
                    }

                    // Do not show video without thumbnail (no thumbnail === no available)
                    if(snippet.thumbnails !== undefined){
                        video_id  = snippet.resourceId.videoId;
                        thumb_url = snippet.thumbnails.medium.url; // get medium quality thumb url
                        video_url = "https://www.youtube.com/embed/"+video_id;
                    }else{
                        return;
                    }

                    // Create the html
                    html  = '<li>';
                    html += '<a title="'+title+'" href="'+video_url+'" data-youtubeID="'+video_id+'">';
                    html += '<img src="'+thumb_url+'" alt="'+title+'" />';
                    html += '<span>'+title+'</span>';
                    html += '</a>';
                    html += '</li>';

                    // Display the html
                    $('#spidochetubeTuts_list').append(html);

                    // Update the page token tracker or hide the load more button
                    if(data.nextPageToken !== undefined){
                        // Update the page token
                        $('#spidochetubeTuts_loadmore').attr('data-next',next_page);
                    }else{
                        // Hide the loader
                        $('#spidochetubeTuts_loadmore').css('visibility','hidden');

                    }
                }); //END $.each(data.items)

            }).complete(function(){

                // When the JSON request is complete
                // Initialize the first video
                if(first_load === true){
                    var first_video_id = $('#spidochetubeTuts_list li:first-child a').attr('data-youtubeID');
                    var first_video_url = iframe_src(first_video_id, settings.autoplay, settings.theme);
                    var iframe_html = '<iframe id="player" src="'+first_video_url+'" width="640" height="360" frameborder="0" allowfullscreen></iframe>';

                    $('#spidochetubeTuts_list li:first-child').addClass('spidochetubeTuts_current');

                    $('#spidochetubeTuts_player').append(iframe_html);
                }

                // Load more click event
                $('#spidochetubeTuts_loadmore').off('click').on('click',function(){
                    $this.spidochetube({
                        key         : settings.key,
                        id          : settings.id,
                        max_results : settings.max_results,
                        paging      : settings.paging,
                        first_load  : false
                    });
                    return false;
                });

                // Set player iframe height
                set_player_height();
                $(window).resize(set_player_height);

                // Create callback function when the feed is completly loaded
                if($.isFunction(settings.complete)){
                    settings.complete.apply($this);
                }

            }); // END getJSON

        });// END each()

        // Build and return the youtube iframe src
        function iframe_src(iframe_video_id, autoplay, theme){

            var src = 'http://www.youtube.com/embed/'+iframe_video_id+'?version=3&loop=1&autoplay='+autoplay+'&rel=0&showsearch=0&showinfo=0&theme='+theme;
            return src;

        }

        // Keep player height ratio on resize
        function set_player_height(){

            var ratio = 1.7777777777777777; // ratio for 640*360 video
            var player_width = $('#player').width();
            var player_height = player_width / ratio;

            $('#player').height(player_height);

        }

        // Add delegate click event
        function init_item_click($el, scroll_duration){

            // Update the video on click, scroll to the player and toggle the current class
            $el.on('click','li a',function(e){
                e.preventDefault();
                var next_video_id = $(this).attr('data-youtubeID');
                var next_video_url = iframe_src(next_video_id, settings.autoplay, settings.theme);

                $('#spidochetubeTuts_list li').removeClass('spidochetubeTuts_current');
                $(this).parent().addClass('spidochetubeTuts_current');

                $('html, body').animate({
                    scrollTop: $('#spidochetubeTuts_player').offset().top
                }, scroll_duration, function(){
                    $('#spidochetubeTuts_player iframe').attr('src' , next_video_url);
                });

            });
        }

    }; //END spidochetubeTuts

})(jQuery);
