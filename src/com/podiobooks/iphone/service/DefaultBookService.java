package com.podiobooks.iphone.service;

import java.io.IOException;
import java.net.URL;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Random;
import java.util.logging.Logger;
import java.util.regex.Pattern;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import com.podiobooks.iphone.Book;
import com.podiobooks.iphone.BookList;
import com.podiobooks.iphone.Episode;
import com.podiobooks.iphone.dao.DefaultFeedDao;
import com.podiobooks.iphone.dao.FeedDao;
import com.sun.jersey.spi.resource.Singleton;
import com.sun.syndication.feed.synd.SyndCategory;
import com.sun.syndication.feed.synd.SyndEnclosure;
import com.sun.syndication.feed.synd.SyndEntry;
import com.sun.syndication.feed.synd.SyndFeed;
import com.sun.syndication.io.FeedException;
import com.sun.syndication.io.SyndFeedInput;

/**
 * The default implementation of the book service, exposing the methods as a
 * RESTful web service via the Jersey JAX-RS framework.
 * 
 * Most of the data extraction in this service is done by "screen scraping" the
 * current Podiobooks.com site (January, 2010) and is likely to break with any
 * significant changes to the site.  Future implementations of these services
 * will be done in tandem with the development of the new Podiobooks.com site.
 * 
 * @author mkimberlin
 * 
 * TODO: Construct exception handling mechanism!
 * TODO: Implement dependency injection?
 */
@Path("books")
@Singleton
public class DefaultBookService extends SiteParsingService implements BookService {
    private static final Logger log = Logger.getLogger(DefaultBookService.class.getName());
     
    FeedDao feedDao = new DefaultFeedDao();
    Random random = new Random(new Date().getTime());

    // TODO: Make these property driven...
    private static final String ALL_BOOKS_FEED = "http://www.podiobooks.com/opml/all/";
    private static final String BASE_SEARCH_URL = "http://www.podiobooks.com/podiobooks/search.php?includeAdult=1&keyword=";
    private static final String MAIN_URL = "http://www.podiobooks.com/";
    
    /**
     * {@inheritDoc}
     */
    @GET @Path("title/{title}")
    @Produces("application/json")
    @Override public Book getBook(@PathParam("title") String title) {
        String url = BASE_BOOK_FEED_URL.replaceFirst(TITLE_PLACEHOLDER, title);
        return getBookByFeedUrl(url);
    }
    
    /**
     * {@inheritDoc} 
     */
    @GET @Path("category/{category}")
    @Produces("application/json")
    @Override public BookList getBooks(@PathParam("category")String category) {
        if(category != null)
            category = category.replaceAll("-_-", "/");
        List<Book> books = new ArrayList<Book>();
        try {
            Document doc = feedDao.retrieveFeed(ALL_BOOKS_FEED);
            NodeList children = doc.getElementsByTagName("body").item(0).getChildNodes().item(1).getChildNodes();
            for(int i=0; i<children.getLength(); i++) {
                Node child = children.item(i);
                if(child.getNodeName().compareToIgnoreCase("outline") == 0
                    && (category == null || category.trim().length()==0 ||
                        child.getAttributes().getNamedItem("text").getNodeValue().compareToIgnoreCase(category) == 0)) {
                    books.addAll(getBooks(child.getChildNodes()));
                }
            }
        } catch(Exception e) {
            log.warning("An error occurred while loading books for the category \"" +category+"\": " + e.getMessage());
            e.printStackTrace();
        }
        BookList list = new BookList();
        list.setBooks(books);
        return list;
    }
    
    /**
     * {@inheritDoc} 
     */
    @GET @Path("search")
    @Produces("application/json")
    @Override public BookList searchBooks(@QueryParam("keyword") String keywords) {
        BookList bookList = new BookList();
        try {keywords = URLEncoder.encode(keywords, "UTF-8");}catch(Exception e ) {}
        try {
            URL url = new URL(BASE_SEARCH_URL+keywords);
            List<Book> books = new ArrayList<Book>();
            books = extractSearchResults(url);
            bookList.setBooks(books);
        } catch (Exception e) {
            log.warning("An unexpected error occurred while retrieving search results corresponding to: \""+keywords+"\": " + e.getMessage());
            e.printStackTrace();
            bookList.setBooks(new ArrayList<Book>());
        }
        
        return bookList;
    }
    
