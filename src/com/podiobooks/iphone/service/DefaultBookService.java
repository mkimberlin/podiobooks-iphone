package com.podiobooks.iphone.service;

import java.net.URL;
import java.util.ArrayList;
import java.util.List;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import lombok.SneakyThrows;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import com.podiobooks.iphone.Book;
import com.sun.jersey.spi.resource.Singleton;
import com.sun.syndication.feed.synd.SyndCategory;
import com.sun.syndication.feed.synd.SyndFeed;
import com.sun.syndication.io.SyndFeedInput;

@Path("books")
@Singleton
public class DefaultBookService implements BookService {
    
    private static final String TITLE_PLACEHOLDER = "__TITLE_PLACEHOLDER__";
    private static final String BASE_BOOK_FEED_URL = "http://podiobooks.com/title/"+TITLE_PLACEHOLDER+"/feed";

    @GET
    @Path("title/{title}")
    @Produces("application/json")
    @Override @SneakyThrows @SuppressWarnings("unchecked")
	public Book getBook(@PathParam("title") String title) {
		final URL feedUrl = new URL(BASE_BOOK_FEED_URL
		    .replaceFirst(TITLE_PLACEHOLDER, title.toLowerCase().replaceAll("\\s", "-")));
		SyndFeedInput input = new SyndFeedInput();
        DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
        Document doc = builder.parse(feedUrl.openStream());
		SyndFeed feed = input.build(doc);
		Book book = new Book();
		book.setTitle(feed.getTitle().substring(0, feed.getTitle().indexOf(" - A free audiobook by")));
		book.setCopyright(feed.getCopyright());
		book.setDescription(feed.getDescription());
		book.setImageUrl(feed.getImage().getUrl());
		book.setLastUpdated(feed.getPublishedDate());
        book.setCategories(getCategoryNames(feed.getCategories()));
		book.setUrl(feed.getLink());
		
        NodeList authorElems = doc.getElementsByTagName("itunes:author");
        Node authorNode = authorElems.item(0);
        if(authorNode != null)
            book.setAuthor(authorNode.getTextContent());
		return book;
	}
	
	private List<String> getCategoryNames(List<SyndCategory> categories) {
	    List<String> catNames = new ArrayList<String>();
	    for(SyndCategory cat: categories) {
	        catNames.add(cat.getName());
	    }
	    return catNames;
	}

}
