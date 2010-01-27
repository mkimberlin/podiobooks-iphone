var hist = [];
var start = new History('Home', function() {loadPage('index.html');});

function loadPage(url) {
    showProgress();
    scrollTo(0,1);
    if (url == undefined || url == 'index.html') {
        if(url != undefined) {
            $('body').load(url + ' #container', function(){handlePageChange(function() {loadPage('index.html');}, 'Home');});
        } else {
        	handlePageChange(function() {loadPage('index.html');}, 'Home');
        }
    } else {
        $('body').load(url + ' #container', function() {
            handlePageChange(function() {loadPage(url);});
        });
    }
}

function handleStartPage() {
    hijackLinks();
    hist.unshift(start);
    removeProgress();
}

function History(title, method) {
    this.title = title;
    this.method = method;
}

function handlePageChange(historyFunction, title) {
    $('#backbutton').remove();
    if(title == undefined || title == null) {
        title = $('#header h1').html();
    } else {
        var headerText = $('#header h1');
        headerText.text(title);
    }
	setTimeout( function() {
		document.addEventListener('touchmove', function(e){ e.preventDefault(); }, false);
		myScroll = new iScroll(document.getElementById('content'));
	}, 100);
    hist.unshift(new History(title, historyFunction));
    addBackButton();
    removeProgress();
    hijackLinks();
    scrollTo(0,1);
}

function addBackButton(){
    if(hist.length > 1) {
        $('#header').prepend('<span id="backButton">'+hist[1].title+'</span>');
        $('#backButton').click(function(){
            //Remove current page
            hist.shift();
            var history = hist.shift();
            history.method();
        });
    }
}

function showProgress() {
    $('body').append('<div id="progress">Loading...</div>');
}

function removeProgress() {
    var progress = $('#progress');
    if(progress != undefined) {
        progress.remove();
    }
}

function hijackLinks() {
    var staticLinks = $('#content a.static');
    staticLinks.click(function(e){
        e.preventDefault();
        loadPage(e.target.href);
    });
}

function loadCategories() {
    showProgress();
    $.getJSON('resources/category/list',
        function(categoryList) {
            $('body').load('categories.html #container', function() {
            	populateCategories(categoryList);
            	handlePageChange(function() {loadCategories();});
            });
        });
}

function populateCategories(list) {
    var categories = list.categories;
    var categoryList = $("#categories");
    for(var idx in categories) {
        categoryList.append('<li><a href="#" onclick="javascript:loadCategory(\''+categories[idx]+'\')">'+categories[idx]+'</a></li>');
    }
}

