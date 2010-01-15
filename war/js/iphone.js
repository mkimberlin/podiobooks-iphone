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
    
    var cover = $('#cover');
    cover.attr('src', book.imageUrl);
    
    $('#description').text(book.description);
    
    removeProgress();
    scrollTo(0,1);
    hijackLinks();
}