    /**
     * {@inheritDoc} 
     */
    @GET @Path("recent")
    @Produces("application/json")
    @Override public BookList getRecentUpdates() {
        BookList bookList = new BookList();
        try {
            URL url = new URL(MAIN_URL);
            StringBuilder result = readContents(url);
            
            //Snip out the recent updates section...
            result.delete(0, result.indexOf("<p>Recent Updates</p>"));
            result.delete(result.indexOf("</ul>"), result.length());
            
            bookList.setBooks(extractRecentUpdates(result));
        } catch (IOException e) {
            log.warning("An unexpected error occurred while retrieving recent book updates: " + e.getMessage());
            e.printStackTrace();
            bookList.setBooks(new ArrayList<Book>());
        }
        return bookList;
    }
    
    /**
     * {@inheritDoc}
     */
    @GET @Path("random/{category}")
    @Produces("application/json")
    @Override public Book getRandomBook(@PathParam("category") String category) {
        BookList books = getBooks(category);
        Book book = books.getBooks().get(random.nextInt(books.getBooks().size()));
        String feedUrl = book.getFeedUrl();
        book = getBook(feedUrl.substring(feedUrl.indexOf("/title/")+7,feedUrl.indexOf("/feed")));
        book.setFeedUrl(feedUrl);
        return book;
    }
    
    /**
     * {@inheritDoc}
     */
    @GET @Path("random")
    @Produces("application/json")
    @Override public Book getRandomBook() {
        return getRandomBook(null);
    }
    
    /**
     * Retrieves a <code>Book</code> from its RSS feed at the provided URL. If
     * an error occurs during the retrieval or processing of the feed, then
     * an empty book will be returned.
     * 
     * @param url  the URL of the RSS feed
     * @return the <code>Book</code> fully populated with information extracted
     *         from the RSS feed
     */
    private Book getBookByFeedUrl(String url) {
        Book book = null;
        try {
            Document doc = feedDao.retrieveFeed(url);
            book = constructBookFromDetailedFeed(doc);
        } catch (Exception e) {
            log.warning("An error occurred while retrieving or parsing the RSS feed \""
                + url + "\": " + e.getMessage());
            e.printStackTrace();
            book = new Book();
        }

        return book;
    }

    /**
     * Constructs a book object populated by the data taken from the
     * provided RSS document.
     * 
     * @param doc  the <code>Document</code> containing the parsed RSS feed
     * @return the <code>Book</code> fully populated with information extracted
     *         from the RSS feed
     * @throws FeedException  if the feed could not be parsed
     */
    @SuppressWarnings("unchecked")
    private Book constructBookFromDetailedFeed(Document doc)
            throws FeedException {
        SyndFeedInput input = new SyndFeedInput();
        SyndFeed feed = input.build(doc);
        
        Book book = new Book();
        book.setTitle(feed.getTitle().substring(0,
            feed.getTitle().indexOf(" - A free audiobook by")));
        book.setCopyright(feed.getCopyright());
        book.setDescription(feed.getDescription());
        book.setImageUrl(feed.getImage().getUrl());
        SimpleDateFormat formatter = new SimpleDateFormat("MM/dd/yy");
        book.setLastUpdated(formatter.format(feed.getPublishedDate()));
        book.setCategories(parseCategoryNames(feed.getCategories()));
        book.setUrl(feed.getLink());

        book.setEpisodes(parseEpisodes(feed.getEntries()));

        book.setAuthors(parseAuthors(doc));
        
        return book;
    }
    
    /**
     * Parses any authors from the iTunes specific author tags, ignoring
     * "Podiobooks Staff" that occurs for the "The End" or "Your caught up"
     * files.
     * 
     * @param doc  the parsed RSS feed
     * @return  a list of author names
     */
    private List<String> parseAuthors(Document doc) {
        // Author is not provided as a part of the core RSS portion of the
        // feed.  As such, it must be taken from the iTunes portion.
        NodeList authorNodes = doc.getElementsByTagName("itunes:author");
        
        List<String> authors = new ArrayList<String>();
        for(int i=0; i<authorNodes.getLength(); i++) {
            Node authorNode = authorNodes.item(i);
            if (authorNode != null) {
                String author = authorNode.getTextContent();
                if(!authors.contains(author) && !"Podiobooks Staff".equalsIgnoreCase(author))
                    authors.add(author);
            }    
        }
        return authors;
    }

