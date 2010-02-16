var episodes;
var checkInterval;
var current;

function showProgress(target) {
    var progress = $('#progress');
    var page = $('body'); 
    if(target != undefined) {
        page = $(target);
    }
    if(progress.length == 0) {
        page.append('<div id="progress">Loading...</div>');
    }
}

function showNextEpisodeConfirm(target) {
    displayConfirmation(target, 'Play the next episode?',
        function(){
    	    playPause(parseInt(current)+1);
    	}
    );
}

function displayConfirmation(target, text, yesFunc, noFunc) {
	var confirm = $(target+' .confirm');
    var page = $('body');
    if(target != undefined) {
        page = $(target);
    }
    if(confirm.length == 0) {
        page.append('<div class="confirm"></div>');
        confirm = $(target+' .confirm');
        confirm.append(text);
        confirm.append('<br/><div class="yes">Yes</div><div class="no">No</div>');
        
        var callAndClose =  function(func) {
        	if(func != undefined) func();
        	$(target+' .confirm').remove();
        };
        var yesCall = function() {callAndClose(yesFunc);};
        var noCall = function() {callAndClose(noFunc);};
        
        var yes = $(target+' .confirm .yes');
        yes.bind('tap', yesCall);
        yes.bind('click', yesCall);
        
        var no = $(target+' .confirm .no');
        no.bind('tap', noCall);
        no.bind('click', noCall);
    }
}

function removeProgress() {
    var progress = $('#progress');
    if(progress != undefined) {
        progress.remove();
    }
}

function loadCategories() {
    showProgress();
    $.getJSON('resources/category/list',
        function(categoryList) {
            populateCategories(categoryList);
            removeProgress();
        });
}

function populateCategories(list) {
    var categories = list.categories;
    var categoryList = $('#categories');
    for(var idx in categories) {
        categoryList.append('<li onclick="javascript:loadCategory(\''+categories[idx]+'\')">'+categories[idx]+'</li>');
    }
}

