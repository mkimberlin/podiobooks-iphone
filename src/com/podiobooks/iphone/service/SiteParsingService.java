package com.podiobooks.iphone.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.nio.CharBuffer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.podiobooks.iphone.Book;

public class SiteParsingService {

    public static final String TITLE_PLACEHOLDER = "__TITLE_PLACEHOLDER__";
    public static final String BASE_BOOK_FEED_URL = "http://podiobooks.com/title/"
        + TITLE_PLACEHOLDER + "/feed/";
    
    /**
     * Reads the entire contents of the file at the provided URL into a
     * StringBuilder for processing.
     * 
     * @param url  the URL to be read
     * @return the contents of the file referenced by the URL
     * @throws IOException  if an error occurs while retrieving the contents of
     *         the file
     */
    protected StringBuilder readContents(URL url) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(url.openStream()));
        StringBuilder result = new StringBuilder();
        CharBuffer current = CharBuffer.allocate(1024);
        while (in.read(current) != -1) {
            result.append(current.array());
            current.clear();
        }
        return result;
    }
    
    /**
     * Retrieves the first string in a <code>CharSequence</code> matching the
     * provided pattern. 
     * 
     * @param toMatch  the <code>CharSequence</code> to perform the match against
     * @param pattern  the regular expression to be matched
     * @return the first string in the CharSequence that matches the given
     *         pattern
     */
    protected String getFirstMatch(CharSequence toMatch, Pattern pattern) {
        Matcher matcher = pattern.matcher(toMatch);
        matcher.find();
        String date = matcher.group();
        return date;
    }
    
    /**
     * Constructs a <code>Book</code> from the given title, update date and
     * feed URL fragment.
     * 
     * @param date  the date the book was last updated
     * @param titleUrlFragment  the portion of the feed URL specifying that
     *        is unique to this book (i.e. "the-rookie" or "ravenwood")
     * @param title  the full title of the book
     * @return  the populated <code>Book</code> object
     */
    protected Book constructBook(String date, String titleUrlFragment,
            String title) {
        Book book = new Book();
        book.setTitle(title);
        book.setFeedUrl(BASE_BOOK_FEED_URL.replaceFirst(TITLE_PLACEHOLDER, titleUrlFragment));
        book.setLastUpdated(date);
        return book;
    }
}
