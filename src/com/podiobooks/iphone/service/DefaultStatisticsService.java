package com.podiobooks.iphone.service;

import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

import com.podiobooks.iphone.Book;
import com.podiobooks.iphone.BookList;
import com.sun.jersey.spi.resource.Singleton;

@Path("stats")
@Singleton
public class DefaultStatisticsService extends SiteParsingService implements StatisticsService {
    private static final Logger log = Logger.getLogger(DefaultStatisticsService.class.getName());
    
    public static final String CHARTS_URL = "http://www.podiobooks.com/charts.php";
    
    /**
     * {@inheritDoc} 
     */
    @GET @Path("today")
    @Produces("application/json")
    @Override public BookList getTodaysTopSubscriptions() {
        BookList list = new BookList();
        List<Book> books = new ArrayList<Book>();
        try {
            URL url = new URL(CHARTS_URL);
            StringBuilder result = readContents(url);
            
            //Snip out the appropriate section...
            result.delete(0, result.indexOf("<p>Today's Top Subscriptions</p>"));
            result.delete(result.indexOf("</td>"), result.length());
            
            books = extractBooksFromListItems(result);
        } catch (IOException e) {
            log.severe("An unexpected error occurred while retrieving today's top subscriptions: " + e.getMessage());
            list.setError("An error occurred while loading today's subscriptions.  "+
                    "This is likely because of slowness on the site.  Please go back and try again.  "+
                    "If the problem persists please <a href='mailto:mkimberlin@gmail.com'>let me know</a>.");
        }
        list.setBooks(books);
        return list;
    }

    /**
     * {@inheritDoc} 
     */
    @GET @Path("top")
    @Produces("application/json")
    @Override public BookList getTopTen() {
        BookList list = new BookList();
        List<Book> books = new ArrayList<Book>();
        try {
            URL url = new URL(CHARTS_URL);
            StringBuilder result = readContents(url);
            
            //Snip out the appropriate section...
            result.delete(0, result.indexOf("<p>The Podiobooks Top Ten</p>"));
            //Strangely, top ten is missing a </td>...look for the <tr instead.
            result.delete(result.indexOf("<tr"), result.length());
            
            books = extractBooksFromListItems(result);
        } catch (IOException e) {
            log.severe("An unexpected error occurred while retrieving top ten subscriptions: " + e.getMessage());
            list.setError("An error occurred while loading the top ten.  "+
                    "This is likely because of slowness on the site.  Please go back and try again.  "+
                    "If the problem persists please <a href='mailto:mkimberlin@gmail.com'>let me know</a>.");
        }
        list.setBooks(books);
        return list;
    }
    
    /**
     * {@inheritDoc} 
     */
    @GET @Path("overall")
    @Produces("application/json")
    @Override public BookList getTopOverall() {
        BookList list = new BookList();
        List<Book> books = new ArrayList<Book>();
        try {
            URL url = new URL(CHARTS_URL);
            StringBuilder result = readContents(url);
            
            //Snip out the appropriate section...
            result.delete(0, result.indexOf("<p>Top Overall Rating</p>"));
            result.delete(result.indexOf("</td>"), result.length());
            
            books  = extractBooksFromListItems(result);
        } catch (IOException e) {
            log.severe("An unexpected error occurred while retrieving top overall ratings: " + e.getMessage());
            list.setError("An error occurred while loading the top overall titles.  "+
                    "This is likely because of slowness on the site.  Please go back and try again.  "+
                    "If the problem persists please <a href='mailto:mkimberlin@gmail.com'>let me know</a>.");
        }

        list.setBooks(books);        
        return list;
    }
    
    /**
     * {@inheritDoc} 
     */
    @GET @Path("topbyvotes")
    @Produces("application/json")
    @Override public BookList getTopByVotes() {
        BookList list = new BookList();
        List<Book> books = new ArrayList<Book>();
        try {
            URL url = new URL(CHARTS_URL);
            StringBuilder result = readContents(url);
            
            //Snip out the appropriate section...
            result.delete(0, result.indexOf("<p>Top Overall Rating by No. of Votes</p>"));
            result.delete(result.indexOf("</td>"), result.length());
            
            books = extractBooksFromListItems(result);
        } catch (IOException e) {
            log.severe("An unexpected error occurred while retrieving top ratings by votes: " + e.getMessage());
            list.setError("An error occurred while loading the top titles by votes.  "+
                    "This is likely because of slowness on the site.  Please go back and try again.  "+
                    "If the problem persists please <a href='mailto:mkimberlin@gmail.com'>let me know</a>.");
        }
        
        list.setBooks(books);
        return list;
    }
    
    /**
     * {@inheritDoc} 
     */
    @GET @Path("alltime")
    @Produces("application/json")
    @Override public BookList getTopAllTimeSubscriptions() {
        BookList list = new BookList();
        List<Book> books = new ArrayList<Book>();
        try {
            URL url = new URL(CHARTS_URL);
            StringBuilder result = readContents(url);
            
            //Snip out the appropriate section...
            result.delete(0, result.indexOf("<p>All Time Top Subscriptions</p>"));
            result.delete(result.indexOf("</td>"), result.length());
            
            books = extractBooksFromListItems(result);
        } catch (IOException e) {
            log.severe("An unexpected error occurred while retrieving today's top all time subscriptions: " + e.getMessage());
            list.setError("An error occurred while loading today's top titles.  "+
                    "This is likely because of slowness on the site.  Please go back and try again.  "+
                    "If the problem persists please <a href='mailto:mkimberlin@gmail.com'>let me know</a>.");
        }
        
        list.setBooks(books);
        return list;
    }
    
    private List<Book> extractBooksFromListItems(StringBuilder result) {
        List<Book> books = new ArrayList<Book>();        
        while(result.indexOf("/title/") >= 0) {
           
            //Extract the title fragment from the href
            int nextPos = result.indexOf("/title/")+7;
            int endPos = result.indexOf("/\"", nextPos);
            String titleUrlFragment = result.substring(nextPos, endPos);
            result.delete(0, endPos);

            //Extract the book title
            nextPos = result.indexOf(">")+1;
            endPos = result.indexOf("</a");
            String title = result.substring(nextPos, endPos);
            result.delete(0, result.indexOf("</li>")+5);
            
            Book book = constructBook(null, titleUrlFragment, title);
            books.add(book);
        }
        return books;
    }
    
}
