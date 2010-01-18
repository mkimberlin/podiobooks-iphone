package com.podiobooks.iphone;

import java.util.Date;
import java.util.List;

import javax.xml.bind.annotation.XmlRootElement;

import lombok.Data;

@Data
@XmlRootElement(name="book")
public class Book {
	private String title;
    private List<String> authors;
	private String description;
	private List<String> categories;
	private String copyright;
	private String url;
	private Date lastUpdated;
	private String imageUrl;
	private String feedUrl;
	private List<Episode> episodes;
}