    /**
     * Parses a list of <code>Episode</code>s from a list of syndication entries
     * taken from the feed.
     * 
     * @param entries  the list of <code>SyndEntry</code> parsed by ROME
     * @return  a list of <code>Episode</code>s
     */
    private List<Episode> parseEpisodes(List<SyndEntry> entries) {
        List<Episode> episodes = new ArrayList<Episode>();
        for (SyndEntry entry : entries) {
            Episode ep = new Episode();
            ep.setTitle(entry.getTitle());
            // Assuming a single enclosure here...
            ep.setUrl(((SyndEnclosure) entry.getEnclosures().get(0)).getUrl());
            episodes.add(ep);
        }
        return episodes;
    }

    /**
     * Parses a the list of category names from those in the feed.
     * 
     * @param categories  a list of syndicated categories parsed by ROME
     * @return a list of category names
     */
    private List<String> parseCategoryNames(List<SyndCategory> categories) {
        List<String> catNames = new ArrayList<String>();
        for (SyndCategory cat : categories) {
            catNames.add(cat.getName());
        }
        return catNames;
    }

    /**
     * Extracts a list of books from the <code>NodeList</code> of a category.
     * It is assumed that there is no nesting and that all titles are "outline"
     * entries in the provided <code>NodeList</code>.
     * 
     * @param bookNodes  the list of nodes containing the desired books
     * @return a list of <code>Book</code>s with the title and feed url
     *         populated
     */
    private List<Book> getBooks(NodeList bookNodes) {
        List<Book> books = new ArrayList<Book>();
        for(int i=0; i<bookNodes.getLength(); i++) {
            Node bookNode = bookNodes.item(i);
            if(bookNode.getNodeName().compareToIgnoreCase("outline") == 0) {
                Book book = new Book();
                book.setTitle(bookNode.getAttributes().getNamedItem("text").getNodeValue());
                book.setFeedUrl(bookNode.getAttributes().getNamedItem("url").getNodeValue());
                books.add(book);
            }
        }
        return books;
    }

    /**
     * Extracts a list of <code>Book</code>s resulting from a search.
     * 
     * @param url  the search page URL (including query string)
     * @return a list of <code>Book</code>s matching the search
     * @throws IOException  if an error occurs while retrieving the search
     *         results from the site
     */
    private List<Book> extractSearchResults(URL url)
            throws IOException {
        List<Book> books = new ArrayList<Book>();
        
        StringBuilder result = readContents(url);
        while(result.indexOf("/title/") >= 0) {
            result.delete(0, result.indexOf("/title/")+7);
            int nextPos = result.indexOf("/title/")+7;
            int endPos = result.indexOf("\"", nextPos);
            String titleUrlFragment = result.substring(nextPos, endPos);
            result.delete(0, endPos);
            String title = result.substring(result.indexOf(">")+1, result.indexOf("</a"));
            result.delete(0, result.indexOf("</tr>"));
            Book book = constructBook(null, titleUrlFragment, title);
            books.add(book);
        }
        return books;
    }

    /**
     * Extracts a list of <code>Book</code>s recently updated from the site's
     * front page.  The number of episodes updated is appended to the book's
     * title.
     * 
     * @param result  the recent updates section of the podiobooks.com main page 
     * @return the list of <code>Book</code>s recently updated, with each
     *         book's title, last updated date and feed url populated and
     *         the number of episodes updated appended to the book's title
     */
    private List<Book> extractRecentUpdates(StringBuilder result) {
        List<Book> books = new ArrayList<Book>();        
        Pattern datePattern = Pattern.compile("(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.]\\d\\d");
        Pattern episodePattern = Pattern.compile("\\s\\d+\\D");
        while(result.indexOf("/title/") >= 0) {
            //Match the date and number of episodes
            String date = getFirstMatch(result, datePattern);
            String episodes = getFirstMatch(result, episodePattern);
            episodes = episodes.substring(0, episodes.length()-1).trim();
            
            //Extract the title fragment from the href
            int nextPos = result.indexOf("/title/")+7;
            int endPos = result.indexOf("/\"", nextPos);
            String titleUrlFragment = result.substring(nextPos, endPos);
            result.delete(0, endPos);

            //Extract the book title
            nextPos = result.indexOf(">")+1;
            endPos = result.indexOf("</a");
            String title = result.substring(nextPos, endPos);
            result.delete(0, endPos);
            
            StringBuilder titleBuilder = new StringBuilder(title);
            titleBuilder.append(" - ").append(episodes).append(" Episodes");
            Book book = constructBook(date, titleUrlFragment, titleBuilder.toString());
            books.add(book);
        }
        return books;
    }

}
