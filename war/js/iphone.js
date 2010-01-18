$(document).ready(function(){ 
    loadPage();
});
function loadPage(url) {
    showProgress();
    if (url == undefined) {
        hijackLinks();
        removeProgress();
    } else {
        $('body').load(url + ' #container', hijackLinks);
    }
    scrollTo(0,1);
}
function showProgress() {
	$('body').append('<div id="progress">Loading...</div>');
}
function removeProgress() {
	$('#progress').remove();
}
function hijackLinks() {
    var header = $('#header');
    if(header != undefined) {
        header.click(function(){
            loadPage('index.html');
        });
    }
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
	$.getJSON('resources/books/category/'+category,
        function(bookList) {
		    $('body').load('books.html #container', function() {populateBooks(category, bookList);});
	    });
}
function populateBooks(category, list) {
	var headerText = $('#header h1');
	headerText.text(category);
	
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
    	    $('body').load('detail.html #container', function() {replaceBookData(book);});
        });
}
function replaceBookData(book) {
    var bookTitle = $('#bookTitle');
    bookTitle.text(book.title);
    bookTitle.click(function(){
        loadPage('index.html');
    });
    
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