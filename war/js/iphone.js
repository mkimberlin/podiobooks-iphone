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
    	$('#header').prepend('<div id="backButton">'+hist[1].title+'</div>');
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
//    var header = $('#header');
//    if(header != undefined) {
//        header.click(function(){
//            loadPage('index.html');
//        });
//    }
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
	
	var books = list.books;
    var bookList = $("#books");
    if(books instanceof Array) {
    for(var idx in books) {
    	var bookTitle = books[idx].url.substring(books[idx].url.lastIndexOf('/title/')+7, books[idx].url.lastIndexOf('/feed'));
    	bookList.append('<li><a href="#" onclick="javascript:loadBookDetail(\''+bookTitle+'\')">'+books[idx].title+'</a></li>');
    }
    } else {
    	var bookTitle = books.url.substring(books.url.lastIndexOf('/title/')+7, books.url.lastIndexOf('/feed'));
    	bookList.append('<li><a href="#" onclick="javascript:loadBookDetail(\''+bookTitle+'\')">'+books.title+'</a></li>');
    }
    removeProgress();
    scrollTo(0,1);
    hijackLinks();
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