var hist = [];
var start = new History('Home', function() {loadPage('index.html');});

$(document).ready(function(){ 
    loadPage();
});

function loadPage(url) {
    showProgress();
    scrollTo(0,1);
    if (url == undefined || url == 'index.html') {
        if(url != undefined) {
        	$('body').load(url + ' #container', handleStartPage);
        } else {
        	handleStartPage();
        }
    } else {
        $('body').load(url + ' #container', function() {handlePageChange(url);});
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
function handlePageChange(url) {
    hijackLinks();
    var title = $("#header h1").html();
    $('#backbutton').remove();
    hist.unshift(new History(title, function() {loadPage(url);}));
    addBackButton();
    removeProgress();
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
    $('#content a.static').click(function(e){
        e.preventDefault();
        loadPage(e.target.href);
    });
}

function loadCategories() {
	showProgress();
	$.getJSON('resources/category/list',
        function(categoryList) {
		    $('body').load('categories.html #container', function() {populateCategories(categoryList);});
	    });
}

function populateCategories(list) {
    var title = $("#header h1").html();
    $('#backbutton').remove();
    hist.unshift(new History(title, loadCategories));
    addBackButton();
	
	var categories = list.categories;
    var categoryList = $("#categories");
    for(var idx in categories) {
    	categoryList.append('<li><a href="#" onclick="javascript:loadCategory(\''+categories[idx]+'\')">'+categories[idx]+'</a></li>');
    }
    removeProgress();
    scrollTo(0,1);
    hijackLinks();
}

function loadCategory(category) {
	showProgress();
	$.getJSON('resources/books/category/'+category.replace(/\//g,"-_-"),
        function(bookList) {
		    $('body').load('books.html #container', function() {populateBooks(category, bookList);});
	    });
}

function populateBooks(category, list) {
	var headerText = $('#header h1');
	headerText.text(category);
	
    $('#backbutton').remove();
    hist.unshift(new History(category, function() {loadCategory(category);}));
    addBackButton();

    displayBookResults(list);

    removeProgress();
    scrollTo(0,1);
    hijackLinks();
}

function displayBookResults(list) {
	var books = list.books;
    var bookList = $("#books");
    if(books instanceof Array) {
    	for(var idx in books) {
    		bookList.append(createBookListItem(books[idx]));
    	}
    } else {
    	bookList.append(createBookListItem(books));
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
    	    	});
        });
}

function loadBookDetail(title) {
	showProgress();
    $.getJSON('resources/books/title/'+title,
        function(book){
    	    $('body').load('detail.html #container', function() {replaceBookData(book, title);});
        });
}

function replaceBookData(book, title) {
    var bookTitle = $('#bookTitle');
    bookTitle.text(book.title);

    $('#backbutton').remove();
    hist.unshift(new History(book.title, function() {loadBookDetail(title);}));
    addBackButton();
    
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
    
    removeProgress();
    scrollTo(0,1);
    hijackLinks();
}

function loadSearch() {
	$('body').load('search.html #container', function() {
		var searchForm = $('#searchForm');
		searchForm.submit(function(event){    
		    search(); 
		    event.preventDefault();
		    return false;
		});
		handlePageChange('search.html');
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
		    $('body').load('search.html #container', function() {populateSearchResults(keywords, results);});
	    });
}

function populateSearchResults(keywords, result) {
    $('#backbutton').remove();
    
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
    hist.unshift(new History('Search', function() {search(keywords);}));
    addBackButton();
    
    $('#search').attr('value', keywords);
    
    displayBookResults(result);
    
    removeProgress();
    scrollTo(0,1);
    hijackLinks();
}

function loadRecent() {
	showProgress();
	$.getJSON('resources/books/recent',
		function(updates) {
	    	$('body').load('books.html #container', function() {
	    		populateBookResults('Recent Updates', updates, loadRecent);
	    	});
    	});
}

function loadTopTen() {
	showProgress();
	$.getJSON('resources/stats/top',
        function(updates) {
		    $('body').load('books.html #container', function() {
		    	populateBookResults('Top Ten', updates, loadTopTen);
		    });
	    });
}

function loadTodaysTop() {
	showProgress();
	$.getJSON('resources/stats/today',
        function(updates) {
		    $('body').load('books.html #container', function() {
		    	populateBookResults('Today\'s Top', updates, loadTopTen);
		    });
	    });
}

function loadTopOverall() {
	showProgress();
	$.getJSON('resources/stats/overall',
        function(updates) {
		    $('body').load('books.html #container', function() {
		    	populateBookResults('Top Rated', updates, loadTopTen);
		    });
	    });
}

function loadTopByVotes() {
	showProgress();
	$.getJSON('resources/stats/topbyvotes',
        function(updates) {
		    $('body').load('books.html #container', function() {
		    	populateBookResults('Top By Votes', updates, loadTopTen);
		    });
	    });
}

function loadTopAllTime() {
	showProgress();
	$.getJSON('resources/stats/alltime',
        function(updates) {
		    $('body').load('books.html #container', function() {
		    	populateBookResults('All Time Top', updates, loadTopTen);
		    });
	    });
}

function populateBookResults(title, list, historyFunction) {
	var headerText = $('#header h1');
	headerText.text(title);
	
    $('#backbutton').remove();
    hist.unshift(new History(title, historyFunction));
    addBackButton();
	
    displayBookResults(list);

    removeProgress();
    scrollTo(0,1);
    hijackLinks();
}