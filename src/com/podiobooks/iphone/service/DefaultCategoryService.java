package com.podiobooks.iphone.service;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

//import com.google.appengine.repackaged.org.apache.commons.logging.Log;
//import com.google.appengine.repackaged.org.apache.commons.logging.LogFactory;
import com.podiobooks.iphone.CategoryList;
import com.podiobooks.iphone.dao.DefaultFeedDao;
import com.podiobooks.iphone.dao.FeedDao;
import com.sun.jersey.spi.resource.Singleton;

@Path("category")
@Singleton
public class DefaultCategoryService implements CategoryService {
    private static final Logger log = Logger.getLogger(DefaultCategoryService.class.getName());
    
    private static final String ALL_BOOKS_FEED = "http://www.podiobooks.com/opml/all/";
    
    // TODO: Implement Guice injection...
    FeedDao feedDao = new DefaultFeedDao();
    
    @GET
    @Path("list")
    @Produces("application/json")
    @Override
    public CategoryList getCategories() {
        CategoryList list = new CategoryList();
        List<String> categories = new ArrayList<String>();
        try {
            Document doc = feedDao.retrieveFeed(ALL_BOOKS_FEED);
            NodeList children = doc.getElementsByTagName("body").item(0).getChildNodes().item(1).getChildNodes();
            for(int i=0; i<children.getLength(); i++) {
                Node child = children.item(i);
                if(child.getNodeName().compareToIgnoreCase("outline") == 0) {
                    categories.add(child.getAttributes().getNamedItem("text").getNodeValue());
                }
            }
        } catch(Exception e) {
            log.severe("An error occurred while retrieving the complete list of categories: " + e.getMessage());
            list.setError("An error occurred while loading the category list.  "+
                    "This is likely because of slowness on the site.  Please go back and try again.  "+
                    "If the problem persists please <a href='mailto:mkimberlin@gmail.com'>let me know</a>.");
        }
        
        list.setCategories(categories);
        return list;
    }

}