function loadCategory(category) {
    showProgress();
    $.getJSON('resources/books/category/'+category.replace(/\//g,'-_-'),
        function(bookList) {
            displayBookResults(bookList);
            removeProgress();
        });
}

function displayBookResults(list) {
    $('#bookScroll').empty();
    if(list == undefined || list == null || list.books == undefined || list.books == null) {
        $('#bookScroll').append('<p style="text-align:center">No Books Found</p>');
    } else {
        $('#bookScroll').append('<ul class="rounded"></ul>');
        var bookList = $('#bookScroll ul');
        var books = list.books;
        if(books instanceof Array) {
            for(var idx in books) {
                var bookTitle = books[idx].feedUrl.substring(books[idx].feedUrl.lastIndexOf('/title/')+7, books[idx].feedUrl.lastIndexOf('/feed'));
                bookList.append(createBookListItem(books[idx], bookTitle));
                $('#'+bookTitle).bind('tap', function() {
                    loadBookDetail($(this).attr('id'));
                });
                $('#'+bookTitle).bind('click', function() {
                    loadBookDetail($(this).attr('id'));
                });
            }
        } else {
            bookList.append(createBookListItem(books));
        }
    }
}

function createBookListItem(book, id) {
    var listItem = '<li><a id="'+id+'" class="dissolve" href="#detail">'+book.title;
    if(book.lastUpdated != undefined) {
        listItem += '<br/><span class="updateDate">Updated On: '+book.lastUpdated+'</span>';
    }
    listItem += '</a></li>';
    return listItem;    
}

function loadRandom(category) {
    showProgress('#books');
    var resource = 'resources/books/random';
    if(category != undefined) {
        resource += '/'+category;
    }
    $.getJSON(resource,
        function(book){
            var title = book.feedUrl.substring(book.feedUrl.lastIndexOf('/title/')+7, book.feedUrl.lastIndexOf('/feed'));
            replaceBookData(book, title);
            removeProgress();
        });
}

function loadBookDetail(title) {
    showProgress('#detail');
    $('#bookDetail').empty();
    $.getJSON('resources/books/title/'+title, function(book) {
            $('#bookDetail').load('bookDetail.html', function(){
                  populateBookData(book, title);
                   removeProgress();
            });
        });
}

function populateBookData(book, title) {
    var bookTitle = $('#bookTitle');
    bookTitle.text(book.title);
    
    var authorText = 'by ';
    if(book.authors instanceof Array) {
       for(var idx in book.authors) {
           if(idx > 0 && idx == book.authors.length-1) {
               authorText += ' and ';
           } else if(idx > 0){
               authorText += ', '
           }
           authorText += book.authors[idx];
       }
    } else {
        authorText += book.authors;
    }
    var author = $('.title>.author');
    author.text(authorText);
    
    var cover = $('#cover');
    cover.attr('src', book.imageUrl);
    
    // Replace any carriage returns.
    book.description = book.description.replace(/\r?\n|\r|\\n/g, '<br/>');
    $('#description').empty().append(book.description);
    
    $("#hiddenPlayer").empty();
    var episodesList = $('#episodes');
    episodes = book.episodes
    for(var idx in episodes) {
        var content = '<li id="'+idx+'" class="episode';
        if(isPlayed(episodes[idx]) == true) {
            content +=' played';
        }
        content += '">'+episodes[idx].title;
        
        if(episodes[idx].position != 0) {
            content += '<br/><span class="currentPosition"> Current Position: ';
            content += getCurrentPosition(idx);
            content += '</span>';
        }
        
        content += '</li>';
        episodesList.append(content);
        
        $("#hiddenPlayer").append('<audio id="audio'+idx+'" src="'+episodes[idx].url+'" height="0" width="0"></audio>');
        
        $('#'+idx).bind('tap', function() {
            confirmPlay($(this).attr('id'));
        });
        $('#'+idx).bind('click', function() {
            confirmPlay($(this).attr('id'));
        });
    }
}

function isPlayed(idx) {
    return false;
}

function confirmPlay(idx) {
    displayConfirmation('#detail', 'Play this episode?',
        function(){
            playPause(idx);
        }
    );
}

function playPause(idx) {
    var audio = document.getElementById('audio'+idx);
    if (audio.paused) {
      current = idx;
      audio.play();
      if(checkInterval != undefined)
          window.clearInterval(checkInterval);
      checkInterval = window.setInterval("checkPosition("+idx+")", 1000);
    } else {
      audio.pause();
    }
}

function checkPosition(idx) {
    var audio = $('#audio'+idx);
    if(audio.paused) {
        window.clearInterval(checkInterval);
    }
    
    var duration = audio.attr('duration');
    var position = audio.attr('currentTime');
    var episode = episodes[idx];
    episodes[idx].duration = duration;
    episodes[idx].position = position;
    
    var isTest = true;
    if(duration != 0 && duration != undefined) {
        //If within a second.
        if(duration < position+1) {
            window.clearInterval(checkInterval);
            showNextEpisodeConfirm('#detail');
            updatePosition(idx, true);
            audio.remove();
        } else {
        	updatePosition(idx);
        }
    }
}

function updatePosition(idx, complete) {
    var episodeItem = $('#'+idx);
    var positionItem = $('#'+idx+' .currentPosition');
    var content;
    if(complete == true) {
    	episodeItem.addClass('complete');
    	content = ' Complete!';
    } else {
    	content = ' Current Position: ';
        content += getCurrentPosition(idx);
    }
    if(positionItem.length == 0) {
        content = '<br/><span class="currentPosition">' + content;
        content += '</span>';
        episodeItem.append(content);
    } else {
        positionItem.html(content);
    }
}

function getCurrentPosition(idx) {
    var lastTime = episodes[idx].position;
    var seconds = (lastTime%60).toFixed(0);
    if(seconds < 10) {
        seconds = "0"+seconds;
    }
    return (Math.floor(lastTime/60)).toFixed(0)+':'+seconds;    
}

function getDuration() {
    var audio = document.getElementById('audio');
    return audio.duration;
}

function loadSearch() {
    var searchForm = $('#searchForm');
    searchForm.submit(function(event){    
        search(); 
        event.preventDefault();
        return false;
    });
}

function search(query) {
    showProgress('#search');
    var keywords;
    if(query == undefined) {
        keywords = $('#search').attr('value');
    } else {
        keywords = query;
    }
    $.getJSON('resources/books/search', {keyword:keywords}, 
        function(results) {
            populateSearchResults(keywords, results);
            removeProgress();
        });
}

function populateSearchResults(keywords, result) {
    var searchForm = $('#searchForm');
    searchForm.submit(function(event){    
        search(); 
        event.preventDefault();
        return false;
    });
    
    //Avoid making multiple searches new history entries...
    var last = hist.shift();
    if(last.title != 'Search') {
        hist.unshift(last);
    }

    $('#search').attr('value', keywords);
    
    displayBookResults(result);
}

function loadRecent() {
    showProgress('#books');
    $('#bookScroll').empty();
    $('#books .toolbar h1').text('Recent Updates');
    $.getJSON('resources/books/recent',
        function(updates) {
            displayBookResults(updates);
            removeProgress();
        });
}

function loadTopTen() {
    showProgress('#books');
    $('#bookScroll').empty();
    $('#books .toolbar h1').text('Top Ten');
    $.getJSON('resources/stats/top',
        function(updates) {
            displayBookResults(updates);
            removeProgress();
        });
}

function loadTodaysTop() {
    showProgress('#books');
    $('#bookScroll').empty();
    $('#books .toolbar h1').text('Today\'s Top');
    $.getJSON('resources/stats/today',
        function(updates) {
            displayBookResults(updates);
            removeProgress();
        });
}

function loadTopOverall() {
    showProgress('#books');
    $('#bookScroll').empty();
    $('#books .toolbar h1').text('Top Rated');
    $.getJSON('resources/stats/overall',
        function(updates) {
            displayBookResults(updates);
            removeProgress();
        });
}

function loadTopByVotes() {
    showProgress('#books');
    $('#bookScroll').empty();
    $('#books .toolbar h1').text('Top By Votes');
    $.getJSON('resources/stats/topbyvotes',
        function(updates) {
            displayBookResults(updates);
            removeProgress();
        });
}

function loadTopAllTime() {
    showProgress('#books');
    $('#bookScroll').empty();
    $('#books .toolbar h1').text('All Time Top');
    $.getJSON('resources/stats/alltime',
        function(updates) {
            displayBookResults(updates);
            removeProgress();
        });
}