function loadCategory(category) {
    showProgress();
    $.getJSON('resources/books/category/'+category.replace(/\//g,"-_-"),
        function(bookList) {
            $('body').load('books.html #container', function() {
            	displayBookResults(bookList);
            	handlePageChange(function() {loadCategory(category);}, category);
            });
        });
}

function displayBookResults(list) {
    if(list == undefined || list == null || list.books == undefined || list.books == null) {
        $("#books").prepend('<p id="noneFound" style="text-align:center">No Books Found</p>');
    } else {
        var books = list.books;
        $('nonFound').remove();
        var bookList = $("#books");
        if(books instanceof Array) {
            for(var idx in books) {
                bookList.append(createBookListItem(books[idx]));
            }
        } else {
            bookList.append(createBookListItem(books));
        }
    }
}

function createBookListItem(book) {
    var bookTitle = book.feedUrl.substring(book.feedUrl.lastIndexOf('/title/')+7, book.feedUrl.lastIndexOf('/feed'));
    var listItem = '<li><a href="#" onclick="javascript:loadBookDetail(\''+bookTitle+'\')">'+book.title;
    if(book.lastUpdated != undefined) {
        listItem = listItem + '<br/><span class="updateDate">Updated On: '+book.lastUpdated+'</span>';
    }
    listItem = listItem + '</a></li>';
    return listItem;    
}

function loadRandom(category) {
    showProgress();
    var resource = 'resources/books/random';
    if(category != undefined) {
        resource = resource+"/"+category;
    }
    $.getJSON(resource,
        function(book){
            $('body').load('detail.html #container',
                function() {
                    var title = book.feedUrl.substring(book.feedUrl.lastIndexOf('/title/')+7, book.feedUrl.lastIndexOf('/feed'));
                    replaceBookData(book, title);
                    handlePageChange(function() {loadBookDetail(title);});
                });
        });
}

function loadBookDetail(title) {
    showProgress();
    $.getJSON('resources/books/title/'+title,
        function(book){
            $('body').load('detail.html #container', function() {
            	replaceBookData(book, title);
            	handlePageChange(function() {loadBookDetail(title);});
            });
        });
}

function replaceBookData(book, title) {
    var bookTitle = $('#bookTitle');
    bookTitle.text(book.title);
    
    var authorText = 'by ';
    if(book.authors instanceof Array) {
       for(var idx in book.authors) {
           if(idx > 0 && idx == book.authors.length-1) {
               authorText = authorText + " and ";
           } else if(idx > 0){
               authorText = authorText + ", "
           }
           authorText = authorText + book.authors[idx];
       }
    } else {
        authorText = authorText + book.authors;
    }
    var author = $('.title>.author');
    author.text(authorText);
    
    var cover = $('#cover');
    cover.attr('src', book.imageUrl);
    
    // Replace any carriage returns.
    book.description = book.description.replace(/\r?\n|\r|\\n/g, '<br/>');
    $('#description').empty().append(book.description);
    
    var episodes = $("#episodes");
    for(var idx in book.episodes) {
        episodes.append('<li><a href="'+book.episodes[idx].url+'">'+book.episodes[idx].title+'</a></li>');
    }
}

function loadSearch() {
    $('body').load('search.html #container', function() {
        var searchForm = $('#searchForm');
        searchForm.submit(function(event){    
            search(); 
            event.preventDefault();
            return false;
        });
        handlePageChange(function() {loadPage('search.html');}, "Search");
    });
}

function search(query) {
    showProgress();
    var keywords;
    if(query == undefined) {
        keywords = $('#search').attr('value');
    } else {
        keywords = query;
    }
    $.getJSON('resources/books/search', {keyword:keywords}, 
        function(results) {
            $('body').load('search.html #container', function() {
            	populateSearchResults(keywords, results);
            	handlePageChange(function() {search(keywords);}, 'Search');
            });
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
    showProgress();
    $.getJSON('resources/books/recent',
        function(updates) {
            $('body').load('books.html #container', function() {
                displayBookResults(updates);
                handlePageChange(loadRecent, 'Recent Updates');
            });
        });
}

function loadTopTen() {
    showProgress();
    $.getJSON('resources/stats/top',
        function(updates) {
            $('body').load('books.html #container', function() {
                displayBookResults(updates);
                handlePageChange(loadTopTen, 'Top Ten');
            });
        });
}

function loadTodaysTop() {
    showProgress();
    $.getJSON('resources/stats/today',
        function(updates) {
            $('body').load('books.html #container', function() {
                displayBookResults(updates);
                handlePageChange(loadTodaysTop, 'Today\'s Top');
            });
        });
}

function loadTopOverall() {
    showProgress();
    $.getJSON('resources/stats/overall',
        function(updates) {
            $('body').load('books.html #container', function() {
                displayBookResults(updates);
                handlePageChange(loadTopOverall, 'Top Rated');
            });
        });
}

function loadTopByVotes() {
    showProgress();
    $.getJSON('resources/stats/topbyvotes',
        function(updates) {
            $('body').load('books.html #container', function() {
                displayBookResults(updates);
                handlePageChange(loadTopByVotes, 'Top By Votes');
            });
        });
}

function loadTopAllTime() {
    showProgress();
    $.getJSON('resources/stats/alltime',
        function(updates) {
            $('body').load('books.html #container', function() {
                displayBookResults(updates);
                handlePageChange(loadTopAllTime, 'All Time Top');
            });
        });
}