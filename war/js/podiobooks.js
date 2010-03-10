/*jslint undef: true, browser: true */  
/*global jQuery, $, openDatabase*/  

"use strict";
var Podiobooks = (function () {
    var episodes,
        nowPlaying,
        currentTitle,
        db,
        checkInterval,
        positionInterval,
        setPositionInterval,

    confirmDelete = function (toRemove) {
        Podiobooks.displayConfirmation($('#books'), 'Remove this title?',
            function () {
                Podiobooks.deleteFavorite(toRemove);
                Podiobooks.loadFavorites();
            }
        );
    },
    
    /**
     * Creates a list item representing a book with the given title, id and last
     * update date.
     */
    createBookListItem = function (title, id, updated) {
        var listItem = '<li><a id="' + id + '" href="#detail">' + title;
        if (updated !== undefined) {
            listItem += '<br/><span class="updateDate">Updated On: ' + updated + '</span>';
        }
        listItem += '</a></li>';
        return listItem;    
    },
        
    /**
     * Builds the menu of favorites for display.
     */
    displayFavorites = function (transaction, result) {
        var bookList,
            bookElement, i,
            row, title, id,
            page = $('#favorites'),
            books = page.find('.bookList'),
            loadBookHandler = function () {
                Podiobooks.loadBookDetail('resources/books/title/' + $(this).attr('id'));
            },
            deleteHandler = function () {
                confirmDelete($(this).attr("id"));
            };
            
        books.empty();
        
        if (result.rows.length === 0) {
            books.append('<p style="text-align:center">No Favorites Found</p>');
        } else {
            books.append('<ul class="edgetoedge"></ul>');
            bookList = books.find('ul');
            for (i = 0; i < result.rows.length; i = i + 1) {
                row = result.rows.item(i);
                title = row.title;
                id = row.id;
                bookList.append(createBookListItem(title, id));
                bookElement = $('#' + id);
                bookElement.bind('tap', loadBookHandler);
                bookElement.bind('click', loadBookHandler);
                bookElement.swipe(deleteHandler);
            }
        }
        Podiobooks.removeProgress(page);
    },
    
    /**
     * Parses a book's ID from the RSS feed URL.
     */
    getIdFromFeedUrl = function (url) {
        return url.substring(url.lastIndexOf('/title/') + 7,
                url.lastIndexOf('/feed'));
    },
    
    /**
     * Creates a menu of book items from the given list of books in the provided
     * target div (if specified).  If no target div is given, then the default
     * "#books .bookList" selector will be used.  If no books are in the given
     * list, then a message indicating this will be displayed.
     */
    displayBooks = function (bookList, target) {
        var list, books, idx, id, detailHandler;
        if (target === undefined) {
            target = $('#books .bookList');
        }
        
        if (target.children().length !== 0) {
            target.empty();
        }
        
        if (bookList !== null && bookList.error !== undefined && bookList.error !== "") {
            target.append('<p style="text-align:center">' + bookList.error + '</p>');
        } else if (bookList === null || bookList.books === undefined || bookList.books.length === 0) {
            target.append('<p style="text-align:center">No Books Found</p>');
        } else {
            target.append('<ul class="edgetoedge"></ul>');
            list = target.children('ul');
            books = bookList.books;
            
            detailHandler = function () {
                Podiobooks.loadBookDetail('resources/books/title/' + $(this).attr('id'));
            };
            
            if (books instanceof Array) {
                for (idx in books) {
                    if (!isNaN(Number(idx))) {
                        id = getIdFromFeedUrl(books[idx].feedUrl);
                        list.append(createBookListItem(books[idx].title, id, books[idx].lastUpdated));
                        $('#' + id).bind('tap', detailHandler);
                        $('#' + id).bind('click', detailHandler);
                    }
                }
            } else {
                id = getIdFromFeedUrl(books.feedUrl);
                list.append(createBookListItem(books.title, id));
                $('#' + id).bind('tap', detailHandler);
                $('#' + id).bind('click', detailHandler);
            }
        }
    },
    
    /**
     * Loads books asynchronously from the specified JSON resource and uses the
     * the specified title for the page.  If specified, the page and bookList
     * divs will be used for to display the results, otherwise the default
     * "#books" and ".bookList" divs will be populated respectively.
     */
    loadBooksAsync = function (title, resource, page, bookList) {
        if (page === undefined) {
            page = $('#books');
        }
        if (bookList === undefined) {
            bookList = page.find('.bookList');
        }
        bookList.empty();
        bookList.css('webkitTransform', 'translateX(0px)');
        
        page.find('.toolbar h1').text(title);
        Podiobooks.displayProgress(page);
        $.getJSON(resource,
            function (bookResults) {
                displayBooks(bookResults, bookList);
                Podiobooks.removeProgress(page);
            });
    },
    
    /**
     * Creates a menu of categories from the given list.  If no categories are
     * specified in the list, then a message indicating this is displayed.
     */
    populateCategories = function (list) {
        var categories = list.categories,
            categoryList = $('#categoryScroll'),
            loadCategoryHandler = function () {
                Podiobooks.loadCategory($(this).text());
            },
            idx,
            category;
        
        categoryList.empty();
        if (categories === undefined || categories === null) {
            categoryList.append('<p style="text-align:center">No Categories Found!</p>');
        } else {
            categoryList.append('<ul class="edgetoedge"></ul>');
            categoryList = categoryList.find('ul');
            for (idx in categories) {
                if (!isNaN(Number(idx))) {
                    categoryList.append('<li><a id="cat' + idx +
                        '" href="#books">' + categories[idx] + '</a></li>');
                    category = categoryList.find('#cat' + idx);
                    category.bind('tap', loadCategoryHandler);
                    category.bind('click', loadCategoryHandler);
                }
            }
        }
    },
    
    constructAuthorText = function (authors) {
        var authorText = 'by ',
            idx;
        if (authors instanceof Array) {
            for (idx in authors) {
                if (!isNaN(Number(idx))) {
                    if (idx > 0 && idx === authors.length - 1) {
                        authorText += ' and ';
                    } else if (idx > 0) {
                        authorText += ', ';
                    }
                    authorText += authors[idx];
                }
            }
        } else {
            authorText += authors;
        }
        return authorText;
    },
    
    clearPlayerIntervals = function () {
        if (checkInterval !== undefined) {
            clearInterval(checkInterval);
        }
        if (positionInterval !== undefined) {
            clearInterval(positionInterval);
        }
    },
    
    getPositionForDisplay = function (idx) {
        var lastTime = episodes[idx].position,
            seconds = (lastTime % 60).toFixed(0);
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        return (Math.floor(lastTime / 60)).toFixed(0) + ':' + seconds;    
    },
    
    setEpisodePositions = function (result) {
        var row, epIdx, i;
        
        for (i = 0; i < result.rows.length; i += 1) {
            row = result.rows.item(i);
            epIdx = row.episode;
            episodes[epIdx].complete = row.complete;
            episodes[epIdx].position = row.position;
        }
    },

    updateEpisodePosition = function (ct, idx, pos, complete) {
        db.transaction(
            function (transaction) {
                transaction.executeSql(
                    'DELETE FROM history WHERE title = ? AND episode = ?;',
                    [ct, idx]);
                transaction.executeSql(
                    'INSERT INTO history (title, episode, position, complete) VALUES (?, ?, ?, ?);', 
                    [ct, idx, pos, complete]);
            }
        );
    },
    
    updateEpisode = function () {
        updateEpisodePosition(currentTitle, nowPlaying,
                episodes[nowPlaying].position, episodes[nowPlaying].complete);
    },
    
    updatePosition = function (idx, complete) {
        var episodeItem = $('#' + idx),
            positionItem = episodeItem.find('.currentPosition'),
            content;
        
        if (complete === true) {
            episodeItem.addClass('complete');
            content = ' Complete!';
        } else {
            if (episodes[idx].position !== 0) {
                content = ' Current Position: ';
                content += getPositionForDisplay(idx);
            }
        }
        positionItem.html(content);
    },
    
    showNextEpisodeConfirm = function () {
        var player = $("#player");
        Podiobooks.displayConfirmation($('#detail'), 'Play the next episode?', Podiobooks.playPause);
        
        nowPlaying = nowPlaying + 1;
        
        player.empty();
        player.append('<audio src="' +
                episodes[nowPlaying].url + '" height="0" width="0"></audio>');
    },
    
    checkPosition = function () {
        var audio = $('#player audio'),
            duration,
            position,
            episode;
        
        if (!audio[0].paused) {
	        duration = audio.attr('duration');
	        position = audio.attr('currentTime');
	        episode = episodes[nowPlaying];
	        episodes[nowPlaying].duration = duration;
	        if (position !== 0) {
	            episodes[nowPlaying].position = position;
	        }
	        
	        if (duration !== 0 && duration !== undefined) {
	            //If within a second.
	            if (duration < position + 1) {
	                //The order of these calls is important.
	                clearPlayerIntervals();
	                audio.remove();
	                updatePosition(nowPlaying, true);
	                episodes[nowPlaying].complete = true;
	                updateEpisode();
	                showNextEpisodeConfirm();
	            } else {
	                updatePosition(nowPlaying);
	            }
	        }
        }
    },
    
    attemptSeekToLastPosition = function () {
        var audio = $('#player audio')[0];
        if (audio.seekable && audio.currentTime !== 0) {
            if (audio.currentTime < episodes[nowPlaying].position) {
                audio.currentTime = episodes[nowPlaying].position;
            }
            if (audio.currentTime > episodes[nowPlaying].position) {
                clearInterval(setPositionInterval);
            }
        }
    },
    
    confirmPlay = function (idx) {
        var player = $("#player"),
            audio;
        idx = parseInt(idx, 10);
        if (nowPlaying !== idx) {
            player.empty();
            player.append('<audio src="' + episodes[idx].url + '" height="0" width="0"></audio>');
        }
        nowPlaying = idx;
        audio = player.find('audio')[0];
        
        if (!audio.paused) {
            Podiobooks.playPause();
        } else {
            Podiobooks.displayConfirmation($('#detail'), 'Play this episode?',
                function () {
                    Podiobooks.playPause();
                    setPositionInterval = setInterval(attemptSeekToLastPosition, 500);
                    setTimeout(function () {
                        if (setPositionInterval !== null) {
                            clearInterval(setPositionInterval);
                        }
                    }, 30000);
                }
            );
        }
    },
    
    displayEpisodes = function () {
        var episodesList = $('#episodes'), idx,
            content, episodeElem,
            playHandler = function () {
                confirmPlay($(this).attr('id'));
            };
        episodesList.empty();
            
        for (idx in episodes) {
            if (!isNaN(Number(idx))) {
                content = '<li id="' + idx + '" class="episode';
            
                //Determine if we need the complete class
                if (episodes[idx].complete.toLowerCase() === 'true') {
                    content += ' complete';
                }
                content += '">' + episodes[idx].title;
                content += '<br/><span class="currentPosition">';
                
                //Determine if we need the position information
                if (episodes[idx].complete.toLowerCase() === 'true') {
                    content += ' Complete!';
                } else if (parseFloat(episodes[idx].position, 10) !== 0) {
                    content += ' Current Position: ' + getPositionForDisplay(idx);
                }
                content += '</span></li>';
            
                episodesList.append(content);
                episodeElem = $('#' + idx);
                episodeElem.bind('tap', playHandler);
                episodeElem.bind('click', playHandler);
            }
        }
    },
    
    populateEpisodeData = function (transaction, result) {
        setEpisodePositions(result);
        displayEpisodes();
    },
    
    loadEpisodeData = function (transaction) {
        transaction.executeSql(
            'SELECT * FROM history WHERE title = ? ORDER BY episode;', 
            [currentTitle], populateEpisodeData
        );
    },
    
    populateEpisodes = function () {
        db.transaction(loadEpisodeData);
    },
    
    populateBookData = function (book, title) {
        var descriptionHandler = function () {
                $('#description').hide();
                $('#fullDescription').show();
            },
            authorText = constructAuthorText(book.authors),
            fullDescElem = $('#fullDescription'),
            desc;
        
        clearPlayerIntervals();
        currentTitle = title;
        episodes = book.episodes;
        nowPlaying = undefined;
        
        $('#bookTitle').text(book.title); 
        $('.title>.author').text(authorText);
        $('#cover').attr('src', book.imageUrl);

        // Replace any carriage returns.
        book.description = book.description.replace(/\r?\n|\r|\\n/g, '<br/>');
        desc = book.description;
        if (book.description.length > 255) {
            desc = book.description.substring(0, 255) + '... &nbsp;<span id="expandDesc">More</span>';
        }
        $('#description').append(desc);
        fullDescElem.append(book.description);
        fullDescElem.hide();
        $('#expandDesc').bind("tap", descriptionHandler);
        $('#expandDesc').bind("click", descriptionHandler);
        
        populateEpisodes();
    },
    
    callAndClose = function (target, func) {
        target.find('.confirm').remove();
        if (func !== undefined) {
            func();
        }
    },
    
    isFavorite = function (title, id) {
        db.transaction(function (transaction) { 
            transaction.executeSql('SELECT * FROM favorites WHERE id=?;',
                [id],
                function (transaction, result) {
                    var count = result.rows.length,
                        fav = $('.favorite'),
                        deleteHandler = function () {
                            Podiobooks.deleteFavorite(id);
                            isFavorite(title, id);
                        },
                        addHandler = function () {
                            Podiobooks.addFavorite(title, id);
                            isFavorite(title, id);
                        };
                    if (count > 0) {
                        fav.html("Remove From Favorites");
                        fav.unbind();
                        fav.bind('tap', deleteHandler);
                        fav.bind('click', deleteHandler);
                    } else {
                        fav.html("Add To Favorites");
                        fav.unbind();
                        fav.bind('tap', addHandler);
                        fav.bind('click', addHandler);
                    }
                }
            );
        });
    };
    
    return {
        /**
         * Initializes the database tables if necessary.
         */
        initializeStorage : function () {
            var dbName = 'podiobooks',
                version = '0.1',
                displayName = 'Podiobooks Player',
                maxSize = 524288;
           
            db = openDatabase(dbName, version, displayName, maxSize);
            db.transaction(function (transaction) {
                transaction.executeSql(
                    'CREATE TABLE IF NOT EXISTS history ' +
                    '  (title TEXT NOT NULL, episode INTEGER NOT NULL, ' +
                    '   position REAL, complete INTEGER);'
                );
            });
            db.transaction(function (transaction) {
                transaction.executeSql(
                    'CREATE TABLE IF NOT EXISTS favorites ' +
                    '  (id TEXT NOT NULL, title TEXT NOT NULL);'
                );
            });
        },
        
        /**
         * Loads favorite titles from the database and displays the results.
         */
        loadFavorites : function () {
            var page = $('#favorites'),
                books = page.find('.bookList');

            Podiobooks.displayProgress(page);
            books.css('webkitTransform', 'translateX(0px)');
            books.empty();
            db.transaction(function (transaction) {
                transaction.executeSql('SELECT * FROM favorites ORDER BY title;', [],
                    displayFavorites);
            });
        },        
        
        /**
         * Displays the "loading" dialog in order to make the user feel warm
         * and fuzzy.  We all like to feel warm and fuzzy.
         */
        displayProgress : function (target) {     
            if (target === undefined) {
                target = $('body');
            }
            
            target.find('div.progress').remove();
            target.append('<div class="progress">Loading...</div>');
        },

        /**
         * When things have finished and the user no longer needs to feel warm
         * and fuzzy, call this...
         */
        removeProgress : function (target) {
            target.find('div.progress').remove();
        },
        
        /**
         * Executes the title search from the search page.
         */
        executeSearch : function () {
            var page, resultsList, searchField, keywords;
            
            page = $('#searchpage');
            Podiobooks.displayProgress(page);
            
            resultsList = $('#results');
            $('#results').css('webkitTransform', 'translateX(0px)');
            
            searchField = page.find('#searchForm input[name="keyword"]');
            searchField.blur();
            keywords = searchField.attr('value'); 
            $.getJSON('resources/books/search', {keyword : keywords}, 
                function (results) {
                    displayBooks(results, resultsList);
                    Podiobooks.removeProgress(page);
                }
            );
        },
        
        /**
         * Asynchronously loads and displays categories.
         */
        loadCategories : function () {
            var page = $('#categorypage');
            
            Podiobooks.displayProgress(page);
            page.find('#categoryScroll').css('webkitTransform', 'translateX(0px)');
            $.getJSON('resources/category/list',
                function (categoryList) {
                    populateCategories(categoryList);
                    Podiobooks.removeProgress(page);
                });
        },
        
        /**
         * Asynchronously loads any books belonging to the specified category.
         */
        loadCategory : function (category) {
            loadBooksAsync(category,
                'resources/books/category/' + category.replace(/\//g, '-_-'));
        },
        
        loadRecent : function () {
            loadBooksAsync('Recent Updates', 'resources/books/recent', $('#recent'));
        },
        
        loadTopTen : function () {
            loadBooksAsync('Top Ten', 'resources/stats/top');
        },
        
        loadTodaysTop : function () {
            loadBooksAsync('Today\'s Top', 'resources/stats/today');
        },
        
        loadTopOverall : function () {
            loadBooksAsync('Top Rated', 'resources/stats/overall');
        },
        
        loadTopByVotes: function () {
            loadBooksAsync('Top By Votes', 'resources/stats/topbyvotes');
        },
        
        loadTopAllTime : function () {
            loadBooksAsync('All Time Top', 'resources/stats/alltime');
        },
        
        loadRandom : function () {
            Podiobooks.loadBookDetail('resources/books/random', $('#random'));
        },
        
        loadBookDetail : function (resource, target) {
            var container,
                page = $('#detail');
            // These two lines are a temporary hack bug fix...
            $('#random .bookDetail').empty();
            $('#detail .bookDetail').empty();
            
            if (target !== undefined) {
                page = target;
            }
            container = page.find('.bookDetail');
            
            Podiobooks.displayProgress(page);
            container.css('webkitTransform', 'translateX(0px)');
            container.empty();
            $.getJSON(resource,
                function (book) {
                    var title = getIdFromFeedUrl(book.feedUrl);
                    container.load('bookDetail.html',
                        function () {
                            populateBookData(book, title);
                            isFavorite(book.title, title);
                            Podiobooks.removeProgress(page);
                            container.css('webkitTransform', 'translateX(1px)');
                        }
                    );
                }
            );
        },
        
        displayConfirmation : function (target, text, yesFunc, noFunc) {
            var confirm,
                yes,
                no,
                yesCall = function () {
                    callAndClose(target, yesFunc);
                },
                noCall = function () {
                    callAndClose(target, noFunc);
                };
            
            if (target === undefined) {
                target = $('body');
            }
            
            confirm = target.find('.confirm');
            if (confirm.length === 0) {
                target.append('<div class="confirm"></div>');
                confirm = target.find('.confirm');
                confirm.append(text);
                confirm.append('<br/><div class="yes">Yes</div><div class="no">No</div>');
                
                yes = confirm.find('.yes');
                yes.bind('tap', yesCall);
                yes.bind('click', yesCall);
                
                no = confirm.find('.no');
                no.bind('tap', noCall);
                no.bind('click', noCall);
            }
        },
        
        addFavorite : function (title, id) {
            db.transaction(function (transaction) {
                transaction.executeSql('INSERT INTO favorites (title, id) VALUES (?, ?);',
                    [title, id]);
            });
        },

        deleteFavorite : function (remove) {
            db.transaction(function (transaction) {
                transaction.executeSql('DELETE FROM favorites WHERE id=?;', [remove]);
            });
        },
        
        playPause : function () {
            var audio = $('#player audio')[0];
            if (audio.paused) {
                audio.play();
                clearPlayerIntervals();
                checkInterval = setInterval(checkPosition, 1000);
                positionInterval = setInterval(updateEpisode, 5000);
            } else {
                updateEpisode();
                audio.pause();
            }
        }
    };
}());