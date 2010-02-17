var episodes;
var checkInterval;
var current;

function showProgress(target) {
    var progress = $('div.progress');
    var page = $('body'); 
    if(target != undefined) {
        page = $(target);
    }
    if(progress.length == 0) {
        page.append('<div class="progress">Loading...</div>');
    }
}

function showNextEpisodeConfirm(target) {
	$("#hiddenPlayer").empty();
	$("#hiddenPlayer").append('<audio src="'+episodes[current+1].url+'" height="0" width="0"></audio>');
	current = current+1;
    displayConfirmation(target, 'Play the next episode?',
        function(){
    	    playPause();
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
    var progress = $('div.progress');
    if(progress != undefined) {
        progress.remove();
    }
}

function loadCategories() {
    showProgress('#categorypage');
    $.getJSON('resources/category/list',
        function(categoryList) {
            populateCategories(categoryList);
            removeProgress();
        });
}

function populateCategories(list) {
    var categories = list.categories;
    var categoryList = $('#categoryScroll');
    categoryList.empty();
    if(categories == undefined || categories == null) {
    	categoryList.append('<p style="text-align:center">No Categories Found!</p>');
    } else {
    	categoryList.append('<ul class="rounded"></ul>');
    	categoryList = $('#categoryScroll ul');
        for(var idx in categories) {
            categoryList.append('<li><a id="cat'+idx+'" href="#books">'+categories[idx]+'</a></li>');
            $('#cat'+idx).bind('tap', function(){loadCategory($(this).text());});
            $('#cat'+idx).bind('click', function(){loadCategory($(this).text());});
        }
    }
}

function loadCategory(category) {
    showProgress('#books');
    $.getJSON('resources/books/category/'+category.replace(/\//g,'-_-'),
        function(bookList) {
            displayBookResults(bookList);
            removeProgress();
        });
}

function displayBookResults(list, target) {
	if(target == undefined) {
		target = '#bookScroll';
	}
	
    $(target).empty();
    if(list == undefined || list == null || list.books == undefined || list.books == null) {
        $(target).append('<p style="text-align:center">No Books Found</p>');
    } else {
        $(target).append('<ul class="rounded"></ul>');
        var bookList = $(target+' ul');
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
    var listItem = '<li><a id="'+id+'" class="slideup" href="#detail">'+book.title;
    if(book.lastUpdated != undefined) {
        listItem += '<br/><span class="updateDate">Updated On: '+book.lastUpdated+'</span>';
    }
    listItem += '</a></li>';
    return listItem;    
}

function loadAnyRandom() {
	loadRandom();
}

function loadRandom(category) {
    showProgress('#detail');
    var resource = 'resources/books/random';
    if(category != undefined) {
        resource += '/'+category;
    }
    $.getJSON(resource,
        function(book){
            var title = book.feedUrl.substring(book.feedUrl.lastIndexOf('/title/')+7, book.feedUrl.lastIndexOf('/feed'));
            $('#bookDetail').load('bookDetail.html', function(){
                populateBookData(book, title);
                removeProgress();
            });
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
	if(current != parseInt(idx)) {
        $("#hiddenPlayer").empty();
        $("#hiddenPlayer").append('<audio src="'+episodes[parseInt(idx)].url+'" height="0" width="0"></audio>');
	}
    current = parseInt(idx);
    displayConfirmation('#detail', 'Play this episode?',
        function(){
            playPause();
        }
    );
}

function playPause() {
    var audio = $('#hiddenplayer audio')[0];
    if (audio.paused) {
      audio.play();
      if(checkInterval != undefined)
          window.clearInterval(checkInterval);
      checkInterval = window.setInterval("checkPosition()", 1000);
    } else {
      audio.pause();
    }
}

function checkPosition() {
    var audio = $('#hiddenplayer audio');
    if(audio[0].paused) {
        window.clearInterval(checkInterval);
    }
    
    var duration = audio.attr('duration');
    var position = audio.attr('currentTime');
    var episode = episodes[current];
    episodes[current].duration = duration;
    episodes[current].position = position;
    
    var isTest = true;
    if(duration != 0 && duration != undefined) {
        //If within a second.
        if(duration < position+1) {
        	//The order of these calls is important.
            audio.remove();
            window.clearInterval(checkInterval);
            updatePosition(current, true);
            showNextEpisodeConfirm('#detail');
        } else {
        	updatePosition(current);
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
    var audio = $('#hiddenplayer audio');
    return audio.attr('duration');
}

function search() {
    showProgress('#searchpage');
    var keywords = $('#search').attr('value');
    $.getJSON('resources/books/search', {keyword:keywords}, 
        function(results) {
    	    displayBookResults(results, '#results');
            removeProgress();
        });
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